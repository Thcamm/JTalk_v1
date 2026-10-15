"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen,
  Layers,
  Search,
  Plus,
  Volume2,
  CheckCircle2,
  Circle,
  Trash2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  Filter,
  Check,
  X,
  Eye,
  EyeOff,
  Flame,
  BrainCircuit,
  Clock,
  Zap,
  Bookmark,
  BookmarkCheck,
  Globe2,
  BookMarked,
  LayoutGrid,
  List,
  ArrowRight,
  Star,
  GraduationCap,
  VolumeX,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import {
  vocabularyService,
  DEFAULT_STARTER_VOCABULARY,
  type SystemVocabLearnerItem,
} from "@/services/vocabulary.service";
import { userService } from "@/services/user.service";
import { soundEffects } from "@/utils/soundEffects";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import type { VocabularyItem, CreateVocabularyPayload } from "@/types";
import VocabularyQuizModal from "@/components/vocabulary/VocabularyQuizModal";
import {
  translateToVietnamese,
  sanitizeExampleTranslation,
} from "@/utils/japaneseMeaningTranslator";

// =========================================================================
// HELPER: FURIGANA / RUBY PHONETIC ALIGNMENT
// =========================================================================
interface RubyWord {
  kanji: string;
  furigana: string;
}

const KANJI_REGEX = /[一-龯㐀-䶿]/;

function kataToHira(str?: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export function buildFuriganaWords(
  japanese?: string,
  furigana?: string
): Array<RubyWord> {
  if (!japanese || typeof japanese !== "string") return [];
  if (
    !furigana ||
    typeof furigana !== "string" ||
    !furigana.trim() ||
    !KANJI_REGEX.test(japanese)
  ) {
    return [{ kanji: japanese || "", furigana: "" }];
  }

  const cleanJp = japanese.trim();
  const cleanFuri = furigana.trim();

  if (!cleanJp) return [];

  if (cleanJp === cleanFuri || kataToHira(cleanJp) === kataToHira(cleanFuri)) {
    return [{ kanji: cleanJp, furigana: "" }];
  }

  const tokens: Array<{ text: string; isKanji: boolean }> = [];
  let currText = "";
  let currIsKanji = KANJI_REGEX.test(cleanJp[0]);

  for (let i = 0; i < cleanJp.length; i++) {
    const isK = KANJI_REGEX.test(cleanJp[i]);
    if (isK === currIsKanji) {
      currText += cleanJp[i];
    } else {
      tokens.push({ text: currText, isKanji: currIsKanji });
      currText = cleanJp[i];
      currIsKanji = isK;
    }
  }
  if (currText) {
    tokens.push({ text: currText, isKanji: currIsKanji });
  }

  const result: Array<RubyWord> = [];
  let furiIdx = 0;
  const hiraFuri = kataToHira(cleanFuri);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (!token.isKanji) {
      const hiraToken = kataToHira(token.text).replace(/\s+/g, "");

      while (furiIdx < cleanFuri.length && /\s/.test(cleanFuri[furiIdx])) {
        furiIdx++;
      }

      if (hiraFuri.startsWith(hiraToken, furiIdx)) {
        result.push({ kanji: token.text, furigana: "" });
        furiIdx += hiraToken.length;
      } else {
        const found = hiraFuri.indexOf(hiraToken, furiIdx);
        if (found !== -1 && found - furiIdx < 20) {
          furiIdx = found + hiraToken.length;
          result.push({ kanji: token.text, furigana: "" });
        } else {
          result.push({ kanji: token.text, furigana: "" });
        }
      }
    } else {
      while (furiIdx < cleanFuri.length && /\s/.test(cleanFuri[furiIdx])) {
        furiIdx++;
      }

      const nextNonKanji = tokens[i + 1];
      if (nextNonKanji) {
        const nextHira = kataToHira(nextNonKanji.text).replace(/\s+/g, "");
        const matchIdx = hiraFuri.indexOf(nextHira, furiIdx);
        if (matchIdx !== -1 && matchIdx >= furiIdx) {
          const matchedReading = cleanFuri.slice(furiIdx, matchIdx).trim();
          result.push({ kanji: token.text, furigana: matchedReading });
          furiIdx = matchIdx;
        } else {
          result.push({ kanji: token.text, furigana: "" });
        }
      } else {
        const remainingReading = cleanFuri.slice(furiIdx).trim();
        result.push({ kanji: token.text, furigana: remainingReading });
        furiIdx = cleanFuri.length;
      }
    }
  }

  return result.length > 0 ? result : [{ kanji: cleanJp, furigana: "" }];
}

// Bảng tra ví dụ phong phú cho từ vựng phổ biến
const SAMPLE_EXAMPLES_MAP: Record<
  string,
  { sentence: string; furigana: string; translation: string }
> = {
  こんにちは: {
    sentence: "先生、こんにちは！",
    furigana: "せんせい、こんにちは！",
    translation: "Em chào thầy/cô ạ!",
  },
  ありがとう: {
    sentence: "手伝ってくれて、本当にありがとう。",
    furigana: "てつだってくれて、ほんとうにありがとう。",
    translation: "Cảm ơn bạn rất nhiều vì đã giúp đỡ tôi.",
  },
  食べる: {
    sentence: "毎朝、パンを食べます。",
    furigana: "まいあさ、パンをたべます。",
    translation: "Mỗi sáng tôi đều ăn bánh mì.",
  },
  飲む: {
    sentence: "喫茶店でコーヒーを飲みます。",
    furigana: "きっさてんでコーヒーをのみます。",
    translation: "Tôi uống cà phê ở quán giải khát.",
  },
  行く: {
    sentence: "明日、学校へ行きます。",
    furigana: "あした、がっこうへいきます。",
    translation: "Ngày mai tôi sẽ đến trường.",
  },
  来る: {
    sentence: "友達が家へ遊びに来ました。",
    furigana: "ともだちがいえへあそびにきました。",
    translation: "Bạn tôi đã đến nhà chơi.",
  },
  見る: {
    sentence: "週末に映画を見ます。",
    furigana: "しゅうまつにえいがをみます。",
    translation: "Cuối tuần tôi xem phim.",
  },
  聞く: {
    sentence: "毎晩、日本の音楽を聞きます。",
    furigana: "まいばん、にほんのおんがくをききます。",
    translation: "Mỗi tối tôi đều nghe nhạc Nhật.",
  },
  話す: {
    sentence: "日本語で先生と話します。",
    furigana: "にほんごでせんせいとはなします。",
    translation: "Tôi nói chuyện với giáo viên bằng tiếng Nhật.",
  },
  勉強: {
    sentence: "毎日、日本語を一生懸命勉強しています。",
    furigana: "まいにち、にほんごをいっしょうけんめいべんきょうしています。",
    translation: "Mỗi ngày tôi đều chăm chỉ học tiếng Nhật.",
  },
  仕事: {
    sentence: "父は毎日朝から晩まで仕事をします。",
    furigana: "ちはまいにちあさからばんまでしごとをします。",
    translation: "Bố tôi làm việc từ sáng đến tối mỗi ngày.",
  },
  本: {
    sentence: "図書館で面白い本を借りました。",
    furigana: "としょかんでおもしろいほんをかりました。",
    translation: "Tôi đã mượn một cuốn sách thú vị ở thư viện.",
  },
  学校: {
    sentence: "バスで学校へ通っています。",
    furigana: "バスでがっこうへかよっています。",
    translation: "Tôi đi học bằng xe buýt.",
  },
  先生: {
    sentence: "田中先生はとても親切です。",
    furigana: "たなかせんせいはとてもしんせつです。",
    translation: "Thầy Tanaka rất thân thiện và nhiệt tình.",
  },
  学生: {
    sentence: "私は大学で日本語を勉強する学生です。",
    furigana: "わたしはだいがくでにほんごをべんきょうするがくせいです。",
    translation: "Tôi là sinh viên học tiếng Nhật tại trường đại học.",
  },
  友達: {
    sentence: "休日に友達と一緒に買い物をします。",
    furigana: "きゅうじつにともだちといっしょにかいものをします。",
    translation: "Vào ngày nghỉ tôi đi mua sắm cùng bạn bè.",
  },
  家族: {
    sentence: "私の家族は４人家族です。",
    furigana: "わたしのかぞくはよにんかぞくです。",
    translation: "Gia đình tôi gồm có 4 người.",
  },
  時間: {
    sentence: "今は勉強する時間です。",
    furigana: "いまはべんきょうするじかんです。",
    translation: "Bây giờ là thời gian học tập.",
  },
  今日: {
    sentence: "今日の天気はとてもいいですね。",
    furigana: "きょうのてんきはとてもいいですね。",
    translation: "Thời tiết hôm nay thật đẹp nhỉ.",
  },
  明日: {
    sentence: "明日は日本語のテストがあります。",
    furigana: "あしたはにほんごのテストがあります。",
    translation: "Ngày mai có bài kiểm tra tiếng Nhật.",
  },
  昨日: {
    sentence: "昨日は友達と公園を散歩しました。",
    furigana: "きのうはともだちとこうえんをさんぽしました。",
    translation: "Hôm qua tôi đã đi dạo trong công viên cùng bạn.",
  },
  寝る: {
    sentence: "毎晩11時に寝ます。",
    furigana: "まいばん11じにねます。",
    translation: "Mỗi tối tôi đi ngủ lúc 11 giờ.",
  },
  ねる: {
    sentence: "毎晩11時に寝ます。",
    furigana: "まいばん11じにねます。",
    translation: "Mỗi tối tôi đi ngủ lúc 11 giờ.",
  },
  起きる: {
    sentence: "毎朝6時に起きます。",
    furigana: "まいあさ6じにおきます。",
    translation: "Mỗi sáng tôi thức dậy lúc 6 giờ.",
  },
  おきる: {
    sentence: "毎朝6時に起きます。",
    furigana: "まいあさ6じにおきます。",
    translation: "Mỗi sáng tôi thức dậy lúc 6 giờ.",
  },
  買う: {
    sentence: "スーパーで新鮮な果物を買いました。",
    furigana: "スーパーでしんせんなくだものをかいました。",
    translation: "Tôi đã mua hoa quả tươi ở siêu thị.",
  },
  待つ: {
    sentence: "駅の前で友達を待ちます。",
    furigana: "えきのまえでともだちをまちます。",
    translation: "Tôi đứng đợi bạn ở trước nhà ga.",
  },
  会う: {
    sentence: "明日、渋谷で友達に会います。",
    furigana: "あした、しぶやでともだちにあいます。",
    translation: "Ngày mai tôi sẽ gặp bạn ở Shibuya.",
  },
  教える: {
    sentence: "先生、日本語を教えてください。",
    furigana: "せんせい、にほんごをおしえてください。",
    translation: "Thưa thầy, xin hãy dạy tiếng Nhật cho em.",
  },
  朝: {
    sentence: "毎朝、公園をジョギングします。",
    furigana: "まいあさ、こうえんをジョギングします。",
    translation: "Mỗi buổi sáng tôi đều chạy bộ trong công viên.",
  },
  夜: {
    sentence: "夜は静かに本を読みます。",
    furigana: "よるはしずかにほんをよみます。",
    translation: "Buổi đêm tôi yên tĩnh đọc sách.",
  },
};

