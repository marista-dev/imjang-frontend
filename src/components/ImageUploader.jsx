import { useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { imageApi } from '@/api/image';
import { toast } from 'sonner';

/**
 * 드래그앤드롭 이미지 업로드 컴포넌트
 * @param {Array} images - 업로드된 이미지 목록 [{id, url}]
 * @param {function} onImagesChange - 이미지 목록 변경 콜백
 * @param {number} maxFiles - 최대 업로드 수 (기본 10)
 */
export const ImageUploader = ({
  images = [],
  onImagesChange,
  maxFiles = 10,
}) => {
  const handleFiles = useCallback(
    async (files) => {
      const remaining = maxFiles - images.length;
      const filesToUpload = Array.from(files).slice(0, remaining);

      for (const file of filesToUpload) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: 10MB 이하 파일만 업로드 가능합니다.`);
          continue;
        }

        try {
          const res = await imageApi.upload(file);
          const uploaded = res.data;
          onImagesChange((prev) => [
            ...prev,
            { id: uploaded.imageId, url: uploaded.thumbnailUrl },
          ]);
        } catch (err) {
          toast.error('이미지 업로드에 실패했어요.');
          console.error('이미지 업로드 실패:', err);
        }
      }
    },
    [images.length, maxFiles, onImagesChange],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = (imageId) => {
    onImagesChange((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <div className="space-y-3">
      {/* 업로드 영역 */}
      {images.length < maxFiles && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-primary/50 active:bg-slate-100"
        >
          <ImagePlus size={32} className="mb-2 text-slate-400" />
          <p className="text-sm text-slate-500">
            사진을 드래그하거나 탭하여 추가
          </p>
          <p className="mt-1 text-xs text-slate-400">
            최대 {maxFiles}장 · 장당 10MB 이하
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}

      {/* 업로드된 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            >
              <img
                src={img.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-transform active:scale-90"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 카운터 */}
      <p className="text-right text-xs text-slate-400">
        {images.length}/{maxFiles}
      </p>
    </div>
  );
};
