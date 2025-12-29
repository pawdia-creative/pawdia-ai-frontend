
// API call configuration - Use backend proxy endpoint
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api',
  apiKey: '', // Not needed when using backend proxy
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


// Enhance image quality using canvas for upscaling (balanced quality and speed)
function enhanceImageQuality(imageUrl: string, targetDPI: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // 不再在后端增强函数中旋转图片
        // 旋转由前端组件负责，基于与原图的比较
        // 这样可以避免双重旋转，并保持逻辑一致性
        const finalWidth = img.naturalWidth || img.width;
        const finalHeight = img.naturalHeight || img.height;
        
        console.log(`Enhancing image: ${finalWidth}x${finalHeight} at ${targetDPI} DPI`);
        
        // Calculate scale factor based on target DPI
        // Assuming original image is 72 DPI (web standard)
        const originalDPI = 72;
        const scaleFactor = targetDPI / originalDPI;
        
        console.log(`Scale factor: ${scaleFactor.toFixed(2)}`);
        
        // If scale factor is very small (< 1.2), no need to enhance
        if (scaleFactor < 1.2) {
          console.log('Scale factor too small, skipping enhancement');
          resolve(imageUrl);
          return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.warn('Failed to get canvas context, returning original image');
          resolve(imageUrl); // Return original if can't get context
          return;
        }
        
        // Calculate target dimensions (use original dimensions)
        canvas.width = Math.round(finalWidth * scaleFactor);
        canvas.height = Math.round(finalHeight * scaleFactor);
        
        console.log(`Target dimensions: ${canvas.width}x${canvas.height}`);
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Progressive upscaling for better quality (2-step for large scale factors)
        if (scaleFactor > 2.5) {
          // Step 1: Upscale to intermediate size (2x)
          const intermediateCanvas = document.createElement('canvas');
          intermediateCanvas.width = Math.round(img.width * 2);
          intermediateCanvas.height = Math.round(img.height * 2);
          const intermediateCtx = intermediateCanvas.getContext('2d');
          
          if (intermediateCtx) {
            intermediateCtx.imageSmoothingEnabled = true;
            intermediateCtx.imageSmoothingQuality = 'high';
            intermediateCtx.drawImage(img, 0, 0, intermediateCanvas.width, intermediateCanvas.height);
            
            // Step 2: Final upscale to target size
            ctx.drawImage(intermediateCanvas, 0, 0, canvas.width, canvas.height);
          } else {
            // Fallback to single-step
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        } else {
          // Single-step upscale for smaller scale factors
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Apply sharpening based on DPI requirements
        if (targetDPI >= 300) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let sharpenedData: ImageData;
            
            // Use advanced sharpening for high DPI (600+)
            if (targetDPI >= 600 && scaleFactor > 2) {
              sharpenedData = applyAdvancedSharpening(imageData);
            } else {
              // Use light sharpening for standard DPI
              sharpenedData = applyLightSharpening(imageData);
            }
            
            ctx.putImageData(sharpenedData, 0, 0);
          } catch (sharpError) {
            console.warn('Sharpening failed, using upscaled image:', sharpError);
            // Continue with upscaled image without sharpening
          }
        }
        
        // Convert to maximum quality JPEG (0.99 quality for best quality)
        const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.99);
        console.log('Image enhancement completed successfully');
        resolve(enhancedImageUrl);
        
      } catch (error) {
        console.error('Image enhancement error:', error);
        // If enhancement fails, return original image
        resolve(imageUrl);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for enhancement');
      resolve(imageUrl); // Return original if enhancement fails
    };
    
    img.src = imageUrl;
  });
}

// Light sharpening filter (faster than advanced sharpening)
function applyLightSharpening(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const outputData = new Uint8ClampedArray(data.length);
  
  // Simple sharpening kernel (lighter than advanced version)
  const kernel = [
    [0, -0.25, 0],
    [-0.25, 2, -0.25],
    [0, -0.25, 0]
  ];
  
  // Copy border pixels unchanged
  for (let i = 0; i < data.length; i++) {
    outputData[i] = data[i];
  }
  
  // Apply kernel to interior pixels (only process every other pixel for speed)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelValue = kernel[ky + 1][kx + 1];
            sum += data[pixelIndex] * kernelValue;
          }
        }
        const outputIndex = (y * width + x) * 4 + c;
        outputData[outputIndex] = Math.max(0, Math.min(255, sum));
      }
      // Keep alpha channel unchanged
      outputData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }
  
  return new ImageData(outputData, width, height);
}

