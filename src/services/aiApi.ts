
import { apiClient, ApiError } from '@/lib/apiClient';
import { handleError } from '@/lib/errorHandler';

// ----- Types and helpers for robust AI response parsing -----
type AnyObj = Record<string, unknown>;
function isObject(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null;
}

function getRawCandidates(obj: AnyObj): AnyObj[] | null {
  if (!obj) return null;
  const raw = obj.raw ?? obj;
  if (Array.isArray(raw)) return raw as AnyObj[];
  if (isObject(raw) && Array.isArray(raw.candidates)) return raw.candidates as AnyObj[];
  return null;
}

// ------------------------------------------------------------
// API call configuration
const API_CONFIG = {
  model: import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash-image'
} as const;


// Image generation request interface
export interface ImageGenerationRequest {
  prompt: string;
  image?: File;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  dpi?: number;
  quality?: string;
  seed?: number; // Fixed seed for reproducible results
  styleId?: string; // Style identifier for consistent parameters
  image_strength?: number; // Strength for image-to-image generation
}

// Proxy request body interface for backend API
interface ProxyRequestBody {
  prompt: string;
  width: number;
  height: number;
  steps?: number;
  cfgScale?: number;
  negativePrompt?: string;
  // Optional image-related fields
  imageBase64?: string;
  imageMimeType?: string;
  mode?: string;
  image_strength?: number;
}

// Image generation response interface
export interface ImageGenerationResponse {
  imageUrl: string;
  generationTime: number;
  model: string;
  enhancedImageUrl?: string; // Optional: enhanced image URL (if enhancement is in progress)
  enhancementPromise?: Promise<string>; // Optional: promise for enhanced image
}

