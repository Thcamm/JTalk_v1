import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Mic,
  Zap,
  Search,
  CheckCircle2,
  Lock,
  Clock,
  History,
  Trophy,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { curriculumService } from "@/services/curriculum.service";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Lesson } from "@/types";

interface SpeakingScenario {
  id: string;
  title: string;
  japaneseTitle: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  isPremium: boolean;
  durationMinutes: number;
  reflexTurns: number;
  imageUrl: string;
  lessonId?: string;
}

const allScenarios: SpeakingScenario[] = [
  {
    id: "sc-1",
    title: "Tự giới thiệu trong lớp học mới",
    japaneseTitle: "新しいクラスでの自己紹介",
    description: "Luyện cách giới thiệu bản thân, sở thích và kết bạn tự nhiên với bạn cùng lớp.",
    level: "N5",
    isPremium: false,
    durationMinutes: 3,
    reflexTurns: 5,
    imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-2",
    title: "Cuộc sống và thói quen hàng ngày",
    japaneseTitle: "毎日の生活について",
    description: "Kể về các hoạt động thường nhật từ sáng đến tối, chia sẻ sở thích cá nhân.",
    level: "N5",
    isPremium: false,
    durationMinutes: 4,
    reflexTurns: 6,
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-3",
    title: "Khám bệnh tại phòng khám Nhật",
    japaneseTitle: "病院で診察を受ける",
    description: "Miêu tả triệu chứng mệt mỏi, đau đầu, sốt và lắng nghe dặn dò của bác sĩ.",
    level: "N4",
    isPremium: true,
    durationMinutes: 4,
    reflexTurns: 6,
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-4",
    title: "Gọi đồ uống tại quán Cafe",
    japaneseTitle: "カフェで飲み物を注文する",
    description: "Hỏi menu thức uống, chọn size ly đá/nóng, đặt bánh ngọt và thanh toán.",
    level: "N4",
    isPremium: false,
    durationMinutes: 3,
    reflexTurns: 5,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-5",
    title: "Hỏi đường và đi tàu điện Shinjuku",
    japaneseTitle: "駅で道を尋ねる・乗換案内",
    description: "Hỏi quầy vé, tìm line tàu Yamanote và hỏi cửa ra hướng Đông của ga.",
    level: "N5",
    isPremium: false,
    durationMinutes: 4,
    reflexTurns: 6,
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-6",
    title: "Phỏng vấn xin việc (Jikoshoukai)",
    japaneseTitle: "採用面接・志望動機",
    description: "Lễ nghi chào hỏi, giải thích lý do ứng tuyển và điểm mạnh của bản thân.",
    level: "N4",
    isPremium: true,
    durationMinutes: 6,
    reflexTurns: 8,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-7",
    title: "Báo cáo công việc HORENSO",
    japaneseTitle: "ビジネス会話・進捗報告",
    description: "Thực hành kính ngữ Sonkeigo/Kenjougo, báo cáo tiến độ dự án cho cấp trên.",
    level: "N3",
    isPremium: true,
    durationMinutes: 5,
    reflexTurns: 7,
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sc-8",
    title: "Rủ bạn đi ăn tại quán Izakaya",
    japaneseTitle: "居酒屋で乾杯・食事の誘い",
    description: "Rủ đồng nghiệp đi ăn sau giờ làm, gọi món nhắm và văn hóa nâng ly Kanpai.",
    level: "N3",
    isPremium: true,
    durationMinutes: 4,
    reflexTurns: 6,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
  },
];

