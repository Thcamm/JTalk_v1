import { useState, useRef, useEffect } from "react";
import { Volume2, Play, Pause, RotateCcw, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  textToSpeak?: string;
  onNativeTts?: (text?: string) => void;
  isPlaying?: boolean;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

export const AudioPlayer = ({
  audioUrl,
  textToSpeak,
  onNativeTts,
  isPlaying: propIsPlaying,
  isLoading = false,
  label = "Nghe giọng mẫu",
  className = "",
}: AudioPlayerProps) => {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePlaying = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setInternalIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      try {
        audio.pause();
      } catch (_) {}
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    };
  }, [textToSpeak]);

  const handlePlayToggle = () => {
    // If audioUrl is provided, play audio element
    if (audioUrl) {
      if (!audioRef.current) return;
      if (activePlaying) {
        audioRef.current.pause();
        setInternalIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setInternalIsPlaying(true))
          .catch(console.error);
      }
      return;
    }

    // Otherwise use TTS handler (Native SpeechSynthesis / Google TTS)
    if (onNativeTts && textToSpeak) {
      if (propIsPlaying === undefined) {
        setInternalIsPlaying(true);
        setTimeout(() => setInternalIsPlaying(false), 2500);
      }
      onNativeTts(textToSpeak);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setInternalIsPlaying(true))
        .catch(console.error);
    } else if (onNativeTts && textToSpeak) {
      onNativeTts(textToSpeak);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all ${className}`}
    >
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <button
        onClick={handlePlayToggle}
        type="button"
        disabled={isLoading}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
          activePlaying
            ? "bg-rose-600 text-white shadow-xs animate-pulse"
            : isLoading
            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
            : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/80"
        }`}
        title={isLoading ? "Đang chuẩn bị âm thanh..." : activePlaying ? "Dừng" : "Phát âm thanh"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
        ) : activePlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5 fill-current" />
        )}
      </button>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isLoading ? "Đang phát âm thanh..." : label}
        </span>
        {audioUrl && (
          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleReplay}
        type="button"
        disabled={isLoading}
        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Phát lại từ đầu"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <Volume2
        className={`w-4 h-4 shrink-0 transition-colors ${
          activePlaying
            ? "text-rose-500 animate-pulse"
            : isLoading
            ? "text-amber-500 animate-pulse"
            : "text-slate-400 dark:text-slate-500"
        }`}
      />
    </div>
  );
};

export default AudioPlayer;
