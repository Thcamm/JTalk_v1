type Props = {
  title: string;
  image: string;
  duration: string;
  onClick?: () => void;
};

export default function LessonCard({
  title,
  image,
  duration,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="
        flex gap-4
        border rounded-2xl p-4
        hover:shadow-md
        cursor-pointer
      "
    >
      <img
        src={image}
        alt={title}
        className="
          w-40 h-24
          object-cover
          rounded-xl
        "
      />

      <div>
        <h3 className="font-semibold text-lg">
          {title}
        </h3>

        <p className="text-muted-foreground">
          {duration}
        </p>
      </div>
    </div>
  );
}