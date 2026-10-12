"use client";

import { useState } from "react";
import {
  Sparkles,
  KeyRound,
  FileQuestion,
  BookOpenCheck,
  Volume2,
  Lightbulb,
  X,
} from "lucide-react";
import { soundEffects } from "@/utils/soundEffects";

interface SmartHintCardProps {
  japanese: string;
  expectedAnswer?: string;
  furigana?: string;
  romaji?: string;
  translation?: string;
  onPlayAudio: (text: string) => void;
  isPlayingAudio?: boolean;
  onClose: () => void;
}

type HintLevel = 1 | 2 | 3;

export const SmartHintCard: React.FC<SmartHintCardProps> = ({
  japanese,
  expectedAnswer,
  furigana,
  romaji,
  translation,
  onPlayAudio,
  isPlayingAudio = false,
  onClose,
}) => {
  const [level, setLevel] = useState<HintLevel>(1);

  const targetText = expectedAnswer || japanese;

  const handleSelectLevel = (newLevel: HintLevel) => {
    soundEffects.playHintPop();
    setLevel(newLevel);
  };

  /**
   * Helper: Generate Key Vocabulary words from the sentence
   */
  const extractKeywords = (text: string) => {
    // Common communicative phrase patterns
    const keywordDictionary: Array<{ pattern: RegExp; jp: string; furi: string; vi: string }> = [
      { pattern: /初めまして|はじめまして/, jp: "初めまして", furi: "はじめまして", vi: "Rất vui được gặp bạn" },
      { pattern: /申します|もうします/, jp: "〜と申します", furi: "〜ともうします", vi: "Tên tôi là..." },
      { pattern: /来ました|きました/, jp: "〜から来ました", furi: "〜からきました", vi: "Đến từ..." },
      { pattern: /よろしくお願いします|よろしくおねがいします/, jp: "よろしくお願いします", furi: "よろしくおねがいします", vi: "Rất mong được giúp đỡ" },
      { pattern: /趣味|しゅみ/, jp: "趣味", furi: "しゅみ", vi: "Sở thích" },
      { pattern: /音楽|おんがく/, jp: "音楽を聴く", furi: "おんがくをきく", vi: "Nghe nhạc" },
      { pattern: /散歩|さんぽ/, jp: "散歩する", furi: "さんぽする", vi: "Đi dạo" },
      { pattern: /起きます|おきます/, jp: "起きます", furi: "おきます", vi: "Thức dậy" },
      { pattern: /ジョギング/, jp: "ジョギング", furi: "ジョギング", vi: "Chạy bộ" },
      { pattern: /注文|ちゅうもん/, jp: "注文", furi: "ちゅうもん", vi: "Gọi món / Đặt hàng" },
      { pattern: /カフェラテ|コーヒー/, jp: "カフェラテ", furi: "カフェラテ", vi: "Cà phê latte" },
      { pattern: /ください/, jp: "〜をください", furi: "〜をください", vi: "Xin vui lòng cho tôi..." },
      { pattern: /支払|しはらい|PayPay/, jp: "支払う", furi: "しはらう", vi: "Thanh toán (tiền mặt/PayPay)" },
      { pattern: /駅|えき/, jp: "駅", furi: "えき", vi: "Nhà ga" },
      { pattern: /電車|でんしゃ/, jp: "電車", furi: "でんしゃ", vi: "Tàu điện" },
      { pattern: /チャージ/, jp: "チャージ機", furi: "チャージき", vi: "Máy nạp thẻ Suica" },
      { pattern: /自己PR|強み|つよみ/, jp: "強み", furi: "つよみ", vi: "Điểm mạnh / Thế mạnh" },
      { pattern: /問題解決/, jp: "問題解決力", furi: "もんだいかいけつりょく", vi: "Kỹ năng giải quyết vấn đề" },
      { pattern: /進捗|しんちょく/, jp: "進捗", furi: "しんちょく", vi: "Tiến độ công việc" },
      { pattern: /完了|かんりょう/, jp: "完了しております", furi: "かんりょうしております", vi: "Đã hoàn thành xong" },
      { pattern: /居酒屋|いざかや/, jp: "居酒屋", furi: "いざかや", vi: "Quán nhậu kiểu Nhật" },
      { pattern: /乾杯|かんぱい|一杯/, jp: "軽く一杯", furi: "かるくいっぱい", vi: "Đi uống làm một ly nhẹ" },
    ];

    const matched = keywordDictionary.filter((item) => item.pattern.test(text));
    if (matched.length > 0) return matched;

    // Fallback: extract chunks by particles (は, を, に, で, と, が, から)
    const chunks = text
      .split(/(?<=[はをにでとがから。、])/g)
      .map((c) => c.trim())
      .filter((c) => c.length >= 2)
      .slice(0, 3);

    return chunks.map((c) => ({
      jp: c,
      furi: c,
      vi: "Cụm phản xạ chính",
    }));
  };

  /**
   * Helper: Generate a cloze frame with blanks for self-construction
   */
  const generateClozeFrame = (text: string) => {
    // Generate fill-in-the-blank placeholders
    if (text.includes("申します") || text.includes("もうします")) {
      return "初めまして、[Tên của bạn] と申します。[Quê quán / Đất nước] から来ました。";
    }
    if (text.includes("趣味") || text.includes("しゅみ")) {
      return "私の趣味は [Sở thích] ことです。休みの日はよく [Hoạt động] します。";
    }
    if (text.includes("ください")) {
      return "[Tên đồ uống / Món ăn] をひとつと、[Món phụ] をください。";
    }
    if (text.includes("支払") || text.includes("PayPay")) {
      return "[Phương thức thanh toán: PayPay / 現金] で支払いたいのですが、よろしいですか？";
    }
    if (text.includes("駅") || text.includes("電車")) {
      return "すみません、[Địa điểm muốn đến] に行きたいんですが、どの電車に乗ればいいですか？";
    }
    if (text.includes("強み") || text.includes("専攻")) {
      return "私の強みは [Điểm mạnh 1] と [Điểm mạnh 2] です。御社でスキルを活かしたいです。";
    }
    if (text.includes("進捗") || text.includes("完了")) {
      return "現在進捗は [Số %] で、[Hạng mục đã xong] まで順調に完了しております。";
    }
    if (text.includes("飲み") || text.includes("居酒屋")) {
      return "もしご都合がよろしければ、今夜軽く [Đi uống / Ăn tối] に行きませんか？";
    }

    // Default cloze mask: mask middle word
    const words = text.split("");
    const midStart = Math.floor(words.length * 0.25);
    const midEnd = Math.floor(words.length * 0.75);
    const masked = words.slice(0, midStart).join("") + " 【 ...... 】 " + words.slice(midEnd).join("");
    return masked;
  };

  const keywords = extractKeywords(targetText);
  const clozeFrame = generateClozeFrame(targetText);

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 dark:border-amber-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 uppercase tracking-wider">
              Trợ Thủ Gợi Ý Thông Minh (AI Smart Hints)
            </h4>
            <p className="text-3xs sm:text-2xs text-amber-700 dark:text-amber-300/80 font-medium">
              3 cấp độ gợi ý phản xạ linh hoạt mô phỏng phương pháp Speak.com
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="p-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded-full transition-colors cursor-pointer"
          title="Đóng bảng gợi ý"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Tier Segmented Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-amber-100/60 dark:bg-slate-900/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/50">
        <button
          onClick={() => handleSelectLevel(1)}
          type="button"
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-2xs sm:text-xs font-black transition-all cursor-pointer ${
            level === 1
              ? "bg-white dark:bg-amber-500 text-amber-900 dark:text-slate-950 shadow-xs scale-100"
              : "text-amber-800 dark:text-amber-300/70 hover:text-amber-950 dark:hover:text-amber-100"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Cấp 1: Từ khóa</span>
        </button>

        <button
          onClick={() => handleSelectLevel(2)}
          type="button"
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-2xs sm:text-xs font-black transition-all cursor-pointer ${
            level === 2
              ? "bg-white dark:bg-amber-500 text-amber-900 dark:text-slate-950 shadow-xs scale-100"
              : "text-amber-800 dark:text-amber-300/70 hover:text-amber-950 dark:hover:text-amber-100"
          }`}
        >
          <FileQuestion className="w-3.5 h-3.5" />
          <span>Cấp 2: Điền khuyết</span>
        </button>

        <button
          onClick={() => handleSelectLevel(3)}
          type="button"
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-2xs sm:text-xs font-black transition-all cursor-pointer ${
            level === 3
              ? "bg-white dark:bg-amber-500 text-amber-900 dark:text-slate-950 shadow-xs scale-100"
              : "text-amber-800 dark:text-amber-300/70 hover:text-amber-950 dark:hover:text-amber-100"
          }`}
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>Cấp 3: Nguyên câu</span>
        </button>
      </div>

      {/* Tier 1: Key Vocabulary Badges */}
      {level === 1 && (
        <div className="space-y-3 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              💡 Từ vựng then chốt cần ghi nhớ:
            </span>
            <span className="text-3xs text-slate-400 font-medium">Bấm vào từ để nghe phát âm</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {keywords.map((kw, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundEffects.playTap();
                  onPlayAudio(kw.jp);
                }}
                className="group p-2.5 bg-amber-50/80 hover:bg-amber-100/90 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-amber-200/80 dark:border-amber-800/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-97 text-left"
                title={`Bấm để nghe phát âm "${kw.jp}"`}
              >
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {kw.jp}
                  </div>
                  {kw.furi && kw.furi !== kw.jp && (
                    <div className="text-3xs font-semibold text-rose-600 dark:text-rose-400">
                      {kw.furi}
                    </div>
                  )}
                  <div className="text-3xs text-slate-500 dark:text-slate-400 font-medium">
                    {kw.vi}
                  </div>
                </div>
                <Volume2 className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-2xs text-amber-800 dark:text-amber-300 font-medium italic pt-1">
            Gợi ý: Hãy ghép các từ khóa trên thành một câu trọn vẹn theo cấu trúc chủ ngữ + vị ngữ.
          </p>
        </div>
      )}

      {/* Tier 2: Cloze Frame */}
      {level === 2 && (
        <div className="space-y-3 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              ✏️ Khung sườn mẫu câu (Điền vào chỗ trống):
            </span>
            <span className="text-3xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
              Chủ động phản xạ
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-sans">
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {clozeFrame}
            </p>
          </div>

          <p className="text-2xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Thay thế các thông tin trong ngoặc vuông <code>[...]</code> bằng dữ liệu thực tế của bạn hoặc theo bài học để nói tự nhiên nhất.
          </p>
        </div>
      )}

      {/* Tier 3: Complete Shadowing Model */}
      {level === 3 && (
        <div className="space-y-3 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                🎙️ Mẫu câu hoàn chỉnh chuẩn Tokyo:
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans leading-snug">
                {targetText}
              </p>
              {furigana && furigana !== targetText && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 font-sans">
                  {furigana}
                </p>
              )}
              {romaji && (
                <p className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                  {romaji}
                </p>
              )}
              {translation && (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic pt-0.5">
                   Nghĩa: {translation}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onPlayAudio(targetText)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-105 active:scale-95 text-white shadow-md transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center gap-1"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className={`w-5 h-5 ${isPlayingAudio ? "animate-pulse" : ""}`} />
              <span className="text-3xs font-extrabold uppercase tracking-wider">Nghe thử</span>
            </button>
          </div>

          {/* Practical Cultural Context Advice */}
          <div className="text-2xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Mẹo phát âm bản xứ:</span>
            </p>
            <p>
              Hãy chú ý trường âm (nguyên âm kéo dài như <em>〜ます, 〜とう</em>) và ngữ điệu lên xuống nhẹ nhàng ở cuối câu để nghe tự nhiên như người Tokyo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartHintCard;
