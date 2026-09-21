import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      title="Đăng xuất"
      className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
      aria-label="Đăng xuất"
    >
      <LogOut size={15} />
    </button>
  );
};

export default Logout;

