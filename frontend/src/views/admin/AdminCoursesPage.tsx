"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { Course, Topic } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  BookOpen,
  Layers,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  FolderPlus,
  Video,
} from "lucide-react";

export default function AdminCoursesPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "topics">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter topics by course
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");

  // Course Modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseLevel, setCourseLevel] = useState("N5");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseIsPremium, setCourseIsPremium] = useState(false);
  const [courseOrder, setCourseOrder] = useState(0);

  // Topic Modal state
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicCourseId, setTopicCourseId] = useState("");
  const [topicLevel, setTopicLevel] = useState("N5");
  const [topicCategory, setTopicCategory] = useState("daily");

  // Delete Course modal
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesData, topicsData] = await Promise.all([
        adminService.getCourses(),
        adminService.getTopics(selectedCourseFilter || undefined),
      ]);
      setCourses(coursesData);
      setTopics(topicsData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu giáo trình.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create/Edit Course Modal
  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitle(course.title);
      setCourseDesc(course.description || "");
      setCourseLevel(course.level || "N5");
      setCourseThumbnail(course.thumbnail || "");
      setCourseIsPremium(Boolean(course.isPremiumOnly));
      setCourseOrder(course.orderIndex || 0);
    } else {
      setEditingCourse(null);
      setCourseTitle("");
      setCourseDesc("");
      setCourseLevel("N5");
      setCourseThumbnail("");
      setCourseIsPremium(false);
      setCourseOrder(courses.length);
    }
    setCourseModalOpen(true);
  };

  // Submit Course Form
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    try {
      setActionLoading(true);
      const payload: Partial<Course> = {
        title: courseTitle.trim(),
        description: courseDesc.trim(),
        level: courseLevel,
        thumbnail: courseThumbnail.trim() || undefined,
        isPremiumOnly: courseIsPremium,
        orderIndex: Number(courseOrder) || 0,
      };

      if (editingCourse) {
        await adminService.updateCourse(editingCourse._id, payload);
      } else {
        await adminService.createCourse(payload);
      }

      setCourseModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi lưu khóa học.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async () => {
    if (!deleteCourseTarget) return;
    try {
      setActionLoading(true);
      await adminService.deleteCourse(deleteCourseTarget._id);
      setDeleteCourseTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa khóa học.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Topic Modal
  const openTopicModal = () => {
    setTopicName("");
    setTopicDesc("");
    setTopicCourseId(courses[0]?._id || "");
    setTopicLevel("N5");
    setTopicCategory("daily");
    setTopicModalOpen(true);
  };

  // Submit Topic Form
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !topicCourseId) return;

    try {
      setActionLoading(true);
      const payload: Partial<Topic> = {
        name: topicName.trim(),
        description: topicDesc.trim(),
        courseId: topicCourseId as any,
        level: topicLevel,
        category: topicCategory,
        orderIndex: topics.length,
      };

      await adminService.createTopic(payload);
      setTopicModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi tạo chủ đề.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen size={26} className="text-amber-400" />
            <span>Quản Lý Khóa Học & Chủ Đề</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quy hoạch giáo trình theo cấp độ JLPT, phân nhóm chủ đề đàm thoại thực tế và quản lý thứ tự hiển thị.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openCourseModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Tạo Khóa Học</span>
          </button>

          <button
            type="button"
            onClick={openTopicModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>+ Thêm Chủ Đề</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "courses"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BookOpen size={15} />
          <span>Danh Sách Khóa Học ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("topics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "topics"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Layers size={15} />
          <span>Danh Sách Chủ Đề ({topics.length})</span>
        </button>
      </div>

      {/* Loading & Error */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <LoadingSpinner size="lg" label="Đang tải dữ liệu giáo trình..." />
        </div>
      ) : error ? (
        <div className="p-12 text-center text-rose-400">
          <p className="font-bold">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : activeTab === "courses" ? (
        /* TAB 1: COURSES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course._id}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between hover:border-amber-600/40 transition-all group"
            >
              <div>
                {/* Thumbnail & Level Badge */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-slate-600">
                      <BookOpen size={36} />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-700 text-indigo-300 font-black text-xs shadow-md">
                      {course.level || "N5"}
                    </span>
                    {course.isPremiumOnly && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-amber-950 font-black text-[10px] shadow-md uppercase">
                        Premium
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {course.description || "Chưa có mô tả cho khóa học này."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Thứ tự: <strong className="text-slate-200">#{course.orderIndex || 0}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openCourseModal(course)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Chỉnh sửa khóa học"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteCourseTarget(course)}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                    title="Xóa khóa học"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 2: TOPICS LIST */
        <div className="space-y-4">
          {/* Topic Filter by Course */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm">
            <span className="text-xs font-bold text-slate-400 shrink-0">Lọc theo khóa:</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 outline-hidden"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.level})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Tên Chủ Đề</th>
                  <th className="py-3.5 px-4">Thuộc Khóa Học</th>
                  <th className="py-3.5 px-4">Cấp độ & Phân loại</th>
                  <th className="py-3.5 px-4 text-right">Bài học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topics.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {t.description || "Chưa có mô tả."}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {typeof t.courseId === "object" && (t.courseId as any)?.title
                        ? (t.courseId as any).title
                        : "Khóa học chung"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-black text-[10px]">
                          {t.level || "N5"}
                        </span>
                        <span className="text-slate-400 capitalize text-[11px]">
                          {t.category || "daily"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/lessons?topicId=${t._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-900 text-indigo-300 hover:text-white transition-colors font-bold text-xs"
                      >
                        <Video size={13} />
                        <span>Xem video</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create / Edit Course */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <h3 className="text-base font-black text-white pb-3 border-b border-slate-800">
              {editingCourse ? "Chỉnh Sửa Khóa Học" : "Tạo Khóa Học Mới"}
            </h3>

            <form onSubmit={handleSaveCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên khóa học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="ví dụ: Kaiwa Thực Chiến Shinsotsu N3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={3}
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Tổng quan nội dung đào tạo và lộ trình bài học..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Trình độ JLPT
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 outline-hidden font-bold"
                  >
                    <option value="N5">N5 (Nhập môn)</option>
                    <option value="N4">N4 (Sơ cấp)</option>
                    <option value="N3">N3 (Trung cấp)</option>
                    <option value="N2">N2 (Thực chiến)</option>
                    <option value="N1">N1 (Cao cấp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={courseOrder}
                    onChange={(e) => setCourseOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Link ảnh Thumbnail
                </label>
                <input
                  type="text"
                  value={courseThumbnail}
                  onChange={(e) => setCourseThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseIsPremium}
                  onChange={(e) => setCourseIsPremium(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-300">
                  Chỉ dành cho tài khoản Premium
                </span>
              </label>

              <div className="mt-6 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/30 cursor-pointer"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu Khóa Học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Topic */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <h3 className="text-base font-black text-white pb-3 border-b border-slate-800">
              Thêm Chủ Đề Mới
            </h3>

            <form onSubmit={handleSaveTopic} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên chủ đề <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="ví dụ: Đi làm thêm (Baito) tại combini"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô tả chủ đề
                </label>
                <textarea
                  rows={2}
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="Tóm tắt nội dung hội thoại chính..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Thuộc khóa học <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={topicCourseId}
                  onChange={(e) => setTopicCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Trình độ JLPT
                  </label>
                  <select
                    value={topicLevel}
                    onChange={(e) => setTopicLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-bold"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Phân loại
                  </label>
                  <select
                    value={topicCategory}
                    onChange={(e) => setTopicCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden capitalize"
                  >
                    <option value="daily">Đời sống hàng ngày</option>
                    <option value="baito">Việc làm thêm (Baito)</option>
                    <option value="business">Công sở & Phỏng vấn</option>
                    <option value="travel">Du lịch & Mua sắm</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {actionLoading ? "Đang tạo..." : "Tạo Chủ Đề"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Course Confirmation */}
      {deleteCourseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-base font-black text-white">Xác nhận xóa khóa học</h3>
            <p className="text-xs text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa khóa học{" "}
              <strong className="text-white">"{deleteCourseTarget.title}"</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteCourseTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteCourse}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 cursor-pointer"
              >
                {actionLoading ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
