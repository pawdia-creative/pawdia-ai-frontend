# Pawdia AI - AI Pet Portrait Generator

Transform your pet photos into stunning artistic portraits with AI. Choose from 6 unique art styles and customize various products for your beloved pets.

## Features

- **AI-Powered Art Generation**: Transform pet photos into beautiful artistic portraits
- **6 Unique Art Styles**: Oil painting, watercolor, pop art, Chinese ink, crayon, and pencil sketch
- **Product Customization**: Create canvas prints, T-shirts, mugs, and more
- **User-Friendly Interface**: Simple 4-step process for creating pet art
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pawdia-ai-portraits-main
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── ArtGeneration.tsx
│   ├── ImageUpload.tsx
│   ├── ProductCustomization.tsx
│   ├── StyleSelection.tsx
│   └── ...
├── pages/              # Page components
│   ├── ArtCreation.tsx
│   ├── Index.tsx
│   └── NotFound.tsx
├── config/             # Configuration files
│   └── prompts.ts     # AI art style prompts
├── assets/             # Static assets
└── hooks/              # Custom React hooks
```

## Art Creation Process

The application follows a simple 4-step process:

1. **Upload Photo**: Upload a clear photo of your pet
2. **Choose Style**: Select from 6 unique art styles
3. **Generate Art**: AI processes your photo in the chosen style
4. **Customize Product**: Choose from various product options

## Available Art Styles

- **Oil Painting**: Classic oil painting style with rich textures
- **Watercolor**: Soft, flowing watercolor effects
- **Pop Art**: Bold, vibrant pop art style
- **Chinese Ink**: Traditional Chinese ink wash painting
- **Crayon**: Playful crayon drawing style
- **Pencil Sketch**: Detailed pencil sketch artwork

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
