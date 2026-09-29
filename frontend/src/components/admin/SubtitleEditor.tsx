"use client";

import { useState } from "react";
import type { VideoSubtitle } from "@/types";
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
} from "lucide-react";

interface SubtitleEditorProps {
  subtitles: VideoSubtitle[];
  onChange: (subs: VideoSubtitle[]) => void;
}

// Convert seconds (e.g. 75.5) to MM:SS string
function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Simple SRT time format "00:01:25,500" -> seconds
function srtTimeToSeconds(srtTime: string): number {
  const match = srtTime.trim().match(/(\d+):(\d+):(\d+)[,\.](\d+)/);
  if (!match) return 0;
  const [, h, m, s, ms] = match;
  return (
    parseInt(h, 10) * 3600 +
    parseInt(m, 10) * 60 +
    parseInt(s, 10) +
    parseInt(ms.padEnd(3, "0").slice(0, 3), 10) / 1000
  );
}

export default function SubtitleEditor({ subtitles, onChange }: SubtitleEditorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

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

  // Import JSON or SRT
  const handleProcessImport = () => {
    setImportError("");
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError("Vui lòng dán nội dung JSON hoặc SRT.");
      return;
    }

    try {
      // 1. Try parsing JSON
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const validated: VideoSubtitle[] = parsed.map((item, idx) => ({
            startTime: Number(item.startTime) || 0,
            endTime: Number(item.endTime) || (Number(item.startTime) || 0) + 3,
            japanese: String(item.japanese || item.jp || item.text || ""),
            furigana: item.furigana ? String(item.furigana) : undefined,
            romaji: item.romaji ? String(item.romaji) : undefined,
            translation: item.translation ? String(item.translation) : item.vi ? String(item.vi) : "",
          }));

          onChange(validated);
          setShowImportModal(false);
          setImportText("");
          return;
        }
      }

      // 2. Try parsing SRT format
      // Format:
      // 1
      // 00:00:01,000 --> 00:00:04,000
      // こんにちは
      const srtBlocks = trimmed.split(/\n\s*\n/);
      const parsedSrt: VideoSubtitle[] = [];

      for (const block of srtBlocks) {
        const lines = block.trim().split("\n");
        if (lines.length >= 2) {
          // Find time line (contains "-->")
          const timeLineIndex = lines.findIndex((l) => l.includes("-->"));
          if (timeLineIndex !== -1) {
            const timeParts = lines[timeLineIndex].split("-->");
            const startTime = srtTimeToSeconds(timeParts[0]);
            const endTime = srtTimeToSeconds(timeParts[1]);
            const textLines = lines.slice(timeLineIndex + 1).map((l) => l.trim()).filter(Boolean);

            const japanese = textLines[0] || "";
            const translation = textLines[1] || "";

            parsedSrt.push({
              startTime,
              endTime,
              japanese,
              translation,
            });
          }
        }
      }

      if (parsedSrt.length > 0) {
        onChange(parsedSrt);
        setShowImportModal(false);
        setImportText("");
        return;
      }

      setImportError("Không thể nhận diện định dạng JSON hoặc SRT hợp lệ.");
    } catch (err: any) {
      setImportError(`Lỗi phân tích: ${err.message || "Định dạng không hợp lệ"}`);
    }
  };

  return (
    <div className="space-y-4">
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

        <div className="flex items-center gap-2">
          {/* Import JSON/SRT Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload size={13} className="text-emerald-400" />
            <span>Import JSON / SRT</span>
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
        </div>
      </div>

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
                      step="0.5"
                      min="0"
                      value={sub.startTime}
                      onChange={(e) =>
                        handleUpdateField(index, "startTime", parseFloat(e.target.value) || 0)
                      }
                      className="w-14 bg-transparent text-center font-mono font-bold text-indigo-300 focus:outline-hidden"
                      title="Thời gian bắt đầu (giây)"
                    />
                    <span className="text-slate-600">→</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={sub.endTime}
                      onChange={(e) =>
                        handleUpdateField(index, "endTime", parseFloat(e.target.value) || 0)
                      }
                      className="w-14 bg-transparent text-center font-mono font-bold text-indigo-300 focus:outline-hidden"
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
                <h3 className="text-base font-black text-white">Import Phụ Đề JSON hoặc SRT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Dán nội dung mảng JSON (các trường: <code>startTime</code>, <code>endTime</code>,{" "}
              <code>japanese</code>, <code>translation</code>) hoặc file <strong>SRT</strong> trích xuất từ YouTube/phần mềm dựng video:
            </p>

            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`[
  {
    "startTime": 0,
    "endTime": 4.5,
    "japanese": "初めまして、よろしくお願いします。",
    "translation": "Rất vui được gặp bạn, mong bạn giúp đỡ."
  }
]`}
              className="mt-3 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
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
