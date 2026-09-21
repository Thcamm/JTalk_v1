import { useState, useRef, useEffect } from "react";
import { Volume2, Play, Pause, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  textToSpeak?: string;
  onNativeTts?: (text?: string) => void;
  label?: string;
  className?: string;
}

export const AudioPlayer = ({
  audioUrl,
  textToSpeak,
  onNativeTts,
  label = "Nghe giọng mẫu",
  className = "",
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
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
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
      return;
    }

    // Otherwise use TTS handler (Native SpeechSynthesis / Google TTS)
    if (onNativeTts && textToSpeak) {
      setIsPlaying(true);
      onNativeTts(textToSpeak);
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    } else if (onNativeTts && textToSpeak) {
      onNativeTts(textToSpeak);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all ${className}`}
    >
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <button
        onClick={handlePlayToggle}
        type="button"
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
          isPlaying
            ? "bg-emerald-600 text-white shadow-xs"
            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        }`}
        title={isPlaying ? "Dừng" : "Phát âm thanh"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {audioUrl && (
          <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleReplay}
        type="button"
        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        title="Phát lại từ đầu"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  );
};

export default AudioPlayer;
