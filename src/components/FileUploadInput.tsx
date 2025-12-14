import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadPrivateDocument, getSignedUrl, deleteFile, FileCategory, FileType } from '@/utils/fileUpload';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadInputProps {
  category: FileCategory;
  fileType: FileType;
  label: string;
  currentFileUrl?: string;
  currentFilePath?: string;
  onUploadSuccess?: (url: string, path: string) => void;
  onDelete?: () => void;
  maxSizeMB?: number;
  className?: string;
}

export default function FileUploadInput({
  category,
  fileType,
  label,
  currentFileUrl,
  currentFilePath,
  onUploadSuccess,
  onDelete,
  maxSizeMB = 5,
  className = '',
}: FileUploadInputProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFileUrl || null);
  const [filePath, setFilePath] = useState<string | null>(currentFilePath || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    setUploading(true);

    try {
      const result = await uploadPrivateDocument({
        category,
        userId: user.id,
        fileType,
        file,
      });

      if (result.success && result.url && result.path) {
        // Get signed URL for preview
        const signedUrl = await getSignedUrl(result.path);
        setPreviewUrl(signedUrl);
        setFilePath(result.path);
        onUploadSuccess?.(result.url, result.path);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!filePath) return;

    const confirmed = window.confirm('Are you sure you want to delete this file?');
    if (!confirmed) return;

    const success = await deleteFile(filePath);
    if (success) {
      setPreviewUrl(null);
      setFilePath(null);
      onDelete?.();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError('Failed to delete file');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">File uploaded</p>
                <p className="text-xs text-gray-500">Max {maxSizeMB}MB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                View
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={uploading}
          className="w-full h-24 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <div className="text-sm">
                <span className="font-medium text-blue-600">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">JPEG, PNG, PDF (max {maxSizeMB}MB)</p>
            </div>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
