// AI art style prompt configuration
// AI prompt templates for generating pet portraits

export interface StylePrompt {
  id: string;
  name: string;
  description: string;
  // AI prompt templates
  promptTemplate: string;
  // Negative prompts
  negativePrompt?: string;
  // Style parameters
  parameters?: {
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    width?: number;
    height?: number;
  };
}

export const stylePrompts: StylePrompt[] = [
  {
    id: "oil-painting",
    name: "Oil Painting",
    description: "Classic texture with rich, vibrant colors",
    // Strictly preserve original composition, pose, background and orientation
    promptTemplate:
      "Convert this pet photo into a classical oil painting with strong hand‑painted texture, but KEEP the original image content EXACTLY the same. " +
      "Hard constraints: 1) Do NOT rotate or flip the scene, keep the same camera angle and orientation as the original photo. " +
      "2) KEEP the pet’s breed, body proportions, pose, posture, head angle, facial expression, fur color, markings, and accessories (such as scarf, collar, clothes) 100% identical to the original photo. " +
      "3) KEEP the composition and framing: the pet’s position in the frame, relative size, and crop must match the original photo. " +
      "4) KEEP the main background structure (ground, street, buildings, trees, people, depth and perspective, light direction) the same as the original photo, only convert them into oil‑painting strokes instead of changing or replacing them. " +
      "Only change the rendering style into a thick, hand‑painted oil painting: visible impasto brush strokes, rich layered paint, tactile three‑dimensional texture, palette‑knife and heavy brushwork. " +
      "Colors should be rich, warm and saturated with classic Old Master tones, with soft chiaroscuro / Rembrandt‑style lighting, but WITHOUT changing the scene layout. " +
      "The final image must look like the original photograph was directly painted over in oil, not a new composition or new pose. " +
      "Emphasize: NO change of composition, NO change of pet pose, NO change of background structure, NO rotation or flipping of the whole image.",
    negativePrompt:
      "blurry, low quality, low resolution, rotated image, flipped image, extreme perspective change, different pose, different dog, different animal, different background, scene changed, zoomed out, zoomed in, cropped differently, cartoon, anime, digital illustration, watercolor, sketch, abstract, surreal, distorted features, deformed body, extra limbs, missing limbs, changed clothing, different scarf, different environment",
    parameters: {
      steps: 28,
      cfgScale: 6.5,
      sampler: "DPM++ 2M Karras",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft brushstrokes and dreamy gradients",
    promptTemplate:
      "Transform this pet photo into an extremely translucent and aesthetic watercolor painting style while STRICTLY preserving the original content. " +
      "Hard constraints: do NOT rotate or flip the image, keep the same camera angle and framing. " +
      "KEEP the pet's breed, posture, body proportions, head angle, expression, fur color, markings and accessories exactly the same as the original photo. " +
      "KEEP the main background structure, perspective and light direction, only convert them into soft watercolor washes instead of changing the scene. " +
      "Apply pure stylistic conversion: soft wet‑on‑wet blending, translucent layered washes, hazy diffusion at the edges, natural watercolor granulation and flow. " +
      "Colors should be fresh and elegant with controlled saturation, the background can be slightly simplified and softened but must follow the same composition and depth as the original image.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, changed composition, different pose, different background, scene replaced, cartoon, anime, oil painting, hard edges, heavy brushstrokes, opaque colors, abstract, distorted features, deformed body, extra limbs, missing limbs",
    parameters: {
      steps: 25,
      cfgScale: 7.0,
      sampler: "Euler a",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "gta-style",
    name: "Urban Comic",
    description: "Rockstar's cover-art aesthetic with bold outlines",
    promptTemplate:
      "Convert this pet photo into a GTA‑style illustration inspired by Rockstar’s cover‑art aesthetic, but WITHOUT any GTA text or typography and WITHOUT changing the original scene layout. " +
      "Strict requirement: preserve the pet’s original proportions, eye size, breed features, markings, posture, body orientation and expression exactly as in the photo. Do NOT alter the anatomy, do NOT exaggerate features, do NOT change the pose. " +
      "Keep the same composition, camera angle and cropping as the original image; do not rotate or flip the picture. " +
      "Convert the existing background into a graphic, poster‑like treatment with bold shapes and stylized lighting, but keep the same perspective and object layout as the original scene. " +
      "Use bold black outlines, high‑contrast cel shading and vibrant saturated colors, so it feels like the original photo was redrawn in GTA cover‑art style, not a new composition.",
    negativePrompt:
      "blurry, low quality, rotated image, flipped image, different pose, different dog, different animal, completely new background, scene changed, chibi, big head, exaggerated eyes, surreal, abstract, watercolor, oil painting, sketch, logos, game titles, text, typography",
    parameters: {
      steps: 25,
      cfgScale: 8.0,
      sampler: "DPM++ 2M Karras",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "chinese-ink",
    name: "Chinese Ink Painting",
    description: "Traditional East Asian brushwork and elegance",
    promptTemplate:
      "Convert this pet photo into a traditional Chinese ink‑wash painting (Shuimo / Guohua) style while keeping the original pose and composition. " +
      "Strict requirement: preserve the pet’s recognizable silhouette, proportions, posture and head direction from the original photo, so viewers can clearly recognize it is the same pet in the same position. " +
      "Do not rotate or flip the image; keep the main composition and subject placement in the frame. " +
      "Use authentic ink‑wash techniques with rich variations of ink density, dryness and moisture, expressive brushwork and intentional blank space, but base the structure and perspective on the original scene. " +
      "The background can be simplified and partially left blank in classical Guohua style, but it should still loosely follow the depth and general layout of the original environment.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, changed pose, different pet, different animal, completely new scene, Western oil painting, colorful pop art, heavy digital effects, complex photorealistic background, distorted anatomy, deformed body",
    parameters: {
      steps: 28,
      cfgScale: 6.5,
      sampler: "DPM++ 2M Karras",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "crayon",
    name: "Crayon",
    description: "Playful and colorful hand-drawn charm",
    promptTemplate:
      "Convert the pet from the original photo into a childlike crayon drawing while strictly preserving the pet itself. " +
      "Keep the pet's breed, posture, proportions, head angle, markings, and expression exactly the same — absolutely no alteration to the pet's appearance or pose. " +
      "Do not rotate or flip the image; keep the pet’s placement in the frame consistent with the original photo. " +
      "Use rough, thick crayon strokes with strong waxy texture, heavy grain, visible pigment buildup, uneven childlike outlines, and highly saturated vivid colors. " +
      "The background can be simplified into a crayon‑style fill but should broadly follow the same horizon and major shapes so the overall composition still feels like the original scene.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different pet, different animal, realistic photo, professional digital painting, watercolor, oil painting, serious formal style, precise technical lines, subtle colors, photographic background, abstract shapes that completely change the scene",
    parameters: {
      steps: 22,
      cfgScale: 6.0,
      sampler: "Euler a",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "pencil-sketch",
    name: "Pencil Sketch",
    description: "Detailed graphite art with realistic shading",
    promptTemplate:
      "Convert this pet photo into a professional pencil sketch while keeping the original composition, pose and background structure. " +
      "Fully preserve the pet's breed, posture, proportions, head orientation, expression and all features from the original image; do NOT change the pose or anatomy. " +
      "Do not rotate or flip the scene; keep the same framing and perspective. " +
      "Use refined cross‑hatching and shading to describe light and shadow with rich grayscale levels, highlighting fur texture and volume. " +
      "The background may be simplified into sketch lines and tonal blocks, but it should still follow the main shapes and depth of the original environment so the scene clearly matches the source photo.",
    negativePrompt:
      "colorful, painting, cartoon, pop art, watercolor, oil painting, colored pencils, markers, any color elements, rotated image, flipped image, changed composition, different pose, different pet, different background, abstract, surreal, distorted anatomy, deformed body",
    parameters: {
      steps: 26,
      cfgScale: 7.0,
      sampler: "DPM++ 2M Karras",
      width: 1024,
      height: 1024
    }
  }
];

// Pet type mapping
// Used to replace {pet_type} placeholder in prompts
export const petTypes = {
  dog: "dog",
  cat: "cat", 
  bird: "bird",
  rabbit: "rabbit",
  hamster: "hamster",
  fish: "fish",
  reptile: "reptile",
  other: "pet"
} as const;

export type PetType = keyof typeof petTypes;

// Function to generate complete prompts
export function generatePrompt(
  styleId: string, 
  petType: PetType = "dog",
  customDescription?: string
): string {
  const style = stylePrompts.find(s => s.id === styleId);
  if (!style) {
    throw new Error(`Style with id ${styleId} not found`);
  }
  
  let prompt = style.promptTemplate.replace(/{pet_type}/g, petTypes[petType]);
  
  if (customDescription) {
    prompt = `${customDescription}, ${prompt}`;
  }
  
  return prompt;
}

// Get style configuration
export function getStyleConfig(styleId: string): StylePrompt | undefined {
  return stylePrompts.find(s => s.id === styleId);
}

// Get all styles
export function getAllStyles(): StylePrompt[] {
  return stylePrompts;
}

// Find style by name
export function findStyleByName(name: string): StylePrompt | undefined {
  return stylePrompts.find(s => s.name.toLowerCase() === name.toLowerCase());
}