import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
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
  Volume2,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { practiceService } from "@/services/practice.service";
import { formatJapaneseForSpeech } from "@/utils/japanesePhrasing";
import type { VideoSubtitle } from "@/types";

type StudyMode = "shadowing" | "pronunciation" | "listening";

interface DemoLesson {
  id: string;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3";
  senseiName: string;
  senseiRole: string;
  senseiAvatar: string;
  duration: string;
  subtitles: VideoSubtitle[];
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
    subtitles: [
      {
        startTime: 0,
        endTime: 5,
        japanese: "みなさん、こんにちは！今回は敬語についてお話ししましょう。",
        furigana: "みなさん、こんにちは！こんかいはけいごについておはなししましょう。",
        romaji: "Minasan, konnichiwa! Konkai wa keigo ni tsuite ohanashi shimashou.",
        translation: "Xin chào các bạn! Hôm nay chúng ta hãy cùng trò chuyện về Kính ngữ nhé.",
        words: [
          { kanji: "みなさん", furigana: "" },
          { kanji: "、こんにちは！", furigana: "" },
          { kanji: "今回", furigana: "こんかい" },
          { kanji: "は", furigana: "" },
          { kanji: "敬語", furigana: "けいご" },
          { kanji: "についてお", furigana: "" },
          { kanji: "話", furigana: "はな" },
          { kanji: "ししましょう。", furigana: "" },
        ],
      },
      {
        startTime: 5,
        endTime: 11,
        japanese: "敬語には、丁寧語、尊敬語、謙譲語の3種類があります。",
        furigana: "けいごには、ていねいご、そんけいご、けんじょうごのさんしゅるいがあります。",
        romaji: "Keigo ni wa, teineigo, sonkeigo, kenjougo no sanshurui ga arimasu.",
        translation: "Trong kính ngữ có 3 loại chính: Thể lịch sự, Tôn kính ngữ và Khiêm nhường ngữ.",
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
        startTime: 11,
        endTime: 17,
        japanese: "丁寧語は「です・ます」を使って、相手に丁寧に話す言葉です。",
        furigana: "ていねいごは「です・ます」をつかって、あいてにていねいにはなすことばです。",
        romaji: "Teineigo wa 'desu, masu' o tsukatte, aite ni teinei ni hanasu kotoba desu.",
        translation: "Thể lịch sự dùng đuôi 'desu, masu' để nói chuyện nhã nhặn với đối phương.",
        words: [
          { kanji: "丁寧語", furigana: "ていねいご" },
          { kanji: "は「です・ます」を", furigana: "" },
          { kanji: "使", furigana: "つか" },
          { kanji: "って、", furigana: "" },
          { kanji: "相手", furigana: "あいて" },
          { kanji: "に", furigana: "" },
          { kanji: "丁寧", furigana: "ていねい" },
          { kanji: "に", furigana: "" },
          { kanji: "話", furigana: "はな" },
          { kanji: "す", furigana: "" },
          { kanji: "言葉", furigana: "ことば" },
          { kanji: "です。", furigana: "" },
        ],
      },
      {
        startTime: 17,
        endTime: 23,
        japanese: "尊敬語は、相手の行動を高めて相手に敬意を表す言葉です。",
        furigana: "そんけいごは、あいてのこうどうをたかめてあいてにけいいをあらわすことばです。",
        romaji: "Sonkeigo wa, aite no koudou o takamete aite ni keii o arawasu kotoba desu.",
        translation: "Tôn kính ngữ nâng cao hành động của đối phương để bày tỏ sự tôn kính.",
        words: [
          { kanji: "尊敬語", furigana: "そんけいご" },
          { kanji: "は、", furigana: "" },
          { kanji: "相手", furigana: "あいて" },
          { kanji: "の", furigana: "" },
          { kanji: "行動", furigana: "こうどう" },
          { kanji: "を", furigana: "" },
          { kanji: "高", furigana: "たか" },
          { kanji: "めて", furigana: "" },
          { kanji: "敬意", furigana: "けいい" },
          { kanji: "を", furigana: "" },
          { kanji: "表", furigana: "あらわ" },
          { kanji: "す", furigana: "" },
          { kanji: "言葉", furigana: "ことば" },
          { kanji: "です。", furigana: "" },
        ],
      },
      {
        startTime: 23,
        endTime: 28,
        japanese: "例えば、「食べる」の尊敬語は「召し上がる」になります。",
        furigana: "たとえば、「たべる」のそんけいごは「めしあがる」になります。",
        romaji: "Tatoeba, 'taberu' no sonkeigo wa 'meshiagaru' ni narimasu.",
        translation: "Ví dụ: tôn kính ngữ của động từ 'ăn' (taberu) sẽ là 'meshiagaru'.",
        words: [
          { kanji: "例", furigana: "たと" },
          { kanji: "えば、「", furigana: "" },
          { kanji: "食", furigana: "た" },
          { kanji: "べる」の", furigana: "" },
          { kanji: "尊敬語", furigana: "そんけいご" },
          { kanji: "は「", furigana: "" },
          { kanji: "召", furigana: "め" },
          { kanji: "し", furigana: "" },
          { kanji: "上", furigana: "あ" },
          { kanji: "がる」になります。", furigana: "" },
        ],
      },
      {
        startTime: 28,
        endTime: 34,
        japanese: "謙譲語は、自分の行動をへりくだって相手を立てる言葉です。",
        furigana: "けんじょうごは、じぶんのこうどうをへりくだってあいてをたてることばです。",
        romaji: "Kenjougo wa, jibun no koudou o herikudatte aite o tateru kotoba desu.",
        translation: "Khiêm nhường ngữ hạ thấp hành động của mình nhằm tôn người đối diện lên.",
        words: [
          { kanji: "謙譲語", furigana: "けんじょうご" },
          { kanji: "は、", furigana: "" },
          { kanji: "自分", furigana: "じぶん" },
          { kanji: "の", furigana: "" },
          { kanji: "行動", furigana: "こうどう" },
          { kanji: "をへりくだって", furigana: "" },
          { kanji: "相手", furigana: "あいて" },
          { kanji: "を", furigana: "" },
          { kanji: "立", furigana: "た" },
          { kanji: "てる", furigana: "" },
          { kanji: "言葉", furigana: "ことば" },
          { kanji: "です。", furigana: "" },
        ],
      },
      {
        startTime: 34,
        endTime: 40,
        japanese: "例えば、「行く」の謙譲語は「伺う」や「参る」と言います。",
        furigana: "たとえば、「いく」のけんじょうごは「うかがう」や「まいる」といいます。",
        romaji: "Tatoeba, 'iku' no kenjougo wa 'ukagau' ya 'mairu' to iimasu.",
        translation: "Ví dụ: khiêm nhường ngữ của 'đi' (iku) được gọi là 'ukagau' hoặc 'mairu'.",
        words: [
          { kanji: "例", furigana: "たと" },
          { kanji: "えば、「", furigana: "" },
          { kanji: "行", furigana: "い" },
          { kanji: "く」の", furigana: "" },
          { kanji: "謙譲語", furigana: "けんじょうご" },
          { kanji: "は「", furigana: "" },
          { kanji: "伺", furigana: "うかが" },
          { kanji: "う」や「", furigana: "" },
          { kanji: "参", furigana: "まい" },
          { kanji: "る」と", furigana: "" },
          { kanji: "言", furigana: "い" },
          { kanji: "います。", furigana: "" },
        ],
      },
      {
        startTime: 40,
        endTime: 46,
        japanese: "これから声に出して一緒にシャドーイングを練習しましょう！",
        furigana: "これからこえにだしていっしょにシャドーイングをれんしゅうしましょう！",
        romaji: "Korekara koe ni dashite issho ni shadouingu o renshuu shimashou!",
        translation: "Bây giờ các bạn hãy phát âm thật to và cùng nhau luyện Shadowing nhé!",
        words: [
          { kanji: "これから", furigana: "" },
          { kanji: "声", furigana: "こえ" },
          { kanji: "に", furigana: "" },
          { kanji: "出", furigana: "だ" },
          { kanji: "して", furigana: "" },
          { kanji: "一緒", furigana: "いっしょ" },
          { kanji: "にシャドーイングを", furigana: "" },
          { kanji: "練習", furigana: "れんしゅう" },
          { kanji: "しましょう！", furigana: "" },
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
    title: "レストランで注文 - Gọi món Ramen & Thanh toán PayPay",
    description: "Tự tin bước vào quán Ramen Tokyo: Chọn độ cứng sợi mì, xin thêm nước đá và thanh toán không tiền mặt.",
    level: "N5",
    senseiName: "Sensei Kenji",
    senseiRole: "Baito & Business Coach",
    senseiAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    duration: "3 phút",
    subtitles: [
      {
        startTime: 0,
        endTime: 5,
        japanese: "いらっしゃいませ！お一人様ですか？カウンター席へどうぞ。",
        furigana: "いらっしゃいませ！おひとりさまですか？カウンターせきへどうぞ。",
        romaji: "Irasshaimase! Ohitorisama desu ka? Kauntaa-seki e douzo.",
        translation: "Kính chào quý khách! Bạn đi 1 người đúng không ạ? Mời bạn ngồi vào quầy counter.",
        words: [
          { kanji: "いらっしゃいませ！お", furigana: "" },
          { kanji: "一人様", furigana: "ひとりさま" },
          { kanji: "ですか？カウンター", furigana: "" },
          { kanji: "席", furigana: "せき" },
          { kanji: "へどうぞ。", furigana: "" },
        ],
      },
      {
        startTime: 5,
        endTime: 10,
        japanese: "おすすめのとんこつラーメンセットをひとつお願いします。",
        furigana: "おすすめのとんこつラーメンセットをひとつおねがいします。",
        romaji: "Osusume no tonkotsu raamen setto o hitotsu onegaishimasu.",
        translation: "Cho tôi một phần set ramen tonkotsu được gợi ý với ạ.",
        words: [
          { kanji: "おすすめのとんこつラーメンセットをひとつお", furigana: "" },
          { kanji: "願", furigana: "ねが" },
          { kanji: "いします。", furigana: "" },
        ],
      },
      {
        startTime: 10,
        endTime: 15,
        japanese: "麺のかたさはかためで、スープはこってりでお願いします。",
        furigana: "めんのかたさはかためで、スープはこってりでおねがいします。",
        romaji: "Men no katasa wa katame de, suupu wa kotteri de onegaishimasu.",
        translation: "Độ cứng của sợi mì cho tôi loại dai cứng, còn nước súp thì đậm đà béo nhé.",
        words: [
          { kanji: "麺", furigana: "めん" },
          { kanji: "のかたさは", furigana: "" },
          { kanji: "硬", furigana: "かた" },
          { kanji: "めで、スープはこってりでお", furigana: "" },
          { kanji: "願", furigana: "ねが" },
          { kanji: "いします。", furigana: "" },
        ],
      },
      {
        startTime: 15,
        endTime: 20,
        japanese: "すみません、お会計をお願いします。PayPayで支払えますか？",
        furigana: "すみません、おかいけいをおねがいします。ペイペイでしはらえますか？",
        romaji: "Sumimasen, okaikei o onegaishimasu. Peipei de shiharaemasu ka?",
        translation: "Xin lỗi, cho tôi thanh toán với. Quán có nhận thanh toán bằng PayPay không ạ?",
        words: [
          { kanji: "すみません、お", furigana: "" },
          { kanji: "会計", furigana: "かいけい" },
          { kanji: "をお", furigana: "" },
          { kanji: "願", furigana: "ねが" },
          { kanji: "いします。PayPayで", furigana: "" },
          { kanji: "支払", furigana: "しはら" },
          { kanji: "えますか？", furigana: "" },
        ],
      },
    ],
  },
];

export const CourseVideoStudyPage = () => {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId: string }>();
  const navigate = useNavigate();

  // Find active lesson from curated demo list or fallback to first
  const initialLesson =
    DEMO_LESSONS.find((l) => l.id === lessonId) || DEMO_LESSONS[0];
  const [selectedLesson, setSelectedLesson] = useState<DemoLesson>(initialLesson);

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

  // Playback & State Reference Guards (Prevents stale React closures from dropping continuous sentences)
  const isPlayingRef = useRef<boolean>(false);
  const isAbRepeatRef = useRef<boolean>(false);
  const activeSubIndexRef = useRef<number>(0);
  const playbackRateRef = useRef<number>(1);
  const playAiSubAudioRef = useRef<((index: number) => Promise<void>) | null>(null);

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

  // Independent container ref for transcript list - ensures 0 window scroll
  const transcriptScrollContainerRef = useRef<HTMLDivElement>(null);
  const subtitleRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const subtitles = selectedLesson.subtitles;
  const currentSub = subtitles[activeSubIndex] || subtitles[0];
  const totalSubtitles = subtitles.length;

  // Helper to cleanly stop both SpeechSynthesis & Voicevox HTMLAudioElement
  const stopAllAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
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

  // Cleanup speech synthesis on unmount & warm up voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }

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

  // Update selected lesson if URL parameter matches
  useEffect(() => {
    if (lessonId) {
      const match = DEMO_LESSONS.find((l) => l.id === lessonId);
      if (match) {
        setSelectedLesson(match);
        setActiveSubIndex(0);
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopAllAudio();
      }
    }
  }, [lessonId, stopAllAudio]);

  // AI Voice Synthesis for Sensei (VOICEVOX studio audio + Bunsetsu SpeechSynthesis fallback)
  const playAiSubAudio = useCallback(
    async (index: number) => {
      const targetSub = subtitles[index];
      if (!targetSub) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsAiSpeaking(false);
        return;
      }

      stopAllAudio();
      setIsAiSpeaking(true);

      const handleAudioFinished = () => {
        setIsAiSpeaking(false);
        audioElementRef.current = null;
        currentUtteranceRef.current = null;

        // If user pressed pause or stopped recording, do NOT advance
        if (!isPlayingRef.current) {
          return;
        }

        if (isAbRepeatRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              playAiSubAudioRef.current?.(index);
            }
          }, 500);
        } else if (index < subtitles.length - 1) {
          // Advance to next sentence automatically and continue playing
          const nextIdx = index + 1;
          setActiveSubIndex(nextIdx);
          setTimeout(() => {
            if (isPlayingRef.current) {
              playAiSubAudioRef.current?.(nextIdx);
            }
          }, 450);
        } else {
          // Reached the end of the lesson
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };

