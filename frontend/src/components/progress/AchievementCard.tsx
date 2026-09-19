type Props = {
  icon: string;
  title: string;
};

export default function AchievementCard({
  icon,
  title,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>
    </div>
  );
}