export const SpeakingPage = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scenarios" | "learning" | "history" | "leaderboard">("scenarios");
  const [selectedLevel, setSelectedLevel] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLessons = async () => {
      try {
        setLoading(true);
        const data = await curriculumService.getLessons();
        if (isMounted && data) {
          setLessons(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải bài học:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScenarioClick = (scenario: SpeakingScenario) => {
    if (scenario.isPremium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }

    // Match specifically with the real lesson in DB by japaneseTitle, title, or topic
    const matchedLesson = lessons.find((l) => {
      const dbTitle = l.title || "";
      const topicName = typeof l.topicId === "object" ? l.topicId?.name || "" : "";
      return (
        dbTitle.includes(scenario.japaneseTitle) ||
        topicName.includes(scenario.japaneseTitle) ||
        (scenario.title && dbTitle.includes(scenario.title))
      );
    });

    const targetId = matchedLesson?._id || scenario.lessonId || scenario.id;
    navigate(`/practice/${targetId}`);
  };

  const handleRandomQuickPractice = () => {
    if (lessons.length > 0) {
      const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
      navigate(`/practice/${randomLesson._id}`);
    } else {
      navigate("/practice/quick-drill");
    }
  };

  const filteredScenarios = allScenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.japaneseTitle.includes(searchQuery) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      selectedLevel === "Tất cả" || sc.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Header (Title, Subtitle & Action button like Image 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Luyện nói
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Luyện nói trong các tình huống thực tế với JTalk AI
            </p>
          </div>

          <button
            onClick={handleRandomQuickPractice}
            type="button"
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Zap size={15} className="fill-amber-300 text-amber-300" />
            <span>Thử thách ngẫu nhiên</span>
          </button>
        </div>

        {/* 2. Secondary Navigation Tabs & Level Filter (Identical to Image 3) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          {/* Left Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab("scenarios")}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === "scenarios"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
              }`}
            >
              <Mic size={14} />
              <span>Kịch bản</span>
            </button>

            <button
              onClick={() => setActiveTab("learning")}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "learning"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
              }`}
            >
              <Clock size={14} />
              <span>Đang học</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "history"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
              }`}
            >
              <History size={14} />
              <span>Lịch sử</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "leaderboard"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
              }`}
            >
              <Trophy size={14} />
              <span>Bảng xếp hạng</span>
            </button>
          </div>

          {/* Right Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["Tất cả", "N5", "N4", "N3", "N2", "N1"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer shrink-0 ${
                  selectedLevel === lvl
                    ? "bg-emerald-600 text-white font-bold shadow-2xs"
                    : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Section Title with Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-slate-900">Tất cả kịch bản</h2>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-2xs font-bold">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>JTalk biên soạn</span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kịch bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* 4. 4-Column Cards Grid (Identical to Image 3) */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" label="Đang tải kịch bản..." />
          </div>
        ) : filteredScenarios.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-2">
            <p className="text-sm font-bold text-slate-700">Không tìm thấy kịch bản phù hợp</p>
            <p className="text-xs text-slate-400">Vui lòng chọn trình độ khác hoặc xóa từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredScenarios.map((scenario) => {
              const isLocked = scenario.isPremium && !isPremium;

              return (
                <div
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className="group bg-white border border-slate-200/90 hover:border-emerald-400 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  {/* Thumbnail Image with Level badge */}
                  <div>
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                      <img
                        src={scenario.imageUrl}
                        alt={scenario.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Level badge at top left (green like Image 3) */}
                      <div className="absolute left-3 top-3 px-2 py-0.5 bg-emerald-100/90 text-emerald-800 backdrop-blur-2xs rounded-md text-2xs font-extrabold uppercase shadow-xs">
                        {scenario.level}
                      </div>

                      {/* Premium badge / Lock */}
                      {scenario.isPremium && (
                        <div className="absolute right-3 top-3">
                          {isLocked ? (
                            <span className="w-7 h-7 rounded-full bg-slate-900/60 backdrop-blur-xs text-amber-300 flex items-center justify-center">
                              <Lock size={13} />
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-400/90 text-amber-950 font-bold text-3xs rounded-md">
                              PRO
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 font-sans">
                        {scenario.japaneseTitle}
                      </h3>

                      <p className="text-xs text-slate-600 font-medium line-clamp-1">
                        {scenario.title}
                      </p>

                      <p className="text-2xs text-slate-400 line-clamp-2 leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 pb-4 pt-1 flex items-center justify-between text-3xs text-slate-400 font-semibold border-t border-slate-100/80">
                    <span>{scenario.durationMinutes} phút • {scenario.reflexTurns} câu</span>
                    <span className="text-emerald-600 font-bold group-hover:underline">
                      Vào luyện ›
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="premium_lesson"
      />
    </div>
  );
};

export default SpeakingPage;
