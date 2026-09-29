"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  adminService,
  type AdminLessonsResponse,
  type AdminLessonsQuery,
} from "@/services/admin.service";
import type { Topic } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Video,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Eye,
  AlertTriangle,
  Play,
  Layers,
} from "lucide-react";

export default function AdminLessonsPage() {
  const [lessonsData, setLessonsData] = useState<AdminLessonsResponse | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [videoFilter, setVideoFilter] = useState("");
  const [page, setPage] = useState(1);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch topics for dropdown
  useEffect(() => {
    adminService
      .getTopics()
      .then((data) => setTopics(data))
      .catch((err) => console.error("Lỗi khi tải topics:", err));
  }, []);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const query: AdminLessonsQuery = {
        page,
        limit: 10,
        search: search || undefined,
        topicId: selectedTopic || undefined,
        level: selectedLevel || undefined,
        hasVideo: videoFilter || undefined,
      };

      const data = await adminService.getLessons(query);
      setLessonsData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách bài học.");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTopic, selectedLevel, videoFilter]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminService.deleteLesson(deleteTarget.id);
      setDeleteTarget(null);
      await fetchLessons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa bài học.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Video size={26} className="text-red-500" />
            <span>Quản Lý Video & Bài Học</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thêm video YouTube, soạn thảo phụ đề song ngữ, phiên âm Furigana và phân cấp độ JLPT cho học viên.
          </p>
        </div>

        <Link
          href="/admin/lessons/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Thêm Video Mới</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tiêu đề, ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Topic Filter */}
        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-hidden"
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Level Filter */}
        <select
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-hidden"
        >
          <option value="">Tất cả cấp độ JLPT</option>
          <option value="N5">N5 (Nhập môn)</option>
          <option value="N4">N4 (Sơ cấp)</option>
          <option value="N3">N3 (Trung cấp)</option>
          <option value="N2">N2 (Thực chiến)</option>
          <option value="N1">N1 (Cao cấp)</option>
        </select>

        {/* Video Type Filter */}
        <select
          value={videoFilter}
          onChange={(e) => {
            setVideoFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-hidden"
        >
          <option value="">Tất cả định dạng</option>
          <option value="true">Có video YouTube</option>
          <option value="false">Chỉ có audio / văn bản</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <LoadingSpinner size="lg" label="Đang tải danh sách bài học..." />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400">
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchLessons}
              className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : !lessonsData || lessonsData.lessons.length === 0 ? (
          <div className="p-16 text-center">
            <Video size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">Không tìm thấy bài học nào</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo bài giảng YouTube mới.
            </p>
            <Link
              href="/admin/lessons/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              <Plus size={14} />
              <span>+ Thêm bài giảng đầu tiên</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Bài học & Video</th>
                  <th className="py-3.5 px-4">Cấp độ & Chủ đề</th>
                  <th className="py-3.5 px-4">Phụ đề & Thời lượng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lessonsData.lessons.map((lesson) => (
                  <tr
                    key={lesson._id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Column 1: Video & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        {lesson.youtubeId ? (
                          <div className="relative w-14 h-9 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800 shadow-xs">
                            <img
                              src={`https://img.youtube.com/vi/${lesson.youtubeId}/default.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                              <Play size={12} className="fill-white text-white drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Video size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <Link
                            href={`/admin/lessons/${lesson._id}`}
                            className="font-bold text-white hover:text-indigo-400 transition-colors block truncate max-w-xs"
                            title={lesson.title}
                          >
                            {lesson.title}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-[11px]">
                            {lesson.channelName && (
                              <span className="truncate max-w-[120px] font-mono text-slate-400">
                                {lesson.channelName}
                              </span>
                            )}
                            {lesson.youtubeId && (
                              <span className="font-mono text-[10px] text-red-400">
                                (ID: {lesson.youtubeId})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Level & Topic */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-black text-[10px]">
                          {lesson.level || "N5"}
                        </span>
                        <div className="text-slate-300 font-medium truncate max-w-[180px]">
                          {lesson.topicId?.name || "Chưa gắn chủ đề"}
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Subtitles & Duration */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-slate-300">
                          <span className="font-bold text-indigo-400">
                            {lesson.subtitles?.length || 0}
                          </span>
                          <span className="text-slate-400 text-[11px]">câu phụ đề</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ⏱ {lesson.duration || "00:00"}
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {lesson.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Xuất bản
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            Bản nháp
                          </span>
                        )}

                        <div>
                          {lesson.isPremiumOnly ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                              Premium Only
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Miễn phí</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Student practice view link */}
                        <Link
                          href={`/practice/${lesson._id}`}
                          target="_blank"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                          title="Mở phòng luyện nói học viên"
                        >
                          <Eye size={14} />
                        </Link>

                        {/* Edit lesson link */}
                        <Link
                          href={`/admin/lessons/${lesson._id}`}
                          className="w-8 h-8 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 hover:text-white flex items-center justify-center transition-colors"
                          title="Chỉnh sửa bài giảng & video"
                        >
                          <Edit size={14} />
                        </Link>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: lesson._id, title: lesson.title })
                          }
                          className="w-8 h-8 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 hover:text-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa bài học"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {lessonsData && lessonsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Trang <strong>{lessonsData.pagination.page}</strong> /{" "}
              {lessonsData.pagination.totalPages} (Tổng {lessonsData.pagination.total} bài)
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
                disabled={page >= lessonsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 font-bold transition-colors cursor-pointer"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-base font-black text-white">Xác nhận xóa bài học</h3>
            <p className="text-xs text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa bài học{" "}
              <strong className="text-white">"{deleteTarget.title}"</strong>? Mọi dữ liệu phụ đề và video liên kết sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
