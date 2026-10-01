"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "@/lib/react-router-compat";
import {
  ArrowLeft,
  Play,
  Pause,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Download,
  Repeat,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { practiceService } from "@/services/practice.service";
import { curriculumService } from "@/services/curriculum.service";
import { formatJapaneseForSpeech } from "@/utils/japanesePhrasing";
import type { VideoSubtitle, Lesson } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

type StudyMode = "shadowing" | "pronunciation" | "listening";

export interface DemoLesson {
  id: string;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3";
  senseiName: string;
  senseiRole: string;
  senseiAvatar: string;
  duration: string;
  youtubeId?: string;
  videoUrl?: string;
  channelName?: string;
  subtitles: VideoSubtitle[];
}

function extractYouTubeId(urlOrId?: string): string | undefined {
  if (!urlOrId) return undefined;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : undefined;
}

function formatSeconds(sec?: number): string {
  if (typeof sec !== "number" || isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const DEMO_LESSONS: DemoLesson[] = [
  {
    id: "lesson-keigo",
    title: "敬語って何？ - Khái niệm Kính ngữ & 3 phân loại chính",
    description: "Nhập môn Kính ngữ tiếng Nhật: Phân biệt Tôn kính ngữ (Sonkeigo), Khiêm nhường ngữ (Kenjougo) và Thể lịch sự (Teineigo).",
    level: "N4",
    senseiName: "Sensei Yuki",
    senseiRole: "Tokyo Accent Specialist",
    senseiAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    duration: "4 phút",
    youtubeId: "1iDoq9sGX1s",
    subtitles: [
      {
        startTime: 0,
        endTime: 6,
        japanese: "このチャンネルで敬語についての動画を出したことがなかったんですけれども、",
        furigana: "このチャンネルでけいごについてのどうがをだしたことがなかったんですけれども、",
        romaji: "Kono channeru de keigo ni tsuite no douga o dashita koto ga nakatta n desu keredomo,",
        translation: "Dù từ trước đến nay tôi chưa từng làm video nói về kính ngữ trên kênh này,",
        words: [
          { kanji: "この", furigana: "" },
          { kanji: "チャンネル", furigana: "" },
          { kanji: "で", furigana: "" },
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "についての", furigana: "" },
          { kanji: "動画", furigana: "どうが" },
          { kanji: "を", furigana: "" },
          { kanji: "出", furigana: "だ" },
          { kanji: "したことがなかったんですけれども、", furigana: "" },
        ],
      },
      {
        startTime: 6,
        endTime: 14,
        japanese: "これから少しずつビデオを出していこうと思います",
        furigana: "これからすこしずつビデオをだしていこうとおもいます",
        romaji: "Korekara sukoshizutsu bideo o dashite ikou to omoimasu",
        translation: "nhưng từ giờ tôi định sẽ dần dần đăng các video về chủ đề này.",
        words: [
          { kanji: "これから", furigana: "" },
          { kanji: "少しずつ", furigana: "すこしずつ" },
          { kanji: "ビデオ", furigana: "" },
          { kanji: "を", furigana: "" },
          { kanji: "出していこう", furigana: "だしていこう" },
          { kanji: "と", furigana: "" },
          { kanji: "思い", furigana: "おも" },
          { kanji: "ます", furigana: "" },
        ],
      },
      {
        startTime: 14,
        endTime: 22,
        japanese: "みなさん、これから一緒に頑張っていきましょう。",
        furigana: "みなさん、これからいっしょにがんばっていきましょう。",
        romaji: "Minasan, korekara issho ni gambarimashou.",
        translation: "Mọi người ơi, từ nay chúng ta hãy cùng nhau cố gắng nhé.",
        words: [
          { kanji: "みなさん", furigana: "" },
          { kanji: "これから", furigana: "" },
          { kanji: "一緒に", furigana: "いっしょに" },
          { kanji: "頑張って", furigana: "がんばって" },
          { kanji: "いきましょう", furigana: "" },
        ],
      },
      {
        startTime: 22,
        endTime: 35,
        japanese: "今回は敬語のレッスン第1回ということで",
        furigana: "こんかいはけいごのレッスンだいいっかいということで",
        romaji: "Konkai wa keigo no ressun daiikkai to iu koto de",
        translation: "Lần này là bài học Kính ngữ số 1,",
        words: [
          { kanji: "今回", furigana: "こんかい" },
          { kanji: "は", furigana: "" },
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "の", furigana: "" },
          { kanji: "レッスン", furigana: "" },
          { kanji: "第1回", furigana: "だいいっかい" },
          { kanji: "ということで", furigana: "" },
        ],
      },
      {
        startTime: 35,
        endTime: 52,
        japanese: "あまり難しい話はしません。",
        furigana: "あまりむずかしいはなしはしません。",
        romaji: "Amari muzukashii hanashi wa shimasen.",
        translation: "nên tôi sẽ không nói những chuyện quá phức tạp đâu.",
        words: [
          { kanji: "あまり", furigana: "" },
          { kanji: "難しい", furigana: "むずかしい" },
          { kanji: "話", furigana: "はなし" },
          { kanji: "は", furigana: "" },
          { kanji: "しません", furigana: "" },
        ],
      },
      {
        startTime: 52,
        endTime: 70,
        japanese: "今回は敬語って何？というお話をしようと思います。",
        furigana: "こんかいはけいごってなん？というおはなしをしようとおもいます。",
        romaji: "Konkai wa keigo tte nan? to iu ohanashi o shiyou to omoimasu.",
        translation: "Lần này tôi dự định sẽ chia sẻ câu chuyện: 'Kính ngữ rốt cuộc là gì?'.",
        words: [
          { kanji: "今回", furigana: "こんかい" },
          { kanji: "は", furigana: "" },
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "って", furigana: "" },
          { kanji: "何", furigana: "なん" },
          { kanji: "？という", furigana: "" },
          { kanji: "お話", furigana: "おはなし" },
          { kanji: "をしようと", furigana: "" },
          { kanji: "思い", furigana: "おも" },
          { kanji: "ます", furigana: "" },
        ],
      },
      {
        startTime: 70,
        endTime: 85,
        japanese: "もうある程度日本語を勉強している人は",
        furigana: "もうあるていどにほんごをべんきょうしているひとは",
        romaji: "Mou aruteido nihongo o benkyou shite iru hito wa",
        translation: "Có thể những bạn đã học tiếng Nhật ở một trình độ nhất định",
        words: [
          { kanji: "もう", furigana: "" },
          { kanji: "ある程度", furigana: "あるていど" },
          { kanji: "日本語", furigana: "にほんご" },
          { kanji: "を", furigana: "" },
          { kanji: "勉強している", furigana: "べんきょうしている" },
          { kanji: "人", furigana: "ひと" },
          { kanji: "は", furigana: "" },
        ],
      },
      {
        startTime: 85,
        endTime: 98,
        japanese: "もうそんなの知ってるよと思うかもしれませんが",
        furigana: "もうそんなのしってるよとおもうかもしれませんが",
        romaji: "Mou sonna no shitteru yo to omou kamoshiremasen ga",
        translation: "sẽ nghĩ rằng 'Ôi điều đó tôi biết rồi mà', nhưng...",
        words: [
          { kanji: "もう", furigana: "" },
          { kanji: "そんなの", furigana: "" },
          { kanji: "知ってるよ", furigana: "しってるよ" },
          { kanji: "と", furigana: "" },
          { kanji: "思う", furigana: "おもう" },
          { kanji: "かもしれませんが", furigana: "" },
        ],
      },
      {
        startTime: 98,
        endTime: 115,
        japanese: "この敬語って何？というのをしっかり説明できる人は少ないと思います。",
        furigana: "このけいごってなん？というのをしっかりせつめいできるひとはすくないとおもいます。",
        romaji: "Kono keigo tte nan? to iu no o shikkari setsumei dekiru hito wa sukunai to omoimasu.",
        translation: "Thực chất kính ngữ là gì? Tôi nghĩ rất ít người có thể giải thích cặn kẽ được.",
        words: [
          { kanji: "この", furigana: "" },
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "って", furigana: "" },
          { kanji: "何", furigana: "なん" },
          { kanji: "？というのをしっかり", furigana: "" },
          { kanji: "説明", furigana: "せつめい" },
          { kanji: "できる", furigana: "" },
          { kanji: "人", furigana: "ひと" },
          { kanji: "は", furigana: "" },
          { kanji: "少な", furigana: "すくな" },
          { kanji: "いと", furigana: "" },
          { kanji: "思い", furigana: "おも" },
          { kanji: "ます", furigana: "" },
        ],
      },
      {
        startTime: 115,
        endTime: 140,
        japanese: "敬語には、丁寧語、尊敬語、謙譲語の3種類があります。",
        furigana: "けいごには、ていねいご、そんけいご、けんじょうごのさんしゅるいがあります。",
        romaji: "Keigo ni wa, teineigo, sonkeigo, kenjougo no sanshurui ga arimasu.",
        translation: "Trong kính ngữ có 3 loại: thể lịch sự, tôn kính ngữ và khiêm nhường ngữ.",
        words: [
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "には、", furigana: "" },
          { kanji: "丁寧語", furigana: "ていねいご" },
          { kanji: "、", furigana: "" },
          { kanji: "尊敬語", furigana: "そんけいご" },
          { kanji: "、", furigana: "" },
          { kanji: "謙譲語", furigana: "けんじょうご" },
          { kanji: "の", furigana: "" },
          { kanji: "3種類", furigana: "さんしゅるい" },
          { kanji: "があります。", furigana: "" },
        ],
      },
      {
        startTime: 140,
        endTime: 185,
        japanese: "丁寧語は「です・ます」を使って、誰に対しても丁寧に話す言葉です。",
        furigana: "ていねいごは「です・ます」をつかって、だれにたいしてもていねいにはなすことばです。",
        romaji: "Teineigo wa 'desu, masu' o tsukatte, dare ni taishite mo teinei ni hanasu kotoba desu.",
        translation: "Thể lịch sự dùng đuôi 'desu, masu' để nói chuyện nhã nhặn với bất kỳ ai.",
        words: [
          { kanji: "丁寧語", furigana: "ていねいご" },
          { kanji: "は「です・ます」を", furigana: "" },
          { kanji: "使", furigana: "つか" },
          { kanji: "って、", furigana: "" },
          { kanji: "誰", furigana: "だれ" },
          { kanji: "に対しても", furigana: "" },
          { kanji: "丁寧", furigana: "ていねい" },
          { kanji: "に", furigana: "" },
          { kanji: "話", furigana: "はな" },
          { kanji: "す", furigana: "" },
          { kanji: "言葉", furigana: "ことば" },
          { kanji: "です。", furigana: "" },
        ],
      },
    ],
  },
  {
    id: "lesson-baito",
    title: "アルバイトの面接 - Phỏng vấn xin việc thêm tại Combini",
    description: "Kịch bản phỏng vấn Baito thực tế: Giới thiệu bản thân, lịch trình làm việc và thái độ giao tiếp chuẩn Nhật.",
    level: "N5",
    senseiName: "Sensei Kenji",
    senseiRole: "Baito & Business Coach",
    senseiAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    duration: "4 phút",
    youtubeId: "nY9Hdf2Wcw4",
    subtitles: [
      {
        startTime: 0,
        endTime: 5,
        japanese: "はじめまして、本日は面接のお時間をいただきありがとうございます。",
        furigana: "はじめまして、ほんじつはめんせつのおじかんをいただきありがとうございます。",
        romaji: "Hajimemashite, honjitsu wa mensetsu no ojikan o itadaki arigatou gozaimasu.",
        translation: "Rất vui được gặp anh/chị, cảm ơn anh/chị vì đã dành thời gian phỏng vấn hôm nay.",
        words: [
          { kanji: "初", furigana: "はじ" },
          { kanji: "めまして、", furigana: "" },
          { kanji: "本日", furigana: "ほんじつ" },
          { kanji: "は", furigana: "" },
          { kanji: "面接", furigana: "めんせつ" },
          { kanji: "のお", furigana: "" },
          { kanji: "時間", furigana: "じかん" },
          { kanji: "をいただきありがとうございます。", furigana: "" },
        ],
      },
      {
        startTime: 5,
        endTime: 10,
        japanese: "ベトナムから参りましたナムと申します。どうぞよろしくお願いします。",
        furigana: "ベトナムからまいりましたナムともうします。どうぞよろしくおねがいします。",
        romaji: "Betonamu kara mairimashita Namu to moushimasu. Douzo yoroshiku onegaishimasu.",
        translation: "Tôi là Nam, đến từ Việt Nam. Rất mong được anh/chị chiếu cố và giúp đỡ.",
        words: [
          { kanji: "ベトナムから", furigana: "" },
          { kanji: "参", furigana: "まい" },
          { kanji: "りましたナムと", furigana: "" },
          { kanji: "申", furigana: "もう" },
          { kanji: "します。どうぞよろしくお", furigana: "" },
          { kanji: "願", furigana: "ねが" },
          { kanji: "いします。", furigana: "" },
        ],
      },
      {
        startTime: 10,
        endTime: 16,
        japanese: "履歴書をお持ちしましたので、こちらをご確認いただけますでしょうか。",
        furigana: "りれきしょをおもちしましたので、こちらをごかくにんいただけますでしょうか。",
        romaji: "Rirekisho o omochi shimashita node, kochira o gokakunin itadakemasu deshou ka.",
        translation: "Tôi đã mang theo sơ yếu lý lịch, xin phép gửi anh/chị kiểm tra qua ạ.",
        words: [
          { kanji: "履歴書", furigana: "りれきしょ" },
          { kanji: "をお", furigana: "" },
          { kanji: "持", furigana: "も" },
          { kanji: "ちしましたので、こちらをご", furigana: "" },
          { kanji: "確認", furigana: "かくにん" },
          { kanji: "いただけますでしょうか。", furigana: "" },
        ],
      },
      {
        startTime: 16,
        endTime: 21,
        japanese: "週に3日、平日の夕方5時からシフトに入ることができます。",
        furigana: "しゅうにみっか、へいじつのゆうがたごじからシフトにはいることができます。",
        romaji: "Shuu ni mikka, heijitsu no yuugata goji kara shifuto ni hairu koto ga dekimasu.",
        translation: "Một tuần 3 ngày, tôi có thể nhận ca làm việc từ 5 giờ chiều các ngày trong tuần.",
        words: [
          { kanji: "週", furigana: "しゅう" },
          { kanji: "に", furigana: "" },
          { kanji: "3日", furigana: "みっか" },
          { kanji: "、", furigana: "" },
          { kanji: "平日", furigana: "へいじつ" },
          { kanji: "の", furigana: "" },
          { kanji: "夕方", furigana: "ゆうがた" },
          { kanji: "5", furigana: "ご" },
          { kanji: "時", furigana: "じ" },
          { kanji: "からシフトに", furigana: "" },
          { kanji: "入", furigana: "はい" },
          { kanji: "ることができます。", furigana: "" },
        ],
      },
      {
        startTime: 21,
        endTime: 27,
        japanese: "人と接することが好きですので、接客やレジ打ちを一生懸命頑張ります！",
        furigana: "ひととせっすることがすきですので、せっきゃくやレジうちをいっしょうけんめいがんばります！",
        romaji: "Hito to sessuru koto ga suki desu node, sekkyaku ya rejiuchi o isshoukenmei gambarimasu!",
        translation: "Tôi rất thích tương tác với mọi người nên sẽ cố gắng hết mình ở khâu phục vụ và thu ngân!",
        words: [
          { kanji: "人", furigana: "ひと" },
          { kanji: "と", furigana: "" },
          { kanji: "接", furigana: "せっ" },
          { kanji: "することが", furigana: "" },
          { kanji: "好", furigana: "す" },
          { kanji: "きですので、", furigana: "" },
          { kanji: "接客", furigana: "せっきゃく" },
          { kanji: "やレジ", furigana: "" },
          { kanji: "打", furigana: "う" },
          { kanji: "ちを", furigana: "" },
          { kanji: "一生懸命", furigana: "いっしょうけんめい" },
          { kanji: "頑張", furigana: "がんば" },
          { kanji: "ります！", furigana: "" },
        ],
      },
    ],
  },
  {
    id: "lesson-shinjuku",
    title: "新宿駅で乗り換え - Hỏi đường & Chuyển tàu điện Shinjuku",
    description: "Kỹ năng tìm đường ray, chuyển tuyến tàu Yamanote/Metro và nạp thẻ Suica tại ga đông đúc nhất thế giới.",
    level: "N5",
    senseiName: "Sensei Yuki",
    senseiRole: "Tokyo Accent Specialist",
    senseiAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    duration: "3 phút",
    youtubeId: "j413wwBsPyo",
    subtitles: [
      {
        startTime: 0,
        endTime: 5,
        japanese: "すみません、新宿駅に行きたいんですが、どの電車に乗ればいいですか？",
        furigana: "すみません、しんじゅくえきにいきたいんですが、どのでんしゃにのればいいですか？",
        romaji: "Sumimasen, Shinjuku-eki ni ikitai n desu ga, dono densha ni noreba ii desu ka?",
        translation: "Xin lỗi, tôi muốn đi đến ga Shinjuku thì nên lên chuyến tàu nào ạ?",
        words: [
          { kanji: "すみません、", furigana: "" },
          { kanji: "新宿駅", furigana: "しんじゅくえき" },
          { kanji: "に", furigana: "" },
          { kanji: "行", furigana: "い" },
          { kanji: "きたいんですが、どの", furigana: "" },
          { kanji: "電車", furigana: "でんしゃ" },
          { kanji: "に", furigana: "" },
          { kanji: "乗", furigana: "の" },
          { kanji: "ればいいですか？", furigana: "" },
        ],
      },
      {
        startTime: 5,
        endTime: 10,
        japanese: "山手線の外回り、3番ホームから乗ると約15分で到着しますよ。",
        furigana: "やまのてせんのそとまわり、さんばんホームからのるとやくじゅうごふんでとうちゃくしますよ。",
        romaji: "Yamanote-sen no sotomawari, sanban hoomu kara noru to yaku juugofun de touchaku shimasu yo.",
        translation: "Bạn đón tuyến Yamanote vòng ngoài tại đường ray số 3, khoảng 15 phút là đến nơi nhé.",
        words: [
          { kanji: "山手線", furigana: "やまのてせん" },
          { kanji: "の", furigana: "" },
          { kanji: "外回", furigana: "そとまわ" },
          { kanji: "り、", furigana: "" },
          { kanji: "3番", furigana: "さんばん" },
          { kanji: "ホームから", furigana: "" },
          { kanji: "乗", furigana: "の" },
          { kanji: "ると", furigana: "" },
          { kanji: "約15分", furigana: "やくじゅうごふん" },
          { kanji: "で", furigana: "" },
          { kanji: "到着", furigana: "とうちゃく" },
          { kanji: "しますよ。", furigana: "" },
        ],
      },
      {
        startTime: 10,
        endTime: 15,
        japanese: "改札口の横にある券売機で、Suicaのチャージも簡単にできます。",
        furigana: "かいさつぐちのよこにあるけんばいきで、スイカのチャージもかんたんにできます。",
        romaji: "Kaisatsuguchi no yoko ni aru kenbaiki de, Suika no chaaji mo kantan ni dekimasu.",
        translation: "Tại máy bán vé bên cạnh cổng soát vé, bạn cũng có thể nạp tiền thẻ Suica dễ dàng.",
        words: [
          { kanji: "改札口", furigana: "かいさつぐち" },
          { kanji: "の", furigana: "" },
          { kanji: "横", furigana: "よこ" },
          { kanji: "にある", furigana: "" },
          { kanji: "券売機", furigana: "けんばいき" },
          { kanji: "で、Suicaのチャージも", furigana: "" },
          { kanji: "簡単", furigana: "かんたん" },
          { kanji: "にできます。", furigana: "" },
        ],
      },
      {
        startTime: 15,
        endTime: 20,
        japanese: "ご親切に教えていただき、本当にありがとうございました！",
        furigana: "ごしんせつにおしえていただき、ほんとうにありがとうございました！",
        romaji: "Goshinsetsu ni oshiete itadaki, hontou ni arigatou gozaimashita!",
        translation: "Cảm ơn anh/chị rất nhiều vì đã tận tình chỉ dẫn cho tôi!",
        words: [
          { kanji: "ご", furigana: "" },
          { kanji: "親切", furigana: "しんせつ" },
          { kanji: "にお", furigana: "" },
          { kanji: "教", furigana: "おし" },
          { kanji: "えていただき、", furigana: "" },
          { kanji: "本当", furigana: "ほんとう" },
          { kanji: "にありがとうございました！", furigana: "" },
        ],
      },
    ],
  },
  {
    id: "lesson-ramen",
    title: "レストランで注文 - Gọi món và Giao tiếp tại Nhà hàng Nhật Bản",
    description: "Nhập vai tình huống thực tế tại quán ăn Nhật: Đặt bàn, hỏi thực đơn, gọi món Karaage và thanh toán.",
    level: "N5",
    senseiName: "Sakura & Ken",
    senseiRole: "Video Hội Thoại Nhà Hàng",
    senseiAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    duration: "5 phút",
    youtubeId: "WzN_jXl1JGs",
    subtitles: [
      {
        startTime: 0,
        endTime: 6,
        japanese: "みなさん、こんにちは！JTalkへようこそ。さくらです。",
        furigana: "みなさん、こんにちは！ジェートークへようこそ。さくらです。",
        romaji: "Minasan, konnichiwa! JTalk e youkoso. Sakura desu.",
        translation: "Mọi người ơi, xin chào! Chào mừng các bạn đến với JTalk. Mình là Sakura.",
      },
      {
        startTime: 6,
        endTime: 15,
        japanese: "こんにちは、ケンです！さくら先生、今日はレストランでの会話ですね。",
        furigana: "こんにちは、ケンです！さくらせんせい、きょうはレストランでのかいわですね。",
        romaji: "Konnichiwa, Ken desu! Sakura-sensei, kyou wa resutoran de no kaiwa desu ne.",
        translation: "Chào mọi người, mình là Ken! Cô Sakura ơi, hôm nay chúng ta học hội thoại tại nhà hàng đúng không ạ?",
      },
      {
        startTime: 15,
        endTime: 25,
        japanese: "はい！日本のレストランで役に立つ丁寧な表現を一緒に練習しましょう。",
        furigana: "はい！にほんのレストランでやくにたつていねいなひょうげんをいっしょにれんしゅうしましょう。",
        romaji: "Hai! Nihon no resutoran de yaku ni tatsu teinei na hyougen o issho ni renshuu shimashou.",
        translation: "Đúng rồi! Chúng ta hãy cùng nhau luyện tập những biểu hiện lịch sự rất hữu ích khi đi ăn tại nhà hàng Nhật Bản nhé.",
      },
      {
        startTime: 25,
        endTime: 32,
        japanese: "楽しみです！よろしくお願いします。",
        furigana: "たのしみです！よろしくおねがいします。",
        romaji: "Tanoshimi desu! Yoroshiku onegaishimasu.",
        translation: "Thật mong chờ quá! Nhờ cô giúp đỡ ạ.",
      },
      {
        startTime: 32,
        endTime: 45,
        japanese: "それでは、ロールプレイからスタートです！ゆっくり聞いてくださいね。",
        furigana: "それでは、ロールプレイからスタートです！ゆっくりきいてくださいね。",
        romaji: "Soredewa, roorupurei kara sutaato desu! Yukkuri kiite kudasai ne.",
        translation: "Vậy thì, chúng ta bắt đầu bằng phần đóng vai nhé! Mọi người hãy lắng nghe thật chậm rãi nhé.",
      },
      {
        startTime: 60,
        endTime: 67,
        japanese: "いらっしゃいませ！何名様ですか？",
        furigana: "いらっしゃいませ！なんめいさまですか？",
        romaji: "Irasshaimase! Nanmei-sama desu ka?",
        translation: "Kính chào quý khách! Quý khách đi mấy người ạ?",
      },
      {
        startTime: 67,
        endTime: 72,
        japanese: "一人です。",
        furigana: "ひとりです。",
        romaji: "Hitori desu.",
        translation: "Tôi đi một mình.",
      },
      {
        startTime: 72,
        endTime: 80,
        japanese: "かしこまりました。お席にご案内いたします。こちらへどうぞ。",
        furigana: "かしこまりました。おせきにごあんないいたします。こちらへどうぞ。",
        romaji: "Kashikomarimashita. Oseki ni goannai itashimasu. Kochira e douzo.",
        translation: "Tôi đã hiểu rồi ạ. Tôi xin phép dẫn quý khách đến bàn. Xin mời đi hướng này ạ.",
      },
      {
        startTime: 80,
        endTime: 85,
        japanese: "メニューをどうぞ。ご注文がお決まりになりましたら、お呼びください。",
        furigana: "メニューをどうぞ。ごちゅうもんがおきまりになりましたら、およびください。",
        romaji: "Menyuu o douzo. Gochuumon ga okimari ni narimashitara, oyobi kudasai.",
        translation: "Xin gửi thực đơn. Khi nào chọn xong món, quý khách vui lòng gọi tôi nhé.",
      },
      {
        startTime: 85,
        endTime: 95,
        japanese: "はい、ありがとうございます。すみません！注文をお願いします。",
        furigana: "はい、ありがとうございます。すみません！ちゅうもんをおねがいします。",
        romaji: "Hai, arigatou gozaimasu. Sumimasen! Chuumon o onegaishimasu.",
        translation: "Vâng, xin cảm ơn. Xin lỗi! Cho tôi gọi món với ạ.",
      },
      {
        startTime: 95,
        endTime: 105,
        japanese: "まだ決まっていません。本日のおすすめは何ですか？",
        furigana: "まだきまっていません。ほんじつのおすすめはなんですか？",
        romaji: "Mada kimatte imasen. Honjitsu no osusume wa nan desu ka?",
        translation: "Tôi vẫn chưa chọn xong. Món gợi ý hôm nay là gì vậy ạ?",
      },
      {
        startTime: 105,
        endTime: 115,
        japanese: "本日のおすすめは唐揚げとたこ焼きです。どちらも人気があります。",
        furigana: "ほんじつのおすすめはからあげとたこやきです。どちらもにんきがあります。",
        romaji: "Honjitsu no osusume wa karaage to takoyaki desu. Dochira mo ninki ga arimasu.",
        translation: "Món gợi ý hôm nay là gà rán Karaage và bánh bạch tuộc Takoyaki ạ.",
      },
      {
        startTime: 115,
        endTime: 125,
        japanese: "じゃあ、唐揚げを１つお願いします。それと、ビールを１つお願いします。",
        furigana: "じゃあ、からあげをひとつおねがいします。それと、ビールをひとつおねがいします。",
        romaji: "Jaa, karaage o hitotsu onegaishimasu. Sore to, biiru o hitotsu onegaishimasu.",
        translation: "Vậy cho tôi 1 phần gà rán và 1 ly bia nhé.",
      },
      {
        startTime: 125,
        endTime: 135,
        japanese: "お待たせいたしました。唐揚げとビールでございます。ごゆっくりどうぞ。",
        furigana: "おまたせいたしました。からあげとビールでございます。ごゆっくりどうぞ。",
        romaji: "Omatase itashimashita. Karaage to biiru de gozaimasu. Goyukkuri douzo.",
        translation: "Xin lỗi đã để quý khách chờ lâu. Đây là gà rán và bia ạ. Chúc quý khách ngon miệng.",
      },
      {
        startTime: 135,
        endTime: 142,
        japanese: "すみません、お水をください。",
        furigana: "すみません、おみずをください。",
        romaji: "Sumimasen, omizu o kudasai.",
        translation: "Xin lỗi, cho tôi xin chút nước lọc với ạ.",
      },
      {
        startTime: 142,
        endTime: 148,
        japanese: "かしこまりました。すぐにお持ちいたします。",
        furigana: "かしこまりました。すぐにおもちいたします。",
        romaji: "Kashikomarimashita. Sugu ni omochi itashimasu.",
        translation: "Vâng ạ. Tôi sẽ mang ra ngay ạ.",
      },
      {
        startTime: 148,
        endTime: 155,
        japanese: "すみません、お会計をお願いします。",
        furigana: "すみません、おかいけいをおねがいします。",
        romaji: "Sumimasen, okaikei o onegaishimasu.",
        translation: "Xin lỗi, tính tiền giúp tôi với ạ.",
      },
      {
        startTime: 240,
        endTime: 255,
        japanese: "いらっしゃいませ！何名様ですか？",
        furigana: "いらっしゃいませ！なんめいさまですか？",
        romaji: "Irasshaimase! Nanmei-sama desu ka?",
        translation: "Kính chào quý khách! Quý khách đi mấy người ạ? [Luyện nói theo mẫu]",
      },
      {
        startTime: 255,
        endTime: 270,
        japanese: "本日のおすすめは何ですか？",
        furigana: "ほんじつのおすすめはなんですか？",
        romaji: "Honjitsu no osusume wa nan desu ka?",
        translation: "Món gợi ý hôm nay là gì vậy ạ? [Luyện nói theo mẫu]",
      },
      {
        startTime: 270,
        endTime: 285,
        japanese: "唐揚げを１つお願いします。",
        furigana: "からあげをひとつおねがいします。",
        romaji: "Karaage o hitotsu onegaishimasu.",
        translation: "Cho tôi 1 phần gà rán Karaage. [Luyện nói theo mẫu]",
      },
      {
        startTime: 285,
        endTime: 300,
        japanese: "すみません、お水をください。",
        furigana: "すみません、おみずをください。",
        romaji: "Sumimasen, omizu o kudasai.",
        translation: "Xin lỗi, cho tôi xin chút nước lọc. [Luyện nói theo mẫu]",
      },
      {
        startTime: 300,
        endTime: 315,
        japanese: "お会計をお願いします。",
        furigana: "おかいけいをおねがいします。",
        romaji: "Okaikei o onegaishimasu.",
        translation: "Cho tôi tính tiền với ạ. [Luyện nói theo mẫu]",
      },
    ],
  },
];

