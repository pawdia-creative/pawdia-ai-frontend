export const BASE_URL = 'https://pawdia-ai.com';
export const BRAND_NAME = 'Pawdia AI';

export interface PageSEO {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export const SEO_CONFIG: Record<string, PageSEO> = {
  '/': {
    path: '/',
    title: 'AI Pet Portrait Generator | Free Preview | Pawdia AI',
    description: 'Transform your pet photos into stunning AI art portraits. Free preview, print-ready downloads, 50+ styles. Perfect for pet memorials and custom gifts.',
    keywords: 'AI pet portrait generator, free AI pet portrait, pet portrait AI, AI pet art, pet photo to art',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/create': {
    path: '/create',
    title: 'Create AI Pet Portrait | Custom Pet Art Generator | Pawdia AI',
    description: 'Create custom AI pet portraits in minutes. Upload your pet photo, choose from 50+ artistic styles, and download high-resolution print-ready artwork.',
    keywords: 'create pet portrait, custom pet art, AI pet portrait generator, pet photo to art',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/ai-pet-portrait-generator': {
    path: '/ai-pet-portrait-generator',
    title: 'AI Pet Portrait Generator | Free Preview & Print-Ready | Pawdia AI',
    description: 'Generate stunning AI pet portraits with free preview. Download print-ready HD/4K images. 50+ artistic styles including watercolor, sketch, oil painting.',
    keywords: 'AI pet portrait generator, free AI pet portrait, pet portrait generator, AI pet art generator',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/free-ai-pet-portrait-generator': {
    path: '/free-ai-pet-portrait-generator',
    title: 'Free AI Pet Portrait Generator | Try Free Preview | Pawdia AI',
    description: 'Free AI pet portrait generator with instant preview. No credit card required. Create beautiful pet art in watercolor, sketch, oil painting styles.',
    keywords: 'free AI pet portrait generator, free pet portrait AI, free pet art generator',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/ai-pet-portrait': {
    path: '/ai-pet-portrait',
    title: 'AI Pet Portrait | Custom Pet Art | High Resolution | Pawdia AI',
    description: 'Create custom AI pet portraits with high-resolution downloads. Perfect for pet memorials, gifts, and home decor. 50+ artistic styles available.',
    keywords: 'AI pet portrait, custom pet portrait, pet portrait AI, high resolution pet art',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/watercolor-pet-portrait-ai': {
    path: '/watercolor-pet-portrait-ai',
    title: 'Watercolor Pet Portrait AI | Custom Watercolor Pet Art | Pawdia AI',
    description: 'Transform your pet into beautiful watercolor art. AI-powered watercolor pet portraits with free preview. Print-ready high-resolution downloads.',
    keywords: 'watercolor pet portrait AI, watercolor pet art, AI watercolor pet portrait, custom watercolor pet',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/sketch-pet-portrait-ai': {
    path: '/sketch-pet-portrait-ai',
    title: 'Sketch Pet Portrait AI | Pencil Sketch Pet Art | Pawdia AI',
    description: 'Create stunning pencil sketch pet portraits with AI. Free preview available. Download high-resolution sketch art perfect for framing.',
    keywords: 'sketch pet portrait AI, pencil sketch pet, AI sketch pet portrait, pet sketch art',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/oil-painting-pet-portrait-ai': {
    path: '/oil-painting-pet-portrait-ai',
    title: 'Oil Painting Pet Portrait AI | Classic Oil Art Style | Pawdia AI',
    description: 'Transform your pet into classic oil painting art. AI-generated oil painting pet portraits with free preview. Museum-quality print-ready downloads.',
    keywords: 'oil painting pet portrait AI, oil painting pet art, AI oil painting pet, classic pet portrait',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/cartoon-pet-portrait-ai': {
    path: '/cartoon-pet-portrait-ai',
    title: 'Cartoon Pet Portrait AI | Animated Pet Art | Pawdia AI',
    description: 'Create fun cartoon and animated pet portraits with AI. Free preview available. Perfect for kids rooms and playful pet art collections.',
    keywords: 'cartoon pet portrait AI, animated pet art, AI cartoon pet portrait, cartoon pet art',
    ogImage: `${BASE_URL}/examples/memorial/ai-cat-sketch.jpg`,
  },
  '/pricing': {
    path: '/pricing',
    title: 'Pricing | AI Pet Portrait Plans & Credits | Pawdia AI',
    description: 'Affordable AI pet portrait pricing. Free plan with 3 credits. Basic ($9.99/month, 30 credits) and Premium ($14.99/month, 60 credits) plans. Credit packages from $4.99. HD downloads $1.99, 4K downloads $3.49.',
    keywords: 'pet portrait pricing, AI pet art pricing, pet portrait generator cost, pet portrait credit packages, buy AI pet art credits',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/subscription': {
    path: '/subscription',
    title: 'Subscription Plans | AI Pet Portrait Credits | Pawdia AI',
    description: 'Choose the perfect subscription plan for AI pet portraits. Free (3 credits), Basic ($9.99/month, 30 credits), and Premium ($14.99/month, 60 credits) plans. Credit packages: $4.99 (10 credits), $8.99 (20 credits), $11.99 (30 credits), $16.99 (50 credits). Includes high-resolution downloads.',
    keywords: 'pet portrait subscription, AI pet art plans, pet portrait credits, pet portrait credit packages, buy AI pet art credits',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/examples': {
    path: '/examples',
    title: 'AI Pet Portrait Examples | Style Gallery | Pawdia AI',
    description: 'Browse stunning AI pet portrait examples in watercolor, sketch, oil painting, and cartoon styles. See before & after transformations.',
    keywords: 'pet portrait examples, AI pet art examples, pet portrait gallery',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/about': {
    path: '/about',
    title: 'About Us | Pawdia AI - AI Pet Portrait Generator',
    description: 'Learn about Pawdia AI, the leading AI pet portrait generator. Our mission to help pet lovers create beautiful art from their pet photos.',
    keywords: 'about Pawdia AI, pet portrait company, AI pet art about',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/contact': {
    path: '/contact',
    title: 'Contact Us | Pawdia AI Support',
    description: 'Contact Pawdia AI for support, questions, or feedback. We typically respond within 24 hours. Email: pawdia.creative@gmail.com',
    keywords: 'contact Pawdia AI, pet portrait support, AI pet art help',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy | Pawdia AI',
    description: 'Pawdia AI privacy policy. Learn how we protect your data and pet photos. GDPR compliant privacy practices.',
    keywords: 'Pawdia AI privacy policy, pet portrait privacy',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/terms': {
    path: '/terms',
    title: 'Terms of Service | Pawdia AI',
    description: 'Pawdia AI terms of service. Read our terms and conditions for using our AI pet portrait generator service.',
    keywords: 'Pawdia AI terms, pet portrait terms of service',
    ogImage: `${BASE_URL}/logo.png`,
  },
  '/blog': {
    path: '/blog',
    title: 'Blog | Pet Portrait Tips & Stories | Pawdia AI',
    description: 'Read our blog for pet portrait tips, AI art stories, and pet memorial ideas. Learn how to create the perfect pet portrait.',
    keywords: 'pet portrait blog, AI pet art blog, pet memorial blog',
    ogImage: `${BASE_URL}/logo.png`,
  },
};

export const FAQ_DATA = {
  '/ai-pet-portrait-generator': [
    {
      question: 'How accurate are AI pet portraits?',
      answer: 'Our AI pet portrait generator uses advanced machine learning to create highly accurate portraits that capture your pet\'s unique features, expressions, and personality. The results are often indistinguishable from hand-drawn artwork.',
    },
    {
      question: 'What artistic styles are available?',
      answer: 'We offer 50+ artistic styles including watercolor, pencil sketch, oil painting, cartoon/animation, pop art, and many more. Each style can be customized to match your preferences.',
    },
    {
      question: 'How do I download my pet portrait?',
      answer: 'After generating your portrait, you can preview it for free. To download, choose from HD ($1.99) or 4K ($3.49) options. All downloads are print-ready and include background removal.',
    },
    {
      question: 'Do I own the copyright to my pet portrait?',
      answer: 'Yes, you own the full commercial rights to your generated pet portrait. You can use it for personal or commercial purposes, including printing, framing, and selling.',
    },
    {
      question: 'How long does it take to generate a pet portrait?',
      answer: 'Most pet portraits are generated within 30-60 seconds. Complex styles or high-resolution outputs may take up to 2 minutes.',
    },
    {
      question: 'Can I use the portrait for pet memorials?',
      answer: 'Absolutely. Our AI pet portraits are perfect for pet memorials. Many customers create beautiful memorial art to honor their beloved pets.',
    },
  ],
  '/watercolor-pet-portrait-ai': [
    {
      question: 'What makes watercolor pet portraits special?',
      answer: 'Watercolor pet portraits capture the soft, flowing beauty of traditional watercolor painting with AI precision. The style creates a dreamy, artistic look perfect for home decor.',
    },
    {
      question: 'Can I customize the watercolor style?',
      answer: 'Yes, you can adjust color intensity, brush stroke effects, and background options to create a unique watercolor pet portrait that matches your vision.',
    },
    {
      question: 'Are watercolor portraits print-ready?',
      answer: 'Yes, all watercolor pet portraits are available in HD and 4K resolutions, perfect for printing on canvas, paper, or other materials.',
    },
  ],
  '/sketch-pet-portrait-ai': [
    {
      question: 'What is a sketch pet portrait?',
      answer: 'Sketch pet portraits use pencil drawing techniques to create detailed, artistic representations of your pet. The style emphasizes lines, shading, and texture.',
    },
    {
      question: 'Can I get a colored sketch?',
      answer: 'Yes, we offer both black & white and colored sketch options. You can choose the style that best fits your preferences.',
    },
  ],
  '/oil-painting-pet-portrait-ai': [
    {
      question: 'What is an oil painting pet portrait?',
      answer: 'Oil painting pet portraits recreate the classic, rich look of traditional oil paintings. The style features bold colors, texture, and depth perfect for elegant home decor.',
    },
    {
      question: 'Are oil painting portraits suitable for large prints?',
      answer: 'Yes, our 4K resolution option is perfect for large prints up to 24x36 inches while maintaining excellent quality and detail.',
    },
  ],
  '/cartoon-pet-portrait-ai': [
    {
      question: 'What is a cartoon pet portrait?',
      answer: 'Cartoon pet portraits create fun, playful, and animated representations of your pet. Perfect for kids\' rooms, social media, and lighthearted pet art.',
    },
    {
      question: 'Can I customize the cartoon style?',
      answer: 'Yes, you can choose from various cartoon styles including Disney-inspired, anime, and custom cartoon effects.',
    },
  ],
};

