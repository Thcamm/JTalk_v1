/**
 * Smart Quizlet & Japanese Vocabulary Parser for JTalk
 * Handles CSV, TSV, pasted text, Kanji/Furigana extraction, and Romaji conversion.
 */

import { translateToVietnamese } from "./japaneseMeaningTranslator";

export interface ParsedVocabItem {
  id: string; // Tạm thời để quản lý trong React state
  kanji: string;
  furigana: string;
  romaji: string;
  meaning: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  wordType: "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";
  notes?: string;
  selected?: boolean;
}

// Bảng map Hiragana sang Romaji chuẩn Hepburn
const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", mu: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

/**
 * Tự động chuyển đổi Hiragana cơ bản sang Romaji
 */
export function hiraganaToRomaji(kana: string): string {
  if (!kana) return "";
  let result = "";
  let i = 0;
  const str = kana.trim();

  while (i < str.length) {
    // Kiểm tra âm đôi 2 ký tự (きゃ, しゃ, ちゃ...)
    if (i + 1 < str.length) {
      const pair = str.slice(i, i + 2);
      if (HIRAGANA_TO_ROMAJI[pair]) {
        result += HIRAGANA_TO_ROMAJI[pair] + " ";
        i += 2;
        continue;
      }
    }

    // Âm ngắt っ
    if (str[i] === "っ" && i + 1 < str.length) {
      const nextChar = str[i + 1];
      const nextRomaji = HIRAGANA_TO_ROMAJI[nextChar] || "";
      if (nextRomaji) {
        result += nextRomaji[0];
      }
      i++;
      continue;
    }

    // Ký tự đơn
    const single = HIRAGANA_TO_ROMAJI[str[i]];
    if (single) {
      result += single + " ";
    } else {
      result += str[i];
    }
    i++;
  }

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Kiểm tra xem chuỗi có chứa chữ Hán (Kanji) không
 */
export function containsKanji(str: string): boolean {
  return /[一-龯]/.test(str);
}

/**
 * Kiểm tra xem chuỗi có chứa Hiragana hoặc Katakana không
 */
export function containsKana(str: string): boolean {
  return /[぀-ゟ゠-ヿ]/.test(str);
}

/**
 * Đoán loại từ (WordType) tiếng Nhật chuẩn xác cao bằng Heuristic NLP
 */
export function detectWordType(
  term: string,
  meaning: string,
  notes: string = ""
): "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other" {
  const combined = (term + " " + meaning + " " + notes).toLowerCase();
  const cleanTerm = term.trim();
  const cleanMeaning = meaning.toLowerCase().trim();

  // 1. Nhận diện Động từ (Verb)
  if (
    notes.includes("verb") ||
    notes.includes("ichidan") ||
    notes.includes("godan") ||
    notes.includes("suru") ||
    combined.includes("(v)") ||
    combined.includes("to ") ||
    cleanMeaning.startsWith("to ") ||
    /\b(ăn|uống|đi|ngủ|đến|nói|chạy|học|làm|mua|bán|xem|nhìn|đọc|viết|nghe|nghĩ|chờ|gọi|mặc|mở|đóng|bắt đầu|kết thúc|thức dậy)\b/.test(
      cleanMeaning
    ) ||
    cleanTerm.endsWith("する")
  ) {
    return "verb";
  }

  // 2. Nhận diện Tính từ (Adjective)
  if (
    notes.includes("adj") ||
    notes.includes("i-adj") ||
    notes.includes("na-adj") ||
    combined.includes("(adj)") ||
    /\b(đẹp|sạch|yên tĩnh|nổi tiếng|khỏe mạnh|thân thiện|rảnh rỗi|thích|ghét|vất vả|tiện lợi|quan trọng|khó|dễ|cao|thấp|rộng|hẹp|nóng|lạnh|mới|cũ|dài|ngắn)\b/.test(
      cleanMeaning
    ) ||
    (cleanTerm.endsWith("い") &&
      containsKanji(cleanTerm) &&
      !/[うくぐすつぬぶむる]$/.test(cleanTerm))
  ) {
    return "adjective";
  }

  // 3. Nhận diện Phó từ (Adverb)
  if (
    notes.includes("adv") ||
    combined.includes("(adv)") ||
    /^(とても|たいへん|すごく|ゆっくり|たくさん|もう|まだ|ちょっと|すこし|ぜんぜん|すぐ|だんだん|たぶん|いつも|よく|あまり)$/.test(
      cleanTerm
    ) ||
    /\b(rất|lắm|nhiều|chậm rãi|chưa|đã|ngay lập tức|hoàn toàn|chắc chắn|luôn luôn|thường xuyên)\b/.test(
      cleanMeaning
    )
  ) {
    return "adverb";
  }

  // 4. Nhận diện Cụm từ / Thành ngữ (Phrase)
  if (
    cleanTerm.length > 6 ||
    cleanTerm.includes(" ") ||
    /^(こんにちは|おはよう|こんばんは|さようなら|ありがとう|いただきます|ごちそうさま|お疲れ様|初めまして|よろしく)/.test(
      cleanTerm
    ) ||
    cleanMeaning.includes("!") ||
    cleanMeaning.includes("?")
  ) {
    return "phrase";
  }

  // 5. Mặc định là Danh từ (Noun)
  return "noun";
}

/**
 * Bóc tách chuỗi thuật ngữ Quizlet (Term) thành { kanji, furigana, romaji, notes, wordType }
 * Hỗ trợ các dạng:
 * - "ねる (寝る) (ichidan)"
 * - "寝る (ねる)"
 * - "あさ (朝)"
 * - "学生 [がくせい]"
 * - "食べる"
 */
export function parseJapaneseTerm(
  rawTerm: string,
  meaning: string = "",
  defaultLevel: "N5" | "N4" | "N3" | "N2" | "N1" = "N5"
): Omit<ParsedVocabItem, "id" | "meaning" | "selected"> {
  let term = rawTerm.trim();
  let kanji = "";
  let furigana = "";
  let notes = "";

  // 1. Tách các dấu ngoặc ghi chú loại từ như (ichidan), (godan), (v), (n)
  const tagMatch = term.match(/[\(（](ichidan|godan|suru|verb|noun|adj|na-adj|i-adj|adv)[\)）]/i);
  if (tagMatch) {
    notes = tagMatch[1].toLowerCase();
    term = term.replace(tagMatch[0], "").trim();
  }

  // 2. Tách cấu trúc dạng: A (B) hoặc A [B] hoặc A（B）
  const bracketMatch = term.match(/^(.+?)[\s\t]*[\(（\[](.+?)[\)）\]][\s\t]*(.*)$/);

  if (bracketMatch) {
    const partA = bracketMatch[1].trim();
    const partB = bracketMatch[2].trim();
    const rest = bracketMatch[3]?.trim() || "";

    if (rest && !notes) notes = rest;

    // Kiểm tra xem partA hay partB chứa Kanji
    const aHasKanji = containsKanji(partA);
    const bHasKanji = containsKanji(partB);

    if (bHasKanji && !aHasKanji) {
      // Dạng Quizlet phổ biến: "ねる (寝る)" -> partA là Kana, partB là Kanji
      kanji = partB;
      furigana = partA;
    } else if (aHasKanji && !bHasKanji) {
      // Dạng truyền thống: "寝る (ねる)" -> partA là Kanji, partB là Kana
      kanji = partA;
      furigana = partB;
    } else {
      // Cả hai đều có Kanji hoặc cả hai đều là Kana
      kanji = partA;
      furigana = partB;
    }
  } else {
    // Không có ngoặc: ví dụ "食べる" hoặc "ありがとう"
    if (containsKanji(term)) {
      kanji = term;
      furigana = ""; // Có thể bổ sung bằng tay hoặc AI
    } else {
      kanji = term;
      furigana = term;
    }
  }

  // Tự động sinh Romaji nếu có Furigana
  const romaji = furigana ? hiraganaToRomaji(furigana) : "";
  const wordType = detectWordType(kanji, meaning, notes);

  return {
    kanji,
    furigana,
    romaji,
    level: defaultLevel,
    wordType,
    notes,
  };
}

/**
 * Phân tích các dòng văn bản CSV/TSV/Text từ Quizlet
 */
export function parseQuizletContent(
  content: string,
  defaultLevel: "N5" | "N4" | "N3" | "N2" | "N1" = "N5"
): ParsedVocabItem[] {
  if (!content || !content.trim()) return [];

  // Tách dòng an toàn với cả \r\n và \n
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedVocabItem[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    // Bỏ qua dòng tiêu đề nếu có
    if (
      index === 0 &&
      (line.toLowerCase().startsWith("term,definition") ||
        line.toLowerCase().startsWith('"term","definition"') ||
        line.toLowerCase().startsWith("từ,nghĩa") ||
        line.toLowerCase().startsWith("thuật ngữ,định nghĩa"))
    ) {
      continue;
    }

    let term = "";
    let definition = "";

    // Trường hợp 1: Phân tách bằng dấu Tab (\t) - rất phổ biến khi copy từ Quizlet/Excel
    if (line.includes("\t")) {
      const parts = line.split("\t");
      term = parts[0]?.trim() || "";
      definition = parts.slice(1).join(" ").trim();
    }
    // Trường hợp 2: Phân tách bằng dấu phẩy CSV chuẩn (có thể bọc trong dấu ngoặc kép)
    else if (line.includes(",")) {
      // Regex parse CSV hỗ trợ ngoặc kép ""
      const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
      if (matches && matches.length >= 2) {
        const cleanVal = (val: string) => {
          let s = val.replace(/^,/, "").trim();
          if (s.startsWith('"') && s.endsWith('"')) {
            s = s.slice(1, -1).replace(/""/g, '"');
          }
          return s.trim();
        };

        term = cleanVal(matches[0]);
        definition = matches.slice(1).map(cleanVal).join(", ").trim();
      } else {
        const parts = line.split(",");
        term = parts[0]?.trim() || "";
        definition = parts.slice(1).join(",").trim();
      }
    }
    // Trường hợp 3: Phân tách bằng dấu gạch ngang " - " hoặc dấu ":"
    else if (line.includes(" - ")) {
      const parts = line.split(" - ");
      term = parts[0]?.trim() || "";
      definition = parts.slice(1).join(" - ").trim();
    } else if (line.includes(":")) {
      const parts = line.split(":");
      term = parts[0]?.trim() || "";
      definition = parts.slice(1).join(":").trim();
    } else {
      // Không tìm thấy dấu phân cách rõ ràng
      term = line;
      definition = "";
    }

    // Làm sạch dấu ngoặc kép bọc ngoài
    term = term.replace(/^["']|["']$/g, "").trim();
    definition = definition.replace(/^["']|["']$/g, "").trim();

    if (!term) continue;

    const parsed = parseJapaneseTerm(term, definition, defaultLevel);

    const parsedKanji = parsed.kanji || term;
    const cleanMeaning = translateToVietnamese(parsedKanji, definition) || definition || "Chưa có nghĩa";

    items.push({
      id: `parsed-${index + 1}-${Date.now()}`,
      kanji: parsedKanji,
      furigana: parsed.furigana,
      romaji: parsed.romaji,
      meaning: cleanMeaning,
      level: parsed.level,
      wordType: parsed.wordType,
      notes: parsed.notes,
      selected: true,
    });
  }

  return items;
}

/**
 * Đọc file CSV/TSV/TXT từ đối tượng File của trình duyệt
 */
export function readUploadedFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result as string;
      // Xóa BOM (﻿) nếu có
      if (text && text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }
      resolve(text || "");
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Xuất danh sách từ vựng thành file CSV chuẩn có UTF-8 BOM
 */
export function exportToCsv(
  items: Array<{
    kanji: string;
    furigana?: string;
    romaji?: string;
    meaning: string;
    level?: string;
    wordType?: string;
  }>,
  fileName: string = "JTalk_Vocabulary.csv"
): void {
  const header = "Kanji,Furigana,Romaji,Meaning,Level,WordType\n";
  const rows = items.map((item) => {
    const k = `"${(item.kanji || "").replace(/"/g, '""')}"`;
    const f = `"${(item.furigana || "").replace(/"/g, '""')}"`;
    const r = `"${(item.romaji || "").replace(/"/g, '""')}"`;
    const m = `"${(item.meaning || "").replace(/"/g, '""')}"`;
    const l = `"${item.level || "N5"}"`;
    const w = `"${item.wordType || "phrase"}"`;
    return `${k},${f},${r},${m},${l},${w}`;
  });

  const csvContent = "﻿" + header + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
