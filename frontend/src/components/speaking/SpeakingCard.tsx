import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useNavigate } from "react-router";

interface SpeakingCardProps {
  id: string | number;
  title: string;
  description: string;
  image?: string;
  level: string;
}

export default function SpeakingCard({
  id,
  title,
  description,
  image,
  level,
}: SpeakingCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/speaking/topic/${id}`)}
      className="
        group
        overflow-hidden
        cursor-pointer
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      {/* Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={image || "https://picsum.photos/600/400"}
          alt={title}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-300
            group-hover:scale-110
          "
        />
      </div>

      <CardContent className="p-5">
        <div className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-600">
          {level}
        </div>

        <h3 className="mt-3 text-lg font-bold">
          {title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}