"use client";

import { useState } from "react";
import { ExternalLink, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { YouTubeIcon } from "@/components/common/YouTubeIcon";

interface YouTubePreviewProps {
  youtubeId: string;
  title?: string;
}

export default function YouTubePreview({ youtubeId, title }: YouTubePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!youtubeId || youtubeId.trim().length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 text-slate-500 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-900/50 flex items-center justify-center text-red-500 mb-3">
          <YouTubeIcon size={26} />
        </div>
        <p className="text-sm font-bold text-slate-300">Chưa có video YouTube</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Dán đường link YouTube bài giảng (hoặc ID 11 ký tự) vào ô bên dưới để tự động phân tích và xem trước.
        </p>
      </div>
    );
  }

  const cleanId = youtubeId.trim();
  const thumbnailUrl = `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`;
  const fallbackThumbnailUrl = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
      {/* Video Player / Thumbnail Preview */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0&modestbranding=1`}
            title={title || "YouTube video preview"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
            <img
              src={thumbnailUrl}
              onError={(e) => {
                // Fallback to HQ thumbnail if MaxRes isn't available
                (e.target as HTMLImageElement).src = fallbackThumbnailUrl;
              }}
              alt={title || "Video thumbnail"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-center justify-center">
              <button
                type="button"
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/40 group-hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Bấm để phát thử video"
              >
                <Play size={28} className="ml-1 fill-white" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
              <span className="font-bold drop-shadow-md truncate max-w-[70%]">
                {title || "Xem trước video bài giảng"}
              </span>
              <span className="bg-black/75 px-2 py-0.5 rounded text-[11px] font-mono">
                Click để phát
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Video Details & Meta */}
      <div className="p-4 flex items-center justify-between gap-3 text-xs bg-slate-900/95 border-t border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          {/^[a-zA-Z0-9_-]{11}$/.test(cleanId) ? (
            <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold shrink-0">
              <CheckCircle2 size={13} />
              <span>ID hợp lệ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-400 font-bold shrink-0">
              <AlertCircle size={13} />
              <span>ID không hợp lệ</span>
            </div>
          )}
          <span className="font-mono text-slate-300 text-[11px] truncate">
            {cleanId}
          </span>
        </div>

        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors shrink-0"
        >
          <span>Mở trên YouTube</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
