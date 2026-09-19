type Props = {
  questions: number;
  passScore: number;
};

export default function QuizCard({
  questions,
  passScore,
}: Props) {
  return (
    <div className="border rounded-2xl p-5 bg-muted/30">
      <h3 className="font-bold mb-2">
        Quiz
      </h3>

      <p>{questions} câu hỏi</p>

      <p>Điểm đạt: {passScore}%</p>
    </div>
  );
}