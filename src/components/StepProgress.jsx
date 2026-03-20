import { cn } from '@/lib/utils';

/**
 * 멀티스텝 폼 진행 바
 * @param {number} currentStep - 현재 스텝 (1부터 시작)
 * @param {number} totalSteps - 전체 스텝 수
 * @param {Array<string>} labels - 각 스텝 라벨 (선택)
 */
export const StepProgress = ({ currentStep, totalSteps, labels = [] }) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="space-y-2">
      {/* 프로그레스 바 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      {/* 스텝 표시 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary">
          {currentStep}/{totalSteps}
        </span>
        {labels[currentStep - 1] && (
          <span className="text-xs text-slate-500">
            {labels[currentStep - 1]}
          </span>
        )}
      </div>
    </div>
  );
};
