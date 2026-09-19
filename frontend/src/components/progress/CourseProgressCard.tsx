type Props = {
  title: string;
  lessons: number;
  completed: number;
  progress: number;
};

export default function CourseProgressCard({
  title,
  lessons,
  completed,
  progress,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {title}
        </h3>

        <span className="text-primary font-semibold">
          {progress}%
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {completed}/{lessons} bài học
      </p>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}