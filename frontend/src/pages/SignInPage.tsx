import { SigninForm } from "@/components/auth/signin-form";
import { useThemeStore } from "@/stores/useThemeStore";
import { Sun, Moon } from "lucide-react";

const SignInPage = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Floating Theme Switcher */}
      <button
        onClick={toggleTheme}
        type="button"
        className="fixed top-5 right-5 z-30 w-11 h-11 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer backdrop-blur-md"
        title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      >
        {isDark ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-slate-700" />
        )}
      </button>

      {/* Ambient Mesh Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-indigo-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Form Container */}
      <div className="w-full max-w-sm md:max-w-4xl relative z-10 my-auto">
        <SigninForm />
      </div>

      {/* Legal & Policy Footer */}
      <div className="relative z-10 text-xs text-slate-400 dark:text-slate-500 text-center max-w-md mt-6 font-medium leading-relaxed">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <a
          href="#"
          className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-4 transition-colors"
        >
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a
          href="#"
          className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-4 transition-colors"
        >
          Chính sách bảo mật
        </a>{" "}
        của JTalk.
      </div>
    </div>
  );
};

export default SignInPage;
