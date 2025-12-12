import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

export const ImageUpload = ({ onImageUpload }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Upload Your Pet Photo</h2>
      <p className="text-muted-foreground mb-8">
        Upload a clear photo of your pet for the best AI art generation results
      </p>

      {!previewUrl ? (
        <div
          className={`
            border-2 border-dashed rounded-2xl p-12 transition-smooth cursor-pointer
            ${dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/30 hover:border-primary/50'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Drop your photo here</h3>
            <p className="text-muted-foreground mb-4">
              or click to browse files
            </p>
            
            <Button size="lg" className="shadow-glow">
              <ImageIcon className="w-5 h-5 mr-2" />
              Select Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Uploaded pet"
              className="max-w-full max-h-96 rounded-2xl shadow-elevated"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
              onClick={clearPreview}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-6">
            <p className="text-green-600 font-medium mb-4">
              ✓ Photo uploaded successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Ready to choose an art style for your pet
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-muted-foreground">
        <p className="mb-2">📸 Tips for best results:</p>
        <ul className="space-y-1 text-left max-w-md mx-auto">
          <li>• Use clear, well-lit photos</li>
          <li>• Make sure your pet is clearly visible</li>
          <li>• Avoid blurry or dark images</li>
          <li>• Supported formats: JPG, PNG, WebP</li>
        </ul>
      </div>
    </div>
  );
};