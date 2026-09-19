type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PremiumModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0
        bg-black/60
        flex items-center justify-center
        z-50
      "
    >
      <div
        className="
          w-[500px]
          bg-white
          rounded-3xl
          p-8
          text-center
        "
      >
        <div className="text-6xl mb-4">
          👑
        </div>

        <h2 className="text-2xl font-bold mb-3">
          Tính năng Premium
        </h2>

        <p className="text-gray-500 mb-6">
          Chấm điểm phát âm bằng AI chỉ dành
          cho thành viên Premium.
        </p>

        <div className="space-y-3">
          <button
            className="
              w-full
              h-12
              rounded-xl
              bg-green-500
              text-white
              font-semibold
            "
          >
            Nâng cấp Premium
          </button>

          <button
            onClick={onClose}
            className="
              w-full
              h-12
              rounded-xl
              border
            "
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}