// Hàm lấy hoặc sinh câu ví dụ kèm Furigana
function getOrGenerateExample(item?: {
  kanji?: string;
  furigana?: string;
  meaning?: string;
  wordType?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}): { sentence: string; furigana: string; translation: string } {
  if (!item || !item.kanji) {
    return { sentence: "", furigana: "", translation: "" };
  }

  const cleanKanji = item.kanji.trim();
  const vMeaning = translateToVietnamese(cleanKanji, item.meaning);

  // 1. Tra cứu từ điển mẫu thông dụng có chất lượng cao nhất
  if (SAMPLE_EXAMPLES_MAP[cleanKanji]) {
    return SAMPLE_EXAMPLES_MAP[cleanKanji];
  }
  if (item.furigana && SAMPLE_EXAMPLES_MAP[item.furigana.trim()]) {
    return SAMPLE_EXAMPLES_MAP[item.furigana.trim()];
  }

  // 2. Nếu từ đã có sẵn câu ví dụ trong DB, làm sạch nghĩa dịch tiếng Việt
  if (item.exampleSentence && item.exampleSentence.trim().length > 0) {
    return {
      sentence: item.exampleSentence.trim(),
      furigana: item.furigana?.trim() || "",
      translation: sanitizeExampleTranslation(
        cleanKanji,
        vMeaning,
        item.exampleTranslation?.trim()
      ),
    };
  }

  // 3. Tự động sinh câu ví dụ tự nhiên theo loại từ bằng tiếng Việt chuẩn
  const type = item.wordType || "noun";
  const furi = item.furigana?.trim() || cleanKanji;
  const meaning = vMeaning || "từ này";

  if (type === "verb") {
    return {
      sentence: `日本語で${cleanKanji}練習をします。`,
      furigana: `にほんごで${furi}れんしゅうをします。`,
      translation: `Thực hành ${meaning} bằng tiếng Nhật.`,
    };
  } else if (type === "adjective") {
    return {
      sentence: `この町はとても${cleanKanji}ですね。`,
      furigana: `このまちはとても${furi}ですね。`,
      translation: `Thành phố này thực sự rất ${meaning} nhỉ.`,
    };
  } else if (type === "adverb") {
    return {
      sentence: `どうぞ${cleanKanji}話してください。`,
      furigana: `どうぞ${furi}はなしてください。`,
      translation: `Xin hãy cứ ${meaning} nói nhé.`,
    };
  } else if (type === "phrase") {
    return {
      sentence: `「${cleanKanji}」と挨拶をしました。`,
      furigana: `「${furi}」とあいさつをしました。`,
      translation: `Đã chào: "${meaning}".`,
    };
  }

  // Mặc định là danh từ (noun)
  return {
    sentence: `これは${cleanKanji}です。毎日使います。`,
    furigana: `これは${furi}です。まいにちつかいます。`,
    translation: `Đây là ${meaning}. Mỗi ngày tôi đều sử dụng.`,
  };
}

// Component hiển thị chữ Nhật có Furigana Ruby
const JapaneseRubyText = ({
  sentence,
  furigana,
  className = "",
}: {
  sentence: string;
  furigana?: string;
  className?: string;
}) => {
  const words = useMemo(() => {
    return buildFuriganaWords(sentence, furigana);
  }, [sentence, furigana]);

  return (
    <span className={`inline-flex flex-wrap items-end gap-x-0.5 leading-relaxed ${className}`}>
      {words.map((w, idx) => {
        if (!w.kanji) return null;
        if (w.furigana) {
          return (
            <ruby key={idx} className="font-bold">
              {w.kanji}
              <rt className="text-rose-500 dark:text-rose-400 font-bold select-none text-[0.62em]">
                {w.furigana}
              </rt>
            </ruby>
          );
        }
        return <span key={idx}>{w.kanji}</span>;
      })}
    </span>
  );
};

