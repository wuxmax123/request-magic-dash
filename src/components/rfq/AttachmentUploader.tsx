import { useState } from 'react';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttachmentUploaderProps {
  images: string[];
  attachments: string[];
  onImagesChange: (images: string[]) => void;
  onAttachmentsChange: (attachments: string[]) => void;
}

export function AttachmentUploader({ 
  images, 
  attachments, 
  onImagesChange, 
  onAttachmentsChange 
}: AttachmentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newImages: string[] = [];
    const newAttachments: string[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push(file.name);
      } else {
        newAttachments.push(file.name);
      }
    });

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          拖拽文件到此处，或点击选择文件
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        />
        <Button variant="outline" size="sm" asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            选择文件
          </label>
        </Button>
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            图片 ({images.length})
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center p-2">
                  <span className="text-xs text-center truncate w-full">{img}</span>
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileIcon className="h-4 w-4" />
            附件 ({attachments.length})
          </h4>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-md group">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{file}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
