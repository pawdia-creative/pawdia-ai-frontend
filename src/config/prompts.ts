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
    promptTemplate: "Convert this pet photo into a classical oil painting with strong hand-painted texture. Strict requirement: Preserve the pet's breed, posture, expression, fur color, and all identifying features exactly as in the original photo. Do NOT alter the pet's appearance — only change the painting style. Use extremely thick, expressive oil-paint strokes (impasto), with clearly visible brush marks, ridges, and layered paint buildup. The texture must feel tactile and three-dimensional, as if painted with a palette knife and heavy brushwork. Colors must be rich, saturated, warm, and full-bodied, with traditional Old Master tones. Lighting should follow classical chiaroscuro / Rembrandt lighting, with soft, refined transitions between light and shadow. The background must be an atmospheric, softly blurred classical oil background, painted with loose, textured strokes — no flat color, no minimalism. The overall image must feel deeply hand-painted, emotional, and artisanal, inspired by Rembrandt, Vermeer, and Titian. Emphasize thick paint, hand-made texture, visible strokes, and physical paint depth.",
    negativePrompt: "blurry, low quality, digital, cartoon, anime, watercolor, sketch, flat colors, modern style, abstract, distorted features",
    parameters: {
      steps: 30,
      cfgScale: 7.5,
      sampler: "DPM++ 2M Karras",
      width: 1024,
      height: 1024
    }
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft brushstrokes and dreamy gradients",
    promptTemplate: "Transform this pet photo into an extremely translucent and aesthetic watercolor painting style. 100% retain the pet's breed, posture, expression, and all appearance details; only perform artistic style conversion. Strictly require watercolor characteristics: use soft blending with wet-on-wet technique, colors should be transparent and layered with watercolor gradient levels, edges show hazy watermark diffusion with natural penetration, retain the unique flowing moist texture and watercolor texture of watercolor; the color tone is fresh and elegant, with saturation precisely controlled between 60-80%; create a hazy artistic conception with gradient watercolor blending for the background, heavy brushstrokes are strictly prohibited. The style integrates the lively and translucent light and shadow of Impressionist watercolor and the fresh soft-focus effect of Japanese healing-style watercolor illustration, presenting an overall literary and ethereal, lush watercolor artistic atmosphere.",
    negativePrompt: "oil painting, digital, sharp edges, bold colors, high contrast, sketch, heavy brushstrokes, opaque colors, artificial look, flat colors, solid backgrounds, harsh lines, photographic realism",
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
    name: "GTA Style",
    description: "Rockstar's cover-art aesthetic with bold outlines",
    promptTemplate: "Convert this pet photo into a GTA-style illustration inspired by Rockstar’s cover-art aesthetic, but WITHOUT any GTA text or typography. Strict requirement: Preserve the pet’s original proportions, eye size, breed features, markings, posture, and expression exactly as in the photo. Do NOT alter the anatomy or enlarge the eyes. Use bold black outlines (3–5 px), high-contrast cel shading, graphic color blocks, and sharp, stylized lighting. Colors must be vibrant and saturated, with crisp highlights and dramatic shadow shapes typical of GTA cover art. The background must feature stylized palm trees, a warm sunset vibe, and simplified blocky shapes or gradient panels — but no logos, no text, no game titles. Keep the background graphic and poster-like, with clean shapes and vivid tropical colors. Overall style should feel like a high-contrast GTA cover illustration blended with a California/Miami palm-tree aesthetic, without any official branding or text",
    negativePrompt: "realistic, natural colors, subtle, classical, oil painting, watercolor, sketch, blurry, low quality, text, logos, game titles, typography, realistic backgrounds",
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
    promptTemplate: "Convert this pet photo into a traditional Chinese ink-wash painting (Shuimo / Guohua) style. Strict requirement: Use authentic ink-wash brush techniques with rich variations of ink density, dryness, and moisture (at least five distinct tonal layers). The painting must preserve the pet's recognizable characteristics, but focus on spirit and expression rather than strict realism. Brushstrokes must be lively, flowing, and expressive, following the aesthetics of Chinese xieyi (freehand) painting. Retain traditional Chinese artistic features: large areas of intentional blank space (over 30% of the composition), atmospheric simplicity, poetic mood and subtle spatial suggestion instead of Western perspective, emphasis on spirit and charm (shen yun) over detailed form. The background must remain simple and mostly blank, following classical ink-wash composition. Add traditional inscription (Chinese calligraphy) and red seal stamps as authentic elements of Guohua. Overall style should evoke the aesthetics of classical masters such as Qi Baishi, Xu Beihong, and Bada Shanren.",
    negativePrompt: "colorful, western style, realistic, digital, bold colors, pop art, detailed background, complex composition, Western perspective, photographic style",
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
    promptTemplate: "Convert the pet from the original photo into a childlike crayon drawing. Remove the original background completely. Keep the pet's breed, posture, proportions, markings, and expression exactly the same — absolutely no alteration to the pet's appearance. Use rough, thick crayon strokes with strong waxy texture, heavy grain, visible pigment buildup, uneven childlike outlines, and highly saturated vivid colors (85%+). Replace the background with a simple crayon-filled background made in the same color palette and same hue family as the pet's dominant fur colors. No details, only rough crayon strokes and wax texture. The whole image must feel innocent, playful, naïve, and warm — like a children's drawing.",
    negativePrompt: "realistic, professional, oil painting, watercolor, serious, formal, detailed, precise lines, subtle colors, adult style, photographic",
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
    promptTemplate: "Convert this pet photo into a professional pencil sketch style. Important: Fully preserve the pet's breed, posture, expression, and all features from the original image. Do not alter the pet's appearance in any way—only transform the style into a sketch. Strict requirements: Use refined cross-hatching techniques to depict light and shadow relationships. Maintain rich grayscale levels (at least 8 levels from pure white to deep black). Highlight the texture and details of the fur. Adopt a classic black-and-white sketch art style. Keep the background simple with negative space. No color is allowed. The overall work must present the artistic feel of a hand-drawn sketch. Style references: Leonardo da Vinci's sketches, academic sketching.",
    negativePrompt: "colorful, painting, digital, cartoon, bold colors, pop art, watercolor, oil painting, colored pencils, markers, any color elements",
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