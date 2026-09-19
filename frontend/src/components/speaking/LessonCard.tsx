interface LessonCardProps {
  title: string;
  japanese: string;
  onClick: () => void;
}

export default function LessonCard({
  title,
  japanese,
  onClick,
}: LessonCardProps) {
  return (
    <div
      onClick={onClick}
      className="
        rounded-2xl
        border
        p-5
        cursor-pointer
        hover:border-emerald-400
        hover:bg-emerald-50
        transition-all
      "
    >
      <h3 className="font-semibold text-lg">
        {title}
      </h3>

      <p className="text-muted-foreground">
        {japanese}
      </p>
    </div>
  );
}