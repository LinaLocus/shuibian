import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { fetchUploadSignature } from './postApi';

interface Props {
  existing: string[];
  onChange: (urls: string[]) => void;
  onError: (msg: string) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUploader({
  existing,
  onChange,
  onError,
  maxImages = 9,
  maxSizeMB = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxImages - existing.length;
    if (remaining <= 0) {
      onError(`最多上传 ${maxImages} 张图片`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const f of filesToUpload) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        onError(`图片不能大于 ${maxSizeMB}MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const { cloudName, uploadPreset } = await fetchUploadSignature();
      const uploaded: string[] = [];

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: formData },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || '上传失败');
        }
        const data = await res.json();
        uploaded.push(data.secure_url);
      }

      onChange([...existing, ...uploaded]);
    } catch (err: any) {
      onError(err.message || '图片上传失败，请重试');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading || existing.length >= maxImages}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            上传中…
          </>
        ) : (
          <>
            <Upload size={16} />
            选择图片（{existing.length}/{maxImages}）
          </>
        )}
      </button>
    </div>
  );
}
