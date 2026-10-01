"use client";

import { useState, useRef } from "react";
import type { VideoSubtitle } from "@/types";
import { adminService } from "@/services/admin.service";
import {
  Plus,
  Trash2,
  Volume2,
  FileCode,
  ArrowUpDown,
  Download,
  Upload,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  FolderOpen,
  Loader2,
  Save,
} from "lucide-react";

interface SubtitleEditorProps {
  subtitles: VideoSubtitle[];
  onChange: (subs: VideoSubtitle[]) => void;
  onAutoFetchYouTube?: () => void;
  isLoadingYouTube?: boolean;
  onSave?: () => void;
  submitting?: boolean;
  isEditMode?: boolean;
}

// Convert seconds (e.g. 75.5) to MM:SS string
function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Flexible timestamp parser supporting SRT (00:01:25,500) and WebVTT (01:25.500 or 00:01:25.500)
function srtTimeToSeconds(srtTime: string): number {
  const trimmed = srtTime.trim();
  // Format: (HH:)?MM:SS[,.]mmm
  const match = trimmed.match(/(?:(?:(\d+):)?(\d+):)?(\d+)[,\.](\d+)/);
  if (match) {
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const msStr = match[4] || "0";
    const milliseconds = parseInt(msStr.padEnd(3, "0").slice(0, 3), 10) / 1000;
    return hours * 3600 + minutes * 60 + seconds + milliseconds;
  }
  const floatSec = parseFloat(trimmed);
  return isNaN(floatSec) ? 0 : floatSec;
}

// Universal parser for JSON, SRT, and WebVTT strings
export function parseSubtitlesContent(raw: string): VideoSubtitle[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // 1. JSON Array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        startTime: Number(item.startTime) || 0,
        endTime: Number(item.endTime) || (Number(item.startTime) || 0) + 3,
        japanese: String(item.japanese || item.jp || item.text || ""),
        furigana: item.furigana ? String(item.furigana) : undefined,
        romaji: item.romaji ? String(item.romaji) : undefined,
        translation: item.translation ? String(item.translation) : item.vi ? String(item.vi) : "",
      }));
    }
  }

  // 2. SRT or WebVTT
  // Strip WebVTT headers & metadata comments
  const cleanText = trimmed
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .replace(/NOTE[^\n]*\n+/g, "");

  const blocks = cleanText.split(/\r?\n\s*\r?\n/);
  const parsedSubs: VideoSubtitle[] = [];

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length === 0) continue;

    const timeLineIndex = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIndex !== -1) {
      const timeParts = lines[timeLineIndex].split("-->");
      const startTime = srtTimeToSeconds(timeParts[0]);
      const endTime = srtTimeToSeconds(timeParts[1]);

      // Subtitle dialogue lines
      const textLines = lines
        .slice(timeLineIndex + 1)
        .map((l) => l.trim().replace(/<[^>]+>/g, "")) // Remove VTT voice tags like <v Voice> or <b>
        .filter(Boolean);

      const japanese = textLines[0] || "";
      const translation = textLines.slice(1).join(" ") || "";

      if (japanese) {
        parsedSubs.push({
          startTime: +startTime.toFixed(2),
          endTime: +(endTime || startTime + 3).toFixed(2),
          japanese,
          translation,
        });
      }
    }
  }

  return parsedSubs;
}