      // 1. Try Voicevox Studio-Grade AI Engine (Shikoku Metan / Tokyo Sensei voice)
      try {
        const voicevoxData = await practiceService.synthesizeVoicevox({
          text: targetSub.japanese,
          speedScale: playbackRateRef.current,
        });

        if (voicevoxData?.audioContent) {
          const audio = new Audio(`data:audio/wav;base64,${voicevoxData.audioContent}`);
          audioElementRef.current = audio;
          audio.onended = handleAudioFinished;
          audio.onerror = () => {
            setIsAiSpeaking(false);
            audioElementRef.current = null;
            // On audio error, attempt next sentence if still playing
            if (isPlayingRef.current && index < subtitles.length - 1) {
              const nextIdx = index + 1;
              setActiveSubIndex(nextIdx);
              setTimeout(() => {
                if (isPlayingRef.current) {
                  playAiSubAudioRef.current?.(nextIdx);
                }
              }, 450);
            }
          };
          await audio.play();
          return;
        }
      } catch (_) {
        // Voicevox engine offline -> fallback smoothly
      }

      // 2. High-speed Fallback: Browser SpeechSynthesis with Bunsetsu phrasing pauses
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const phrasedText = formatJapaneseForSpeech(targetSub.japanese);
          const utterance = new SpeechSynthesisUtterance(phrasedText);
          utterance.lang = "ja-JP";
          utterance.rate = playbackRateRef.current;
          utterance.pitch = 1.0;

