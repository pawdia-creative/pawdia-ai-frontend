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
      "Transform this pet photo into a highly visible watercolor painting with pronounced wet‑on‑wet blooms and dynamic edge effects, while preserving the original composition and pose. " +
      "Hard constraints: do NOT rotate or flip; maintain the pet's anatomy, markings, expression and relative placement. " +
      "Rendering instructions (make watercolor style strong): amplify edge bleeds, pigment granulation, high-flow water diffusion, softened highlights and layered translucent glazes. Add pronounced paper texture, visible water marks and organic color runs. " +
      "Keep background simplified but with strong watercolor washes that echo the original scene's shapes and light direction.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different pet, different animal, different background, cartoon, anime, oil painting, heavy impasto, hard digital edges, photorealistic rendering, distorted anatomy",
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
      "Convert this pet photo into a bold pop/urban comic poster with very pronounced stylistic features, while keeping the original pose and composition intact. " +
      "Hard constraints: maintain pet anatomy, markings and pose exactly; do NOT rotate or flip. " +
      "Rendering instructions (GTA / Rockstar cover art comic style - STRONGER EDGES & PRINT EFFECTS): convert to cel‑shaded poster art with very thick inked outlines, heavy contour inking, and exaggerated rim and rim‑lighting. Use posterized flat color layers with strong local color blocking and selective posterization on midtones. Add pronounced halftone screen printing effects (large halftone dots in shadows, fine halftone in midtones), coarse film/grain texture, and subtle scuffed paper or screen-printed edge artifacts. Emphasize bold contrast, saturated neon accents, and gritty urban grunge overlays (wall stains, spray paint speckles, subtle dust). Introduce stencil‑like shadows, edge posterization, and CMYK‑style separation hints for a printed‑poster look. Add graphic background elements (city skyline silhouettes, street signage, diagonal graphic lines) and controlled noise/grunge overlays so the image unmistakably reads as a gritty, high‑impact GTA cover poster. Prioritize chunky shapes, high edge clarity, visible halftone/print patterns, and strong silhouette contrast while preserving the original pose and anatomy.",
    negativePrompt:
      "blurry, low quality, rotated, flipped, different pose, different animal, watercolor, oil painting, photorealistic rendering, soft gradients, subtle filter, pastel, minimal change, text logos overlay, misaligned features, low contrast, childlike cartoon",
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