import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Home } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data);
      navigate('/', { replace: true });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || '이메일 또는 비밀번호가 올바르지 않아요.';
      setError('root', { message: msg });
    },
  });

  const onSubmit = (data) => mutate(data);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 animate-fade-in-up">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">임장노트</h1>
          <p className="mt-1 text-sm text-slate-500">부동산 현장 방문 기록 앱</p>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-800">로그인</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">이메일</label>
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
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">비밀번호</label>
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
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* 비밀번호 찾기 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.info('비밀번호 재설정 기능은 준비 중이에요.')}
                className="text-xs text-slate-400"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            {/* 서버 에러 */}
            {errors.root && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
                {errors.root.message}
              </p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isPending}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? <Spinner size="sm" className="text-white" /> : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <p className="mt-5 text-center text-sm text-slate-500">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="font-medium text-primary">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
