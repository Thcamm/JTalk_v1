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
        mt-3
        sm:mt-6
        pt-3
        sm:pt-6
        text-center
      "
    >
      {step === "user" && (
        <>
          <p className="mb-3 sm:mb-4 text-xs sm:text-base font-bold flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 animate-pulse" />
            <span>Đến lượt bạn</span>
          </p>

          <button
            onClick={onRecord}
            className="
              size-16
              sm:size-24
              rounded-full
              bg-gradient-to-tr
              from-rose-600
              via-rose-500
              to-amber-500
              text-white
              shadow-lg
              hover:scale-105
              active:scale-95
              transition
              cursor-pointer
              inline-flex
              items-center
              justify-center
            "
          >
            <Mic
              className="size-7 sm:size-9"
            />
          </button>
        </>
      )}

      {step === "recording" && (
        <>
          <div
            className="
              size-16
              sm:size-24
              rounded-full
              bg-red-500
              animate-pulse
              mx-auto
            "
          />

          <p className="mt-3 sm:mt-4 text-xs sm:text-base font-semibold text-red-600 dark:text-red-400">
            Đang ghi âm...
          </p>
        </>
      )}

      {step === "processing" && (
        <>
          <Loader2
            className="
              size-8
              sm:size-10
              animate-spin
              mx-auto
              text-rose-500
            "
          />

          <p className="mt-3 sm:mt-4 text-xs sm:text-base font-semibold text-slate-600 dark:text-slate-400">
            Aki đang chấm điểm...
          </p>
        </>
      )}
    </div>
  );
}