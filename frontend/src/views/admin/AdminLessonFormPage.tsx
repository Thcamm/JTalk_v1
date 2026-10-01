"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  adminService,
  type CreateLessonPayload,
} from "@/services/admin.service";
import { lessonService } from "@/services/lesson.service";
import type { Topic, VideoSubtitle } from "@/types";
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
} from "lucide-react";

interface AdminLessonFormPageProps {
  lessonId?: string;
}

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

  // Topics list for selector
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fetching, setFetching] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [level, setLevel] = useState("N5");
  const [rawVideoInput, setRawVideoInput] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [duration, setDuration] = useState("05:00");
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);

  // Load Topics
  useEffect(() => {
    adminService
      .getTopics()
      .then((data) => {
        setTopics(data);
        if (!isEditMode && data.length > 0 && !topicId) {
          setTopicId(data[0]._id);
        }
      })
      .catch((err) => console.error("Lỗi khi tải topics:", err));
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
        setTopicId(
          typeof data.topicId === "object" && data.topicId?._id
            ? data.topicId._id
            : (data.topicId as string) || ""
        );
        setLevel(data.level || "N5");
        setYoutubeId(data.youtubeId || "");
        setRawVideoInput(data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : "");
        setChannelName(data.channelName || "");
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

      const payload: CreateLessonPayload = {
        title: title.trim(),
        description: description.trim(),
        topicId,
        level,
        youtubeId: youtubeId.trim() || undefined,
        videoUrl: rawVideoInput.trim() || undefined,
        channelName: channelName.trim() || undefined,
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Chủ đề thuộc về <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {topics.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cấp độ JLPT <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-hidden font-bold"
                  >
                    <option value="N5">N5 - Nhập môn & Chào hỏi</option>
                    <option value="N4">N4 - Giao tiếp hàng ngày</option>
                    <option value="N3">N3 - Phỏng vấn & Cuộc sống Nhật</option>
                    <option value="N2">N2 - Công sở & Đàm thoại chuyên sâu</option>
                    <option value="N1">N1 - Thương mại & Cao cấp</option>
                  </select>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kênh / Tác giả YouTube
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="ví dụ: Dogen, Nihongo no Mori, Japanese Ammo"
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
