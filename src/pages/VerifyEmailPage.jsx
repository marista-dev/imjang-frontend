import { useRef, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 4;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [serverError, setServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const { mutate: submitOtp, isPending } = useMutation({
    mutationFn: authApi.verify,
    onSuccess: () => {
      toast.success('이메일 인증이 완료되었어요!');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || '인증 코드가 올바르지 않아요.';
      setServerError(msg);
      // OTP 초기화
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: authApi.resendCode,
    onSuccess: () => {
      toast.success('인증 코드를 재전송했어요.');
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      setServerError('');
      inputRefs.current[0]?.focus();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || '재전송에 실패했어요.';
      toast.error(msg);
    },
  });

  const handleChange = (idx, value) => {
    // 숫자만 허용
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setServerError('');

    // 다음 칸으로 포커스
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }

    // 모두 입력되면 자동 제출
    if (digit && idx === OTP_LENGTH - 1) {
      const code = next.join('');
      if (code.length === OTP_LENGTH) {
        submitOtp({ email, code });
      }
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === OTP_LENGTH) {
      submitOtp({ email, code: pasted });
    }
  };

  const otpCode = otp.join('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 animate-fade-in-up">
      <div className="w-full max-w-sm">
        {/* 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* 아이콘 */}
          <div className="mb-5 flex flex-col items-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <Mail size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">이메일 인증</h2>
            {email ? (
              <p className="mt-1 text-center text-sm text-slate-500">
                <span className="font-medium text-slate-700">{email}</span>으로<br />
                인증 코드 6자리를 보내드렸어요.
              </p>
            ) : (
              <p className="mt-1 text-center text-sm text-slate-500">
                이메일로 전송된 인증 코드를 입력해주세요.
              </p>
            )}
          </div>

          {/* OTP 입력 */}
          <div className="mb-4 flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={cn(
                  'h-12 w-11 rounded-xl border text-center text-lg font-bold outline-none transition-all',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  serverError
                    ? 'border-danger text-danger focus:border-danger focus:ring-danger/20'
                    : digit
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-slate-200 text-slate-800'
                )}
              />
            ))}
          </div>

          {/* 에러 메시지 */}
          {serverError && (
            <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-danger">
              {serverError}
            </p>
          )}

          {/* 확인 버튼 */}
          <button
            type="button"
            disabled={isPending || otpCode.length < OTP_LENGTH}
            onClick={() => submitOtp({ email, code: otpCode })}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? <Spinner size="sm" className="text-white" /> : '인증 확인'}
          </button>

          {/* 재전송 */}
          <div className="mt-4 text-center">
            <p className="mb-1 text-sm text-slate-500">인증 코드를 받지 못했나요?</p>
            <button
              type="button"
              disabled={isResending || resendCooldown > 0}
              onClick={() => resend({ email })}
              className="text-sm font-medium text-primary disabled:text-slate-400"
            >
              {resendCooldown > 0
                ? `재전송 (${resendCooldown}초)`
                : isResending
                ? '전송 중...'
                : '인증 코드 재전송'}
            </button>
          </div>
        </div>

        {/* 뒤로가기 */}
        <div className="mt-4 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 text-sm text-slate-500"
          >
            <ChevronLeft size={16} />
            회원가입으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
