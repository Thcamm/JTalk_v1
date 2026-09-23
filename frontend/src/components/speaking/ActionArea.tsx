import {
  Loader2,
  Mic,
} from "lucide-react";

type Props = {
  step: string;
  onRecord: () => void;
};

export default function ActionArea({
  step,
  onRecord,
}: Props) {
  return (
    <div
      className="
        border-t
        mt-6
        pt-6
        text-center
      "
    >
      {step === "user" && (
        <>
          <p className="mb-4 font-bold flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Đến lượt bạn</span>
          </p>

          <button
            onClick={onRecord}
            className="
              size-24
              rounded-full
              bg-gradient-to-tr
              from-rose-600
              via-rose-500
              to-amber-500
              text-white
              shadow-lg
              hover:scale-105
              transition
              cursor-pointer
            "
          >
            <Mic
              size={36}
              className="mx-auto"
            />
          </button>
        </>
      )}

      {step === "recording" && (
        <>
          <div
            className="
              size-24
              rounded-full
              bg-red-500
              animate-pulse
              mx-auto
            "
          />

          <p className="mt-4">
            Đang ghi âm...
          </p>
        </>
      )}

      {step === "processing" && (
        <>
          <Loader2
            size={40}
            className="
              animate-spin
              mx-auto
            "
          />

          <p className="mt-4">
            Aki đang chấm điểm...
          </p>
        </>
      )}
    </div>
  );
}