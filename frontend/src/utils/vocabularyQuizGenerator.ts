/**
 * Utility: Vocabulary Quiz Generator (Engine sinh câu hỏi trắc nghiệm)
 * Tự động tạo bài kiểm tra từ vựng tiếng Nhật 4 đáp án A, B, C, D từ danh sách từ vựng bất kỳ.
 */

import {
  translateToVietnamese,
  sanitizeExampleTranslation,
} from "./japaneseMeaningTranslator";

export interface QuizItemSource {
  _id?: string;
  id?: string;
  kanji: string;
  furigana?: string;
  romaji?: string;
  meaning: string;
  level?: string;
  wordType?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

export type QuizQuestionType = "jp_to_vi" | "vi_to_jp" | "kanji_to_furi";

export interface QuizOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  subText?: string;
  detailMeaning?: string;
  detailKanji?: string;
  detailFurigana?: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  questionText: string;
  questionSubText?: string;
  audioText?: string;
  options: QuizOption[];
  correctKey: "A" | "B" | "C" | "D";
  sourceItem: QuizItemSource;
  explanation: {
    kanji: string;
    furigana?: string;
    meaning: string;
    exampleSentence?: string;
    exampleTranslation?: string;
  };
}

export interface QuizGeneratorOptions {
  questionCount?: number;
  types?: QuizQuestionType[];
}

/**
 * Xáo trộn ngẫu nhiên mảng (Fisher-Yates Shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Hàm sinh bộ câu hỏi trắc nghiệm từ danh sách từ vựng
 */