export default function SubtitleEditor({
  subtitles,
  onChange,
  onAutoFetchYouTube,
  isLoadingYouTube,
  onSave,
  submitting,
  isEditMode,
}: SubtitleEditorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichNotice, setEnrichNotice] = useState<string | null>(null);

  // Automatically enrich subtitles with Furigana, Romaji and Vietnamese translation using AI
  const handleEnrichWithAi = async () => {
    if (subtitles.length === 0) return;
    try {
      setEnriching(true);
      setEnrichNotice(null);
      const enriched = await adminService.enrichSubtitles(subtitles);
      if (enriched && enriched.length > 0) {
        onChange(enriched);
        setEnrichNotice(`✨ Đã dịch và tạo Furigana/Romaji tự động cho toàn bộ ${enriched.length} câu thoại!`);
        setTimeout(() => setEnrichNotice(null), 6000);
      }
    } catch (err: any) {
      console.error("AI Enrich Error:", err);
      setEnrichNotice("Không thể gọi AI dịch lúc này. Vui lòng kiểm tra lại kết nối.");
      setTimeout(() => setEnrichNotice(null), 6000);
    } finally {
      setEnriching(false);
    }
  };

  // Play Japanese speech via Web Speech API
  const playSpeech = (text: string, index: number) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;

    setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  // Add a new subtitle line
  const handleAddLine = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? lastSub.endTime + 1 : 0;
    const newEnd = newStart + 4;

    const newLine: VideoSubtitle = {
      startTime: newStart,
      endTime: newEnd,
      japanese: "",
      furigana: "",
      romaji: "",
      translation: "",
    };

    onChange([...subtitles, newLine]);
  };

  // Update a single line field
  const handleUpdateField = (
    index: number,
    field: keyof VideoSubtitle,
    value: string | number
  ) => {
    const updated = [...subtitles];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // Remove a line
  const handleRemoveLine = (index: number) => {
    const updated = subtitles.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Move line up/down
  const handleMove = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === subtitles.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...subtitles];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  // Sort all lines by startTime ascending
  const handleSort = () => {
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    onChange(sorted);
  };

  // Export to JSON string
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(subtitles, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle direct file upload (.srt, .vtt, .json)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError("");
      const text = await file.text();
      const parsed = parseSubtitlesContent(text);
      if (parsed.length > 0) {
        onChange(parsed);
        setShowImportModal(false);
        setImportText("");
      } else {
        setImportError("Không tìm thấy dòng phụ đề hợp lệ trong file này (.srt, .vtt hoặc .json).");
      }
    } catch (err: any) {
      setImportError(`Không thể đọc file: ${err.message || "Lỗi không xác định"}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Import JSON, SRT or WebVTT
  const handleProcessImport = () => {
    setImportError("");
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError("Vui lòng dán nội dung JSON, SRT hoặc WebVTT.");
      return;
    }

    try {
      const parsed = parseSubtitlesContent(trimmed);
      if (parsed.length > 0) {
        onChange(parsed);
        setShowImportModal(false);
        setImportText("");
        return;
      }
      setImportError("Không thể nhận diện định dạng JSON, SRT hoặc WebVTT hợp lệ.");
    } catch (err: any) {
      setImportError(`Lỗi phân tích: ${err.message || "Định dạng không hợp lệ"}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for uploading .srt, .vtt, .json */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".srt,.vtt,.json,text/plain"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 font-bold text-xs">
            <Sparkles size={14} className="text-indigo-400" />
            <span>{subtitles.length} câu phụ đề</span>
          </div>

          <button
            type="button"
            onClick={handleSort}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Sắp xếp danh sách phụ đề theo mốc thời gian bắt đầu"
          >
            <ArrowUpDown size={13} />
            <span>Sắp xếp thời gian</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Auto-Enrich Button (Furigana, Romaji, Vietnamese) */}
          {subtitles.length > 0 && (
            <button
              type="button"
              onClick={handleEnrichWithAi}
              disabled={enriching}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title="Dùng AI tự động tạo Furigana, Romaji và Bản dịch tiếng Việt cho toàn bộ câu"
            >
              {enriching ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  <span>AI đang dịch & tạo Furigana...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300" />
                  <span>✨ AI Dịch & Tạo Furigana</span>
                </>
              )}
            </button>
          )}

          {/* Quick YouTube fetch button if parent provided the handler */}
          {onAutoFetchYouTube && (
            <button
              type="button"
              onClick={onAutoFetchYouTube}
              disabled={isLoadingYouTube}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              title="Lấy phụ đề tự động từ video YouTube"
            >
              {isLoadingYouTube ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang bóc tách...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300" />
                  <span>⚡ Tải từ YouTube</span>
                </>
              )}
            </button>
          )}

          {/* Direct File Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Tải file phụ đề (.srt, .vtt, .json) trực tiếp từ máy"
          >
            <FolderOpen size={13} className="text-amber-400" />
            <span>Tải file</span>
          </button>

          {/* Import JSON/SRT/VTT Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload size={13} className="text-emerald-400" />
            <span>Nhập văn bản</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Sao chép toàn bộ phụ đề thành JSON"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Download size={13} className="text-cyan-400" />
                <span>Xuất JSON</span>
              </>
            )}
          </button>

          {/* Add Line Button */}
          <button
            type="button"
            onClick={handleAddLine}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Thêm câu</span>
          </button>

          {/* Quick Save / Create Button in toolbar */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title={isEditMode ? "Lưu cập nhật bài giảng ngay" : "Tạo bài giảng mới ngay"}
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={13} className="text-white" />
                  <span>{isEditMode ? "Lưu Cập Nhật" : "Tạo Bài Giảng"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* AI Enrichment Notice */}
      {enrichNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs flex items-center gap-2.5 shadow-sm animate-fade-in">
          <Sparkles size={16} className="text-amber-300 shrink-0" />
          <span className="font-medium">{enrichNotice}</span>
        </div>
      )}

      {/* Subtitles List */}
      {subtitles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 text-center">
          <FileCode size={36} className="text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-300">Chưa có câu phụ đề nào</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Bấm nút <strong>"+ Thêm câu"</strong> để tạo từng câu thoại, hoặc bấm <strong>"Import JSON / SRT"</strong> để nạp danh sách phụ đề hàng loạt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subtitles.map((sub, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3 group"
            >
              {/* Header: Line Number, Time inputs, Audio test, Up/Down, Delete */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-950/80 border border-indigo-800/80 text-[11px] font-black text-indigo-300">
                    #{index + 1}
                  </span>

                  {/* Time Range Inputs */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                    <Clock size={12} className="text-slate-500" />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sub.startTime}
                      onChange={(e) =>
                        handleUpdateField(index, "startTime", parseFloat(e.target.value) || 0)
                      }
                      className="w-16 bg-transparent text-center font-mono font-bold text-indigo-300 focus:outline-hidden"
                      title="Thời gian bắt đầu (giây)"
                    />
                    <span className="text-slate-600">→</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sub.endTime}
                      onChange={(e) =>
                        handleUpdateField(index, "endTime", parseFloat(e.target.value) || 0)
                      }
                      className="w-16 bg-transparent text-center font-mono font-bold text-indigo-300 focus:outline-hidden"
                      title="Thời gian kết thúc (giây)"
                    />
                    <span className="text-[10px] text-slate-400 font-mono pl-1 border-l border-slate-800">
                      ({formatSeconds(sub.startTime)} - {formatSeconds(sub.endTime)})
                    </span>
                  </div>
                </div>

                {/* Actions: Play TTS, Move, Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => playSpeech(sub.japanese, index)}
                    disabled={!sub.japanese}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                      speakingIndex === index
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40"
                    }`}
                    title="Nghe thử AI phát âm câu tiếng Nhật"
                  >
                    <Volume2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center transition-colors cursor-pointer"
                    title="Di chuyển lên trên"
                  >
                    <ChevronUp size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(index, "down")}
                    disabled={index === subtitles.length - 1}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center transition-colors cursor-pointer"
                    title="Di chuyển xuống dưới"
                  >
                    <ChevronDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="w-7 h-7 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 border border-rose-900/40 flex items-center justify-center transition-colors cursor-pointer ml-1"
                    title="Xóa câu này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Japanese sentence (Required) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tiếng Nhật (Kanji / Kana) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sub.japanese}
                    onChange={(e) => handleUpdateField(index, "japanese", e.target.value)}
                    placeholder="ví dụ: 今日はとてもいい天気ですね。"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm font-medium outline-hidden transition-all"
                  />
                </div>

                {/* Furigana reading */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Furigana / Hiragana (Phiên âm cách đọc)
                  </label>
                  <input
                    type="text"
                    value={sub.furigana || ""}
                    onChange={(e) => handleUpdateField(index, "furigana", e.target.value)}
                    placeholder="ví dụ: きょうはとてもいいてんきですね。"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm font-medium outline-hidden transition-all"
                  />
                </div>

                {/* Romaji */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Romaji
                  </label>
                  <input
                    type="text"
                    value={sub.romaji || ""}
                    onChange={(e) => handleUpdateField(index, "romaji", e.target.value)}
                    placeholder="ví dụ: Kyou wa totemo ii tenki desu ne."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-300 text-xs font-mono outline-hidden transition-all"
                  />
                </div>

                {/* Vietnamese translation */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bản dịch tiếng Việt
                  </label>
                  <input
                    type="text"
                    value={sub.translation || ""}
                    onChange={(e) => handleUpdateField(index, "translation", e.target.value)}
                    placeholder="ví dụ: Hôm nay thời tiết đẹp thật nhỉ."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm font-medium outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-emerald-400" />
                <h3 className="text-base font-black text-white">Import Phụ Đề JSON, SRT hoặc WebVTT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-200">Hoặc chọn file từ máy tính của bạn:</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ các định dạng .srt, .vtt, .json xuất từ YouTube</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <FolderOpen size={14} />
                <span>Chọn file máy tính</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Hoặc dán trực tiếp nội dung văn bản (mảng JSON, nội dung file <strong>.SRT</strong> hoặc <strong>.VTT</strong>):
            </p>

            <textarea
              rows={9}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`[
  {
    "startTime": 0,
    "endTime": 4.5,
    "japanese": "初めまして、よろしくお願いします。",
    "translation": "Rất vui được gặp bạn, mong bạn giúp đỡ."
  }
]
-- HOẶC dán định dạng SRT / WebVTT: --
00:00:01,000 --> 00:00:04,500
初めまして、よろしくお願いします。
Rất vui được gặp bạn, mong bạn giúp đỡ.`}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />

            {importError && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Xác nhận Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
