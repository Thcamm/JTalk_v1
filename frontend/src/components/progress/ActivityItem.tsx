type Props = {
  title: string;
  time: string;
};

export default function ActivityItem({
  title,
  time,
}: Props) {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4">
      <div className="mt-1 h-3 w-3 rounded-full bg-primary" />

      <div className="flex-1">
        <h4 className="font-medium">
          {title}
        </h4>

        <p className="mt-1 text-sm text-muted-foreground">
          {time}
        </p>
      </div>
    </div>
  );
}