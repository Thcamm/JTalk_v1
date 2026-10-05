"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  adminService,
  type CreateLessonPayload,
} from "@/services/admin.service";
import { lessonService } from "@/services/lesson.service";
import type { Topic, VideoSubtitle, Course } from "@/types";
import YouTubePreview from "@/components/admin/YouTubePreview";
import SubtitleEditor, { parseSubtitlesContent } from "@/components/admin/SubtitleEditor";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { YouTubeIcon } from "@/components/common/YouTubeIcon";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Plus,
  X,
  FolderPlus,
} from "lucide-react";

interface AdminLessonFormPageProps {
  lessonId?: string;
}

const TOPIC_VN_MAP: Record<string, string> = {
  "新しいクラスでの自己紹介": "Tự giới thiệu bản thân trong lớp học mới",
  "毎日の生活について": "Hoạt động & Thói quen đời sống thường nhật",
  "病院で診察を受ける": "Khám bệnh & Miêu tả triệu chứng tại phòng khám",
  "カフェで飲み物を注文する": "Gọi đồ uống & Giao tiếp tại quán cà phê",
  "駅で道を尋ねる・乗換案内": "Hỏi đường và chuyển tuyến tàu điện ngầm",
  "採用面接・志望 động cơ": "Phỏng vấn xin việc & Nêu nguyện vọng ứng tuyển",
  "採用面接・志望動機": "Phỏng vấn xin việc & Nêu nguyện vọng ứng tuyển",
  "ビジネス会話・進捗報告": "Đàm thoại công sở & Báo cáo tiến độ HORENSO",
  "居酒屋で乾杯・食事の誘い": "Rủ đồng nghiệp đi ăn & Nâng ly tại quán nhậu",
  "Minna no Nihongo - Video Hội thoại Đời sống": "Giáo trình Minna – Tình huống giao tiếp thực tế",
  "敬語マスター - Làm chủ Kính ngữ giao tiếp": "Làm chủ Kính ngữ giao tiếp thực chiến",
};

const getTopicDisplayName = (name: string): string => {
  return TOPIC_VN_MAP[name] || name;
};

const STANDARD_LEVELS = [
  { value: "N5", label: "N5 - Nhập môn & Chào hỏi" },
  { value: "N4", label: "N4 - Giao tiếp hàng ngày" },
  { value: "N3", label: "N3 - Phỏng vấn & Cuộc sống Nhật" },
  { value: "N2", label: "N2 - Công sở & Đàm thoại chuyên sâu" },
  { value: "N1", label: "N1 - Thương mại & Cao cấp" },
];

const STANDARD_FORMATS = [
  { value: "video", label: "Video Shadowing & Phản xạ" },
  { value: "exam_review", label: "Video Chữa đề & Giải thích đề thi" },
  { value: "situation", label: "Video Tình huống Giao tiếp thực tế" },
];

function extractYouTubeId(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : "";
}