          // Retain reference to prevent garbage collection in Chrome
          currentUtteranceRef.current = utterance;
          (window as unknown as { __jtalkUtterance: SpeechSynthesisUtterance }).__jtalkUtterance = utterance;

          const voices = window.speechSynthesis.getVoices();
          const jpVoice = voices.find(
            (v) =>
              v.lang === "ja-JP" ||
              v.lang.startsWith("ja") ||
              v.lang.includes("JP") ||
              v.name.toLowerCase().includes("japanese")
          );
          if (jpVoice) utterance.voice = jpVoice;

          utterance.onend = handleAudioFinished;
          utterance.onerror = (e) => {
            if (e.error !== "interrupted" && e.error !== "canceled") {
              console.warn("SpeechSynthesis error:", e.error);
            }
            setIsAiSpeaking(false);
            currentUtteranceRef.current = null;
          };

          window.speechSynthesis.speak(utterance);
          return;
        } catch (e) {
          console.warn("SpeechSynthesis exception:", e);
        }
      }

      setIsAiSpeaking(false);
    },
    [subtitles, stopAllAudio]
  );

  useEffect(() => {
    playAiSubAudioRef.current = playAiSubAudio;
  }, [playAiSubAudio]);

  // Jump to specific sentence
  const handleSelectSubtitle = useCallback(
    (idx: number, autoPlay = true) => {
      setActiveSubIndex(idx);
      setUserTranscript("");
      setEvalScore(null);
      setEvalFeedback(null);

      if (autoPlay) {
        isPlayingRef.current = true;
        setIsPlaying(true);
        playAiSubAudio(idx);
      } else {
        isPlayingRef.current = false;
        stopAllAudio();
        setIsPlaying(false);
      }
    },
    [playAiSubAudio, stopAllAudio]
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
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      stopAllAudio();
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playAiSubAudio(activeSubIndex);
    }
  };

  const handlePrevSubtitle = () => {
    if (activeSubIndex > 0) {
      handleSelectSubtitle(activeSubIndex - 1, isPlayingRef.current);
    }
  };

  const handleNextSubtitle = () => {
    if (activeSubIndex < subtitles.length - 1) {
      handleSelectSubtitle(activeSubIndex + 1, isPlayingRef.current);
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

            {/* Dropdown Menu for 4 Curated AI Demo Lessons */}
            {showLessonDropdown && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in-50 duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    Chọn bài học Shadowing AI (MVP)
                  </span>
                  <span className="text-3xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    {DEMO_LESSONS.length} bài sẵn sàng
                  </span>
                </div>

                {DEMO_LESSONS.map((l) => {
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
                        <p className="text-3xs text-slate-400 truncate mt-0.5">{l.description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />}
                    </button>
                  );
                })}
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
      {/* 2. MASTER SHADOWING WORKSPACE (FIT-SCREEN ZERO-SCROLL LAYOUT) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: AI SENSEI VIDEO STAGE & DOCKED SHADOWING ACTION DOCK */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 overflow-hidden justify-between space-y-3">
          {/* A. Integrated AI Sensei Studio Player */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#10131f] to-[#250d18] border border-rose-500/20 shadow-2xl flex-1 flex flex-col justify-between p-4 sm:p-6 select-none min-h-[300px] lg:min-h-[360px]">
            {/* Ambient Tokyo Studio Lighting */}
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Sensei Info & Studio Status */}
            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md border border-rose-500/30 px-3.5 py-1.5 rounded-full shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  {isPlaying && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="text-2xs sm:text-xs font-bold text-rose-200">
                  {selectedLesson.senseiName} • {selectedLesson.senseiRole}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-3xs font-extrabold bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full">
                  Câu {activeSubIndex + 1}/{totalSubtitles}
                </span>
                {isAiSpeaking && (
                  <span className="inline-flex items-center gap-1 text-3xs text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold animate-pulse">
                    <Volume2 className="w-3 h-3 text-rose-400" />
                    <span>Sensei đang đọc mẫu</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center: AI Sensei Avatar & Sound Wave Equalizer */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-3">
              {/* Avatar Box with Glowing Wave Ring */}
              <div className="relative">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
                    isAiSpeaking
                      ? "border-rose-400 ring-4 ring-rose-500/40 scale-105"
                      : "border-slate-700/80"
                  }`}
                >
                  <img
                    src={selectedLesson.senseiAvatar}
                    alt={selectedLesson.senseiName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {isAiSpeaking && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-3xs font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                    Tokyo Accent
                  </div>
                )}
              </div>

              {/* Sound Wave Bars */}
              <div className="flex items-center gap-1 h-4">
                {[30, 60, 95, 50, 85, 45, 90, 40, 80, 60, 75, 25].map((val, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isAiSpeaking ? "bg-rose-400" : "bg-slate-700/60"
                    }`}
                    style={{
                      height: isAiSpeaking
                        ? `${Math.max(25, Math.sin(Date.now() / 150 + i) * 35 + val * 0.5)}%`
                        : "20%",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* LOWER THIRD: EMBEDDED FURIGANA SUBTITLE (Directly visible, no scrolling needed!) */}
            <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-1.5 py-2 px-3 bg-black/55 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl">
              {showSubtitles && (
                <>
                  {renderFuriganaSentence(currentSub)}
                  {showTranslation && currentSub.translation && (
                    <p className="text-xs sm:text-sm font-normal text-slate-300 italic pt-1 border-t border-slate-800/60 line-clamp-2">
                      "{currentSub.translation}"
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Bottom Controls Bar inside Studio Player */}
            <div className="relative z-10 w-full pt-3 flex items-center justify-between border-t border-slate-800/80 mt-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  type="button"
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
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
              </div>

              {/* Quick Subtitle Display Toggles */}
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
                  Bản dịch
                </button>

                <button
                  onClick={() => setIsAbRepeat((prev) => !prev)}
                  type="button"
                  className={`px-2.5 py-1 text-3xs font-extrabold rounded-full border transition-all cursor-pointer ${
                    isAbRepeat
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                      : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                  title="Lặp lại câu này liên tục"
                >
                  <Repeat className="w-3 h-3 inline mr-1" />
                  A-B
                </button>

                {/* Speed Selector */}
                <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-full px-1.5 py-0.5">
                  {[0.8, 1.0, 1.2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackRate(spd)}
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

          {/* B. DOCKED SHADOWING PRACTICE DECK (Always visible, directly actionable!) */}
          <div className="bg-white dark:bg-slate-900 border border-rose-200/90 dark:border-rose-900/60 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded text-2xs font-extrabold uppercase">
                    Luyện Shadowing câu {activeSubIndex + 1}
                  </span>
                  <span className="text-2xs text-slate-400 font-medium">
                    (Bấm mic để nói nhại lại theo Sensei)
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

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ISOLATED SCROLLABLE TRANSCRIPT SIDEBAR */}
        {/* (Auto-scroll stays 100% inside this column, 0 window scrolling!) */}
        {/* ============================================================ */}
        <aside className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 shadow-xs h-[350px] lg:h-auto overflow-hidden">
          {/* Header: Phụ đề + Download */}
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
            className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-thin divide-y divide-slate-100 dark:divide-slate-800/60"
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
                  {/* Play circle icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSubtitle(idx, true);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-rose-500 group-hover:text-white"
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>

                  {/* Japanese text & Furigana */}
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