// Advanced sharpening with edge preservation
function applyAdvancedSharpening(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const outputData = new Uint8ClampedArray(data.length);
  
  // Advanced sharpening kernel with edge preservation
  const kernel = [
    [0, -0.5, 0],
    [-0.5, 3, -0.5],
    [0, -0.5, 0]
  ];
  
  // Copy border pixels unchanged
  for (let i = 0; i < data.length; i++) {
    outputData[i] = data[i];
  }
  
  // Apply kernel to interior pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelValue = kernel[ky + 1][kx + 1];
            sum += data[pixelIndex] * kernelValue;
          }
        }
        const outputIndex = (y * width + x) * 4 + c;
        // Apply edge-preserving sharpening
        const originalValue = data[outputIndex];
        const sharpenedValue = Math.max(0, Math.min(255, sum));
        
        // Blend based on edge detection to avoid over-sharpening
        const edgeStrength = detectEdgeStrength(data, x, y, width);
        const blendedValue = originalValue * (1 - edgeStrength) + sharpenedValue * edgeStrength;
        
        outputData[outputIndex] = Math.max(0, Math.min(255, blendedValue));
      }
    }
  }
  
  return new ImageData(outputData, width, height);
}

// Edge detection for adaptive sharpening
function detectEdgeStrength(data: Uint8ClampedArray, x: number, y: number, width: number): number {
  const centerIndex = (y * width + x) * 4;
  const centerLuminance = (data[centerIndex] + data[centerIndex + 1] + data[centerIndex + 2]) / 3;
  
  let maxDiff = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
      const neighborLuminance = (data[neighborIndex] + data[neighborIndex + 1] + data[neighborIndex + 2]) / 3;
      const diff = Math.abs(centerLuminance - neighborLuminance);
      maxDiff = Math.max(maxDiff, diff);
    }
  }
  
  // Normalize to 0-1 range
  return Math.min(maxDiff / 100, 1);
}

// Print-specific enhancement for high DPI
function applyPrintEnhancement(imageData: ImageData, targetDPI: number): ImageData {
  const { width, height, data } = imageData;
  const outputData = new Uint8ClampedArray(data.length);
  
  // Copy original data
  for (let i = 0; i < data.length; i++) {
    outputData[i] = data[i];
  }
  
  // Apply print-specific enhancements based on DPI
  if (targetDPI >= 600) {
    // Ultra DPI: Apply noise reduction and color enhancement
    applyNoiseReduction(outputData, width, height);
    applyColorEnhancement(outputData, width, height);
  }
  
  if (targetDPI >= 1200) {
    // Maximum DPI: Apply additional sharpening and contrast enhancement
    applyContrastEnhancement(outputData, width, height);
  }
  
  return new ImageData(outputData, width, height);
}

// Noise reduction using median filter
function applyNoiseReduction(data: Uint8ClampedArray, width: number, height: number): void {
  const tempData = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const values = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixelIndex = ((y + dy) * width + (x + dx)) * 4 + c;
            values.push(data[pixelIndex]);
          }
        }
        // Use median value for noise reduction
        values.sort((a, b) => a - b);
        const medianValue = values[4]; // Middle value of 9 elements
        
        const outputIndex = (y * width + x) * 4 + c;
        tempData[outputIndex] = medianValue;
      }
      // Copy alpha channel
      tempData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }
  
  // Copy back to original data
  for (let i = 0; i < data.length; i++) {
    data[i] = tempData[i];
  }
}

// Color enhancement for print
function applyColorEnhancement(data: Uint8ClampedArray, width: number, height: number): void {
  for (let i = 0; i < data.length; i += 4) {
    // Slightly boost saturation for print
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const avg = (r + g + b) / 3;
    const saturationBoost = 1.1; // 10% saturation boost
    
    data[i] = Math.min(255, avg + (r - avg) * saturationBoost);
    data[i + 1] = Math.min(255, avg + (g - avg) * saturationBoost);
    data[i + 2] = Math.min(255, avg + (b - avg) * saturationBoost);
  }
}

