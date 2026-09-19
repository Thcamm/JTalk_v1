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
          <p className="mb-4 font-medium">
            🎤 Đến lượt bạn
          </p>

          <button
            onClick={onRecord}
            className="
              size-24
              rounded-full
              bg-emerald-500
              text-white
              shadow-lg
              hover:scale-105
              transition
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