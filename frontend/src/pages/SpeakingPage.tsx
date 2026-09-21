import { useEffect, useState } from "react";
import SpeakingCard from "@/components/speaking/SpeakingCard";
import { topicService } from "@/services/topic.service";
import type { Topic } from "@/types";

const fallbackTopics = [
  {
    id: "1",
    level: "N5",
    title: "新しいクラスでの自己紹介",
    description: "Practice introducing yourself in a new classroom.",
  },
  {
    id: "2",
    level: "N5",
    title: "毎日の生活について",
    description: "Talk about your daily life and habits.",
  },
  {
    id: "3",
    level: "N4",
    title: "病院で診察を受ける",
    description: "Describe symptoms and speak with a doctor.",
  },
  {
    id: "4",
    level: "N4",
    title: "カフェで飲み物を注文する",
    description: "Order drinks in a cafe naturally.",
  },
];

const SpeakingPage = () => {
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [topics, setTopics] = useState<Array<{ id: string | number; title: string; description: string; level: string; image?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const data: Topic[] = await topicService.getTopics(selectedLevel);

        if (data && data.length > 0) {
          setTopics(
            data.map((t) => ({
              id: t._id,
              title: t.name,
              description: t.description || "",
              level: t.level,
              image: t.image,
            }))
          );
        } else {
          // Fallback if no backend topics exist yet
          const filtered =
            selectedLevel === "Tất cả"
              ? fallbackTopics
              : fallbackTopics.filter((t) => t.level === selectedLevel);
          setTopics(filtered);
        }
      } catch (err) {
        console.error("Lỗi khi tải topics:", err);
        const filtered =
          selectedLevel === "Tất cả"
            ? fallbackTopics
            : fallbackTopics.filter((t) => t.level === selectedLevel);
        setTopics(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [selectedLevel]);

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Luyện nói tiếng Nhật</h1>
        <p className="text-muted-foreground mt-2">
          Chọn chủ đề và luyện hội thoại cùng AI
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-8">
        {["Tất cả", "N5", "N4", "N3", "N2", "N1"].map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-5 py-2 rounded-full border transition ${
              selectedLevel === level
                ? "bg-primary text-white border-primary"
                : "hover:bg-primary/10"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải danh sách chủ đề...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <SpeakingCard key={topic.id} {...topic} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeakingPage;