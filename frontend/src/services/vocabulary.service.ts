import api from "@/services/api";
import type { VocabularyItem, CreateVocabularyPayload } from "@/types";

// Default starter vocabulary for demo or fresh accounts
export const DEFAULT_STARTER_VOCABULARY: VocabularyItem[] = [
  {
    _id: "demo-1",
    kanji: "お疲れ様です",
    furigana: "おつかれさまです",
    romaji: "otsukaresama desu",
    meaning: "Cảm ơn vì đã vất vả (Chào hỏi đồng nghiệp khi kết thúc ca làm / công việc)",
    level: "N4",
    wordType: "phrase",
    exampleSentence: "今日も一日お疲れ様でした。",
    exampleTranslation: "Hôm nay mọi người đã vất vả cả một ngày rồi.",
    isMastered: false,
    reviewCount: 3,
    tags: ["giao_tiep", "cong_so"],
  },
  {
    _id: "demo-2",
    kanji: "初めまして",
    furigana: "はじめまして",
    romaji: "hajimemashite",
    meaning: "Rất hân hạnh được gặp bạn lần đầu",
    level: "N5",
    wordType: "phrase",
    exampleSentence: "初めまして、ナムと申します。",
    exampleTranslation: "Rất vui được gặp bạn, tôi tên là Nam.",
    isMastered: true,
    reviewCount: 5,
    tags: ["chao_hoi", "n5"],
  },
  {
    _id: "demo-3",
    kanji: "遠慮なく",
    furigana: "えんりょなく",
    romaji: "enryo naku",
    meaning: "Đừng ngại ngùng, cứ tự nhiên",
    level: "N3",
    wordType: "adverb",
    exampleSentence: "どうぞ遠慮なく質問してください。",
    exampleTranslation: "Xin hãy cứ tự nhiên đặt câu hỏi.",
    isMastered: false,
    reviewCount: 1,
    tags: ["thuong_ngay", "n3"],
  },
  {
    _id: "demo-4",
    kanji: "よろしくお願いします",
    furigana: "よろしくおねがいします",
    romaji: "yoroshiku onegaishimasu",
    meaning: "Rất mong nhận được sự giúp đỡ / chiếu cố",
    level: "N5",
    wordType: "phrase",
    exampleSentence: "これからよろしくお願いします。",
    exampleTranslation: "Từ nay về sau rất mong được bạn giúp đỡ.",
    isMastered: true,
    reviewCount: 8,
    tags: ["chao_hoi", "n5"],
  },
  {
    _id: "demo-5",
    kanji: "面接",
    furigana: "めんせつ",
    romaji: "mensetsu",
    meaning: "Buổi phỏng vấn",
    level: "N3",
    wordType: "noun",
    exampleSentence: "明日の午後、アルバイトの面接があります。",
    exampleTranslation: "Chiều mai tôi có buổi phỏng vấn xin việc làm thêm.",
    isMastered: false,
    reviewCount: 2,
    tags: ["xin_viec", "baito"],
  },
  {
    _id: "demo-6",
    kanji: "恐れ入りますが",
    furigana: "おそれいりますが",
    romaji: "osoreirimasuga",
    meaning: "Xin thứ lỗi, xin phép làm phiền (Cách nói lịch sự Keigo khi nhờ vả)",
    level: "N2",
    wordType: "phrase",
    exampleSentence: "恐れ入りますが、もう一度お名前を教えていただけますか。",
    exampleTranslation: "Xin thứ lỗi, anh/chị có thể cho tôi biết lại tên được không ạ?",
    isMastered: false,
    reviewCount: 0,
    tags: ["keigo", "kinh_ngu"],
  },
];

export const vocabularyService = {
  getVocabularies: async (params?: {
    level?: string;
    isMastered?: string;
    search?: string;
  }): Promise<VocabularyItem[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.level && params.level !== "all") searchParams.append("level", params.level);
      if (params?.isMastered && params.isMastered !== "all") searchParams.append("isMastered", params.isMastered);
      if (params?.search?.trim()) searchParams.append("search", params.search.trim());

      const url = `/vocabularies${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const res = await api.get(url);
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return data || [];
    } catch (err) {
      console.warn("Lỗi khi tải sổ tay từ vựng từ server, sử dụng dữ liệu mẫu:", err);
      // Fallback filter locally
      let list = [...DEFAULT_STARTER_VOCABULARY];
      if (params?.level && params.level !== "all") {
        list = list.filter((i) => i.level === params.level);
      }
      if (params?.isMastered && params.isMastered !== "all") {
        const isM = params.isMastered === "true";
        list = list.filter((i) => i.isMastered === isM);
      }
      if (params?.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        list = list.filter(
          (i) =>
            i.kanji.toLowerCase().includes(q) ||
            i.furigana?.toLowerCase().includes(q) ||
            i.meaning.toLowerCase().includes(q) ||
            i.romaji?.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  createVocabulary: async (payload: CreateVocabularyPayload): Promise<VocabularyItem> => {
    const res = await api.post("/vocabularies", payload);
    return res.data?.data || res.data;
  },

  toggleMastered: async (id: string, isMastered?: boolean): Promise<VocabularyItem> => {
    const res = await api.patch(`/vocabularies/${id}/mastered`, { isMastered });
    return res.data?.data || res.data;
  },

  deleteVocabulary: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete(`/vocabularies/${id}`);
    return res.data?.data || res.data;
  },
};
