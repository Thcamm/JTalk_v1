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
        border border-slate-200 dark:border-slate-800
        p-5
        cursor-pointer
        hover:border-rose-400 dark:hover:border-rose-500
        hover:bg-rose-50 dark:hover:bg-rose-950/40
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