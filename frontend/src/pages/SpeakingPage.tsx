import SpeakingCard from "@/components/speaking/SpeakingCard";

const topics = [
  {
    id: 1,
    level: "N5",
    title: "新しいクラスでの自己紹介",
    description:
      "Practice introducing yourself in a new classroom.",
  },
  {
    id: 2,
    level: "N5",
    title: "毎日の生活について",
    description:
      "Talk about your daily life and habits.",
  },
  {
    id: 3,
    level: "N4",
    title: "病院で診察を受ける",
    description:
      "Describe symptoms and speak with a doctor.",
  },
  {
    id: 4,
    level: "N4",
    title: "カフェで飲み物を注文する",
    description:
      "Order drinks in a cafe naturally.",
  },
  {
    id: 5,
    level: "N3",
    title: "友達と旅行の計画",
    description:
      "Discuss travel plans with friends.",
  },
];

const SpeakingPage = () => {
  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Luyện nói tiếng Nhật
        </h1>

        <p className="text-muted-foreground mt-2">
          Chọn chủ đề và luyện hội thoại cùng AI
        </p>
      </div>

      {/* Filter */}

      <div className="flex gap-3 mb-8">
        {["Tất cả", "N5", "N4", "N3", "N2", "N1"].map(
          (level) => (
            <button
              key={level}
              className="
              px-5
              py-2
              rounded-full
              border
              hover:bg-primary
              hover:text-white
              transition
            "
            >
              {level}
            </button>
          )
        )}
      </div>

      {/* Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <SpeakingCard
            key={topic.id}
            {...topic}
          />
        ))}
      </div>
    </div>
  );
};

export default SpeakingPage;