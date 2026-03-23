import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Home, Check, X } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

const PW_RULES = [
  { id: 'length', label: '8~20자', test: (v) => v.length >= 8 && v.length <= 20 },
  { id: 'upper', label: '영문 대문자 포함', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: '영문 소문자 포함', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: '숫자 포함', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: '특수문자 포함 (!@#$%^&*)', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm();

  const pwValue = watch('password', '');

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (_, variables) => {
      navigate('/verify-email', { state: { email: variables.email } });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || '회원가입에 실패했어요. 다시 시도해주세요.';
      setError('root', { message: msg });
    },
  });

  const onSubmit = (data) => {
    const allPass = PW_RULES.every((r) => r.test(data.password));
    if (!allPass) {
      setError('password', { message: '비밀번호 조건을 모두 충족해주세요.' });
      return;
    }
    mutate({ name: data.name, email: data.email, password: data.password });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-10 animate-fade-in-up">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">임장노트</h1>
          <p className="mt-1 text-base text-slate-500">부동산 현장 방문 기록 앱</p>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-800">회원가입</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="mb-1.5 block text-base font-medium text-slate-700">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                className={cn(
                  'h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none transition-all',
                  'placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20',
                  errors.name && 'border-danger focus:border-danger focus:ring-danger/20'
                )}
                {...register('name', { required: '이름을 입력해주세요.' })}
              />
              {errors.name && <p className="mt-1 text-base text-danger">{errors.name.message}</p>}
            </div>

            {/* 이메일 */}
            <div>
              <label className="mb-1.5 block text-base font-medium text-slate-700">이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
                className={cn(
                  'h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none transition-all',
                  'placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20',
                  errors.email && 'border-danger focus:border-danger focus:ring-danger/20'
                )}
                {...register('email', {
                  required: '이메일을 입력해주세요.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '올바른 이메일 형식이 아니에요.',
                  },
                })}
              />
              {errors.email && <p className="mt-1 text-base text-danger">{errors.email.message}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="mb-1.5 block text-base font-medium text-slate-700">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  className={cn(
                    'h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 text-base outline-none transition-all',
                    'placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.password && 'border-danger focus:border-danger focus:ring-danger/20'
                  )}
                  {...register('password', { required: '비밀번호를 입력해주세요.' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-base text-danger">{errors.password.message}</p>
              )}

              {/* 비밀번호 조건 실시간 표시 */}
              {pwValue.length > 0 && (
                <div className="mt-2 space-y-1">
                  {PW_RULES.map((rule) => {
                    const passed = rule.test(pwValue);
                    return (
                      <div key={rule.id} className="flex items-center gap-1.5">
                        {passed ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <X size={14} className="text-danger" />
                        )}
                        <span
                          className={cn(
                            'text-base',
                            passed ? 'text-success' : 'text-danger'
                          )}
                        >
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 서버 에러 */}
            {errors.root && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-base text-danger">
                {errors.root.message}
              </p>
            )}

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isPending}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? <Spinner size="sm" className="text-white" /> : '가입하기'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <p className="mt-5 text-center text-base text-slate-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-primary">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
