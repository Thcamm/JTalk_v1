import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    displayName?: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, email, firstName, lastName, displayName },
      { withCredentials: true }
    );

    const accessToken = res.data?.accessToken || res.data?.data?.accessToken;
    const user = res.data?.user || res.data?.data?.user;
    return { accessToken, user, ...res.data };
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      { username, password },
      { withCredentials: true }
    );
    const accessToken = res.data?.accessToken || res.data?.data?.accessToken;
    const user = res.data?.user || res.data?.data?.user;
    return { accessToken, user, ...res.data };
  },

  forgotPassword: async (emailOrUsername: string) => {
    const res = await api.post(
      "/auth/forgot-password",
      { emailOrUsername },
      { withCredentials: true }
    );
    return res.data;
  },

  resetPassword: async (emailOrUsername: string, resetCode: string, newPassword: string) => {
    const res = await api.post(
      "/auth/reset-password",
      { emailOrUsername, resetCode, newPassword },
      { withCredentials: true }
    );
    return res.data;
  },

  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", {}, { withCredentials: true });
    return res.data?.accessToken || res.data?.data?.accessToken;
  },
};
