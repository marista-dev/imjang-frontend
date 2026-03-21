import { cn, formatPrice } from '@/lib/utils';

// ─── 섹션 래퍼 ────────────────────────────────────────────────────────────

export const Section = ({ children, className, id }) => (
  <div id={id} className={cn('rounded-2xl border border-slate-200 bg-white p-5 space-y-4', className)}>
    {children}
  </div>
);

export const SectionTitle = ({ children, required }) => (
  <p className="text-base font-bold text-slate-800">
    {children}
    {required && <span className="ml-0.5 text-danger">*</span>}
  </p>
);

// ─── 칩 버튼 ──────────────────────────────────────────────────────────────

export const ChipButton = ({ active, onClick, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95',
      active
        ? 'bg-primary text-white'
        : 'bg-slate-100 text-slate-500',
      className,
    )}
  >
    {children}
  </button>
);

// ─── 가격 입력 + 힌트 ────────────────────────────────────────────────────

export const PriceInputWithHint = ({ label, value, onChange, placeholder }) => (
  <div>
    {label && <p className="mb-1 text-xs text-slate-400">{label}</p>}
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
    />
    {value && Number(value) >= 1000 && (
      <p className="mt-1 text-xs text-primary">{formatPrice(Number(value))}</p>
    )}
  </div>
);