export default function AdminLessonFormPage({ lessonId: propLessonId }: AdminLessonFormPageProps) {
  const router = useRouter();
  const params = useParams();
  const lessonId = propLessonId || (params?.id as string | undefined);
  const isEditMode = Boolean(lessonId);

  // Topics and Courses list for selector
  const [topics, setTopics] = useState<Topic[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick inline Topic creation
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicLevel, setNewTopicLevel] = useState("N5");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [topicCreateError, setTopicCreateError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [level, setLevel] = useState("N5");
  const [isCustomLevel, setIsCustomLevel] = useState(false);
  const [customLevel, setCustomLevel] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [lessonType, setLessonType] = useState<string>("video");
  const [isCustomFormat, setIsCustomFormat] = useState(false);
  const [customFormat, setCustomFormat] = useState("");
  const [sourceType, setSourceType] = useState<"community" | "jtalk">("community");
  const [rawVideoInput, setRawVideoInput] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [duration, setDuration] = useState("05:00");
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);

  // Load Topics and Courses
  useEffect(() => {
    Promise.all([adminService.getTopics(), adminService.getCourses()])
      .then(([topicsData, coursesData]) => {
        setTopics(topicsData);
        setCourses(coursesData);
        if (!isEditMode && topicsData.length > 0 && !topicId) {
          setTopicId(topicsData[0]._id);
          const firstCid =
            typeof topicsData[0].courseId === "object" && topicsData[0].courseId
              ? (topicsData[0].courseId as any)._id
              : topicsData[0].courseId;
          if (firstCid) setCourseId(firstCid);
        }
      })
      .catch((err) => console.error("Lỗi khi tải topics/courses:", err));
  }, [isEditMode, topicId]);

  // Load existing Lesson if Edit mode
  useEffect(() => {
    if (!lessonId) return;

    const loadLesson = async () => {
      try {
        setFetching(true);
        const data = await lessonService.getLessonById(lessonId);
        setTitle(data.title || "");
        setDescription(data.description || "");
        if (data.courseId) {
          setCourseId(
            typeof data.courseId === "object" && (data.courseId as any)._id
              ? (data.courseId as any)._id
              : (data.courseId as string)
          );
        } else if (
          data.topicId &&
          typeof data.topicId === "object" &&
          (data.topicId as any).courseId
        ) {
          const tCid = (data.topicId as any).courseId;
          setCourseId(typeof tCid === "object" ? tCid._id : tCid);
        }
        setTopicId(
          typeof data.topicId === "object" && data.topicId?._id
            ? data.topicId._id
            : (data.topicId as string) || ""
        );

        // Level check (standard vs custom)
        const currentLevel = data.level || "N5";
        const isStdLevel = STANDARD_LEVELS.some((s) => s.value === currentLevel);
        if (isStdLevel) {
          setLevel(currentLevel);
          setIsCustomLevel(false);
          setCustomLevel("");
        } else {
          setLevel(currentLevel);
          setIsCustomLevel(true);
          setCustomLevel(currentLevel);
        }

        if (data.orderIndex !== undefined) setOrderIndex(Number(data.orderIndex));
        if (data.episodeNumber !== undefined) setEpisodeNumber(Number(data.episodeNumber));

        // Format check (standard vs custom)
        const currentFmt = data.lessonType || "video";
        const isStdFmt = STANDARD_FORMATS.some((f) => f.value === currentFmt);
        if (isStdFmt) {
          setLessonType(currentFmt);
          setIsCustomFormat(false);
          setCustomFormat("");
        } else {
          setLessonType(currentFmt);
          setIsCustomFormat(true);
          setCustomFormat(currentFmt);
        }

        setYoutubeId(data.youtubeId || "");
        setRawVideoInput(data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : "");
        setSourceType((data.sourceType as "community" | "jtalk") || "community");
        setChannelName(data.channelName || "");
        setChannelUrl(data.channelUrl || "");
        setDuration(data.duration || "05:00");
        setIsPremiumOnly(Boolean(data.isPremiumOnly));
        setIsPublished(data.isPublished !== false);
        setSubtitles(data.subtitles || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải thông tin bài học.");
      } finally {
        setFetching(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  // Quick topic creation handler
  const handleCreateQuickTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) {
      setTopicCreateError("Vui lòng nhập tên chủ đề bằng tiếng Việt.");
      return;
    }
    try {
      setCreatingTopic(true);
      setTopicCreateError(null);
      const created = await adminService.createTopic({
        name: newTopicName.trim(),
        courseId: courseId ? (courseId as any) : undefined,
        level: newTopicLevel,
        category: "video",
        isPublished: true,
      });
      setTopics((prev) => [created, ...prev]);
      setTopicId(created._id);
      setNewTopicName("");
      setShowNewTopicForm(false);
    } catch (err: any) {
      setTopicCreateError(err.response?.data?.message || "Không thể tạo chủ đề mới.");
    } finally {
      setCreatingTopic(false);
    }
  };

  // Auto-parse YouTube URL when typed or pasted
  const handleVideoInputChange = (val: string) => {
    setRawVideoInput(val);
    const parsedId = extractYouTubeId(val);
    setYoutubeId(parsedId);
  };

  // State for automatic YouTube transcript fetch
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptNotice, setTranscriptNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Automatically fetch Japanese transcript and metadata from YouTube
  const handleAutoFetchTranscript = async () => {
    const input = rawVideoInput.trim() || youtubeId.trim();
    if (!input) {
      setTranscriptNotice({
        type: "error",
        text: "Vui lòng nhập đường dẫn YouTube hoặc ID video trước khi lấy phụ đề.",
      });
      return;
    }

    try {
      setLoadingTranscript(true);
      setTranscriptNotice(null);
      const data = await adminService.getYoutubeTranscript(input);

      if (data) {
        if (data.videoId) {
          setYoutubeId(data.videoId);
          if (!rawVideoInput) {
            setRawVideoInput(`https://www.youtube.com/watch?v=${data.videoId}`);
          }
        }
        if (data.title && (!title || title.trim() === "")) {
          setTitle(data.title);
        }
        if (data.channelName && (!channelName || channelName.trim() === "")) {
          setChannelName(data.channelName);
        }
        if (data.duration && (!duration || duration === "05:00")) {
          setDuration(data.duration);
        }
        if (data.subtitles && data.subtitles.length > 0) {
          setSubtitles(data.subtitles);
          setTranscriptNotice({
            type: "success",
            text: `Đã tự động tải thành công ${data.subtitles.length} câu phụ đề từ YouTube! (${data.language || "ja"})`,
          });
        } else {
          setTranscriptNotice({
            type: "error",
            text: "Video này không có phụ đề tiếng Nhật tự động. Bạn có thể sử dụng nút 'Tải file' để nạp phụ đề SRT/VTT.",
          });
        }
      }
    } catch (err: any) {
      console.error("Lỗi trích xuất YouTube:", err);
      // Auto-populate video metadata if backend returned it with 404
      const meta = err?.response?.data?.data;
      if (meta) {
        if (meta.title && (!title || title.trim() === "")) {
          setTitle(meta.title);
        }
        if (meta.channelName && (!channelName || channelName.trim() === "")) {
          setChannelName(meta.channelName);
        }
        if (meta.duration && (!duration || duration === "05:00")) {
          setDuration(meta.duration);
        }
      }

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Video này không có sẵn phụ đề tự động hoặc phụ đề tiếng Nhật trên YouTube. Bạn có thể sử dụng chức năng 'Tải file' hoặc 'Nhập văn bản' ở mục 3 bên dưới để nạp phụ đề.";
      setTranscriptNotice({ type: "error", text: msg });
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề bài học.");
      return;
    }
    if (!topicId) {
      setError("Vui lòng chọn chủ đề cho bài học.");
      return;
    }

    try {
      setSubmitting(true);

      const finalLevel = isCustomLevel && customLevel.trim() ? customLevel.trim() : level || "N5";
      const finalLessonType = isCustomFormat && customFormat.trim() ? customFormat.trim() : lessonType || "video";

      const payload: CreateLessonPayload = {
        title: title.trim(),
        description: description.trim(),
        courseId: courseId || undefined,
        topicId,
        level: finalLevel,
        orderIndex: Number(orderIndex) || 0,
        episodeNumber: Number(episodeNumber) || 1,
        lessonType: finalLessonType,
        youtubeId: youtubeId.trim() || undefined,
        videoUrl: rawVideoInput.trim() || undefined,
        sourceType,
        channelName: channelName.trim() || undefined,
        channelUrl: channelUrl.trim() || undefined,
        duration: duration.trim() || "05:00",
        isPremiumOnly,
        isPublished,
        subtitles,
      };

      if (isEditMode && lessonId) {
        await adminService.updateLesson(lessonId, payload);
      } else {
        await adminService.createLesson(payload);
      }

      router.push("/admin/lessons");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Đã xảy ra lỗi khi lưu bài học. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu bài học..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Back Link (Sticky Top Bar so Save button is always accessible) */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/lessons"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Quay lại danh sách bài học"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isEditMode ? "Chỉnh Sửa Video Bài Giảng" : "Thêm Bài Giảng Video YouTube Mới"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Đồng bộ nội dung video YouTube, chuẩn hóa phụ đề song ngữ và phân cấp bài học.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save size={16} />
          <span>{submitting ? "Đang lưu..." : isEditMode ? "Cập Nhật Bài Giảng" : "Tạo Bài Giảng"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Core Info & YouTube Integration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Box 1: Basic Information */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-black text-white">
                <FileText size={18} className="text-indigo-400" />
                <span>1. Thông Tin Cơ Bản</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tiêu đề bài học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ví dụ: Luyện phản xạ: Tự giới thiệu bản thân trong phỏng vấn Shinsotsu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô tả / Ghi chú ngữ pháp & bối cảnh
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả bối cảnh cuộc hội thoại, từ vựng trọng tâm hoặc mẹo giao tiếp tự nhiên..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all"
                />
              </div>

              {/* Course Selector (Khóa học / Bộ video lớn) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Khóa học / Bộ video lớn (Hiển thị ở Thư viện) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={courseId}
                  onChange={(e) => {
                    const newCourseId = e.target.value;
                    setCourseId(newCourseId);
                    if (newCourseId) {
                      const matchTopic = topics.find((t) => {
                        const tCid =
                          typeof t.courseId === "object" && t.courseId
                            ? (t.courseId as any)._id
                            : t.courseId;
                        return tCid === newCourseId;
                      });
                      if (matchTopic) {
                        setTopicId(matchTopic._id);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-medium"
                >
                  <option value="">-- Chọn khóa học / bộ video lớn --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Chọn 1 trong các bộ video ở Thư viện (Kính ngữ, Minna 25 bài, Nhập môn, Đời sống, v.v.)
                </p>
              </div>

              {/* Topic Selector with Vietnamese Display and Inline Create Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Chủ đề chi tiết (Topic con)<span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTopicForm(!showNewTopicForm);
                      setTopicCreateError(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {showNewTopicForm ? (
                      <>
                        <X size={13} />
                        <span>Đóng tạo chủ đề</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>+ Tạo chủ đề mới</span>
                      </>
                    )}
                  </button>
                </div>

                <select
                  required
                  value={topicId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setTopicId(selectedId);
                    const selectedTopic = topics.find((t) => t._id === selectedId);
                    if (selectedTopic && selectedTopic.courseId) {
                      const tCid =
                        typeof selectedTopic.courseId === "object"
                          ? (selectedTopic.courseId as any)._id
                          : selectedTopic.courseId;
                      if (tCid && !courseId) {
                        setCourseId(tCid);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-medium"
                >
                  <option value="">-- Chọn chủ đề bài học --</option>
                  {(courseId
                    ? topics.filter((t) => {
                        const tCid =
                          typeof t.courseId === "object" && t.courseId
                            ? (t.courseId as any)._id
                            : t.courseId;
                        return !tCid || tCid === courseId;
                      })
                    : topics
                  ).map((t) => (
                    <option key={t._id} value={t._id}>
                      {getTopicDisplayName(t.name)}
                    </option>
                  ))}
                </select>

                {/* Inline Quick Topic Creator */}
                {showNewTopicForm && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/80 space-y-3 mt-2 shadow-inner">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <FolderPlus size={15} />
                      <span>Thêm chủ đề mới (Tiếng Việt)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          placeholder="Nhập tên chủ đề tiếng Việt (ví dụ: Chữa đề thi JLPT N3 Dokkai...)"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-indigo-400 outline-hidden"
                        />
                      </div>
                      <div>
                        <select
                          value={newTopicLevel}
                          onChange={(e) => setNewTopicLevel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-400 outline-hidden font-bold"
                        >
                          <option value="N5">N5 (Nhập môn)</option>
                          <option value="N4">N4 (Sơ cấp)</option>
                          <option value="N3">N3 (Trung cấp)</option>
                          <option value="N2">N2 (Thực chiến)</option>
                          <option value="N1">N1 (Cao cấp)</option>
                        </select>
                      </div>
                    </div>

                    {topicCreateError && (
                      <p className="text-[11px] text-rose-400 font-semibold">{topicCreateError}</p>
                    )}

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowNewTopicForm(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateQuickTopic}
                        disabled={creatingTopic || !newTopicName.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {creatingTopic ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Đang tạo...</span>
                          </>
                        ) : (
                          <span>Lưu chủ đề & Chọn ngay</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Level (with custom option), Episode #, and Video-centric Format (with custom option) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Level Selector & Custom Level Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cấp độ bài học <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={isCustomLevel ? "__custom__" : level}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomLevel(true);
                        if (!customLevel) {
                          setCustomLevel("JLPT N3 Chữa đề");
                          setLevel("JLPT N3 Chữa đề");
                        } else {
                          setLevel(customLevel);
                        }
                      } else {
                        setIsCustomLevel(false);
                        setLevel(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-bold"
                  >
                    {STANDARD_LEVELS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                    <option value="__custom__"> Nhập cấp độ tùy chỉnh...</option>
                  </select>

                  {/* Inline Custom Level Input */}
                  {isCustomLevel && (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        required
                        value={customLevel}
                        onChange={(e) => {
                          setCustomLevel(e.target.value);
                          setLevel(e.target.value);
                        }}
                        placeholder="ví dụ: JLPT N3 Chữa đề, N2 Tổng ôn, Sơ cấp A1..."
                        className="w-full pl-3 pr-24 py-2 rounded-xl bg-slate-950 border border-indigo-500/80 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 outline-hidden font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomLevel(false);
                          setLevel("N5");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-rose-400 font-semibold"
                        title="Quay lại danh sách chuẩn"
                      >
                        Về chuẩn JLPT
                      </button>
                    </div>
                  )}
                </div>

                {/* Episode Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tập số (Episode #)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>

                {/* Video-focused Format & Custom Format Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Định dạng bài học
                  </label>
                  <select
                    value={isCustomFormat ? "__custom__" : lessonType}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomFormat(true);
                        if (!customFormat) {
                          setCustomFormat("Video Ngữ pháp chuyên đề");
                          setLessonType("Video Ngữ pháp chuyên đề");
                        } else {
                          setLessonType(customFormat);
                        }
                      } else {
                        setIsCustomFormat(false);
                        setLessonType(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                  >
                    {STANDARD_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                    <option value="__custom__">Nhập định dạng tùy chỉnh...</option>
                  </select>

                  {/* Inline Custom Format Input */}
                  {isCustomFormat && (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        required
                        value={customFormat}
                        onChange={(e) => {
                          setCustomFormat(e.target.value);
                          setLessonType(e.target.value);
                        }}
                        placeholder="ví dụ: Video Ngữ pháp chuyên đề, Tin tức NHK..."
                        className="w-full pl-3 pr-20 py-2 rounded-xl bg-slate-950 border border-indigo-500/80 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomFormat(false);
                          setLessonType("video");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-rose-400 font-semibold"
                        title="Quay lại mặc định"
                      >
                        Về mặc định
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Box 2: YouTube Video Integration */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-black text-white">
                <YouTubeIcon size={20} className="text-red-500" />
                <span>2. Tích Hợp Video YouTube</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Đường dẫn Video YouTube (hoặc ID video 11 ký tự)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rawVideoInput}
                    onChange={(e) => handleVideoInputChange(e.target.value)}
                    placeholder="ví dụ: https://www.youtube.com/watch?v=1iDoq9sGX1s hoặc 1iDoq9sGX1s"
                    className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all font-mono"
                  />
                  {youtubeId && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                      ID: {youtubeId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống tự động nhận diện ID từ mọi định dạng link: <code>youtube.com/watch?v=...</code>, <code>youtu.be/...</code> hoặc <code>embed/...</code>.
                </p>

                {/* Warning if user mistakenly pasted JSON or SRT into YouTube link */}
                {(rawVideoInput.trim().startsWith("[") ||
                  rawVideoInput.trim().startsWith("{") ||
                  rawVideoInput.includes("-->")) && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-800 text-amber-300 text-xs flex items-start gap-2.5 shadow-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-bold text-amber-200">
                        Bạn đang dán mã phụ đề JSON/SRT vào ô link YouTube!
                      </p>
                      <p className="text-[11px] text-amber-300/80 mt-1 leading-relaxed">
                        Ô này chỉ nhận đường dẫn video YouTube (ví dụ: <code>https://www.youtube.com/watch?v=1iDoq9sGX1s</code>). Hãy <strong>cuộn chuột xuống mục "3. Danh Sách Phụ Đề Tương Tác"</strong> bên dưới rồi bấm nút <strong>"Nhập văn bản"</strong> để dán mã phụ đề này vào nhé.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseSubtitlesContent(rawVideoInput);
                          if (parsed.length > 0) {
                            setSubtitles(parsed);
                            setRawVideoInput("");
                            setYoutubeId("");
                            setTranscriptNotice({
                              type: "success",
                              text: `Đã nạp thành công ${parsed.length} câu phụ đề vào Mục 3 bên dưới! Hãy dán link video YouTube vào ô trên.`,
                            });
                          }
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        <span>⬇ Bấm vào đây để tự động nạp đoạn mã này vào Mục 3</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Auto fetch button & status notice */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleAutoFetchTranscript}
                    disabled={loadingTranscript || (!rawVideoInput.trim() && !youtubeId.trim())}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-red-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loadingTranscript ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>Đang trích xuất phụ đề YouTube...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-amber-300" />
                        <span>⚡ Lấy Phụ Đề & Thông Tin Tự Động Từ YouTube</span>
                      </>
                    )}
                  </button>

                  {transcriptNotice && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        transcriptNotice.type === "success"
                          ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                          : "bg-rose-950/60 border-rose-800 text-rose-300"
                      }`}
                    >
                      {transcriptNotice.type === "success" ? (
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      )}
                      <span>{transcriptNotice.text}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nguồn video
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as "community" | "jtalk")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-bold"
                  >
                    <option value="community">🌐 Cộng đồng (YouTube - Miễn phí)</option>
                    <option value="jtalk">⚡ JTalk Độc quyền (AI Studio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kênh / Tác giả YouTube
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="ví dụ: Sambon Juku, Dũng Mori"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Thời lượng hiển thị (MM:SS)
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="05:30"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  URL Kênh / Video gốc (YouTube)
                </label>
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@... hoặc https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Video Preview & Access Settings */}
          <div className="space-y-6">
            {/* Box 3: Live Video Preview */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                Xem Trước Video
              </span>
              <YouTubePreview youtubeId={youtubeId} title={title} />
            </div>

            {/* Box 4: Access & Publishing Options */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block pb-2 border-b border-slate-800">
                Cấu Hình Xuất Bản
              </span>

              {/* Published switch */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Xuất bản công khai
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Học viên có thể nhìn thấy và học ngay
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                />
              </label>

              {/* Premium Only switch */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Độc quyền Premium
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Chỉ hội viên trả phí mới được mở khóa
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPremiumOnly}
                  onChange={(e) => setIsPremiumOnly(e.target.checked)}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Subtitle Editor (Full Width) */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-400" />
              <div>
                <h3 className="text-base font-black text-white">
                  3. Danh Sách Phụ Đề Tương Tác & Luyện Nói
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phụ đề này sẽ đồng bộ thời gian với video YouTube, hiển thị Kanji, Furigana và cho phép AI chấm điểm phát âm của học viên.
                </p>
              </div>
            </div>
          </div>

          <SubtitleEditor
            subtitles={subtitles}
            onChange={setSubtitles}
            onAutoFetchYouTube={handleAutoFetchTranscript}
            isLoadingYouTube={loadingTranscript}
            onSave={handleSubmit}
            submitting={submitting}
            isEditMode={isEditMode}
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            href="/admin/lessons"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            <span>{submitting ? "Đang lưu..." : isEditMode ? "Cập Nhật Bài Giảng" : "Tạo Bài Giảng"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
