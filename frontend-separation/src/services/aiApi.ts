import OpenAI from 'openai';

// API call configuration - Use environment variables
const API_CONFIG = {
  baseURL: import.meta.env.VITE_AI_API_BASE_URL || 'https://api.apiyi.com/v1',
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  model: import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash-image'
} as const;

// Initialize OpenAI client with proper error handling
let openai: OpenAI | null = null;

// Initialize client only if API key is available
try {
  if (API_CONFIG.apiKey && API_CONFIG.apiKey.trim() !== '') {
    openai = new OpenAI({
      apiKey: API_CONFIG.apiKey,
      baseURL: API_CONFIG.baseURL,
      dangerouslyAllowBrowser: true // Allow use in browser environment
    });
  }
} catch (error) {
  console.warn('Failed to initialize AI client:', error);
}

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
async function compressImage(file: File, maxWidth: number = 3072, quality: number = 0.99): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress if file is extremely large (10MB+) to maintain maximum quality
    if (file.size < 10 * 1024 * 1024) { // Less than 10MB - don't compress at all
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

// 检测和校正图像方向 - 与前端组件保持一致的简单逻辑
// 对于宠物肖像，我们期望纵向（垂直）方向
// 注意：此函数目前不再被使用
// 图像旋转现在完全由前端组件负责，基于与原图的比较
// 保留此函数以备将来可能需要
function correctImageOrientation(img: HTMLImageElement): { rotation: number; width: number; height: number } {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  let rotation = 0;
  
  // 确保有有效的尺寸
  if (!width || !height || width === 0 || height === 0) {
    console.warn('Invalid image dimensions in correctImageOrientation:', { width, height });
    return { rotation: 0, width, height };
  }
  
  // 对于宠物肖像，我们期望纵向（垂直）方向
  // 如果图像是横向（宽度 > 高度），自动旋转90度
  // 注意：此逻辑现在由前端组件处理，基于与原图的比较
  if (width > height) {
    rotation = 90;
    [width, height] = [height, width];
    console.log(`Auto-corrected orientation: landscape (${img.naturalWidth}x${img.naturalHeight}) to portrait - rotating 90°`);
  }
  
  return { rotation, width, height };
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

// Apply sharpening filter to image data
function applySharpeningFilter(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const outputData = new Uint8ClampedArray(data.length);
  
  // Simple sharpening kernel
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
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
        outputData[outputIndex] = Math.max(0, Math.min(255, sum));
      }
      // Keep alpha channel unchanged
      outputData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }
  
  return new ImageData(outputData, width, height);
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

// Generate image function
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    // Check if AI client is initialized
    if (!openai) {
      throw new Error('AI service not configured. Please set VITE_AI_API_KEY environment variable.');
    }
    
    const startTime = Date.now();
    
    // Build complete prompt (include dimensions in prompt for Gemini API)
    let fullPrompt = buildFullPrompt(request.prompt, request.negativePrompt, request.dpi, request.quality);
    
    // Add dimensions to prompt if specified (Gemini API may need this in prompt)
    if (request.width && request.height) {
      fullPrompt += `, output image dimensions: ${request.width}x${request.height} pixels, maintain aspect ratio ${request.width}:${request.height}`;
      console.log(`Requested image dimensions: ${request.width}x${request.height}`);
    }
    
    // Use Gemini format to call API
    console.log('Using Gemini format to call API...');
    
    // Build request body - use Gemini format
    let requestBody: any;
    
    // Generation configuration for quality consistency
    // Higher temperature = more creative but less consistent
    // Lower temperature = more consistent but potentially less creative
    const generationConfig = {
      temperature: 0.4,  // Lower temperature for more consistent results (0.0-1.0)
      topP: 0.8,         // Nucleus sampling for quality control
      topK: 40,          // Limit token selection for consistency
      // Use seed if provided for reproducible results
      ...(request.seed !== undefined && { seed: request.seed })
    };
    
    if (request.image) {
      // Only compress if absolutely necessary (maintains maximum quality)
      console.log('Checking if image compression is needed...');
      const compressedImage = await compressImage(request.image, 3072, 0.99); // Maximum quality, larger max width
      if (compressedImage.size < request.image.size) {
        console.log(`Image compressed (minimal): ${(request.image.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedImage.size / 1024 / 1024).toFixed(2)}MB`);
      } else {
        console.log('Original image quality maintained - no compression applied');
      }
      
      // Convert compressed image to base64 format
      const imageBase64 = await fileToBase64(compressedImage);
      
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              },
              {
                inline_data: {
                  mime_type: compressedImage.type || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: generationConfig
      };
    } else {
      // If no image, only send text prompt
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: generationConfig
      };
    }
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    };
    
    const apiUrl = `${API_CONFIG.baseURL}/models/${API_CONFIG.model}:generateContent`;
    console.log('API request configuration:', {
      url: apiUrl,
      method: 'POST',
      headers: requestOptions.headers,
      body: requestOptions.body
    });
    
    // Retry mechanism for network errors
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second (backoff with attempt multiplier)
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API request attempt ${attempt}/${maxRetries}...`);
        
        // Note: avoid aggressive timeout to prevent premature aborts
        const response = await fetch(apiUrl, requestOptions);
        
        // If we get a response, process it
        if (response.ok) {
          // Success - process response
          return await processApiResponse(response, startTime, request);
        }
        
        // For 5xx errors, retry
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`Server error ${response.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // For non-retryable errors, throw immediately
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
        
      } catch (fetchError: any) {
        lastError = fetchError;
        console.error(`Fetch error on attempt ${attempt}:`, fetchError);
        
        // Check if it's a network error or timeout
        const isNetworkError = fetchError.name === 'TypeError' || 
                              fetchError.name === 'AbortError' ||
                              fetchError.message.includes('Failed to fetch') ||
                              fetchError.message.includes('ERR_HTTP2_PING_FAILED') ||
                              fetchError.message.includes('network');
        
        if (isNetworkError && attempt < maxRetries) {
          console.warn(`Network error detected, retrying in ${retryDelay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // If it's the last attempt or not a network error, throw
        if (attempt === maxRetries || !isNetworkError) {
          throw new Error(`Network request failed after ${attempt} attempts: ${fetchError.message}`);
        }
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Unknown error occurred');
    
    // Helper function to process API response
    async function processApiResponse(response: Response, startTime: number, request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
      const generationTime = Date.now() - startTime;
      let data;
      const responseText = await response.text();
      
      console.log('API raw response:', responseText);
      
      // First check if response is XML format error
      if (responseText.includes('<Error>') && responseText.includes('NoSuchKey')) {
        console.log('Detected XML format error response');
        
        // Try to extract useful information from error message
        const keyMatch = responseText.match(/<Key>([^<]+)<\/Key>/);
        if (keyMatch) {
          console.log('Image file Key:', keyMatch[1]);
        }
        
        // Try to parse XML error
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(responseText, 'text/xml');
          const errorCode = xmlDoc.getElementsByTagName('Code')[0]?.textContent;
          const errorMessage = xmlDoc.getElementsByTagName('Message')[0]?.textContent;
          
          console.log('XML error information:', { errorCode, errorMessage });
          
          // If it's NoSuchKey error, image was generated but URL is invalid
          if (errorCode === 'NoSuchKey') {
            throw new Error('API platform returned invalid image URL. Please check API documentation or contact technical support.');
          }
        } catch (xmlError) {
          console.error('Failed to parse XML error:', xmlError);
        }
        
        // Try to parse response text as JSON
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          // If cannot parse as JSON, create an error object
          data = { error: { message: 'API returned XML format error: ' + responseText.substring(0, 200) } };
        }
      } else {
        // Normal JSON response
        try {
          data = JSON.parse(responseText);
          console.log('API response data:', JSON.stringify(data, null, 2));
        } catch (error) {
          console.error('Failed to parse API response:', error);
          console.log('Raw response text:', responseText.substring(0, 500));
          throw new Error('API returned unparsable response format');
        }
      }
    
    // Output complete API response data for debugging
    console.log('Complete API response data:', JSON.stringify(data, null, 2));
    console.log('API response data type:', typeof data);
    console.log('API response data keys:', Object.keys(data));
    
    // Check response structure
    if (data.data) {
      console.log('data field type:', typeof data.data);
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('data[0] keys:', Object.keys(data.data[0]));
      }
    }
    if (data.images) {
      console.log('images field type:', typeof data.images);
      if (Array.isArray(data.images) && data.images.length > 0) {
        console.log('images[0] keys:', Object.keys(data.images[0]));
      }
    }
    
    // Check Gemini format response
    let imageUrl: string | undefined;
    
    console.log('Start parsing Gemini format response...');
    
    // Format 1: Check Gemini format response (candidates array)
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      console.log('Found Gemini format response');
      const candidate = data.candidates[0];
      let textOnlyResponse: string | null = null;
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
          // Check inline image
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            console.log('Found base64 image data in Gemini format');
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
          // Record text if present (do not throw yet)
          if (part.text) {
            console.log('Gemini returned text response:', part.text);
            textOnlyResponse = part.text;
          }
        }
      }
      // If no image found but text exists, throw descriptive error
      if (!imageUrl && textOnlyResponse) {
        throw new Error('AI model returned text response instead of image. Please check if model supports image generation function.');
      }
    }
    
    // Format 2: Check OpenAI standard format (data array)
    if (!imageUrl && data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log('Found OpenAI standard format response');
      const imageData = data.data[0];
      if (imageData.url) {
        imageUrl = imageData.url;
        console.log('Using URL format image:', imageUrl);
      } else if (imageData.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
        console.log('Using base64 format image');
      }
    }
    
    // Format 3: Check direct URL format
    if (!imageUrl && data.url) {
      console.log('Found direct URL format response');
      imageUrl = data.url;
    }
    
    // Format 4: Check base64 format
    if (!imageUrl && data.base64) {
      console.log('Found base64 format response');
      imageUrl = `data:image/png;base64,${data.base64}`;
    }
    
    // Format 5: Check b64_json format
    if (!imageUrl && data.b64_json) {
      console.log('Found b64_json format response');
      imageUrl = `data:image/png;base64,${data.b64_json}`;
    }
    
    // Format 6: Check if there is error message
    if (!imageUrl && data.error) {
      console.log('API returned error message:', data.error);
      throw new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!imageUrl) {
      // If all formats don't match, try to process entire response as base64
      const responseString = JSON.stringify(data);
      console.log('Try to parse response string:', responseString.substring(0, 200) + '...');
      
      if (responseString.length > 100) {
        // Check if contains base64 characteristics
        if (responseString.includes('b64_json') || responseString.includes('base64')) {
          // Try to extract base64 data
          const base64Match = responseString.match(/(?:"b64_json"\s*:\s*")([^"]+)/);
          if (base64Match && base64Match[1]) {
            console.log('Found b64_json data, length:', base64Match[1].length);
            imageUrl = `data:image/png;base64,${base64Match[1]}`;
          }
        }
        
        // Try to directly find base64 data
        const directBase64Match = responseString.match(/(?:image|data|base64)["\s]*:["\s]*([A-Za-z0-9+/=]{100,})/);
        if (directBase64Match && directBase64Match[1]) {
          console.log('Found direct base64 data, length:', directBase64Match[1].length);
          imageUrl = `data:image/png;base64,${directBase64Match[1]}`;
        }
      }
      
      if (!imageUrl) {
        // Last attempt: if response itself is base64 string
        if (typeof data === 'string' && data.length > 1000) {
          console.log('Response itself may be base64 string, length:', data.length);
          imageUrl = `data:image/png;base64,${data}`;
        } else {
          throw new Error('Cannot parse API response format, please check API documentation. Response data: ' + JSON.stringify(data).substring(0, 500));
        }
      }
    }
    
    // Validate imageUrl format
    console.log('Final generated imageUrl:', imageUrl ? imageUrl.substring(0, 100) + '...' : 'null');
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
      console.warn('imageUrl format may be incorrect, try to fix:', imageUrl.substring(0, 100));
      // If looks like base64 but no prefix, add prefix
      if (imageUrl.length > 100 && /^[A-Za-z0-9+/=]+$/.test(imageUrl.replace(/\s/g, ''))) {
        imageUrl = `data:image/png;base64,${imageUrl}`;
        console.log('Fixed imageUrl:', imageUrl.substring(0, 100) + '...');
      }
    }

    // Enhance image quality for printing (async - return original immediately)
    let enhancementPromise: Promise<string> | undefined;
    if (imageUrl && request.dpi && request.dpi >= 300) {
      console.log('Starting image quality enhancement for printing (async)...');
      // Start enhancement in background, don't wait for it
      enhancementPromise = enhanceImageQuality(imageUrl, request.dpi)
        .then((enhancedUrl) => {
          console.log('Image quality enhancement completed');
          return enhancedUrl;
        })
        .catch((enhanceError) => {
          console.warn('Image enhancement failed, using original image:', enhanceError);
          return imageUrl; // Return original if enhancement fails
        });
      
      // Optionally wait for enhancement if user wants highest quality (commented out for speed)
      // For now, return original immediately and enhance in background
      // const enhancedImageUrl = await enhancementPromise;
      // imageUrl = enhancedImageUrl;
    }

      return {
        imageUrl, // Return original image immediately
        generationTime,
        model: API_CONFIG.model,
        enhancementPromise // Optional: can be used to get enhanced version later
      };
    }
    
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate image using simple format (fallback method)
async function generateImageWithSimpleFormat(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const startTime = Date.now();
  
  // Build complete prompt
  const fullPrompt = buildFullPrompt(request.prompt, request.negativePrompt);
  
  try {
    // Try using simpler API call format
    const response = await openai.images.generate({
      model: API_CONFIG.model,
      prompt: fullPrompt,
      n: 1,
    });

    const generationTime = Date.now() - startTime;
    
    // Check response format
    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Invalid response format from AI API');
    }

    return {
      imageUrl: response.data[0].url,
      generationTime,
      model: API_CONFIG.model
    };
  } catch (error) {
    console.error('Simple format API Error:', error);
    
    // If simple format also fails, try using fetch API directly
    return await generateImageWithFetchAPI(request);
  }
}

// Use fetch API for direct call (final fallback method)
async function generateImageWithFetchAPI(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const startTime = Date.now();
  
  // Build complete prompt
  const fullPrompt = buildFullPrompt(request.prompt, request.negativePrompt);
  
  try {
    // First try Gemini format, as this is required for the API platform gemini-2.5-flash-image-preview model
    return await tryGeminiFormat(request, fullPrompt, startTime);
  } catch (error) {
    console.error('Gemini format failed, trying standard format:', error);
    
    try {
      // If Gemini format fails, try standard format
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
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response format from AI API');
      }

      return {
        imageUrl: data.data[0].url,
        generationTime,
        model: API_CONFIG.model
      };
    } catch (error) {
      console.error('Standard format failed, trying simple format:', error);
      
      // If standard format also fails, try simplest format
      return await trySimpleFormat(request, fullPrompt, startTime);
    }
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

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    // Check if AI client is initialized
    if (!openai) {
      console.error('AI service not configured. Please set VITE_AI_API_KEY environment variable.');
      return false;
    }
    // Send a simple test request
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

// Get available model list
export async function getAvailableModels(): Promise<string[]> {
  try {
    // Check if AI client is initialized
    if (!openai) {
      console.error('AI service not configured. Please set VITE_AI_API_KEY environment variable.');
      return [];
    }
    
    const models = await openai.models.list();
    return models.data.map(model => model.id);
  } catch (error) {
    console.error('Failed to get model list:', error);
    return [];
  }
}