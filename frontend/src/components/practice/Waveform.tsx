interface WaveformProps {
  isRecording: boolean;
  waveformData?: number[];
  className?: string;
}

export const Waveform = ({
  isRecording,
  waveformData = new Array(28).fill(0.08),
  className = "",
}: WaveformProps) => {
  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-1.5 h-16 px-4 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 rounded-2xl overflow-hidden transition-colors ${className}`}
    >
      {waveformData.slice(0, 28).map((val, idx) => {
        // Calculate height scaled from 12% to 100%
        const normalizedHeight = isRecording
          ? Math.max(12, Math.min(100, Math.round(val * 100)))
          : 12;

        return (
          <div
            key={idx}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${
              isRecording
                ? "bg-gradient-to-t from-emerald-500 to-teal-400 shadow-xs shadow-emerald-200 dark:shadow-emerald-950/50"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
            style={{
              height: `${normalizedHeight}%`,
              transitionDelay: `${idx * 4}ms`,
            }}
          />
        );
      })}
    </div>
  );
};

export default Waveform;