// Compress image while maintaining quality (for faster base64 conversion)
// Only compress when absolutely necessary to maintain maximum quality
async function compressImage(file: File, maxWidth: number = 3072, quality: number = 0.99, force: boolean = false): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only skip compression for small files when not forced.
    // Allow forcing compression (used when we need to aggressively reduce payload).
    if (!force && file.size < 10 * 1024 * 1024) { // Less than 10MB - don't compress by default
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Only resize if image is larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // If image is already small enough, return original
        if (width === img.width && height === img.height && file.size < 10 * 1024 * 1024) {
          resolve(file);
          return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Convert file to base64 format
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix, keep only base64 data
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// Light sharpening filter (faster than advanced sharpening)





// Color enhancement for print



// Build complete prompt with quality consistency requirements
function buildFullPrompt(prompt: string, negativePrompt?: string, dpi?: number, quality?: string): string {
  let fullPrompt = prompt;
  
  // CRITICAL: Add strong quality consistency requirements at the beginning
  // These help ensure stable, high-quality output every time
  fullPrompt += ', masterpiece, best quality, professional artwork, highly detailed, ultra high resolution, 8K quality';
  fullPrompt += ', consistent style, stable quality, refined details, polished finish';
  
  // Enhanced DPI and quality requirements for printing
  if (dpi) {
    if (dpi >= 600) {
      fullPrompt += `, ${dpi} DPI, ultra high resolution, print ready, commercial printing quality, maximum detail, no pixelation, crisp edges, professional grade, archival quality`;
    } else if (dpi >= 300) {
      fullPrompt += `, ${dpi} DPI, high resolution, print quality, sharp details, clean lines, vibrant colors`;
    } else {
      fullPrompt += `, ${dpi} DPI, standard resolution`;
    }
  }
  
  if (quality) {
    if (quality === 'ultra') {
      fullPrompt += ', ultra quality, maximum detail, professional grade, archival quality, museum quality, perfect sharpness, flawless execution';
    } else if (quality === 'high') {
      fullPrompt += ', high quality, excellent detail, premium print ready, sharp and clear, refined artwork';
    } else {
      fullPrompt += `, ${quality} quality`;
    }
  }
  
  // Add print-specific requirements for high DPI
  if (dpi && dpi >= 600) {
    fullPrompt += ', no artifacts, no blur, no noise, perfect sharpness, smooth gradients, professional printing quality';
    fullPrompt += ', vector-like quality, sharp edges, clean lines, perfect details, commercial grade';
  }
  
  // Add universal quality requirements
  fullPrompt += ', sharp edges, clean lines, no blur, no artifacts, crisp details, vibrant colors';
  fullPrompt += ', professional composition, balanced lighting, harmonious colors';
  
  // Build negative prompt with quality consistency requirements
  let fullNegativePrompt = 'low quality, blurry, pixelated, artifacts, noise, distorted, amateur, inconsistent style, poor execution, bad anatomy, deformed';
  if (negativePrompt) {
    fullNegativePrompt = `${negativePrompt}, ${fullNegativePrompt}`;
  }
  
  // Add negative prompts using proper separator
  fullPrompt += ` ### ${fullNegativePrompt}`;
  
  return fullPrompt;
}

// Generate image function - Use backend proxy
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    const startTime = Date.now();


    // Build complete prompt (include dimensions in prompt for Gemini API)
    const fullPrompt = buildFullPrompt(request.prompt, request.negativePrompt, request.dpi, request.quality);

    // Prepare the request body for the backend proxy
    const proxyRequestBody: ProxyRequestBody = {
      prompt: fullPrompt,
      width: request.width || 512,
      height: request.height || 512,
    };
    if (typeof request.steps !== 'undefined') proxyRequestBody.steps = request.steps;
    if (typeof request.cfgScale !== 'undefined') proxyRequestBody.cfgScale = request.cfgScale;
    if (typeof request.negativePrompt !== 'undefined') proxyRequestBody.negativePrompt = request.negativePrompt;

    // Support image input: convert to base64 and include for image-to-image mode
    if (request.image) {
      try {
        // Decide a sensible compression target based on requested output dimensions.
        // Use the short side (min) to avoid upscaling and reduce payload.
        const targetShortSide = Math.min(request.width || 512, request.height || 512);
        // Clamp max width to a conservative bound to avoid extremely large uploads.
        // Prefer keeping it near the requested short side and never exceed 1024 on upload.
        const clampMaxWidth = Math.min(Math.max(targetShortSide, 512), 1024);

        // First-pass compress: resize down to clampMaxWidth (if larger) and use a reasonable quality.
        // Force compression to ensure even files under default thresholds get resized if needed.
        let imgFile = await compressImage(request.image, clampMaxWidth, 0.88, true);
        let b64 = await fileToBase64(imgFile);

        // If payload still too large for provider/Cloudflare, perform additional aggressive compression passes.
        // Use a conservative threshold on base64 length (characters). Adjust as needed by provider limits.
        const BASE64_WARN_THRESHOLD = 1_500_000; // ~1.1MB binary
        if (b64.length > BASE64_WARN_THRESHOLD) {
          if (import.meta.env.DEV) console.warn('Image base64 payload is large, applying extra compression passes', { length: b64.length, clampMaxWidth });
          // Multi-pass aggressive compression strategy:
          // 1) Reduce to firstTarget (min(request short side, 1024)) at quality 0.78
          // 2) If still too large, reduce to 512 at quality 0.72
          // 3) If still too large, reduce to 384 at quality 0.65
          const firstTarget = Math.min(Math.max(512, targetShortSide), 1024);
          imgFile = await compressImage(request.image, firstTarget, 0.78);
          b64 = await fileToBase64(imgFile);

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const secondTarget = 512;
            imgFile = await compressImage(request.image, secondTarget, 0.72);
            b64 = await fileToBase64(imgFile);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const thirdTarget = 384;
            imgFile = await compressImage(request.image, thirdTarget, 0.65);
            b64 = await fileToBase64(imgFile);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            if (import.meta.env.DEV) console.warn('Image still large after aggressive compression passes; final base64 length:', b64.length);
          }
        }

        // Final safety check: if still too large after aggressive compression, abort and surface error.
        const FINAL_BASE64_HARD_LIMIT = 1_800_000; // ~1.35MB binary
        if (b64.length > FINAL_BASE64_HARD_LIMIT) {
          throw new Error('Image too large after compression; please use a smaller image or crop before uploading');
        }
        proxyRequestBody.imageBase64 = b64;
        // include MIME type so backend can assemble a proper data URI
        proxyRequestBody.imageMimeType = imgFile.type || 'image/jpeg';
        proxyRequestBody.mode = 'image_to_image';
        // image_strength controls how much to preserve original.
        const requestedImageStrength = request.image_strength;
        proxyRequestBody.image_strength = typeof requestedImageStrength !== 'undefined' ? requestedImageStrength : 0.15;
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to prepare image input for A.I. proxy, falling back to text-only:', e);
      }
    }

    // Call the backend proxy endpoint
    const response = await apiClient.post('/generate', proxyRequestBody, {
      timeout: 60000, // 60 second timeout for AI generation
    });

    const data = response.data as Record<string, unknown>;

    // Check if the backend returned an error
    if (data.error) {
      throw new ApiError(`AI API error: ${data.error}`, 400, 'AI_API_ERROR');
    }

    // The backend should return the image URL or base64 data.
    // Be resilient: accept multiple shapes and also attempt to extract image data
    // from nested/raw provider responses under `data.raw` (fallback).
    let imageUrl: string | undefined;

      // Priority 1: Try to extract image from provider "candidates" structure (Gemini-style)
      const candidates = getRawCandidates(data);
      if (candidates && candidates.length > 0) {
        for (const cand of candidates) {
          if (!isObject(cand)) continue;
          const content = cand.content;
          if (!isObject(content) || !Array.isArray(content.parts)) continue;
          for (const partRaw of content.parts) {
            const part = partRaw as AnyObj;
            const inlineData = isObject(part) && (part.inlineData || part.inline_data);
            if (isObject(inlineData) && typeof inlineData.data === 'string') {
              const base64Str = inlineData.data;
              const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
              imageUrl = `data:${mimeType};base64,${base64Str}`;
              break;
            }
            if (typeof part.text === 'string') {
              const markdownImageRegex = /!\[image\]\((data:image\/[^;]+;base64,[^)]+)\)/;
              const match = part.text.match(markdownImageRegex);
              if (match) {
                imageUrl = match[1];
                break;
              }
            }
          }
          if (imageUrl) break;
        }
      }

       // Priority 2: Check direct well-known fields
       if (!imageUrl) {
    if (typeof (data as any).imageUrl === 'string') {
      imageUrl = (data as any).imageUrl;
    } else if (isObject((data as any).image) && typeof ((data as any).image as any).url === 'string') {
      imageUrl = ((data as any).image as any).url;
    } else if (isObject((data as any).image) && typeof ((data as any).image as any).base64 === 'string') {
      imageUrl = `data:image/png;base64,${((data as any).image as any).base64}`;
    } else if (typeof (data as any).base64 === 'string') {
      imageUrl = `data:image/png;base64,${(data as any).base64}`;
         } else {
           // No direct image fields found
         }
    }

       // Priority 3: Fallback parsing for other API formats
    if (!imageUrl && isObject((data as any).raw)) {
         const raw = (data as any).raw;

         // Check for DALL-E style response
         if (Array.isArray(raw.data) && raw.data.length > 0) {
           const imageData = raw.data[0] as any;
           if (typeof imageData.url === 'string') {
             imageUrl = imageData.url;
           } else if (typeof imageData.b64_json === 'string') {
             imageUrl = `data:image/png;base64,${imageData.b64_json}`;
           }
      }
    }

    // Final fallback: check top-level text fields for embedded URLs
    if (!imageUrl && typeof data === 'object' && data !== null) {
      const textCandidates = ['text', 'message', 'content', 'result'];
      const obj = data as Record<string, unknown>;
      for (const fld of textCandidates) {
        const v = obj[fld];
        if (typeof v === 'string') {
          const urlMatch = v.match(/https?:\/\/[^\s'"]+/);
          if (urlMatch) {
            imageUrl = urlMatch[0];
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      console.error('Backend proxy returned unexpected response shape:', data);
      console.error('Available keys in response:', Object.keys(data));
      throw new Error('Backend proxy returned invalid response format');
    }

    const generationTime = Date.now() - startTime;

    return {
      imageUrl,
      generationTime,
      model: API_CONFIG.model
    };
  }
  catch (error: unknown) {
    handleError(error, 'ai_generation', {
      showToast: false, // Let the calling component handle UI feedback
      logError: true
    });
    throw error; // Re-throw for component-level handling
  }
}





