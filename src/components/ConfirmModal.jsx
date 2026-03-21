import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

/**
 * 확인 모달 (모바일: Vaul Drawer 바텀시트)
 * @param {boolean} isOpen
 * @param {string} title
 * @param {string} message
 * @param {string} confirmText - 확인 버튼 텍스트
 * @param {'danger' | 'primary'} variant - 확인 버튼 스타일
 * @param {function} onConfirm
 * @param {function} onCancel
 */
export const ConfirmModal = ({
  isOpen,
  title = '정말 삭제하시겠어요?',
  message = '이 작업은 되돌릴 수 없습니다.',
  confirmText = '삭제',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[91] mx-auto w-full max-w-app rounded-t-2xl bg-white px-5 pb-safe pt-4">
          <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{message}</p>

          <div className="mt-6 flex gap-3 pb-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'flex h-12 flex-1 items-center justify-center rounded-xl font-semibold text-white transition-transform active:scale-[0.98]',
                variant === 'danger' ? 'bg-danger' : 'bg-primary',
              )}
            >
              {confirmText}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
