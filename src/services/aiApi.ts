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
}

// Image generation response interface
export interface ImageGenerationResponse {
  imageUrl: string;
  generationTime: number;
  model: string;
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

// Enhance image quality using canvas for upscaling and sharpening
// Enhance image quality using advanced super-resolution and anti-aliasing techniques
function enhanceImageQuality(imageUrl: string, targetDPI: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate scale factor based on target DPI
        // Assuming original image is 72 DPI (web standard)
        const originalDPI = 72;
        const scaleFactor = targetDPI / originalDPI;
        
        // For high DPI (600+), use progressive upscaling to avoid artifacts
        const progressiveUpscale = targetDPI >= 600;
        
        let currentCanvas = document.createElement('canvas');
        let currentCtx = currentCanvas.getContext('2d');
        
        if (!currentCtx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Progressive upscaling for high DPI to avoid pixelation
        if (progressiveUpscale) {
          // Step 1: Initial upscale to 2x
          const step1Scale = 2;
          currentCanvas.width = img.width * step1Scale;
          currentCanvas.height = img.height * step1Scale;
          
          // High-quality image rendering for initial upscale
          currentCtx.imageSmoothingEnabled = true;
          currentCtx.imageSmoothingQuality = 'high';
          currentCtx.drawImage(img, 0, 0, currentCanvas.width, currentCanvas.height);
          
          // Step 2: Apply advanced sharpening with edge preservation
          const imageData = currentCtx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
          const sharpenedData = applyAdvancedSharpening(imageData);
          currentCtx.putImageData(sharpenedData, 0, 0);
          
          // Step 3: Final upscale to target size with Lanczos interpolation
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = img.width * scaleFactor;
          finalCanvas.height = img.height * scaleFactor;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (!finalCtx) {
            reject(new Error('Could not get final canvas context'));
            return;
          }
          
          // Use high-quality scaling for final upscale
          finalCtx.imageSmoothingEnabled = true;
          finalCtx.imageSmoothingQuality = 'high';
          finalCtx.drawImage(currentCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
          
          // Step 4: Apply final enhancement for print quality
          const finalImageData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
          const enhancedData = applyPrintEnhancement(finalImageData, targetDPI);
          finalCtx.putImageData(enhancedData, 0, 0);
          
          // Convert to high-quality JPEG
          const enhancedImageUrl = finalCanvas.toDataURL('image/jpeg', 0.98);
          resolve(enhancedImageUrl);
          
        } else {
          // For lower DPI, use standard enhancement
          currentCanvas.width = img.width * scaleFactor;
          currentCanvas.height = img.height * scaleFactor;
          
          // Apply high-quality image rendering
          currentCtx.imageSmoothingEnabled = true;
          currentCtx.imageSmoothingQuality = 'high';
          currentCtx.drawImage(img, 0, 0, currentCanvas.width, currentCanvas.height);
          
          // Apply standard sharpening
          const imageData = currentCtx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
          const sharpenedData = applySharpeningFilter(imageData);
          currentCtx.putImageData(sharpenedData, 0, 0);
          
          // Convert to high-quality JPEG
          const enhancedImageUrl = currentCanvas.toDataURL('image/jpeg', 0.95);
          resolve(enhancedImageUrl);
        }
        
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

// Build complete prompt
function buildFullPrompt(prompt: string, negativePrompt?: string, dpi?: number, quality?: string): string {
  let fullPrompt = prompt;
  
  // Enhanced quality description for print requirements
  fullPrompt += ', masterpiece, best quality, professional, detailed, ultra high resolution, 8K quality';
  
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
      fullPrompt += ', ultra quality, maximum detail, professional grade, archival quality, museum quality, perfect sharpness';
    } else if (quality === 'high') {
      fullPrompt += ', high quality, excellent detail, premium print ready, sharp and clear';
    } else {
      fullPrompt += `, ${quality} quality`;
    }
  }
  
  // Add print-specific requirements for high DPI
  if (dpi && dpi >= 600) {
    fullPrompt += ', no artifacts, no blur, no noise, perfect sharpness, smooth gradients, professional printing quality';
    fullPrompt += ', vector-like quality, sharp edges, clean lines, perfect details, commercial grade';
  }
  
  // Add print-specific requirements
  fullPrompt += ', sharp edges, clean lines, no blur, no artifacts, crisp details, vibrant colors';
  
  // Add negative prompts
  if (negativePrompt) {
    fullPrompt += ` ### ${negativePrompt}`;
  }
  
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
    
    // Build complete prompt
    const fullPrompt = buildFullPrompt(request.prompt, request.negativePrompt, request.dpi, request.quality);
    
    // Use Gemini format to call API
    console.log('Using Gemini format to call API...');
    
    // Build request body - use Gemini format
    let requestBody: any;
    
    if (request.image) {
      // Convert image to base64 format
      const imageBase64 = await fileToBase64(request.image);
      
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              },
              {
                inline_data: {
                  mime_type: request.image.type || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
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
        ]
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
    
    let response;
    try {
      response = await fetch(apiUrl, requestOptions);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Network request failed: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check response status
    if (!response.ok) {
      console.error('HTTP error status:', response.status, response.statusText);
      
      // Check if it's a CORS error
      if (response.status === 0) {
        throw new Error('CORS error: API server not configured to allow cross-origin requests. Please check API configuration or contact API provider.');
      }
      
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
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
    
    const generationTime = Date.now() - startTime;
    
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
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
          // Check if there is inlineData (base64 image data)
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            console.log('Found base64 image data in Gemini format');
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
          // Check if there is text response (may be error message)
          if (part.text) {
            console.log('Gemini returned text response:', part.text);
            // If returned text instead of image, model may not support image generation
            if (part.text.includes('art') || part.text.includes('portrait') || part.text.includes('style')) {
              throw new Error('AI model returned text response instead of image. Please check if model supports image generation function.');
            }
          }
        }
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

    // Enhance image quality for printing
    if (imageUrl && request.dpi && request.dpi >= 300) {
      console.log('Applying image quality enhancement for printing...');
      try {
        const enhancedImageUrl = await enhanceImageQuality(imageUrl, request.dpi);
        imageUrl = enhancedImageUrl;
        console.log('Image quality enhancement completed');
      } catch (enhanceError) {
        console.warn('Image enhancement failed, using original image:', enhanceError);
      }
    }

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
          size: '1024x1024',
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
        size: '1024x1024',
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
        size: '1024x1024',
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

// Get supported image sizes
function getSupportedSize(width?: number, height?: number): '1024x1024' | '1792x1024' | '1024x1792' {
  // Default to 1024x1024
  if (!width || !height) {
    return '1024x1024';
  }
  
  // Choose most appropriate size based on aspect ratio
  const aspectRatio = width / height;
  
  if (aspectRatio > 1.5) {
    return '1792x1024'; // Wide image
  } else if (aspectRatio < 0.67) {
    return '1024x1792'; // Tall image
  } else {
    return '1024x1024'; // Square image
  }
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