// Contrast enhancement
function applyContrastEnhancement(data: Uint8ClampedArray, width: number, height: number): void {
  for (let i = 0; i < data.length; i += 4) {
    // Apply mild contrast enhancement
    const contrast = 1.05; // 5% contrast boost
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      data[i + c] = Math.min(255, Math.max(0, factor * (value - 128) + 128));
    }
  }
}


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

    console.log('Calling backend proxy for image generation...');

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
          console.warn('Image base64 payload is large, applying extra compression passes', { length: b64.length, clampMaxWidth });
          // Multi-pass aggressive compression strategy:
          // 1) Reduce to target short side (request.width/request.height short side or 512) at quality 0.80
          // 2) If still too large, reduce to 384 at quality 0.72
          // 3) If still too large, reduce to 256 at quality 0.65
          const targetShortSide = Math.max(request.width || 512, request.height || 512);
          const firstTarget = Math.min(Math.max(512, targetShortSide), 1024);
          imgFile = await compressImage(request.image, firstTarget, 0.80);
          b64 = await fileToBase64(imgFile);
          console.log('After pass 1 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const secondTarget = 384;
            imgFile = await compressImage(request.image, secondTarget, 0.72);
            b64 = await fileToBase64(imgFile);
            console.log('After pass 2 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            const thirdTarget = 256;
            imgFile = await compressImage(request.image, thirdTarget, 0.65);
            b64 = await fileToBase64(imgFile);
            console.log('After pass 3 aggressive compression, base64 length:', b64.length, 'mime:', imgFile.type);
          }

          if (b64.length > BASE64_WARN_THRESHOLD) {
            console.warn('Image still large after aggressive compression passes; final base64 length:', b64.length);
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
        console.log('Image-to-image request prepared, size:', b64.length, 'mime:', proxyRequestBody.imageMimeType, 'strength:', proxyRequestBody.image_strength);
      } catch (e) {
        console.warn('Failed to prepare image input for A.I. proxy, falling back to text-only:', e);
      }
    }

    // Call the backend proxy endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    try {
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // localStorage may be unavailable in some environments; ignore
      console.warn('Could not read token from localStorage for AI request', e);
    }

    const response = await fetch(`${API_CONFIG.baseURL}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(proxyRequestBody)
    });

    const generationTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend proxy error:', response.status, errorText);
      throw new Error(`Backend proxy error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend proxy response:', data);

    // Check if the backend returned an error
    if (data.error) {
      throw new Error(`AI API error: ${data.error}`);
    }

    // The backend should return the image URL or base64 data
    let imageUrl: string;

    if (data.imageUrl) {
      imageUrl = data.imageUrl;
    } else if (data.image && data.image.url) {
      imageUrl = data.image.url;
    } else if (data.image && data.image.base64) {
      imageUrl = `data:image/png;base64,${data.image.base64}`;
    } else if (data.base64) {
      imageUrl = `data:image/png;base64,${data.base64}`;
    } else {
      throw new Error('Backend proxy returned invalid response format');
    }

    console.log('Image generation successful via backend proxy');

    return {
      imageUrl,
      generationTime,
      model: API_CONFIG.model
    };

  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}



// Try Gemini format API call
async function tryGeminiFormat(request: ImageGenerationRequest, fullPrompt: string, startTime: number): Promise<ImageGenerationResponse> {
  try {
    // Use standard OpenAI image generation format, not Gemini format
    const response = await fetch(`${API_CONFIG.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        prompt: fullPrompt,
        n: 1,
        size: getSupportedSize(request.width, request.height),
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const generationTime = Date.now() - startTime;
    
    // Parse Gemini format response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const parts = data.candidates[0].content.parts;
      
      // Find image URL
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType === 'image/png') {
          // Process base64 image data
          const imageData = part.inlineData.data;
          return {
            imageUrl: `data:image/png;base64,${imageData}`,
            generationTime,
            model: API_CONFIG.model
          };
        } else if (part.text && part.text.includes('http')) {
          // Extract URL
          const urlMatch = part.text.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            return {
              imageUrl: urlMatch[0],
              generationTime,
              model: API_CONFIG.model
            };
          }
        }
      }
    }
    
    // Try other response formats
    if (data.images && data.images[0] && data.images[0].url) {
      return {
        imageUrl: data.images[0].url,
        generationTime,
        model: API_CONFIG.model
      };
    }
    
    if (data.data && data.data[0] && data.data[0].url) {
      return {
        imageUrl: data.data[0].url,
        generationTime,
        model: API_CONFIG.model
      };
    }
    
    throw new Error('Unable to parse Gemini API response format');
  } catch (error) {
    console.error('Gemini format API Error:', error);
    
    // If Gemini format also fails, try simplest format
    return await trySimpleFormat(request, fullPrompt, startTime);
  }
}

// Try simplest API format
async function trySimpleFormat(request: ImageGenerationRequest, fullPrompt: string, startTime: number): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        prompt: fullPrompt,
        n: 1,
        size: getSupportedSize(request.width, request.height),
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const generationTime = Date.now() - startTime;
    
    // Try parsing different response formats
    if (data.data && data.data[0] && data.data[0].url) {
      return {
        imageUrl: data.data[0].url,
        generationTime,
        model: API_CONFIG.model
      };
    } else if (data.images && data.images[0] && data.images[0].url) {
      return {
        imageUrl: data.images[0].url,
        generationTime,
        model: API_CONFIG.model
      };
    } else if (data.url) {
      return {
        imageUrl: data.url,
        generationTime,
        model: API_CONFIG.model
      };
    }
    
    throw new Error('Unable to parse API response format');
  } catch (error) {
    console.error('Simple format API Error:', error);
    throw new Error(`All API call methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get supported image size string for API (use actual dimensions if provided)
function getSupportedSize(width?: number, height?: number): string {
  // If dimensions are provided, use them directly (format: "WIDTHxHEIGHT")
  if (width && height) {
    // Round to nearest supported size or use exact dimensions
    // For APIs that support custom sizes, use exact dimensions
    // For APIs that only support specific sizes, map to closest supported size
    return `${width}x${height}`;
  }
  
  // Default to 1024x1024 if no dimensions provided
  return '1024x1024';
}
