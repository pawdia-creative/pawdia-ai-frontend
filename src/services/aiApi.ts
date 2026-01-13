
import { apiClient, ApiError } from '@/lib/apiClient';
import { handleError } from '@/lib/errorHandler';

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

    if (import.meta.env.DEV) console.log('Calling backend proxy for image generation...');

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
        const targetShortSide = Math.max(request.width || 512, request.height || 512);
        // Clamp max width to a reasonable upper bound to avoid extremely large uploads.
        const clampMaxWidth = Math.min(Math.max(targetShortSide, 512) * 2, 2048);

        // First-pass compress: aim for roughly twice the short side (keeps quality but reduces large originals)
        // Force compression to ensure even files under 10MB get resized if needed.
        let imgFile = await compressImage(request.image, clampMaxWidth, 0.92, true);
        let b64 = await fileToBase64(imgFile);

        // If payload still too large for provider/Cloudflare, perform additional aggressive compression passes.
        // Use a conservative threshold on base64 length (characters). Adjust as needed by provider limits.
        const BASE64_WARN_THRESHOLD = 4_000_000; // ~3MB binary
        if (b64.length > BASE64_WARN_THRESHOLD) {
          if (import.meta.env.DEV) console.warn('Image base64 payload is large, applying extra compression passes', { length: b64.length, clampMaxWidth });
          // Multi-pass aggressive compression strategy:
          // 1) Reduce to target short side (request.width/request.height short side or 512) at quality 0.80
          // 2) If still too large, reduce to 384 at quality 0.72
          // 3) If still too large, reduce to 256 at quality 0.65
          const targetShortSide = Math.max(request.width || 512, request.height || 512);
          const firstTarget = Math.min(Math.max(512, targetShortSide), 1024);
          imgFile = await compressImage(request.image, firstTarget, 0.80);
          b64 = await fileToBase64(imgFile);
          if (import.meta.env.DEV) console.log('After pass 1 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const secondTarget = 384;
            imgFile = await compressImage(request.image, secondTarget, 0.72);
            b64 = await fileToBase64(imgFile);
            if (import.meta.env.DEV) console.log('After pass 2 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const thirdTarget = 256;
            imgFile = await compressImage(request.image, thirdTarget, 0.65);
            b64 = await fileToBase64(imgFile);
            if (import.meta.env.DEV) console.log('After pass 3 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            if (import.meta.env.DEV) console.warn('Image still large after aggressive compression passes; final base64 length:', b64.length);
          }
        } else {
          if (import.meta.env.DEV) console.log('Image compressed within acceptable size', { length: b64.length, mime: imgFile.type });
        }

        // Final safety check: if still too large after aggressive compression, abort and surface error.
        const FINAL_BASE64_HARD_LIMIT = 6_000_000; // ~4.5MB binary
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
        if (import.meta.env.DEV) console.log('Image-to-image request prepared, size:', b64.length, 'mime:', proxyRequestBody.imageMimeType, 'strength:', proxyRequestBody.image_strength);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to prepare image input for A.I. proxy, falling back to text-only:', e);
      }
    }

    // Call the backend proxy endpoint
    const response = await apiClient.post('/generate', proxyRequestBody, {
      timeout: 60000, // 60 second timeout for AI generation
    });

    const data = response.data as any;
    if (import.meta.env.DEV) console.log('Backend proxy response:', data);

    // Check if the backend returned an error
    if (data.error) {
      throw new ApiError(`AI API error: ${data.error}`, 400, 'AI_API_ERROR');
    }

    // The backend should return the image URL or base64 data.
    // Be resilient: accept multiple shapes and also attempt to extract image data
    // from nested/raw provider responses under `data.raw` (fallback).
    let imageUrl: string | undefined;

    console.log('=== FRONTEND AI RESPONSE DEBUG START ===');
    console.log('Full response data keys:', Object.keys(data));
    console.log('Full response data:', data);
    console.log('=== FRONTEND AI RESPONSE DEBUG END ===');

       // Priority 1: Check for Gemini API response structure (most common for img2img)
       console.log('=== STARTING GEMINI PARSING ===');
       console.log('Full data object keys:', Object.keys(data));
       console.log('data.raw exists:', !!data.raw);
       console.log('data.raw type:', typeof data.raw);

       if (data.raw && typeof data.raw === 'object') {
         console.log('data.raw keys:', Object.keys(data.raw));
         console.log('data.raw.candidates exists:', !!data.raw.candidates);
         console.log('data.raw.candidates is array:', Array.isArray(data.raw.candidates));
         if (data.raw.candidates) {
           console.log('data.raw.candidates length:', data.raw.candidates.length);
         }
         // Log a sample of the raw response for debugging
         try {
           const rawSample = JSON.stringify(data.raw).substring(0, 500);
           console.log('Raw response sample:', rawSample + '...');
         } catch (e) {
           console.log('Could not stringify raw response');
         }
       }

       if (data.raw && typeof data.raw === 'object' && data.raw.candidates && Array.isArray(data.raw.candidates) && data.raw.candidates.length > 0) {
         console.log('Found Gemini candidates structure');
         const candidate = data.raw.candidates[0];
         console.log('First candidate keys:', Object.keys(candidate));

         if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
           console.log('Processing candidate.content.parts, length:', candidate.content.parts.length);
           for (const part of candidate.content.parts) {
             console.log('Part keys:', Object.keys(part));

             // Check for both inlineData and inline_data (API might return either)
             const inlineData = part.inlineData || part.inline_data;
             if (inlineData && inlineData.data) {
               console.log('Found inlineData/inline_data with data');
               const base64Str = inlineData.data;
               const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
               imageUrl = `data:${mimeType};base64,${base64Str}`;
               console.log('SUCCESS: Extracted image from Gemini inlineData, length:', base64Str.length);
               break;
             }

             // Check for text field containing markdown image with base64 data URL
             if (part.text && typeof part.text === 'string') {
               console.log('Found text field, checking for markdown image pattern');
               // Look for ![image](data:image/png;base64,...) pattern
               const markdownImageRegex = /!\[image\]\((data:image\/[^;]+;base64,[^)]+)\)/;
               const match = part.text.match(markdownImageRegex);
               if (match) {
                 imageUrl = match[1];
                 console.log('SUCCESS: Extracted image from Gemini markdown text, URL length:', imageUrl?.length || 0);
                 break;
               }
             }
           }
         }
       }

       // Fallback: Try parsing raw directly as candidates (in case Worker wrapped it differently)
       if (!imageUrl && data.raw && typeof data.raw === 'object' && Array.isArray(data.raw) && data.raw.length > 0) {
         console.log('Trying raw array parsing...');
         // If raw is an array, treat it as candidates
         const candidate = data.raw[0];
         if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
           for (const part of candidate.content.parts) {
             const inlineData = part.inlineData || part.inline_data;
             if (inlineData && inlineData.data) {
               const base64Str = inlineData.data;
               const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
               imageUrl = `data:${mimeType};base64,${base64Str}`;
               console.log('SUCCESS: Extracted image from raw array fallback');
               break;
             }

             // Check for text field containing markdown image with base64 data URL
             if (part.text && typeof part.text === 'string') {
               console.log('Found text field in raw array, checking for markdown image pattern');
               const markdownImageRegex = /!\[image\]\((data:image\/[^;]+;base64,[^)]+)\)/;
               const match = part.text.match(markdownImageRegex);
               if (match) {
                 imageUrl = match[1];
                 console.log('SUCCESS: Extracted image from raw array markdown text fallback, URL length:', imageUrl?.length || 0);
                 break;
               }
             }
           }
         }
       }

       // Priority 2: Check direct well-known fields
       if (!imageUrl) {
         console.log('Checking direct fields...');
         if (data.imageUrl && typeof data.imageUrl === 'string') {
           imageUrl = data.imageUrl;
           console.log('Found imageUrl in direct field');
         } else if (data.image && data.image.url && typeof data.image.url === 'string') {
           imageUrl = data.image.url;
           console.log('Found image.url in direct field');
         } else if (data.image && data.image.base64 && typeof data.image.base64 === 'string') {
           imageUrl = `data:image/png;base64,${data.image.base64}`;
           console.log('Found image.base64 in direct field');
         } else if (data.base64 && typeof data.base64 === 'string') {
           imageUrl = `data:image/png;base64,${data.base64}`;
           console.log('Found base64 in direct field');
         } else {
           console.log('No direct image fields found');
         }
       }

       // Priority 3: Fallback parsing for other API formats
       if (!imageUrl && data.raw && typeof data.raw === 'object') {
         console.log('Checking raw field for other formats...');
         const raw = data.raw;

         // Check for DALL-E style response
         if (raw.data && Array.isArray(raw.data) && raw.data.length > 0) {
           const imageData = raw.data[0];
           if (imageData.url) {
             imageUrl = imageData.url;
             console.log('Found DALL-E style URL');
           } else if (imageData.b64_json) {
             imageUrl = `data:image/png;base64,${imageData.b64_json}`;
             console.log('Found DALL-E style base64');
           }
         }
       }

    // Final fallback: check top-level text fields for embedded URLs
    console.log('Checking top-level text fields for URLs...');
    if (!imageUrl && typeof data === 'object') {
      const textCandidates = ['text', 'message', 'content', 'result'];
      for (const fld of textCandidates) {
        const v = (data as any)[fld];
        if (typeof v === 'string') {
          console.log('Checking text field:', fld, 'value:', v.substring(0, 100));
          const urlMatch = v.match(/https?:\/\/[^\s'"]+/);
          if (urlMatch) {
            imageUrl = urlMatch[0];
            console.log('Found URL in text field:', fld);
            break;
          }
        }
      }
    }

    console.log('Final result - imageUrl found:', !!imageUrl, 'imageUrl value:', imageUrl);
    if (!imageUrl) {
      console.error('Backend proxy returned unexpected response shape:', data);
      console.error('Available keys in response:', Object.keys(data));
      throw new Error('Backend proxy returned invalid response format');
    }

    const generationTime = Date.now() - startTime;
    if (import.meta.env.DEV) console.log('Image generation successful via backend proxy');

    return {
      imageUrl,
      generationTime,
      model: API_CONFIG.model
    };
  }
  catch (error: any) {
    handleError(error, 'ai_generation', {
      showToast: false, // Let the calling component handle UI feedback
      logError: true
    });
    throw error; // Re-throw for component-level handling
  }
}