function findMatchingDemoLesson(id?: string): DemoLesson | undefined {
  if (!id) return undefined;
  const lower = id.toLowerCase();

  // 1. Direct ID match
  const direct = DEMO_LESSONS.find((l) => l.id === id);
  if (direct) return direct;

  // 2. Keyword/Slug matching for restaurant / food / ramen / ordering
  if (
    lower.includes("ramen") ||
    lower.includes("goi-mon") ||
    lower.includes("nha-hang") ||
    lower.includes("restaurant") ||
    lower.includes("an-uong") ||
    lower.includes("chuumon") ||
    lower.includes("order") ||
    lower.includes("mon-an") ||
    lower.includes("quan-an") ||
    lower.includes("cafe") ||
    lower.includes("do-uong") ||
    lower === "topic-2-lesson-1" ||
    lower === "topic-2-lesson-2" ||
    lower === "topic-2-lesson-3" ||
    lower === "topic-4-lesson-1" ||
    lower === "topic-4-lesson-2" ||
    lower === "sc-4" ||
    lower === "sc-8"
  ) {
    return DEMO_LESSONS.find((l) => l.id === "lesson-ramen");
  }

  // 3. Keigo / Kính ngữ
  if (lower.includes("keigo") || lower.includes("kinh-ngu") || lower === "topic-keigo") {
    return DEMO_LESSONS.find((l) => l.id === "lesson-keigo");
  }

  // 4. Shinjuku / Hỏi đường / Ga tàu
  if (
    lower.includes("shinjuku") ||
    lower.includes("station") ||
    lower.includes("ga-tau") ||
    lower.includes("hoi-duong") ||
    lower.includes("topic-3") ||
    lower.includes("topic-5")
  ) {
    return DEMO_LESSONS.find((l) => l.id === "lesson-shinjuku");
  }

  // 5. Baito / Phỏng vấn / Chào hỏi
  if (
    lower.includes("baito") ||
    lower.includes("lam-quen") ||
    lower.includes("chao-hoi") ||
    lower.includes("combini") ||
    lower.includes("konbini") ||
    lower.includes("topic-1")
  ) {
    return DEMO_LESSONS.find((l) => l.id === "lesson-baito");
  }

  return undefined;
}

