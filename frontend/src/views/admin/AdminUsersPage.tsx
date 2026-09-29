"use client";

import { useEffect, useState, useCallback } from "react";
import {
  adminService,
  type AdminUsersResponse,
  type AdminUsersQuery,
} from "@/services/admin.service";
import type { User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Sparkles,
  Flame,
  Trophy,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Calendar,
  Zap,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [usersData, setUsersData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "user" | "admin">("");
  const [tierFilter, setTierFilter] = useState<"" | "free" | "premium">("");
  const [page, setPage] = useState(1);

  // Modal states
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [premiumModalUser, setPremiumModalUser] = useState<User | null>(null);
  const [premiumDays, setPremiumDays] = useState(30);
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const query: AdminUsersQuery = {
        page,
        limit: 12,
        search: search || undefined,
        role: roleFilter || undefined,
        tier: tierFilter || undefined,
      };

      const data = await adminService.getUsers(query);
      setUsersData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, tierFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Role Change
  const handleUpdateRole = async (newRole: "user" | "admin") => {
    if (!roleModalUser) return;
    try {
      setActionLoading(true);
      await adminService.updateUserRole(roleModalUser._id, newRole);
      setRoleModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật vai trò.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Premium Subscription Update
  const handleUpdateSubscription = async (tier: "free" | "premium") => {
    if (!premiumModalUser) return;
    try {
      setActionLoading(true);
      await adminService.updateUserSubscription(
        premiumModalUser._id,
        tier,
        tier === "premium" ? premiumDays : 0
      );
      setPremiumModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật gói học.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      setActionLoading(true);
      await adminService.deleteUser(deleteModalUser._id);
      setDeleteModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa người dùng.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Users size={26} className="text-indigo-400" />
          <span>Quản Lý Người Dùng & Học Viên</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Theo dõi tiến độ học tập, quản lý phân quyền Quản trị viên và kích hoạt quyền lợi Premium cho thành viên JTalk AI.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email, username..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-hidden"
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">Học viên (User)</option>
          <option value="admin">Quản trị viên (Admin)</option>
        </select>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-hidden"
        >
          <option value="">Tất cả gói học</option>
          <option value="premium">Hội viên Premium</option>
          <option value="free">Tài khoản Miễn phí</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <LoadingSpinner size="lg" label="Đang tải danh sách người dùng..." />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400">
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : !usersData || usersData.users.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">Không tìm thấy người dùng</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Học viên</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Gói học</th>
                  <th className="py-3.5 px-4">Mục tiêu & Tiến độ</th>
                  <th className="py-3.5 px-4">Ngày tham gia</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersData.users.map((u) => {
                  const isSelf = currentAdmin?._id === u._id;
                  const isPrem = u.subscription?.tier === "premium";

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Column 1: Avatar, Name, Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-950 border border-slate-700 flex items-center justify-center font-bold text-indigo-300 shrink-0 shadow-xs">
                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">
                                {u.displayName || u.username}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] truncate font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role */}
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase shadow-xs">
                            <Shield size={11} className="text-indigo-400" />
                            <span>Quản trị viên</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            <span>Học viên</span>
                          </span>
                        )}
                      </td>

                      {/* Column 3: Subscription Tier */}
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold">
                            Toàn quyền (Admin)
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            {isPrem ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                                <Sparkles size={11} className="text-amber-400" />
                                <span>Premium</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                                Free
                              </span>
                            )}

                            {isPrem && u.subscription?.expiresAt && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Hết hạn:{" "}
                                {new Date(u.subscription.expiresAt).toLocaleDateString("vi-VN")}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Goal, Level, Streak, XP */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-black text-[10px]">
                            {u.profile?.targetLevel || "N5"}
                          </span>

                          <div className="flex items-center gap-2 text-[11px] text-slate-300">
                            <span className="flex items-center gap-0.5" title="Chuỗi Streak">
                              <Flame size={12} className="text-rose-500 fill-rose-500" />
                              <span>{u.gamification?.streak || 0}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="Tổng XP">
                              <Trophy size={12} className="text-amber-500" />
                              <span>{u.gamification?.totalXp || 0}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Created Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>

                      {/* Column 6: Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Toggle Button */}
                          <button
                            type="button"
                            onClick={() => setRoleModalUser(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Thay đổi quyền Quản trị viên"
                          >
                            Phân quyền
                          </button>

                          {/* Premium Upgrade Button (Chỉ dành cho học viên) */}
                          {u.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => setPremiumModalUser(u)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Cấp/Gia hạn gói Premium cho học viên"
                            >
                              Gói học
                            </button>
                          )}

                          {/* Delete Account (disabled for self) */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setDeleteModalUser(u)}
                              className="w-7 h-7 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 hover:text-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData && usersData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Trang <strong>{usersData.pagination.page}</strong> /{" "}
              {usersData.pagination.totalPages} (Tổng {usersData.pagination.total} thành viên)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 font-bold transition-colors cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= usersData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 font-bold transition-colors cursor-pointer"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal Change Role */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center mb-4">
              <Shield size={24} />
            </div>

            <h3 className="text-base font-black text-white">Phân Quyền Tài Khoản</h3>
            <p className="text-xs text-slate-400 mt-2">
              Thay đổi vai trò hệ thống cho thành viên{" "}
              <strong className="text-white">
                {roleModalUser.displayName || roleModalUser.username}
              </strong>{" "}
              (<span className="font-mono text-slate-300">{roleModalUser.email}</span>).
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateRole("admin")}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  roleModalUser.role === "admin"
                    ? "border-indigo-500 bg-indigo-950/50 text-white"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Quản trị viên (Admin)</div>
                  <div className="text-[11px] text-slate-400">
                    Toàn quyền truy cập Cổng Quản trị, up video YouTube, sửa bài học.
                  </div>
                </div>
                {roleModalUser.role === "admin" && (
                  <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateRole("user")}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  roleModalUser.role === "user"
                    ? "border-indigo-500 bg-indigo-950/50 text-white"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Học viên tiêu chuẩn (User)</div>
                  <div className="text-[11px] text-slate-400">
                    Chỉ truy cập giao diện học tập, luyện nói và thi thử.
                  </div>
                </div>
                {roleModalUser.role === "user" && (
                  <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                )}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Grant Premium */}
      {premiumModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>

            <h3 className="text-base font-black text-white">Quản Lý Gói Hội Viên Premium</h3>
            <p className="text-xs text-slate-400 mt-2">
              Cấp quyền hoặc thu hồi gói Premium cho{" "}
              <strong className="text-white">
                {premiumModalUser.displayName || premiumModalUser.username}
              </strong>
              .
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Thời hạn kích hoạt Premium:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "1 Tháng (30 ngày)", days: 30 },
                    { label: "3 Tháng (90 ngày)", days: 90 },
                    { label: "1 Năm (365 ngày)", days: 365 },
                    { label: "Trọn đời (10 năm)", days: 3650 },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setPremiumDays(opt.days)}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                        premiumDays === opt.days
                          ? "border-amber-500 bg-amber-950/50 text-amber-300"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateSubscription("premium")}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {actionLoading ? "Đang xử lý..." : `Kích hoạt Premium (${premiumDays} ngày)`}
                </button>

                {premiumModalUser.subscription?.tier === "premium" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateSubscription("free")}
                    className="w-full py-2 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hạ về gói Miễn phí (Free)
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setPremiumModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Delete User Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-base font-black text-white">Xác nhận xóa tài khoản</h3>
            <p className="text-xs text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa học viên{" "}
              <strong className="text-white">
                {deleteModalUser.displayName || deleteModalUser.username}
              </strong>{" "}
              ({deleteModalUser.email})? Mọi nhật ký luyện nói và tiến độ của người này sẽ bị xóa vĩnh viễn.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                {actionLoading ? "Đang xóa..." : "Xác nhận xóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
