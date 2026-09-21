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
  Mail,
  Zap,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

const signUpSchema = z.object({
  firstname: z.string().min(1, "Vui lòng nhập tên của bạn"),
  lastname: z.string().min(1, "Vui lòng nhập họ của bạn"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm() {
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsSubmitting(true);
      const { firstname, lastname, username, email, password } = data;
      await signUp(username, password, email, firstname, lastname);
      navigate("/signin");
    } catch {
      // Toast notification is handled in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-emerald-950/20 overflow-hidden transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Sign Up Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Logo & Header */}
            <div className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-2.5 group mb-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <span className="text-xl select-none">🐸</span>
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block">
                    JTalk
                  </span>
                  <span className="text-3xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block -mt-1">
                    AI
                  </span>
                </div>
              </Link>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Tạo tài khoản JTalk 
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Tham gia cộng đồng học viên Kaiwa và nhận lượt luyện nói miễn phí mỗi ngày
              </p>
            </div>

            {/* Họ & Tên */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="lastname"
                  className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Họ
                </label>
                <input
                  type="text"
                  id="lastname"
                  placeholder="Nguyễn"
                  {...register("lastname")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                />
                {errors.lastname && (
                  <p className="text-3xs font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                    {errors.lastname.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="firstname"
                  className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Tên
                </label>
                <input
                  type="text"
                  id="firstname"
                  placeholder="Văn A"
                  {...register("firstname")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                />
                {errors.firstname && (
                  <p className="text-3xs font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                    {errors.firstname.message}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserIcon size={15} />
                </div>
                <input
                  type="text"
                  id="username"
                  placeholder="jtalker2026"
                  {...register("username")}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                />
              </div>
              {errors.username && (
                <p className="text-3xs font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="ban@example.com"
                  {...register("email")}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                />
              </div>
              {errors.email && (
                <p className="text-3xs font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password with Show/Hide */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-3xs font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-105 active:translate-y-0.5 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Đang khởi tạo tài khoản...</span>
              ) : (
                <>
                  <span>Tạo tài khoản ngay</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Sign in Redirection */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Đã có tài khoản? </span>
              <Link
                to="/signin"
                className="font-black text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 cursor-pointer"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>

        {/* Right Column: Branded Hero Showcase */}
        <div className="relative hidden md:flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-2xs font-extrabold uppercase tracking-wider text-emerald-100 shadow-2xs">
              <Sparkles size={13} className="text-amber-300" />
              <span>Gia Nhập JTalk Ngay Hôm Nay</span>
            </div>
          </div>

          {/* Center Value Props */}
          <div className="relative z-10 space-y-5 my-auto py-6">
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight">
                Học giao tiếp tiếng Nhật thông minh hơn 
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                Tài khoản miễn phí trọn đời với các công nghệ AI nhận diện phát âm và đối đáp Kaiwa tiên tiến nhất.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Miễn phí 2 lượt luyện nói / ngày</p>
                  <p className="text-3xs text-emerald-200/80">Luyện Shadowing và nhận kết quả chấm điểm giọng nói</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Lưu trữ giọng nói Cloudinary</p>
                  <p className="text-3xs text-emerald-200/80">Nghe lại giọng phát âm của bạn để cải thiện từng ngày</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Flame size={16} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white">Theo dõi tiến trình & Streak</p>
                  <p className="text-3xs text-emerald-200/80">Biểu đồ học tập 7 ngày và huy hiệu thành tích</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badge */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-2xs text-emerald-200/80">
            <span className="font-extrabold text-white">JTalk AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