// =========================================================================
// CẤU HÌNH NHÃN LOẠI TỪ & CẤP ĐỘ JLPT
// =========================================================================
const WORD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  verb: { label: "Động từ", color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60" },
  noun: { label: "Danh từ", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60" },
  adjective: { label: "Tính từ", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
  adverb: { label: "Phó từ", color: "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60" },
  phrase: { label: "Cụm từ", color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" },
  other: { label: "Khác", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  N5: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/60" },
  N4: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-600 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800/60" },
  N3: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800/60" },
  N2: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800/60" },
  N1: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800/60" },
};

/**
 * Chuẩn hóa chuỗi tiếng Việt loại bỏ toàn bộ dấu thanh/dấu mũ và chữ đ
 * Cho phép tìm kiếm không dấu ("com" khớp "cơm", "tot" khớp "tốt", "an" khớp "ăn")
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra xem một từ vựng có khớp với từ khóa tìm kiếm hay không
 * Hỗ trợ Kanji, Furigana, Romaji, nghĩa tiếng Anh và nghĩa tiếng Việt (có dấu hoặc không dấu)
 */
function matchesSearch(
  item: {
    kanji: string;
    furigana?: string;
    romaji?: string;
    meaning: string;
  },
  searchTerm: string
): boolean {
  if (!searchTerm || !searchTerm.trim()) return true;
  const qRaw = searchTerm.trim().toLowerCase();
  const qNorm = removeVietnameseTones(qRaw);

  // 1. Khớp Kanji
  if (item.kanji && item.kanji.toLowerCase().includes(qRaw)) return true;

  // 2. Khớp Furigana / Hiragana
  if (item.furigana && item.furigana.toLowerCase().includes(qRaw)) return true;

  // 3. Khớp Romaji
  if (item.romaji && item.romaji.toLowerCase().includes(qRaw)) return true;

  // 4. Khớp Nghĩa tiếng Anh / gốc trong database
  if (item.meaning && item.meaning.toLowerCase().includes(qRaw)) return true;
  if (item.meaning && removeVietnameseTones(item.meaning).includes(qNorm)) return true;

  // 5. Khớp Nghĩa tiếng Việt đã dịch (có dấu)
  const viMeaning = translateToVietnamese(item.kanji, item.meaning).toLowerCase();
  if (viMeaning.includes(qRaw)) return true;

  // 6. Khớp Nghĩa tiếng Việt không dấu (vd: "com" -> "cơm trưa")
  const viNorm = removeVietnameseTones(viMeaning);
  if (viNorm.includes(qNorm)) return true;

  return false;
}

export default function VocabularyNotebookPage() {
  const { user, isPremium, bonusPractices, canEarnBonus, fetchMe } = useAuth();

  // 2 Tab chính: "system" (Kho chung) và "notebook" (Sổ tay cá nhân)
  const [mainTab, setMainTab] = useState<"system" | "notebook">("system");

  // Chế độ xem: "flashcard" (Mặc định học Flashcard) hoặc "list" (Danh sách bảng)
  const [viewMode, setViewMode] = useState<"flashcard" | "list">("flashcard");

  // -------------------------------------------------------------
  // DỮ LIỆU KHO CHUNG (SYSTEM VOCABULARY)
  // -------------------------------------------------------------
  const [systemVocabs, setSystemVocabs] = useState<SystemVocabLearnerItem[]>([]);
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
  const [systemLevel, setSystemLevel] = useState<string>("N5");
  const [systemSearch, setSystemSearch] = useState("");
  const [systemCardIndex, setSystemCardIndex] = useState(0);
  const [isSystemCardFlipped, setIsSystemCardFlipped] = useState(false);
  const [savingWordId, setSavingWordId] = useState<string | null>(null);
  const [systemLevelCounts, setSystemLevelCounts] = useState<Record<string, number>>({
    all: 0,
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  });
  const [systemTotalCount, setSystemTotalCount] = useState<number>(0);

  // -------------------------------------------------------------
  // DỮ LIỆU SỔ TAY CÁ NHÂN (USER NOTEBOOK)
  // -------------------------------------------------------------
  const [myVocabs, setMyVocabs] = useState<VocabularyItem[]>([]);
  const [isLoadingNotebook, setIsLoadingNotebook] = useState(false);
  const [notebookLevel, setNotebookLevel] = useState<string>("all");
  const [notebookStatus, setNotebookStatus] = useState<string>("all");
  const [notebookSearch, setNotebookSearch] = useState("");
  const [dueCount, setDueCount] = useState<number>(0);
  const [notebookCardIndex, setNotebookCardIndex] = useState(0);
  const [isNotebookCardFlipped, setIsNotebookCardFlipped] = useState(false);
  const [isReviewingSRS, setIsReviewingSRS] = useState(false);

  // -------------------------------------------------------------
  // TÙY CHỌN & MODAL
  // -------------------------------------------------------------
  const [showFuriganaOnFront, setShowFuriganaOnFront] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  // Form thêm từ mới vào sổ tay
  const [formData, setFormData] = useState<CreateVocabularyPayload>({
    kanji: "",
    furigana: "",
    romaji: "",
    meaning: "",
    level: "N5",
    wordType: "phrase",
    exampleSentence: "",
    exampleTranslation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Practice to earn
  const reviewsToday =
    user?.dailyUsage?.vocabReviewsToday ?? user?.quota?.vocabReviewsToday ?? 0;
  const reviewsTarget = (bonusPractices + 1) * 5;
  const canClaimBonusNow = canEarnBonus && reviewsToday >= reviewsTarget;

  // 1. TẢI DỮ LIỆU KHO CHUNG
  const loadSystemVocabularies = useCallback(async () => {
    try {
      setIsLoadingSystem(true);
      const res = await vocabularyService.getSystemVocabularies({
        level: systemLevel,
        limit: 500,
      });
      setSystemVocabs(res.items || []);
      if (res.levelCounts) {
        setSystemLevelCounts(res.levelCounts);
      }
      setSystemTotalCount(res.total || res.items?.length || 0);
      setSystemCardIndex(0);
      setIsSystemCardFlipped(false);
    } catch (err) {
      console.warn("Lỗi tải kho chung:", err);
    } finally {
      setIsLoadingSystem(false);
    }
  }, [systemLevel]);

  // 2. TẢI DỮ LIỆU SỔ TAY CÁ NHÂN
  const loadMyVocabularies = useCallback(async () => {
    try {
      setIsLoadingNotebook(true);
      const [items, due] = await Promise.all([
        vocabularyService.getVocabularies({
          level: notebookLevel,
          isMastered: notebookStatus === "due" ? "all" : notebookStatus,
          isDue: notebookStatus === "due" ? "true" : undefined,
        }),
        vocabularyService.getDueCount(),
      ]);
      setMyVocabs(items.length > 0 ? items : DEFAULT_STARTER_VOCABULARY);
      setDueCount(due);
      setNotebookCardIndex(0);
      setIsNotebookCardFlipped(false);
    } catch {
      setMyVocabs(DEFAULT_STARTER_VOCABULARY);
    } finally {
      setIsLoadingNotebook(false);
    }
  }, [notebookLevel, notebookStatus]);

  // Danh sách từ vựng hiển thị sau khi lọc tìm kiếm thông minh (Client-side instant filter)
  const displayedSystemVocabs = useMemo(() => {
    return systemVocabs.filter((item) => matchesSearch(item, systemSearch));
  }, [systemVocabs, systemSearch]);

  const displayedMyVocabs = useMemo(() => {
    return myVocabs.filter((item) => matchesSearch(item, notebookSearch));
  }, [myVocabs, notebookSearch]);

  // Reset chỉ số thẻ khi gõ tìm kiếm để hiển thị từ đầu tiên khớp
  useEffect(() => {
    setSystemCardIndex(0);
    setIsSystemCardFlipped(false);
  }, [systemSearch]);

  useEffect(() => {
    setNotebookCardIndex(0);
    setIsNotebookCardFlipped(false);
  }, [notebookSearch]);

  // Gọi API ban đầu
  useEffect(() => {
    loadSystemVocabularies();
  }, [loadSystemVocabularies]);

  useEffect(() => {
    loadMyVocabularies();
  }, [loadMyVocabularies]);

  // Phát âm tiếng Nhật chuẩn
  const speakJapanese = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("Trình duyệt không hỗ trợ phát âm tiếng Nhật.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(
        (v) =>
          v.lang === "ja-JP" ||
          v.lang.startsWith("ja") ||
          v.name.toLowerCase().includes("japanese")
      );
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false);
    }
  };

  // -------------------------------------------------------------
  // XỬ LÝ LƯU TỪ KHO CHUNG VÀO SỔ TAY CÁ NHÂN
  // -------------------------------------------------------------
  const handleSaveToMyNotebook = async (
    item: SystemVocabLearnerItem,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (savingWordId || item.isSaved) return;

    try {
      setSavingWordId(item._id);
      soundEffects.playTap();

      const cleanMeaning = translateToVietnamese(item.kanji, item.meaning);
      const cleanExTrans = sanitizeExampleTranslation(item.kanji, cleanMeaning, item.exampleTranslation);

      const saved = await vocabularyService.saveFromSystem({
        systemVocabId: item._id,
        kanji: item.kanji,
        furigana: item.furigana,
        romaji: item.romaji,
        meaning: cleanMeaning,
        level: item.level,
        wordType: item.wordType,
        exampleSentence: item.exampleSentence,
        exampleTranslation: cleanExTrans,
      });

      // Cập nhật state kho chung: đánh dấu từ này đã lưu
      setSystemVocabs((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, isSaved: true } : v))
      );

      // Thêm vào sổ tay cá nhân
      setMyVocabs((prev) => [saved, ...prev]);

      soundEffects.playSuccess();
      toast.success(`Đã lưu "${item.kanji}" vào Sổ tay cá nhân của bạn! ⭐`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi lưu từ vào sổ tay.");
    } finally {
      setSavingWordId(null);
    }
  };

  // -------------------------------------------------------------
  // XỬ LÝ ÔN TẬP SRS (SPACED REPETITION) CHO SỔ TAY
  // -------------------------------------------------------------
  const handleReviewSRS = async (
    item: VocabularyItem,
    rating: "again" | "hard" | "good" | "easy",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (isReviewingSRS) return;
    setIsReviewingSRS(true);

    if (rating === "again") soundEffects.playTap();
    else if (rating === "hard") soundEffects.playEncourage();
    else if (rating === "good") soundEffects.playGood();
    else soundEffects.playSuccess();

    try {
      const res = await vocabularyService.reviewSRS(item._id, rating);
      const updated = res.item || {
        ...item,
        srsStage: res.srsStage,
        interval: res.interval,
        nextReviewDate: res.nextReviewDate,
        isMastered: res.srsStage >= 4,
      };

      setMyVocabs((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, ...updated } : v))
      );

      if (res.totalXp) {
        useAuthStore.getState().updateUserGamification({
          totalXp: res.totalXp,
          level: res.level,
        });
      }

      const anyRes = res as any;
      if (typeof anyRes.vocabReviewsToday === "number") {
        useAuthStore.getState().updateUserDailyUsage({
          practiceCount: user?.dailyUsage?.practiceCount || 0,
          vocabReviewsToday: anyRes.vocabReviewsToday,
        });
      }

      const ratingNames = {
        again: "🔴 Chưa thuộc - Ôn lại sau 1 ngày",
        hard: "🟡 Hơi khó - Chu kỳ ngắn",
        good: "🟢 Nhớ tốt - +5 XP!",
        easy: "⚡ Rất dễ - Chu kỳ dài (+5 XP!)",
      };
      toast.success(ratingNames[rating]);
      setDueCount((prev) => Math.max(0, prev - 1));

      // Tự động chuyển thẻ tiếp theo
      setTimeout(() => {
        setIsNotebookCardFlipped(false);
        setNotebookCardIndex((prev) => (prev + 1) % myVocabs.length);
      }, 300);
    } catch {
      toast.success("Đã ghi nhận ôn tập thẻ! +5 XP");
      setTimeout(() => {
        setIsNotebookCardFlipped(false);
        setNotebookCardIndex((prev) => (prev + 1) % myVocabs.length);
      }, 300);
    } finally {
      setIsReviewingSRS(false);
    }
  };

  // Đổi trạng thái đã thuộc trong Sổ tay
  const handleToggleMastered = async (
    item: VocabularyItem,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    try {
      const updated = await vocabularyService.toggleMastered(
        item._id,
        !item.isMastered
      );
      setMyVocabs((prev) =>
        prev.map((v) =>
          v._id === item._id ? { ...v, isMastered: updated.isMastered } : v
        )
      );
      toast.success(
        !item.isMastered
          ? `Đã đánh dấu thuộc từ "${item.kanji}"!`
          : `Đã đưa từ "${item.kanji}" vào danh sách cần ôn tập.`
      );
    } catch {
      setMyVocabs((prev) =>
        prev.map((v) =>
          v._id === item._id ? { ...v, isMastered: !v.isMastered } : v
        )
      );
    }
  };

  // Xóa từ khỏi Sổ tay cá nhân
  const handleDeleteWord = async (
    id: string,
    kanji: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa từ "${kanji}" khỏi sổ tay không?`)) return;

    try {
      await vocabularyService.deleteVocabulary(id);
      setMyVocabs((prev) => prev.filter((v) => v._id !== id));
      toast.success(`Đã xóa từ "${kanji}" khỏi sổ tay.`);
    } catch {
      setMyVocabs((prev) => prev.filter((v) => v._id !== id));
    }
  };

  // Thêm từ mới thủ công vào Sổ tay
  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kanji.trim() || !formData.meaning.trim()) {
      toast.error("Vui lòng nhập từ tiếng Nhật và nghĩa tiếng Việt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await vocabularyService.createVocabulary(formData);
      setMyVocabs((prev) => [created, ...prev]);
      toast.success(`Đã thêm từ "${formData.kanji}" vào sổ tay!`);
      setIsAddModalOpen(false);
      setFormData({
        kanji: "",
        furigana: "",
        romaji: "",
        meaning: "",
        level: "N5",
        wordType: "phrase",
        exampleSentence: "",
        exampleTranslation: "",
      });
    } catch {
      const localItem: VocabularyItem = {
        _id: "local-" + Date.now(),
        kanji: formData.kanji.trim(),
        furigana: formData.furigana?.trim(),
        romaji: formData.romaji?.trim(),
        meaning: formData.meaning.trim(),
        level: formData.level || "N5",
        wordType: formData.wordType || "phrase",
        exampleSentence: formData.exampleSentence?.trim(),
        exampleTranslation: formData.exampleTranslation?.trim(),
        isMastered: false,
        reviewCount: 0,
      };
      setMyVocabs((prev) => [localItem, ...prev]);
      toast.success(`Đã thêm từ "${formData.kanji}" vào sổ tay!`);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Practice to earn bonus claim
  const handleClaimBonusInNotebook = async () => {
    try {
      setClaimingBonus(true);
      const res = await userService.claimPracticeBonus();
      if (res.success) {
        soundEffects.playSuccess();
        toast.success(res.message);
        await fetchMe();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Chưa đủ điều kiện đổi lượt nói."
      );
    } finally {
      setClaimingBonus(false);
    }
  };

  // Xử lý lưu các từ làm sai từ bài kiểm tra vào Sổ tay
  const handleSaveQuizWrongWords = async (wrongWords: any[]) => {
    let savedCount = 0;
    for (const item of wrongWords) {
      try {
        const cleanMeaning = translateToVietnamese(item.kanji, item.meaning);
        const cleanExTrans = sanitizeExampleTranslation(item.kanji, cleanMeaning, item.exampleTranslation);

        await vocabularyService.saveFromSystem({
          systemVocabId: item._id || item.id,
          kanji: item.kanji,
          furigana: item.furigana,
          romaji: item.romaji,
          meaning: cleanMeaning,
          level: item.level,
          wordType: item.wordType,
          exampleSentence: item.exampleSentence,
          exampleTranslation: cleanExTrans,
        });
        savedCount++;
      } catch (e) {
        // bỏ qua nếu đã tồn tại
      }
    }
    if (savedCount > 0) {
      loadMyVocabularies();
    }
  };

  // Thưởng XP khi hoàn thành bài kiểm tra
  const handleEarnQuizXp = (xp: number) => {
    if (user?.gamification) {
      const newXp = (user.gamification.totalXp || 0) + xp;
      useAuthStore.getState().updateUserGamification({
        totalXp: newXp,
        level: Math.floor(newXp / 100) + 1,
      });
      toast.success(`🎉 Chúc mừng! Bạn nhận được +${xp} XP từ bài kiểm tra!`);
    }
  };

  // Thẻ hiện tại của Kho chung & Sổ tay (sau khi lọc tìm kiếm thông minh)
  const currentSystemCard =
    displayedSystemVocabs[systemCardIndex] || displayedSystemVocabs[0];
  const currentNotebookCard =
    displayedMyVocabs[notebookCardIndex] || displayedMyVocabs[0];

  // Câu ví dụ của thẻ Kho chung & thẻ Sổ tay
  const systemExample = useMemo(
    () => getOrGenerateExample(currentSystemCard),
    [currentSystemCard]
  );
  const notebookExample = useMemo(
    () => getOrGenerateExample(currentNotebookCard),
    [currentNotebookCard]
  );

  // Thao tác bàn phím cho Flashcard
  useEffect(() => {
    if (viewMode !== "flashcard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (mainTab === "system") {
          setIsSystemCardFlipped((prev) => !prev);
        } else {
          setIsNotebookCardFlipped((prev) => !prev);
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (mainTab === "system") {
          setIsSystemCardFlipped(false);
          setSystemCardIndex(
            (prev) => (prev + 1) % (displayedSystemVocabs.length || 1)
          );
        } else {
          setIsNotebookCardFlipped(false);
          setNotebookCardIndex(
            (prev) => (prev + 1) % (displayedMyVocabs.length || 1)
          );
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (mainTab === "system") {
          setIsSystemCardFlipped(false);
          setSystemCardIndex(
            (prev) =>
              (prev - 1 + (displayedSystemVocabs.length || 1)) %
              (displayedSystemVocabs.length || 1)
          );
        } else {
          setIsNotebookCardFlipped(false);
          setNotebookCardIndex(
            (prev) =>
              (prev - 1 + (displayedMyVocabs.length || 1)) %
              (displayedMyVocabs.length || 1)
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, mainTab, displayedSystemVocabs.length, displayedMyVocabs.length]);

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-3.5 font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* ========================================================================= */}
      {/* 1. COMPACT TOP BAR - TINH GỌN, GIẢM CHIỀU CAO ĐỂ ĐƯA FLASHCARD LÊN ĐẦU */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        {/* Trái: Tiêu đề + 4 Mini Stat Badges nằm gọn trên 1 hàng */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-2xs">
              <Sparkles size={14} />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Sổ tay Từ vựng JLPT
            </h1>
          </div>

          {/* 4 Mini Stat Badges siêu gọn (cao chỉ 24px) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div
              title={`Kho từ vựng ${systemLevel === "all" ? "toàn hệ thống" : systemLevel}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-3xs font-black shadow-2xs"
            >
              <Globe2 size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>Kho {systemLevel === "all" ? "tất cả" : systemLevel}:</span>
              <span className="font-mono text-2xs font-black">
                {systemLevel === "all" ? systemLevelCounts.all || systemVocabs.length : (systemLevelCounts[systemLevel] ?? systemVocabs.length)} từ
              </span>
            </div>

            <div
              title="Tổng số từ trong Sổ tay cá nhân của bạn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-3xs font-black shadow-2xs"
            >
              <BookOpen size={12} className="text-rose-600 dark:text-rose-400" />
              <span>Sổ tay:</span>
              <span className="font-mono text-2xs font-black text-rose-600 dark:text-rose-400">
                {myVocabs.length} từ
              </span>
            </div>

            <div
              title="Số thẻ Flashcard đến hạn ôn tập Spaced Repetition hôm nay"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-3xs font-black shadow-2xs"
            >
              <Clock size={12} className="text-amber-600 dark:text-amber-400" />
              <span>Đến hạn SRS:</span>
              <span className="font-mono text-2xs font-black text-amber-600 dark:text-amber-400">
                {dueCount} thẻ
              </span>
            </div>

            <div
              title="Số từ bạn đã ghi nhớ thành thạo (SRS stage >= 4)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-3xs font-black shadow-2xs"
            >
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Đã thuộc:</span>
              <span className="font-mono text-2xs font-black text-emerald-600 dark:text-emerald-400">
                {myVocabs.filter((v) => v.isMastered).length} từ
              </span>
            </div>
          </div>
        </div>

        {/* Phải: 2 nút hành động gọn gàng */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsQuizModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:brightness-105 active:scale-95 text-white font-extrabold text-xs shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
            title="Làm bài kiểm tra trắc nghiệm 4 đáp án A, B, C, D"
          >
            <Sparkles size={13} />
            <span>Kiểm tra ABCD 📝</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title="Thêm từ vựng mới vào Sổ tay cá nhân"
          >
            <Plus size={13} />
            <span>Thêm từ</span>
          </button>
        </div>
      </div>

      {/* Mini Practice-to-Earn Notification */}
      {!isPremium && canEarnBonus && (
        <div className="py-1 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-300/80 dark:border-amber-800/60 flex items-center justify-between gap-2 text-2xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <Zap size={12} className="fill-amber-500 text-amber-500 shrink-0" />
            <span>
              Ôn tập 5 thẻ Flashcard để nạp +1 lượt nói ({reviewsToday}/{reviewsTarget} thẻ hôm nay)
            </span>
          </div>
          {canClaimBonusNow ? (
            <button
              type="button"
              onClick={handleClaimBonusInNotebook}
              disabled={claimingBonus}
              className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-3xs cursor-pointer"
            >
              {claimingBonus ? "..." : "Nhận +1 Lượt! ⚡"}
            </button>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2 TAB CHÍNH & CHẾ ĐỘ XEM */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Nút Tab Kho chung & Sổ tay */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMainTab("system");
              setIsSystemCardFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
              mainTab === "system"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe2 size={14} />
            <span>
              Kho từ vựng chung (
              {systemLevel === "all"
                ? systemLevelCounts.all || systemVocabs.length
                : systemLevelCounts[systemLevel] ?? systemVocabs.length}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainTab("notebook");
              setIsNotebookCardFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
              mainTab === "notebook"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            <span>Sổ tay cá nhân ({myVocabs.length})</span>
          </button>
        </div>

        {/* Chuyển chế độ: Flashcard vs Danh sách bảng + Toggle Furigana */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("flashcard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "flashcard"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Học bằng thẻ Flashcard 3D"
            >
              <Layers size={13} />
              <span>Flashcard 3D</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Xem dạng danh sách bảng"
            >
              <List size={13} />
              <span>Danh sách</span>
            </button>
          </div>

          {viewMode === "flashcard" && (
            <button
              type="button"
              onClick={() => setShowFuriganaOnFront(!showFuriganaOnFront)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
              title="Bật/Tắt Furigana ở mặt trước thẻ"
            >
              {showFuriganaOnFront ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Furigana</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KHO TỪ VỰNG CHUNG (MASTER BANK) */}
      {/* ========================================================================= */}
      {mainTab === "system" && (
        <div className="space-y-4">
          {/* Thanh công cụ lọc Cấp độ JLPT & Tìm kiếm thông minh */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-0.5">
                JLPT:
              </span>
              {["all", "N5", "N4", "N3", "N2", "N1"].map((lvl) => {
                const count =
                  lvl === "all" ? systemLevelCounts.all : systemLevelCounts[lvl];
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSystemLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      systemLevel === lvl
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lvl === "all"
                      ? count && count > 0
                        ? `Tất cả (${count})`
                        : "Tất cả"
                      : count !== undefined && count > 0
                      ? `${lvl} (${count})`
                      : lvl}
                  </button>
                );
              })}
            </div>

            {/* Ô Tìm kiếm thông minh với nút X xóa nhanh */}
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={systemSearch}
                onChange={(e) => setSystemSearch(e.target.value)}
                placeholder="Tìm Kanji, Furigana, nghĩa..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {systemSearch && (
                <button
                  type="button"
                  onClick={() => setSystemSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* CHẾ ĐỘ 1: FLASHCARD 3D CHO KHO CHUNG */}
          {viewMode === "flashcard" ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {isLoadingSystem ? (
                <div className="py-20 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Đang tải thẻ Flashcard kho chung...
                  </p>
                </div>
              ) : displayedSystemVocabs.length === 0 ? (
                systemSearch.trim() ? (
                  /* MÀN HÌNH OOPS! KHI KHÔNG TÌM THẤY TỪ VỰNG */
                  <div className="py-12 px-6 text-center rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4 my-2 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/15 via-amber-500/15 to-indigo-500/15 border border-rose-300/40 dark:border-rose-800/40 flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400 shadow-inner">
                      <SearchX size={32} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-3xs font-extrabold uppercase tracking-wider">
                        <Sparkles size={11} className="text-amber-500" />
                        <span>Oops! Không tìm thấy từ vựng</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Không có kết quả nào khớp với "{systemSearch}"
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Bạn có thể thử tìm bằng <strong>Kanji</strong> (ví dụ: 本, 食べる), <strong>Hiragana</strong> (ほん, たべる), <strong>Romaji</strong> (hon, taberu), hoặc <strong>nghĩa tiếng Việt</strong> (gõ có dấu hoặc không dấu như "sách" / "sach", "cơm" / "com", "tốt" / "tot").
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSystemSearch("")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:brightness-105 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        <RotateCw size={13} />
                        <span>Xóa tìm kiếm & Xem toàn bộ ({systemVocabs.length} từ)</span>
                      </button>
                      {systemLevel !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSystemLevel("all")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Globe2 size={13} />
                          <span>Tìm trên Tất cả cấp độ JLPT</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                    <Globe2 size={40} className="mx-auto text-slate-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Chưa tìm thấy từ vựng trong kho chung
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hãy thử đổi cấp độ hoặc từ khóa tìm kiếm khác.
                    </p>
                  </div>
                )
              ) : (
                <>
                  {/* Tiến độ và hướng dẫn */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Thẻ {systemCardIndex + 1} / {displayedSystemVocabs.length}
                      </span>
                      <span className="text-3xs text-slate-400 hidden sm:inline">
                        (Nhấn Space để lật, ← / → để đổi từ)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSystemVocabs((prev) =>
                          [...prev].sort(() => Math.random() - 0.5)
                        );
                        setSystemCardIndex(0);
                        setIsSystemCardFlipped(false);
                        toast.success("Đã xáo trộn thứ tự thẻ Flashcard!");
                      }}
                      className="inline-flex items-center gap-1 text-2xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      <Shuffle size={13} />
                      <span>Xáo trộn</span>
                    </button>
                  </div>

                  {/* KHUNG THẺ FLASHCARD 3D KHO CHUNG */}
                  <div
                    onClick={() => setIsSystemCardFlipped(!isSystemCardFlipped)}
                    className="relative h-[430px] w-full cursor-pointer select-none perspective-1000 group"
                  >
                    <div
                      className={`relative w-full h-full duration-500 preserve-3d transition-transform rounded-3xl shadow-xl border-2 ${
                        isSystemCardFlipped
                          ? "rotate-y-180 border-indigo-300 dark:border-indigo-800/80 bg-gradient-to-br from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* ================= MẶT TRƯỚC (FRONT) ================= */}
                      <div className="absolute inset-0 backface-hidden p-8 flex flex-col justify-between rounded-3xl">
                        {/* Top Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-3xs font-extrabold border ${
                                LEVEL_COLORS[currentSystemCard.level]?.bg ||
                                LEVEL_COLORS.N5.bg
                              } ${
                                LEVEL_COLORS[currentSystemCard.level]?.text ||
                                LEVEL_COLORS.N5.text
                              } ${
                                LEVEL_COLORS[currentSystemCard.level]?.border ||
                                LEVEL_COLORS.N5.border
                              }`}
                            >
                              {currentSystemCard.level}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-md text-3xs font-bold border ${
                                WORD_TYPE_LABELS[currentSystemCard.wordType]?.color ||
                                WORD_TYPE_LABELS.noun.color
                              }`}
                            >
                              {WORD_TYPE_LABELS[currentSystemCard.wordType]?.label ||
                                "Từ vựng"}
                            </span>
                          </div>

                          {/* Loa phát âm */}
                          <button
                            type="button"
                            onClick={(e) => speakJapanese(currentSystemCard.kanji, e)}
                            className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                            title="Nghe phát âm chuẩn tiếng Nhật"
                          >
                            <Volume2 size={20} />
                          </button>
                        </div>

                        {/* Center: Kanji, Furigana & Romaji */}
                        <div className="text-center space-y-3 my-auto">
                          {showFuriganaOnFront && currentSystemCard.furigana && (
                            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest animate-fade-in">
                              {currentSystemCard.furigana}
                            </div>
                          )}

                          <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-wide drop-shadow-xs">
                            {currentSystemCard.kanji}
                          </div>

                          {currentSystemCard.romaji && (
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                              {currentSystemCard.romaji}
                            </div>
                          )}
                        </div>

                        {/* Bottom Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
                          <span className="text-3xs text-slate-500 font-semibold flex items-center gap-1">
                            <span>Bấm vào thẻ để xem nghĩa & ví dụ</span>
                            <RotateCw size={11} />
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleSaveToMyNotebook(currentSystemCard, e)}
                            disabled={
                              currentSystemCard.isSaved ||
                              savingWordId === currentSystemCard._id
                            }
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              currentSystemCard.isSaved
                                ? "bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                                : "bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 active:scale-95 text-white shadow-md shadow-rose-600/20"
                            }`}
                          >
                            {currentSystemCard.isSaved ? (
                              <>
                                <BookmarkCheck size={14} />
                                <span>Đã lưu vào sổ tay</span>
                              </>
                            ) : (
                              <>
                                <Bookmark size={14} />
                                <span>Lưu vào Sổ tay</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ================= MẶT SAU (BACK - GIẢI THÍCH & VÍ DỤ CÓ FURIGANA) ================= */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 flex flex-col justify-between rounded-3xl">
                        {/* Top Back */}
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500 fill-amber-500" />
                            <span>Ý nghĩa & Ví dụ minh họa</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => speakJapanese(currentSystemCard.kanji, e)}
                            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                            title="Nghe lại phát âm từ"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        {/* Center Back: Nghĩa tiếng Việt + Câu ví dụ có Furigana */}
                        <div className="space-y-4 my-auto">
                          {/* Nghĩa tiếng Việt */}
                          <div>
                            <div className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                              Nghĩa tiếng Việt:
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                              {translateToVietnamese(currentSystemCard.kanji, currentSystemCard.meaning)}
                            </div>
                          </div>

                          {/* Khung Câu ví dụ có Furigana Ruby */}
                          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-slate-950/80 border border-indigo-200/80 dark:border-slate-800 text-left space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-3xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <GraduationCap size={12} />
                                <span>Ví dụ tiếng Nhật có Furigana:</span>
                              </span>

                              {/* Loa phát âm cho câu ví dụ */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  speakJapanese(systemExample.sentence, e)
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                title="Nghe phát âm câu ví dụ"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>

                            {/* Câu tiếng Nhật có Furigana Ruby */}
                            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-loose">
                              <JapaneseRubyText
                                sentence={systemExample.sentence}
                                furigana={systemExample.furigana}
                              />
                            </div>

                            {/* Dịch nghĩa câu ví dụ */}
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium italic border-t border-indigo-200/40 dark:border-slate-800/80 pt-1.5">
                              {systemExample.translation}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Back Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
                          <span className="text-3xs text-slate-500 font-semibold">
                            Bấm để quay lại mặt trước
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleSaveToMyNotebook(currentSystemCard, e)}
                            disabled={
                              currentSystemCard.isSaved ||
                              savingWordId === currentSystemCard._id
                            }
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              currentSystemCard.isSaved
                                ? "bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                                : "bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 active:scale-95 text-white"
                            }`}
                          >
                            {currentSystemCard.isSaved ? (
                              <>
                                <BookmarkCheck size={14} />
                                <span>Đã trong sổ tay</span>
                              </>
                            ) : (
                              <>
                                <Bookmark size={14} />
                                <span>Lưu vào Sổ tay</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút Chuyển thẻ Trước / Sau */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSystemCardFlipped(false);
                        setSystemCardIndex(
                          (prev) =>
                            (prev - 1 + displayedSystemVocabs.length) % displayedSystemVocabs.length
                        );
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
                    >
                      <ChevronLeft size={16} />
                      <span>Thẻ trước</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSystemCardFlipped(false);
                        setSystemCardIndex((prev) => (prev + 1) % displayedSystemVocabs.length);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer transition-all"
                    >
                      <span>Thẻ tiếp theo</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* CHẾ ĐỘ 2: BẢNG DANH SÁCH CHO KHO CHUNG */
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              {isLoadingSystem ? (
                <div className="py-20 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Đang tải danh sách từ vựng kho chung...
                  </p>
                </div>
              ) : displayedSystemVocabs.length === 0 ? (
                systemSearch.trim() ? (
                  <div className="py-12 px-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <SearchX size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Oops! Không tìm thấy từ nào khớp với "{systemSearch}"
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Hãy thử gõ bằng Kanji, Romaji, Hiragana hoặc tiếng Việt có dấu/không dấu (vd: cơm/com, ăn/an).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSystemSearch("")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                    >
                      <RotateCw size={12} />
                      <span>Xóa tìm kiếm & Hiện toàn bộ</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center text-slate-500 text-xs">
                    Chưa có từ vựng nào trong danh mục này.
                  </div>
                )
              ) : (
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5 w-12 text-center">STT</th>
                        <th className="p-3.5 min-w-[160px]">Từ tiếng Nhật</th>
                        <th className="p-3.5 min-w-[140px]">Romaji</th>
                        <th className="p-3.5 min-w-[220px]">Nghĩa tiếng Việt</th>
                        <th className="p-3.5 w-28">Loại từ</th>
                        <th className="p-3.5 w-20">Cấp độ</th>
                        <th className="p-3.5 w-32 text-center">Sổ tay cá nhân</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-sans">
                      {displayedSystemVocabs.map((item, idx) => {
                        const levelStyle =
                          LEVEL_COLORS[item.level] || LEVEL_COLORS.N5;
                        const typeConfig =
                          WORD_TYPE_LABELS[item.wordType] || WORD_TYPE_LABELS.noun;
                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="p-3.5 text-center text-slate-400 text-3xs font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-slate-900 dark:text-white">
                                  {item.kanji}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => speakJapanese(item.kanji, e)}
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                  <Volume2 size={14} />
                                </button>
                              </div>
                              {item.furigana && item.furigana !== item.kanji && (
                                <div className="text-2xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                                  {item.furigana}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {item.romaji || "—"}
                            </td>
                            <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                              {translateToVietnamese(item.kanji, item.meaning)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-3xs font-bold border ${typeConfig.color}`}
                              >
                                {typeConfig.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                              >
                                {item.level}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={(e) => handleSaveToMyNotebook(item, e)}
                                disabled={item.isSaved || savingWordId === item._id}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                                  item.isSaved
                                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 cursor-default"
                                    : "bg-rose-600 hover:bg-rose-500 text-white"
                                }`}
                              >
                                {item.isSaved ? (
                                  <>
                                    <BookmarkCheck size={12} />
                                    <span>Đã lưu</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark size={12} />
                                    <span>Lưu vào sổ</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SỔ TAY CÁ NHÂN (USER'S PERSONAL NOTEBOOK) */}
      {/* ========================================================================= */}
      {mainTab === "notebook" && (
        <div className="space-y-6">
          {/* Thanh lọc Sổ tay cá nhân */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc cấp độ */}
              <select
                value={notebookLevel}
                onChange={(e) => setNotebookLevel(e.target.value)}
                className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>

              {/* Lọc trạng thái */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-2xs font-bold">
                <button
                  type="button"
                  onClick={() => setNotebookStatus("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notebookStatus === "all"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Tất cả ({myVocabs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotebookStatus("learning")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notebookStatus === "learning"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Cần ôn
                </button>
                <button
                  type="button"
                  onClick={() => setNotebookStatus("mastered")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notebookStatus === "mastered"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Đã thuộc
                </button>
                <button
                  type="button"
                  onClick={() => setNotebookStatus("due")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    notebookStatus === "due"
                      ? "bg-rose-700 text-white shadow-2xs"
                      : "text-rose-600 dark:text-rose-400 hover:text-rose-700"
                  }`}
                >
                  <Clock size={11} />
                  <span>Đến hạn ({dueCount})</span>
                </button>
              </div>
            </div>

            {/* Tìm kiếm */}
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={notebookSearch}
                onChange={(e) => setNotebookSearch(e.target.value)}
                placeholder="Tìm trong sổ tay..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
              {notebookSearch && (
                <button
                  type="button"
                  onClick={() => setNotebookSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* CHẾ ĐỘ 1: FLASHCARD ÔN TẬP SRS CHO SỔ TAY */}
          {viewMode === "flashcard" ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {isLoadingNotebook ? (
                <div className="py-20 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Đang tải thẻ Flashcard sổ tay...
                  </p>
                </div>
              ) : displayedMyVocabs.length === 0 ? (
                notebookSearch.trim() ? (
                  /* MÀN HÌNH OOPS! KHI KHÔNG TÌM THẤY TỪ VỰNG TRONG SỔ TAY */
                  <div className="py-12 px-6 text-center rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4 my-2 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/15 via-amber-500/15 to-indigo-500/15 border border-rose-300/40 dark:border-rose-800/40 flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400 shadow-inner">
                      <SearchX size={32} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-3xs font-extrabold uppercase tracking-wider">
                        <Sparkles size={11} className="text-amber-500" />
                        <span>Oops! Không tìm thấy từ vựng</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Không có từ nào trong sổ tay khớp với "{notebookSearch}"
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Bạn có thể thử tìm bằng <strong>Kanji</strong>, <strong>Hiragana</strong>, <strong>Romaji</strong>, hoặc <strong>tiếng Việt</strong> (có dấu hoặc không dấu như "sách" / "sach", "cơm" / "com", "tốt" / "tot").
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNotebookSearch("")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                      >
                        <RotateCw size={13} />
                        <span>Xóa tìm kiếm & Xem toàn bộ sổ tay ({myVocabs.length} từ)</span>
                      </button>
                    </div>
                  </div>
                ) : myVocabs.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                    <BookOpen size={40} className="mx-auto text-slate-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Sổ tay cá nhân của bạn đang trống!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Hãy chuyển sang tab "Kho Từ vựng Chung" và bấm "Lưu vào Sổ tay" ở các từ bạn muốn ghi nhớ, hoặc thêm từ mới thủ công.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setMainTab("system")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Khám phá Kho chung
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Thêm từ thủ công
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                    <BookOpen size={40} className="mx-auto text-slate-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Không có từ vựng nào khớp bộ lọc
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hãy thử chọn cấp độ hoặc trạng thái khác.
                    </p>
                  </div>
                )
              ) : (
                <>
                  {/* Tiến độ và hướng dẫn */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Thẻ {notebookCardIndex + 1} / {displayedMyVocabs.length}
                      </span>
                      <span className="text-3xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                        Spaced Repetition SM-2
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMyVocabs((prev) =>
                          [...prev].sort(() => Math.random() - 0.5)
                        );
                        setNotebookCardIndex(0);
                        setIsNotebookCardFlipped(false);
                        toast.success("Đã xáo trộn thứ tự thẻ!");
                      }}
                      className="inline-flex items-center gap-1 text-2xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      <Shuffle size={13} />
                      <span>Xáo trộn</span>
                    </button>
                  </div>

                  {/* KHUNG THẺ FLASHCARD 3D SỔ TAY */}
                  <div
                    onClick={() => setIsNotebookCardFlipped(!isNotebookCardFlipped)}
                    className="relative h-[430px] w-full cursor-pointer select-none perspective-1000 group"
                  >
                    <div
                      className={`relative w-full h-full duration-500 preserve-3d transition-transform rounded-3xl shadow-xl border-2 ${
                        isNotebookCardFlipped
                          ? "rotate-y-180 border-rose-300 dark:border-rose-800/80 bg-gradient-to-br from-white via-rose-50/30 to-white dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* ================= MẶT TRƯỚC (FRONT) ================= */}
                      <div className="absolute inset-0 backface-hidden p-8 flex flex-col justify-between rounded-3xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-3xs font-extrabold border ${
                                LEVEL_COLORS[currentNotebookCard.level]?.bg ||
                                LEVEL_COLORS.N5.bg
                              } ${
                                LEVEL_COLORS[currentNotebookCard.level]?.text ||
                                LEVEL_COLORS.N5.text
                              } ${
                                LEVEL_COLORS[currentNotebookCard.level]?.border ||
                                LEVEL_COLORS.N5.border
                              }`}
                            >
                              {currentNotebookCard.level}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleToggleMastered(currentNotebookCard, e)}
                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                                currentNotebookCard.isMastered
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/25"
                                  : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                              }`}
                              title="Bấm để tích / bỏ tích trạng thái Đã thành thạo"
                            >
                              {currentNotebookCard.isMastered ? (
                                <>
                                  <CheckCircle2 size={12} className="fill-white text-emerald-500" />
                                  <span>Đã thành thạo</span>
                                </>
                              ) : (
                                <>
                                  <Circle size={12} />
                                  <span>Cần ôn tập (Bấm để tích thuộc)</span>
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => speakJapanese(currentNotebookCard.kanji, e)}
                            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Nghe phát âm chuẩn"
                          >
                            <Volume2 size={20} />
                          </button>
                        </div>

                        <div className="text-center space-y-3 my-auto">
                          {showFuriganaOnFront && currentNotebookCard.furigana && (
                            <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono tracking-widest">
                              {currentNotebookCard.furigana}
                            </div>
                          )}

                          <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-wide drop-shadow-xs">
                            {currentNotebookCard.kanji}
                          </div>

                          {currentNotebookCard.romaji && (
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                              {currentNotebookCard.romaji}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
                          <span className="text-3xs text-slate-500 font-semibold flex items-center gap-1">
                            <span>Bấm để xem nghĩa & đánh giá SRS</span>
                            <RotateCw size={11} />
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleToggleMastered(currentNotebookCard, e)}
                            className="text-2xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold"
                          >
                            {currentNotebookCard.isMastered
                              ? "Chuyển sang cần ôn"
                              : "Đánh dấu đã thuộc"}
                          </button>
                        </div>
                      </div>

                      {/* ================= MẶT SAU (BACK - GIẢI THÍCH & VÍ DỤ CÓ FURIGANA) ================= */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 flex flex-col justify-between rounded-3xl">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500 fill-amber-500" />
                            <span>Ý nghĩa & Đánh giá ghi nhớ</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => speakJapanese(currentNotebookCard.kanji, e)}
                            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                            title="Nghe lại phát âm từ"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-4 my-auto">
                          {/* Nghĩa tiếng Việt */}
                          <div>
                            <div className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                              Nghĩa tiếng Việt:
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                              {translateToVietnamese(currentNotebookCard.kanji, currentNotebookCard.meaning)}
                            </div>
                          </div>

                          {/* Khung ví dụ có Furigana Ruby */}
                          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-slate-950/80 border border-rose-200/80 dark:border-slate-800 text-left space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-3xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <GraduationCap size={12} />
                                <span>Ví dụ tiếng Nhật có Furigana:</span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) =>
                                  speakJapanese(notebookExample.sentence, e)
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                title="Nghe phát âm câu ví dụ"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>

                            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-loose">
                              <JapaneseRubyText
                                sentence={notebookExample.sentence}
                                furigana={notebookExample.furigana}
                              />
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium italic border-t border-rose-200/40 dark:border-slate-800/80 pt-1.5">
                              {notebookExample.translation}
                            </div>
                          </div>
                        </div>

                        <div className="text-center pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold block">
                            Chọn 1 mức độ nhớ để Spaced Repetition lên lịch ôn tập:
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 NÚT ĐÁNH GIÁ SRS (SUPERMEMO SM-2) - ĐỒNG BỘ THEME */}
                  <div className="grid grid-cols-4 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={(e) =>
                        handleReviewSRS(currentNotebookCard, "again", e)
                      }
                      className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      title="Quên hoàn toàn, cần học lại vào ngày mai"
                    >
                      <RotateCw size={15} />
                      <span>Chưa thuộc</span>
                      <span className="text-3xs text-rose-500">1 ngày</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) =>
                        handleReviewSRS(currentNotebookCard, "hard", e)
                      }
                      className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      title="Khá khó nhớ, lặp lại sớm"
                    >
                      <Clock size={15} />
                      <span>Hơi khó</span>
                      <span className="text-3xs text-amber-500">2 ngày</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) =>
                        handleReviewSRS(currentNotebookCard, "good", e)
                      }
                      className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      title="Nhớ tốt, cộng +5 XP"
                    >
                      <CheckCircle2 size={15} />
                      <span>Nhớ tốt</span>
                      <span className="text-3xs text-emerald-600">+5 XP</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) =>
                        handleReviewSRS(currentNotebookCard, "easy", e)
                      }
                      className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      title="Rất dễ, tăng chu kỳ lặp lại dài và cộng +5 XP"
                    >
                      <Zap size={15} />
                      <span>Rất dễ</span>
                      <span className="text-3xs text-sky-600">+5 XP</span>
                    </button>
                  </div>

                  {/* Nút Chuyển thẻ Trước / Sau */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotebookCardFlipped(false);
                        setNotebookCardIndex(
                          (prev) =>
                            (prev - 1 + displayedMyVocabs.length) % displayedMyVocabs.length
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft size={14} />
                      <span>Trước</span>
                    </button>

                    <span className="text-3xs text-slate-500 font-bold">
                      {notebookCardIndex + 1} / {displayedMyVocabs.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNotebookCardFlipped(false);
                        setNotebookCardIndex(
                          (prev) => (prev + 1) % displayedMyVocabs.length
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Sau</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* CHẾ ĐỘ 2: BẢNG DANH SÁCH CHO SỔ TAY CÁ NHÂN */
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              {isLoadingNotebook ? (
                <div className="py-20 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Đang tải danh sách từ vựng sổ tay...
                  </p>
                </div>
              ) : displayedMyVocabs.length === 0 ? (
                notebookSearch.trim() ? (
                  <div className="py-12 px-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <SearchX size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Oops! Không tìm thấy từ nào khớp với "{notebookSearch}"
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Hãy thử gõ bằng Kanji, Romaji, Hiragana hoặc tiếng Việt có dấu/không dấu (vd: cơm/com, ăn/an).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotebookSearch("")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                    >
                      <RotateCw size={12} />
                      <span>Xóa tìm kiếm & Hiện toàn bộ</span>
                    </button>
                  </div>
                ) : myVocabs.length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-3">
                    <BookOpen size={36} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">
                      Sổ tay cá nhân của bạn đang trống.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 px-6 text-center text-slate-500 text-xs">
                    Không có từ vựng nào trong sổ tay khớp với bộ lọc này.
                  </div>
                )
              ) : (
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5 w-12 text-center">STT</th>
                        <th className="p-3.5 min-w-[160px]">Từ vựng / Kanji</th>
                        <th className="p-3.5 min-w-[140px]">Romaji</th>
                        <th className="p-3.5 min-w-[220px]">Nghĩa tiếng Việt</th>
                        <th className="p-3.5 w-24">Cấp độ</th>
                        <th className="p-3.5 w-28 text-center">Trạng thái</th>
                        <th className="p-3.5 w-20 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-sans">
                      {displayedMyVocabs.map((item, idx) => {
                      const levelStyle =
                        LEVEL_COLORS[item.level] || LEVEL_COLORS.N5;
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3.5 text-center text-slate-400 text-3xs font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900 dark:text-white">
                                {item.kanji}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => speakJapanese(item.kanji, e)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                            {item.furigana && item.furigana !== item.kanji && (
                              <div className="text-2xs text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                                {item.furigana}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {item.romaji || "—"}
                          </td>
                          <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                            {translateToVietnamese(item.kanji, item.meaning)}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                            >
                              {item.level}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleToggleMastered(item, e)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-3xs font-bold transition-all cursor-pointer ${
                                item.isMastered
                                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                                  : "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                              }`}
                            >
                              {item.isMastered ? (
                                <>
                                  <Check size={11} />
                                  <span>Đã thuộc</span>
                                </>
                              ) : (
                                <>
                                  <Circle size={10} />
                                  <span>Cần ôn</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteWord(item._id, item.kanji, e)
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Xóa khỏi sổ tay"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM TỪ VỰNG THỦ CÔNG VÀO SỔ TAY */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={18} className="text-rose-600" />
                <span>Thêm từ vựng mới vào Sổ tay</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddWordSubmit} className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Từ tiếng Nhật / Kanji <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kanji}
                  onChange={(e) =>
                    setFormData({ ...formData, kanji: e.target.value })
                  }
                  placeholder="VD: 食べる hoặc こんにちは"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Furigana (Hiragana)
                  </label>
                  <input
                    type="text"
                    value={formData.furigana}
                    onChange={(e) =>
                      setFormData({ ...formData, furigana: e.target.value })
                    }
                    placeholder="VD: たべる"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Romaji
                  </label>
                  <input
                    type="text"
                    value={formData.romaji}
                    onChange={(e) =>
                      setFormData({ ...formData, romaji: e.target.value })
                    }
                    placeholder="VD: taberu"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) =>
                    setFormData({ ...formData, meaning: e.target.value })
                  }
                  placeholder="VD: Ăn (cơm, bánh mì...)"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cấp độ
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Loại từ
                  </label>
                  <select
                    value={formData.wordType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wordType: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="verb">Động từ (Verb)</option>
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="adjective">Tính từ (Adj)</option>
                    <option value="adverb">Phó từ (Adv)</option>
                    <option value="phrase">Cụm từ (Phrase)</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Câu ví dụ tiếng Nhật (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.exampleSentence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exampleSentence: e.target.value,
                    })
                  }
                  placeholder="VD: ご飯を食べます。"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && (
                    <RotateCw size={13} className="animate-spin" />
                  )}
                  <span>Lưu vào sổ tay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LÀM BÀI KIỂM TRA TRẮC NGHIỆM  */}
      {/* ========================================================================= */}
      <VocabularyQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        vocabList={mainTab === "system" ? systemVocabs : myVocabs}
        title={
          mainTab === "system"
            ? `Bài Kiểm Tra Kho Từ Vựng Chung (${systemLevel})`
            : "Bài Kiểm Tra Sổ Tay Cá Nhân"
        }
        defaultQuestionCount={10}
        onSaveWrongWordsToNotebook={handleSaveQuizWrongWords}
        onEarnXp={handleEarnQuizXp}
      />
    </div>
  );
}
