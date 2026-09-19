type Topic = {
  id: number;
  title: string;
};

type Props = {
  topics: Topic[];
  selectedTopic: number;
  onSelect: (id: number) => void;
};

export default function TopicSideBar({
  topics,
  selectedTopic,
  onSelect,
}: Props) {
  return (
    <div className="w-72 border-r pr-4">
      <h2 className="font-bold text-lg mb-4">
        Chủ đề
      </h2>

      <div className="space-y-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.id)}
            className={`
              w-full
              text-left
              p-3
              rounded-xl
              transition
              ${
                selectedTopic === topic.id
                  ? "bg-primary text-white"
                  : "hover:bg-muted"
              }
            `}
          >
            {topic.title}
          </button>
        ))}
      </div>
    </div>
  );
}