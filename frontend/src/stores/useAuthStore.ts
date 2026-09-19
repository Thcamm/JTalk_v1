import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import type { AuthState } from "@/types";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });
      await authService.signUp(username, password, email, firstName, lastName);
      toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.");
    } catch (error) {
      console.error(error);
      toast.error("Đăng ký không thành công");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      set({ loading: true });

      const { accessToken } = await authService.signIn(username, password);
      get().setAccessToken(accessToken);

      await get().fetchMe();

      toast.success("Chào mừng bạn quay lại với Moji 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập không thành công!");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      toast.success("Logout thành công!");
    } catch (error) {
      console.error(error);
    } finally {
      get().clearState();
    }
  },

  fetchMe: async () => {
    try {
      set({ loading: true });
      const user = await authService.fetchMe();
      set({ user });
    } catch (error) {
      console.error(error);
      set({ user: null, accessToken: null });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const accessToken = await authService.refresh();
      get().setAccessToken(accessToken);
      const user = await authService.fetchMe();
      set({ user });
    } catch (error) {
      get().clearState();
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
