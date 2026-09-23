import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Flame,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm() {
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      setIsSubmitting(true);
      const { username, password } = data;
      await signIn(username, password);
      navigate("/dashboard");
    } catch {
      // Notification handled in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-rose-950/20 overflow-hidden transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Signin Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo & Header */}
            <div className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-2.5 group mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" />
                  <Sparkles size={20} className="text-white animate-spin-slow relative z-10" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block">
                    JTalk
                  </span>
                  <span className="text-3xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest block -mt-1">
                    AI
                  </span>
                </div>
              </Link>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Chào mừng quay lại
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Đăng nhập vào tài khoản JTalk để tiếp tục chuỗi luyện nói Kaiwa
              </p>
            </div>

            {/* Username Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  id="username"
                  placeholder="Nhập tên đăng nhập của bạn"
                  {...register("username")}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all shadow-2xs"
                />
              </div>
              {errors.username && (
                <p className="text-xs font-bold text-rose-500 dark:text-rose-400 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-bold text-rose-500 dark:text-rose-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <span>Đang đăng nhập...</span>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Sign up Link */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>Chưa có tài khoản? </span>
              <Link
                to="/signup"
                className="font-black text-rose-600 dark:text-rose-400 hover:underline underline-offset-4 cursor-pointer"
              >
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>

        {/* Right Column: Branded Hero Showcase */}
        <div className="relative hidden md:flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 text-white overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-2xs font-extrabold uppercase tracking-wider text-rose-100 shadow-2xs">
              <Sparkles size={13} className="text-amber-300" />
              <span>Học Tiếng Nhật Phản Xạ Chuẩn Tokyo</span>
            </div>
          </div>

          {/* Center Value Props */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight">
                Nói tiếng Nhật tự nhiên như người bản xứ
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium">
                Gia sư AI lắng nghe, phân tích trọng âm và phản hồi đối đáp chỉ trong 1 giây.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-rose-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Chấm điểm phản xạ tức thì</p>
                  <p className="text-3xs text-rose-200/80">4 tiêu chí: Phát âm, Trọng âm, Lưu loát & Độ chuẩn xác</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-rose-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Flame size={16} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Chuỗi Streak & Gamification</p>
                  <p className="text-3xs text-rose-200/80">Tích lũy XP, đua bảng xếp hạng và duy trì phản xạ mỗi ngày</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-rose-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Kịch bản thực chiến IT & Doanh nghiệp</p>
                  <p className="text-3xs text-rose-200/80">Phỏng vấn xin việc, họp dự án, giao tiếp hàng ngày N5-N3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badge */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-2xs text-rose-200/80">
            <span className="font-extrabold text-white">JTalk AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SigninForm;