export function generateVocabularyQuiz(
  items: QuizItemSource[],
  options?: QuizGeneratorOptions
): QuizQuestion[] {
  if (!items || items.length === 0) return [];

  // Lọc các từ hợp lệ (có kanji và meaning)
  const validItems = items.filter(
    (item) => item.kanji && item.kanji.trim() && item.meaning && item.meaning.trim()
  );

  if (validItems.length < 2) return [];

  const requestedCount = options?.questionCount || 10;
  const actualCount = Math.min(requestedCount, validItems.length);

  // Chọn ngẫu nhiên actualCount từ làm câu hỏi
  const shuffledCandidates = shuffleArray(validItems);
  const selectedQuestions = shuffledCandidates.slice(0, actualCount);

  const allowedTypes: QuizQuestionType[] =
    options?.types && options.types.length > 0
      ? options.types
      : ["jp_to_vi", "vi_to_jp", "kanji_to_furi"];

  const questions: QuizQuestion[] = [];

  for (let i = 0; i < selectedQuestions.length; i++) {
    const targetItem = selectedQuestions[i];

    // Quyết định dạng câu hỏi
    let chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

    // Nếu chọn kanji_to_furi nhưng từ không có Furigana riêng biệt với Kanji (ví dụ từ thuần kana), chuyển sang jp_to_vi
    if (
      chosenType === "kanji_to_furi" &&
      (!targetItem.furigana || targetItem.furigana.trim() === targetItem.kanji.trim())
    ) {
      chosenType = Math.random() > 0.5 ? "jp_to_vi" : "vi_to_jp";
    }

    // Lấy 3 đáp án gây nhiễu (distractors) từ các từ còn lại
    const otherCandidates = validItems.filter(
      (it) => it.kanji !== targetItem.kanji && it.meaning !== targetItem.meaning
    );
    const shuffledOthers = shuffleArray(otherCandidates);
    const distractors = shuffledOthers.slice(0, 3);

    const targetMeaning = translateToVietnamese(targetItem.kanji, targetItem.meaning);
    const targetExample = targetItem.exampleSentence || `毎日の生活で${targetItem.kanji}を使います。`;
    const targetExTrans = sanitizeExampleTranslation(
      targetItem.kanji,
      targetMeaning,
      targetItem.exampleTranslation || `Sử dụng "${targetMeaning}" trong giao tiếp hàng ngày.`
    );

    let rawOptions: Array<{
      text: string;
      subText?: string;
      detailMeaning: string;
      detailKanji: string;
      detailFurigana?: string;
      isCorrect: boolean;
    }> = [];
    let questionText = "";
    let questionSubText: string | undefined = undefined;
    let audioText: string = targetItem.kanji;

    if (chosenType === "jp_to_vi") {
      // Dạng 1: Cho tiếng Nhật -> Chọn nghĩa tiếng Việt
      questionText = targetItem.kanji;
      questionSubText =
        targetItem.furigana && targetItem.furigana !== targetItem.kanji
          ? targetItem.furigana
          : targetItem.romaji;
      audioText = targetItem.kanji;

      rawOptions = [
        {
          text: targetMeaning,
          detailMeaning: targetMeaning,
          detailKanji: targetItem.kanji,
          detailFurigana: targetItem.furigana,
          isCorrect: true,
        },
        ...distractors.map((d) => {
          const dMeaning = translateToVietnamese(d.kanji, d.meaning);
          return {
            text: dMeaning,
            detailMeaning: dMeaning,
            detailKanji: d.kanji,
            detailFurigana: d.furigana,
            isCorrect: false,
          };
        }),
      ];
    } else if (chosenType === "vi_to_jp") {
      // Dạng 2: Cho nghĩa tiếng Việt -> Chọn từ tiếng Nhật đúng
      questionText = targetMeaning;
      questionSubText = "Hãy chọn từ tiếng Nhật tương ứng";
      audioText = targetItem.kanji;

      rawOptions = [
        {
          text: targetItem.kanji,
          subText: targetItem.furigana || targetItem.romaji,
          detailMeaning: targetMeaning,
          detailKanji: targetItem.kanji,
          detailFurigana: targetItem.furigana,
          isCorrect: true,
        },
        ...distractors.map((d) => {
          const dMeaning = translateToVietnamese(d.kanji, d.meaning);
          return {
            text: d.kanji,
            subText: d.furigana || d.romaji,
            detailMeaning: dMeaning,
            detailKanji: d.kanji,
            detailFurigana: d.furigana,
            isCorrect: false,
          };
        }),
      ];
    } else {
      // Dạng 3: Cho Kanji -> Chọn cách đọc Furigana/Hiragana đúng
      questionText = targetItem.kanji;
      questionSubText = "Chọn cách đọc Hiragana (Furigana) chính xác";
      audioText = targetItem.kanji;

      rawOptions = [
        {
          text: targetItem.furigana || targetItem.kanji,
          detailMeaning: targetMeaning,
          detailKanji: targetItem.kanji,
          detailFurigana: targetItem.furigana,
          isCorrect: true,
        },
        ...distractors.map((d) => {
          const dMeaning = translateToVietnamese(d.kanji, d.meaning);
          return {
            text: d.furigana || d.kanji,
            detailMeaning: dMeaning,
            detailKanji: d.kanji,
            detailFurigana: d.furigana,
            isCorrect: false,
          };
        }),
      ];
    }

    // Đảm bảo các lựa chọn đáp án không bị trùng lặp text hiển thị
    const seenTexts = new Set<string>();
    for (const opt of rawOptions) {
      if (seenTexts.has(opt.text)) {
        if (opt.detailKanji && !opt.text.includes(opt.detailKanji)) {
          opt.text = `${opt.text} (${opt.detailKanji})`;
        }
      }
      seenTexts.add(opt.text);
    }

    // Xáo trộn 4 đáp án ngẫu nhiên
    const shuffledOptions = shuffleArray(rawOptions);
    const keys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

    let correctKey: "A" | "B" | "C" | "D" = "A";
    const finalOptions: QuizOption[] = shuffledOptions.map((opt, idx) => {
      const key = keys[idx];
      if (opt.isCorrect) correctKey = key;
      return {
        key,
        text: opt.text,
        subText: opt.subText,
        detailMeaning: opt.detailMeaning,
        detailKanji: opt.detailKanji,
        detailFurigana: opt.detailFurigana,
      };
    });

    questions.push({
      id: `quiz-q-${i + 1}-${targetItem.kanji}`,
      type: chosenType,
      questionText,
      questionSubText,
      audioText,
      options: finalOptions,
      correctKey,
      sourceItem: {
        ...targetItem,
        meaning: targetMeaning,
        exampleSentence: targetExample,
        exampleTranslation: targetExTrans,
      },
      explanation: {
        kanji: targetItem.kanji,
        furigana: targetItem.furigana,
        meaning: targetMeaning,
        exampleSentence: targetExample,
        exampleTranslation: targetExTrans,
      },
    });
  }

  return questions;
}