function formatLessonToDemo(lesson: Lesson): DemoLesson {
  const isKeigo =
    lesson.title?.toLowerCase().includes("kính ngữ") ||
    lesson.title?.toLowerCase().includes("keigo") ||
    lesson.title?.toLowerCase().includes("敬語");

  const isFoodLesson =
    lesson.title?.toLowerCase().includes("gọi món") ||
    lesson.title?.toLowerCase().includes("nhà hàng") ||
    lesson.title?.toLowerCase().includes("ramen") ||
    lesson.title?.toLowerCase().includes("quán") ||
    lesson.title?.toLowerCase().includes("cafe") ||
    lesson.title?.toLowerCase().includes("đồ uống") ||
    lesson.title?.toLowerCase().includes("ăn uống") ||
    lesson.title?.toLowerCase().includes("注文");

  const ytId =
    lesson.youtubeId ||
    extractYouTubeId(lesson.videoUrl) ||
    (isKeigo ? "1iDoq9sGX1s" : undefined);

  let subs = lesson.subtitles || [];
  if (!subs || subs.length === 0) {
    if (lesson.dialogues && lesson.dialogues.length > 0) {
      subs = lesson.dialogues.map((d, idx) => ({
        startTime: idx * 5,
        endTime: (idx + 1) * 5,
        japanese: d.japanese,
        furigana: d.furigana,
        romaji: d.romaji,
        translation: d.translation,
      }));
    } else if (lesson.sampleSentence) {
      subs = [
        {
          startTime: 0,
          endTime: 5,
          japanese: lesson.sampleSentence,
          translation: lesson.translation || "",
        },
      ];
    }
  }

  const defaultSubs = isFoodLesson
    ? (DEMO_LESSONS.find((l) => l.id === "lesson-ramen")?.subtitles || DEMO_LESSONS[0].subtitles)
    : DEMO_LESSONS[0].subtitles;

  return {
    id: lesson._id,
    title: lesson.title,
    description: lesson.description || "",
    level: (lesson.level as "N5" | "N4" | "N3") || "N5",
    senseiName: lesson.channelName || (isFoodLesson ? "Sensei Kenji" : "Sensei Yuki"),
    senseiRole: lesson.channelName
      ? "Video bài giảng bản xứ"
      : isFoodLesson
      ? "Baito & Restaurant Coach"
      : "Tokyo Accent Specialist",
    senseiAvatar:
      lesson.image ||
      (isFoodLesson
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
        : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"),
    duration: lesson.duration || `${lesson.durationMinutes || 5} phút`,
    youtubeId: ytId,
    videoUrl: lesson.videoUrl,
    channelName: lesson.channelName,
    subtitles: subs.length > 0 ? subs : defaultSubs,
  };
}

export const CourseVideoStudyPage = () => {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId: string }>();
  const navigate = useNavigate();

  // Find active lesson from matched demo list or fallback to first
  const initialLesson =
    findMatchingDemoLesson(lessonId) || DEMO_LESSONS[0];
  const [selectedLesson, setSelectedLesson] = useState<DemoLesson>(initialLesson);
  const [loadingLesson, setLoadingLesson] = useState<boolean>(false);
  const [courseLessons, setCourseLessons] = useState<DemoLesson[]>(DEMO_LESSONS);

  const [studyMode, setStudyMode] = useState<StudyMode>("shadowing");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Subtitle visibility toggles
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  const [isAbRepeat, setIsAbRepeat] = useState(false);
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);

  // Shadowing & Speech Recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [evalFeedback, setEvalFeedback] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // YouTube IFrame Player API States & Refs
  const [ytApiReady, setYtApiReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  const ytTimePollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback & State Reference Guards (Prevents stale React closures from dropping continuous sentences)
  const isPlayingRef = useRef<boolean>(false);
  const isAbRepeatRef = useRef<boolean>(false);
  const activeSubIndexRef = useRef<number>(0);
  const playbackRateRef = useRef<number>(1);
  const subtitlesRef = useRef<VideoSubtitle[]>(selectedLesson.subtitles);

  useEffect(() => {
    subtitlesRef.current = selectedLesson.subtitles;
  }, [selectedLesson.subtitles]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isAbRepeatRef.current = isAbRepeat;
  }, [isAbRepeat]);

  useEffect(() => {
    activeSubIndexRef.current = activeSubIndex;
  }, [activeSubIndex]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Load YouTube IFrame API Script with polling fallback for client SPA navigations
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT && (window as any).YT.Player) {
      setYtApiReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).YT && (window as any).YT.Player) {
        setYtApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevReady = (window as any).onYouTubeIframeAPIReady;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      setYtApiReady(true);
      clearInterval(checkInterval);
    };

    const existingTag = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingTag) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Independent container ref for transcript list - ensures 0 window scroll
  const transcriptScrollContainerRef = useRef<HTMLDivElement>(null);
  const subtitleRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const subtitles = selectedLesson.subtitles;
  const currentSub = subtitles[activeSubIndex] || subtitles[0];
  const totalSubtitles = subtitles.length;

  // Helper to cleanly stop any Audio & SpeechSynthesis without resuming paused speech
  const stopAllAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch (_) {}
      audioElementRef.current = null;
    }
    currentUtteranceRef.current = null;
    setIsAiSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      stopAllAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [stopAllAudio]);

  // 1. Dynamic Lesson Loading by lessonId (fetches from API if not a static ID)
  useEffect(() => {
    let isMounted = true;
    if (!lessonId) return;

    // Check direct static demo match first
    const directMatch = DEMO_LESSONS.find((l) => l.id === lessonId);
    if (directMatch) {
      setSelectedLesson(directMatch);
      setActiveSubIndex(0);
      isPlayingRef.current = false;
      setIsPlaying(false);
      stopAllAudio();
      return;
    }

    // Try fetching from Backend API
    const loadFromApi = async () => {
      try {
        setLoadingLesson(true);
        const data = await curriculumService.getLessonById(lessonId);
        if (isMounted && data) {
          const formatted = formatLessonToDemo(data);
          setSelectedLesson(formatted);
          setActiveSubIndex(0);
          isPlayingRef.current = false;
          setIsPlaying(false);
          stopAllAudio();
          return;
        }
      } catch (err) {
        console.warn("Could not fetch lesson from backend API, applying smart fallback:", err);
      } finally {
        if (isMounted) setLoadingLesson(false);
      }

      // If API failed or returned 404 (e.g. mock ID or offline backend):
      if (isMounted) {
        const fallbackMatch = findMatchingDemoLesson(lessonId) || DEMO_LESSONS[0];
        setSelectedLesson(fallbackMatch);
        setActiveSubIndex(0);
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopAllAudio();
      }
    };

    loadFromApi();

    return () => {
      isMounted = false;
    };
  }, [lessonId, stopAllAudio]);

  // 2. Load all lessons of the active Course for the Quick Switcher dropdown
  useEffect(() => {
    let isMounted = true;
    if (!courseId || courseId === "video" || courseId === "demo") {
      setCourseLessons(DEMO_LESSONS);
      return;
    }

    const loadCourseLessons = async () => {
      try {
        const topics = await curriculumService.getCourseTopics(courseId);
        if (!isMounted || !topics || topics.length === 0) {
          setCourseLessons(DEMO_LESSONS);
          return;
        }

        const lessonsPromises = topics.map((t) =>
          curriculumService.getTopicLessons(t._id).catch(() => [] as Lesson[])
        );
        const topicLessonsArrays = await Promise.all(lessonsPromises);
        const allFetchedLessons = topicLessonsArrays.flat();

        if (isMounted) {
          if (allFetchedLessons.length > 0) {
            const formattedList = allFetchedLessons.map(formatLessonToDemo);
            setCourseLessons(formattedList);
          } else {
            setCourseLessons(DEMO_LESSONS);
          }
        }
      } catch (err) {
        console.warn("Could not load course lessons for switcher:", err);
        if (isMounted) setCourseLessons(DEMO_LESSONS);
      }
    };

    loadCourseLessons();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Synchronize subtitles with YouTube video playback time
  const startYouTubeTimeSync = useCallback(() => {
    if (ytTimePollIntervalRef.current) {
      clearInterval(ytTimePollIntervalRef.current);
    }

    ytTimePollIntervalRef.current = setInterval(() => {
      if (!ytPlayerRef.current || typeof ytPlayerRef.current.getCurrentTime !== "function") {
        return;
      }

      try {
        const currentTime = ytPlayerRef.current.getCurrentTime();
        if (typeof currentTime !== "number" || isNaN(currentTime)) return;

        const subs = subtitlesRef.current || [];
        if (!subs || subs.length === 0) return;

        // A-B Repeat Mode support for looping current subtitle
        if (isAbRepeatRef.current) {
          const activeSub = subs[activeSubIndexRef.current];
          if (activeSub && typeof activeSub.endTime === "number" && currentTime >= activeSub.endTime) {
            ytPlayerRef.current.seekTo(activeSub.startTime || 0, true);
            return;
          }
        }

        // 1. Exact range matching: startTime <= currentTime < endTime
        let matchedIndex = -1;
        for (let i = 0; i < subs.length; i++) {
          const sub = subs[i];
          const start = typeof sub.startTime === "number" ? sub.startTime : 0;
          const nextStart = subs[i + 1] && typeof subs[i + 1].startTime === "number" ? subs[i + 1].startTime : start + 6;
          const end = typeof sub.endTime === "number" && sub.endTime > start ? sub.endTime : nextStart;

          if (currentTime >= (start - 0.05) && currentTime < end) {
            matchedIndex = i;
            break;
          }
        }

        // 2. Fallback: match the latest started subtitle
        if (matchedIndex === -1) {
          for (let i = subs.length - 1; i >= 0; i--) {
            const start = typeof subs[i].startTime === "number" ? subs[i].startTime : 0;
            if (currentTime >= start) {
              matchedIndex = i;
              break;
            }
          }
        }

        // 3. Fallback: before the first subtitle starts
        if (matchedIndex === -1 && subs.length > 0) {
          matchedIndex = 0;
        }

        if (matchedIndex !== -1 && matchedIndex !== activeSubIndexRef.current) {
          activeSubIndexRef.current = matchedIndex;
          setActiveSubIndex(matchedIndex);
        }
      } catch (_) {}
    }, 100);
  }, []);

  const stopYouTubeTimeSync = useCallback(() => {
    if (ytTimePollIntervalRef.current) {
      clearInterval(ytTimePollIntervalRef.current);
      ytTimePollIntervalRef.current = null;
    }
  }, []);

  // Initialize and synchronize YouTube Player
  useEffect(() => {
    if (!ytApiReady || !selectedLesson.youtubeId) return;

    // If player already exists, load the new video immediately
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.loadVideoById === "function") {
          ytPlayerRef.current.loadVideoById(selectedLesson.youtubeId);
          return;
        } else if (typeof ytPlayerRef.current.cueVideoById === "function") {
          ytPlayerRef.current.cueVideoById(selectedLesson.youtubeId);
          return;
        }
      } catch (_) {}
    }

    const container = document.getElementById("jtalk-yt-player");
    if (!container) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ytPlayerRef.current = new (window as any).YT.Player("jtalk-yt-player", {
        videoId: selectedLesson.youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (event: any) => {
            try {
              event.target.setPlaybackRate(playbackRateRef.current);
            } catch (_) {}
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (event: any) => {
            if (event.data === 1) { // PLAYING
              isPlayingRef.current = true;
              setIsPlaying(true);
              stopAllAudio();
              startYouTubeTimeSync();
            } else if (event.data === 2 || event.data === 0) { // PAUSED or ENDED
              isPlayingRef.current = false;
              setIsPlaying(false);
              stopYouTubeTimeSync();
            }
          },
        },
      });
    } catch (err) {
      console.warn("YouTube player init error:", err);
    }

    return () => {
      stopYouTubeTimeSync();
    };
  }, [ytApiReady, selectedLesson.youtubeId, startYouTubeTimeSync, stopYouTubeTimeSync, stopAllAudio]);

  // Clean up YouTube time poll & instance on unmount
  useEffect(() => {
    return () => {
      stopYouTubeTimeSync();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [stopYouTubeTimeSync]);

  // Jump to specific sentence and seek YouTube video
  const handleSelectSubtitle = useCallback(
    (idx: number, autoPlay = true) => {
      setActiveSubIndex(idx);
      activeSubIndexRef.current = idx;
      setUserTranscript("");
      setEvalScore(null);
      setEvalFeedback(null);

      // Cleanly stop any synthetic audio or TTS
      stopAllAudio();

      const currentSubtitles = subtitlesRef.current || [];
      const targetSub = currentSubtitles[idx];
      const targetTime = typeof targetSub?.startTime === "number" ? targetSub.startTime : idx * 5;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(targetTime, true);
          if (autoPlay) {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            isPlayingRef.current = true;
          } else {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        } catch (err) {
          console.warn("YouTube seek error:", err);
        }
      }
    },
    [stopAllAudio]
  );

  // ISOLATED AUTO-SCROLL: Scrolls ONLY the transcript container, NEVER the window or video!
  useEffect(() => {
    const container = transcriptScrollContainerRef.current;
    const element = subtitleRefs.current[activeSubIndex];
    if (container && element) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      const targetScroll = relativeTop - container.clientHeight / 2 + elementRect.height / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [activeSubIndex]);

  // Toggle Video Play / Pause
  const togglePlayPause = () => {
    stopAllAudio();
    if (ytPlayerRef.current) {
      try {
        const state = ytPlayerRef.current.getPlayerState?.();
        if (state === 1) { // Currently PLAYING
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
          isPlayingRef.current = false;
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          isPlayingRef.current = true;
        }
      } catch (_) {
        if (isPlayingRef.current) {
          ytPlayerRef.current.pauseVideo?.();
          setIsPlaying(false);
          isPlayingRef.current = false;
        } else {
          ytPlayerRef.current.playVideo?.();
          setIsPlaying(true);
          isPlayingRef.current = true;
        }
      }
    }
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    playbackRateRef.current = rate;
    if (ytPlayerRef.current?.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch (_) {}
    }
  };

  const handlePrevSubtitle = () => {
    if (activeSubIndex > 0) {
      handleSelectSubtitle(activeSubIndex - 1, true);
    }
  };

  const handleNextSubtitle = () => {
    if (activeSubIndex < subtitles.length - 1) {
      handleSelectSubtitle(activeSubIndex + 1, true);
    }
  };

  const handleReplayCurrent = () => {
    handleSelectSubtitle(activeSubIndex, true);
  };

  // Shadowing Recording with Web Speech API
  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.");
      return;
    }

    try {
      isPlayingRef.current = false;
      stopAllAudio();
      setIsPlaying(false);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      }
      setUserTranscript("");
      setEvalScore(null);
      setEvalFeedback(null);
      isRecordingRef.current = true;
      setIsRecording(true);

      const rec = new SpeechRecognition();
      rec.lang = "ja-JP";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        isRecordingRef.current = true;
        setIsRecording(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join("");
        setUserTranscript(text);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        console.warn("Shadowing speech recognition notice:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Lỗi micro ghi âm. Vui lòng kiểm tra quyền micro.");
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      };

      rec.onend = () => {
        if (isRecordingRef.current) {
          try {
            rec.start();
          } catch (_) {}
        } else {
          setIsRecording(false);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);

    // Scoring calculation based on transcript accuracy
    setTimeout(() => {
      const target = currentSub.japanese.replace(/[、。！？\s]/g, "");
      const spoken = userTranscript.replace(/[、。！？\s]/g, "");

      if (!spoken || spoken.length === 0) {
        toast.warning("Chưa ghi nhận được giọng nói. Bạn hãy bấm Micro và đọc đuổi theo câu mẫu nhé!");
        setEvalScore(null);
        setEvalFeedback(null);
        return;
      }

      // Levenshtein / character similarity metric
      let matches = 0;
      for (let i = 0; i < spoken.length; i++) {
        if (target.includes(spoken[i])) matches++;
      }
      const similarity = Math.min(100, Math.round((matches / Math.max(target.length, 1)) * 100));
      const score = Math.max(45, similarity);

      setEvalScore(score);
      if (score >= 90) {
        setEvalFeedback("Xuất sắc! Ngữ điệu Tokyo chuẩn xác, phát âm rất tự nhiên.");
        toast.success(`Điểm Shadowing: ${score}/100 • Xuất sắc!`);
      } else {
        setEvalFeedback("Khá tốt! Chú ý ngắt nhịp và trường âm để giọng nói trôi chảy hơn nhé.");
        toast.info(`Điểm Shadowing: ${score}/100`);
      }
    }, 400);
  }, [currentSub, userTranscript]);

  // Clean segment words for Furigana rendering
  const renderFuriganaSentence = (sub: VideoSubtitle) => {
    if (sub.words && sub.words.length > 0) {
      return (
        <div className="flex flex-wrap items-end justify-center gap-x-0.5 gap-y-1 font-jp leading-relaxed">
          {sub.words.map((w, idx) => {
            const hasFuri = showFurigana && w.furigana && w.furigana.trim().length > 0;
            if (hasFuri) {
              return (
                <ruby key={idx} className="text-lg sm:text-2xl font-black text-white hover:text-rose-300 transition-colors">
                  {w.kanji}
                  <rt className="text-rose-400 font-bold">{w.furigana}</rt>
                </ruby>
              );
            }
            return (
              <span key={idx} className="text-lg sm:text-2xl font-black text-white hover:text-rose-200 transition-colors">
                {w.kanji}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <p className="text-lg sm:text-2xl font-black text-white font-jp text-center leading-relaxed">
        {sub.japanese}
      </p>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-100 dark:bg-[#090d14] flex flex-col font-sans transition-colors overflow-x-hidden lg:overflow-hidden select-text">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & LESSON SELECTOR */}
      {/* ============================================================ */}
      <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20 shadow-2xs">
        {/* Left: Back button & Lesson Dropdown */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => (courseId ? navigate(`/courses/${courseId}`) : navigate("/courses"))}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Quick Lesson Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLessonDropdown((prev) => !prev)}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-left hover:bg-rose-100/80 transition cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-3xs font-extrabold">
                    {selectedLesson.level}
                  </span>
                  <span className="text-2xs sm:text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                    {selectedLesson.title}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu for Course Lessons */}
            {showLessonDropdown && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in-50 duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách bài học khóa này
                  </span>
                  <span className="text-3xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    {courseLessons.length} bài
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 scrollbar-thin">
                  {courseLessons.map((l) => {
                    const isSelected = l.id === selectedLesson.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelectedLesson(l);
                          setActiveSubIndex(0);
                          setShowLessonDropdown(false);
                          setIsPlaying(false);
                          stopAllAudio();
                          if (courseId) {
                            navigate(`/courses/${courseId}/lesson/${l.id}`);
                          }
                          toast.success(`Đã chuyển sang bài: ${l.title}`);
                        }}
                        type="button"
                        className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 font-bold border border-rose-200 dark:border-rose-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-3xs font-extrabold px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded">
                              {l.level}
                            </span>
                            <p className="text-xs truncate">{l.title}</p>
                          </div>
                          {l.description && (
                            <p className="text-3xs text-slate-400 truncate mt-0.5">{l.description}</p>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Study Mode Toggles & Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setStudyMode("shadowing")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              studyMode === "shadowing"
                ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-rose-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-amber-300" />
            <span>Shadowing</span>
          </button>

          <button
            onClick={() => setStudyMode("pronunciation")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              studyMode === "pronunciation"
                ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-rose-500/20"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            <Mic className="w-3.5 h-3.5 animate-pulse text-rose-500 dark:text-rose-400" />
            <span className="hidden sm:inline">Phát âm</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MASTER VIDEO LEARNING & SHADOWING WORKSPACE */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: CINEMA YOUTUBE PLAYER & DOCKED INTERACTIVE SUBTITLE DOCK */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-4">
          {/* Video Metadata Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedLesson.channelName || "Video Bài Giảng Bản Xứ"}
              </span>
              <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                HD 1080p
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                Câu {activeSubIndex + 1}/{totalSubtitles}
              </span>
            </div>
          </div>

          {/* 1. Cinema 16:9 YouTube Player */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 shrink-0">
            <div id="jtalk-yt-player" className="w-full h-full" />
          </div>

          {/* 2. Docked Interactive Subtitle Bar */}
          <div className="w-full bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 shrink-0">
            {/* Furigana Sentence & Vietnamese Translation */}
            <div className="text-center space-y-2 py-1">
              {showSubtitles && (
                <>
                  <div className="min-h-[50px] flex items-center justify-center">
                    {renderFuriganaSentence(currentSub)}
                  </div>
                  {showTranslation && currentSub.translation && (
                    <p className="text-xs sm:text-sm text-slate-300 font-normal italic pt-1 border-t border-slate-800/60 max-w-3xl mx-auto line-clamp-2">
                      "{currentSub.translation}"
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Playback Controls & Subtitle Toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
              {/* Playback action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  type="button"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handlePrevSubtitle}
                  disabled={activeSubIndex === 0}
                  type="button"
                  className="w-8 h-8 rounded-full text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                  title="Câu trước đó"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNextSubtitle}
                  disabled={activeSubIndex >= totalSubtitles - 1}
                  type="button"
                  className="w-8 h-8 rounded-full text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                  title="Câu kế tiếp"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={handleReplayCurrent}
                  type="button"
                  className="w-8 h-8 rounded-full text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Nghe lại câu hiện tại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-3xs font-extrabold bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/60 ml-1">
                  Câu {activeSubIndex + 1}/{totalSubtitles}
                </span>
              </div>

              {/* Toggles & Speed chips */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowSubtitles((prev) => !prev)}
                  type="button"
                  className={`px-2.5 py-1 text-3xs font-extrabold rounded-full border transition-all cursor-pointer ${
                    showSubtitles
                      ? "bg-rose-600 text-white border-rose-500"
                      : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Bật/Tắt Phụ đề"
                >
                  Phụ đề
                </button>

                <button
                  onClick={() => setShowFurigana((prev) => !prev)}
                  type="button"
                  className={`px-2.5 py-1 text-3xs font-extrabold rounded-full border transition-all cursor-pointer ${
                    showFurigana
                      ? "bg-rose-600 text-white border-rose-500"
                      : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Bật/Tắt Furigana"
                >
                  Furigana
                </button>

                <button
                  onClick={() => setShowTranslation((prev) => !prev)}
                  type="button"
                  className={`px-2.5 py-1 text-3xs font-extrabold rounded-full border transition-all cursor-pointer ${
                    showTranslation
                      ? "bg-rose-600 text-white border-rose-500"
                      : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Bật/Tắt Bản dịch tiếng Việt"
                >
                  Dịch nghĩa
                </button>

                <button
                  onClick={() => setIsAbRepeat((prev) => !prev)}
                  type="button"
                  className={`px-2.5 py-1 text-3xs font-extrabold rounded-full border transition-all cursor-pointer ${
                    isAbRepeat
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                      : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Lặp lại câu này liên tục (A-B Repeat)"
                >
                  <Repeat className="w-3 h-3 inline mr-1" />
                  A-B
                </button>

                {/* Speed Chips */}
                <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-full px-1.5 py-0.5">
                  {[0.8, 1.0, 1.2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSetPlaybackRate(spd)}
                      type="button"
                      className={`px-1.5 py-0.5 text-3xs font-extrabold rounded-full transition-colors cursor-pointer ${
                        playbackRate === spd
                          ? "bg-rose-600 text-white font-black"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Docked Shadowing Practice Deck */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded text-2xs font-extrabold uppercase">
                    Luyện Shadowing câu {activeSubIndex + 1}
                  </span>
                  <span className="text-2xs text-slate-400 font-medium">
                    (Bấm mic để nhại giọng nói theo video)
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-jp line-clamp-1">
                  {currentSub.japanese}
                </p>
              </div>

              {/* Big Prominent Microphone Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                type="button"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-600/30 scale-105"
                    : "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white shadow-rose-600/20 active:scale-95"
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
                <span>{isRecording ? "Dừng ghi âm & Chấm điểm" : "Bấm Micro & Nhại giọng"}</span>
              </button>
            </div>

            {/* Live Transcript & Pronunciation Feedback */}
            {(isRecording || userTranscript || evalScore !== null) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                    Giọng nói nhận diện được:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-jp truncate">
                    {userTranscript || "Đang lắng nghe giọng của bạn..."}
                  </p>
                  {evalFeedback && (
                    <p className="text-2xs text-rose-600 dark:text-rose-400 font-medium">
                      💡 {evalFeedback}
                    </p>
                  )}
                </div>

                {evalScore !== null && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`px-3 py-1 rounded-xl flex items-center gap-1.5 font-black text-xs border ${
                        evalScore >= 85
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{evalScore} điểm</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ISOLATED SCROLLABLE TRANSCRIPT SIDEBAR */}
        <aside className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 shadow-xs h-[350px] lg:h-auto overflow-hidden">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Kịch bản bài giảng</h2>
              <span className="text-3xs font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                {totalSubtitles} câu
              </span>
            </div>

            <button
              onClick={() => toast.info("Đã tải phụ đề bài học xuống định dạng .SRT")}
              type="button"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Tải phụ đề xuống"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ISOLATED SCROLL CONTAINER: ONLY THIS BOX SCROLLS */}
          <div
            ref={transcriptScrollContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin divide-y divide-slate-100 dark:divide-slate-800/60"
          >
            {subtitles.map((sub, idx) => {
              const isActive = idx === activeSubIndex;

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    subtitleRefs.current[idx] = el;
                  }}
                  onClick={() => handleSelectSubtitle(idx, true)}
                  className={`group flex items-start gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-rose-50/90 dark:bg-rose-950/50 border-l-4 border-rose-500 text-rose-950 dark:text-rose-200 shadow-2xs font-semibold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {/* Timestamp Badge & Play Button */}
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSubtitle(idx, true);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isActive
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-rose-500 group-hover:text-white"
                      }`}
                      title={`Nhảy tới ${formatSeconds(sub.startTime)}`}
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive
                          ? "bg-rose-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-rose-600"
                      }`}
                    >
                      {formatSeconds(sub.startTime)}
                    </span>
                  </div>

                  {/* Japanese text & Furigana & Translation */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm leading-relaxed font-jp ${
                        isActive ? "font-bold text-rose-950 dark:text-rose-200" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {sub.japanese}
                    </p>

                    {showFurigana && sub.furigana && (
                      <p className="text-3xs text-rose-600 dark:text-rose-400 font-semibold font-jp">
                        {sub.furigana}
                      </p>
                    )}

                    {showTranslation && sub.translation && (
                      <p className="text-2xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                        {sub.translation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseVideoStudyPage;
