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
      "Strongly convert this pet photo into a bold, highly textured classical oil painting while PRESERVING the original composition and pose. " +
      "Hard constraints: do NOT rotate or flip the image; keep the same camera angle, framing, and the pet's anatomy, breed, markings, and accessories exactly as in the photo. " +
      "Rendering instructions (make the style very pronounced): apply heavy impasto brush strokes, visible palette‑knife texture, layered thick paint, pronounced directional brushwork and tactile 3D paint buildup. " +
      "Increase painterly contrast and rich warm saturation; introduce pronounced specular highlights and soft cinematic Rembrandt‑style lighting. The photo should clearly read as the SAME subject rendered in a dramatic oil painting — emphasize brush texture, canvas grain and paint thickness. " +
      "Do NOT alter pose, composition or background objects — only convert surface rendering to an unmistakable oil painting.",
    negativePrompt:
      "blurry, low quality, low resolution, rotated image, flipped image, extreme perspective change, different pose, different dog, different animal, different background, scene changed, cartoon, anime, watercolor, sketch, abstract, surreal, distorted features, deformed body, extra limbs, missing limbs",
    parameters: {
      steps: 38,
      cfgScale: 9.0,
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
      // User-provided watercolor prompt (preserve original composition / pose)
      "Transform this {pet_type} photo into a beautiful watercolor style. Important: The original pet's breed, posture, expression, and all characteristics must be completely preserved. The pet's appearance must not be altered; only the style must be changed to watercolor. " +
      "Strict requirements: A soft watercolor wash effect must be used. Colors must be transparent and layered, edges must be naturally blurred, and the unique fluidity and wetness of watercolor must be retained. The color tone must be fresh and elegant (saturation controlled between 60-80%). " +
      "The background must use a gradient watercolor effect; heavy brushstrokes are prohibited. The overall style must present an artistic and refreshing watercolor aesthetic. Style references: Impressionist watercolor, Japanese watercolor illustration.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different pet, different animal, different background, cartoon, anime, oil painting, heavy impasto, heavy brushstrokes, hard digital edges, photorealistic rendering, distorted anatomy, oversaturated, neon colors, gritty texture",
    parameters: {
      steps: 30,
      cfgScale: 8.0,
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
      "Convert this {pet_type} photo into a GTA-style illustration inspired by Rockstar’s cover-art aesthetic, but WITHOUT any GTA text or typography. " +
      "Strict requirement: Preserve the pet’s original proportions, eye size, breed features, markings, posture, and expression exactly as in the photo. Do NOT alter the anatomy or enlarge the eyes. " +
      "Rendering instructions: Use bold black outlines (3–5 px), high-contrast cel shading, graphic color blocks, and sharp, stylized lighting. Colors must be vibrant and saturated, with crisp highlights and dramatic shadow shapes typical of GTA cover art. " +
      "Background instructions: Feature stylized palm trees, a warm sunset vibe, and simplified blocky shapes or gradient panels — but no logos, no text, no game titles. Keep the background graphic and poster-like, with clean shapes and vivid tropical colors. " +
      "Overall style should feel like a high-contrast GTA cover illustration blended with a California/Miami palm-tree aesthetic, without any official branding or text.",
    negativePrompt:
      "logos, text, game titles, trademarks, blurry, low quality, rotated, flipped, different pose, different animal, watercolor, oil painting, photorealistic rendering, soft gradients, subtle filter, pastel, misaligned features, distorted anatomy, excessive grain, neon artifacts",
    parameters: {
      steps: 38,
      cfgScale: 10.0,
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
      "Convert this pet photo into a commanding Chinese ink‑wash (Shuimo) painting with bold, expressive brushwork while preserving the original subject and composition. " +
      "Hard constraints: keep pet silhouette, posture and placement identical; do NOT rotate or flip. " +
      "Rendering instructions (accentuate style): use strong calligraphic strokes, deliberate ink bleed, rich tonal gradations from dense black to pale grey, and intentional negative space. Emphasize bold, confident brush marks and high-contrast ink values so the style reads strongly as classical ink painting.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different pet, photorealistic color, oil painting, watercolor, pop art, heavy digital effects, distorted anatomy",
    parameters: {
      steps: 32,
      cfgScale: 8.0,
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
      "Convert the pet from the original photo into a vivid, unmistakable crayon/colored‑wax illustration while preserving the pet's exact pose and proportions. " +
      "Hard constraints: do NOT change anatomy, posture, or placement. " +
      "Rendering instructions (make style bold): apply chunky waxy strokes, heavy pigment buildup, visible paper tooth, uneven childlike outlines, and saturated primary colors. Emphasize texture, grain, and tactile wax reflections so the final image reads strongly as a crayon artwork rather than a subtle filter.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different pet, photorealistic rendering, watercolor, oil painting, subtle color shifts, minimal changes",
    parameters: {
      steps: 30,
      cfgScale: 7.5,
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
      "Convert this pet photo into a highly detailed, expressive pencil sketch while strictly preserving the original composition and pose. " +
      "Hard constraints: keep pet anatomy, markings and placement identical; do NOT rotate or flip. " +
      "Rendering instructions (make sketch style obvious): emphasize strong cross‑hatching, deep chiaroscuro, crisp edge definition for fur and facial features, and visible paper grain. Increase contrast and add pronounced directional strokes to convey texture and form — produce a clearly hand‑drawn graphite artwork rather than a soft photo filter.",
    negativePrompt:
      "colorful, painting, cartoon, pop art, watercolor, oil painting, markers, rotated image, flipped image, different pose, different pet, abstract, surreal, distorted anatomy",
    parameters: {
      steps: 30,
      cfgScale: 8.0,
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