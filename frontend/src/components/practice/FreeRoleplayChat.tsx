import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  VolumeX,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { practiceService } from "@/services/practice.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatJapaneseForSpeech } from "@/utils/japanesePhrasing";
import { soundEffects } from "@/utils/soundEffects";
import { getLearnerJapaneseIdentity } from "@/utils/vietnameseToKatakana";
import { RoleplaySummaryModal } from "@/components/practice/RoleplaySummaryModal";
import type { RoleplayMessage } from "@/types";

interface FreeRoleplayChatProps {
  lessonId?: string;
  scenarioTitle: string;
  level?: string;
  initialAiDialogue?: {
    japanese: string;
    furigana?: string;
    romaji?: string;
    translation?: string;
  };
  initialSuggestedAnswers?: Array<{
    japanese: string;
    furigana?: string;
    romaji?: string;
    translation?: string;
  }>;
  showFurigana: boolean;
  showRomaji: boolean;
  showTranslation: boolean;
  onToggleFurigana: () => void;
  onToggleRomaji: () => void;
  onToggleTranslation: () => void;
}

/**
 * Tự động tạo câu chào mở đầu chuẩn bối cảnh của từng tình huống giao tiếp
 */
const getDefaultOpeningForScenario = (
  scenarioTitle: string = ""
): { japanese: string; furigana: string; romaji: string; translation: string } => {
  const title = (scenarioTitle || "").toLowerCase();

  // 1. Lớp học / Bạn bè / Chào hỏi / Học tiếng Nhật / Trường học
  if (
    title.includes("lớp học") ||
    title.includes("trường học") ||
    title.includes("bạn cùng lớp") ||
    title.includes("tiết học") ||
    title.includes("lớp mới") ||
    title.includes("làm quen") ||
    title.includes("chào hỏi") ||
    title.includes("học tiếng nhật") ||
    title.includes("クラス") ||
    title.includes("学校") ||
    title.includes("友達") ||
    title.includes("自己紹介")
  ) {
    return {
      japanese: "初めまして！今日からこのクラスですね。お会いできて嬉しいです！お名前は何とお呼びすればいいですか？",
      furigana: "はじめまして！きょうからこのクラスですね。おあいできてうれしいです！おなまえはなんとおよびすればいいですか？",
      romaji: "Hajimemashite! Kyou kara kono kurasu desu ne. Oai dekite ureshii desu! Onamae wa nan to oyobi sureba ii desu ka?",
      translation: "Chào bạn mới! Từ hôm nay chúng mình học chung lớp này rồi. Rất vui được gặp bạn! Mình có thể gọi bạn là gì nhỉ?",
    };
  }

  // 2. Quán cà phê
  if (
    title.includes("cà phê") ||
    title.includes("cafe") ||
    title.includes("đồ uống") ||
    title.includes("quán nước") ||
    title.includes("カフェ") ||
    title.includes("喫茶店")
  ) {
    return {
      japanese: "いらっしゃいませ！ご注文はお決まりですか？",
      furigana: "いらっしゃいませ！ごちゅうもんはおきまりですか？",
      romaji: "Irasshaimase! Gochuumon wa okimari desu ka?",
      translation: "Kính chào quý khách! Quý khách đã chọn được đồ uống chưa ạ?",
    };
  }

  // 3. Cửa hàng tiện lợi / Siêu thị
  if (
    title.includes("tiện lợi") ||
    title.includes("siêu thị") ||
    title.includes("combini") ||
    title.includes("mua sắm") ||
    title.includes("コンビニ") ||
    title.includes("スーパー")
  ) {
    return {
      japanese: "いらっしゃいませ！温めますか？袋はおつけしますか？",
      furigana: "いらっしゃいませ！あたためますか？ふくろはおつけしますか？",
      romaji: "Irasshaimase! Atatamemasu ka? Fukuro wa otsuke shimasu ka?",
      translation: "Kính chào quý khách! Quý khách có cần hâm nóng không ạ? Quý khách có lấy túi không ạ?",
    };
  }

  // 4. Ga tàu / Hỏi đường
  if (
    title.includes("ga tàu") ||
    title.includes("hỏi đường") ||
    title.includes("đi tàu") ||
    title.includes("tàu điện") ||
    title.includes("chỉ đường") ||
    title.includes("駅") ||
    title.includes("道") ||
    title.includes("電車")
  ) {
    return {
      japanese: "すみません、駅員です。何かお困りですか？",
      furigana: "すみません、えきいんです。なにかおこまりですか？",
      romaji: "Sumimasen, ekiin desu. Nanika okomari desu ka?",
      translation: "Xin lỗi bạn, tôi là nhân viên nhà ga. Bạn đang cần hỗ trợ gì chăng?",
    };
  }

  // 5. Phỏng vấn
  if (
    title.includes("phỏng vấn") ||
    title.includes("xin việc") ||
    title.includes("arubaito") ||
    title.includes("part-time") ||
    title.includes("làm thêm") ||
    title.includes("面接")
  ) {
    return {
      japanese: "どうぞお入りください。おかけください。まずは自己紹介をお願いできますか？",
      furigana: "どうぞおはいりください。おかけください。まずはじこしょうかいをおねがいできますか？",
      romaji: "Douzo ohairi kudasai. Okake kudasai. Mazu wa jikoshoukai o onegai dekimasu ka?",
      translation: "Mời bạn vào phòng. Xin mời ngồi. Trước hết bạn có thể giới thiệu bản thân một chút được không?",
    };
  }

  // 6. Bệnh viện
  if (
    title.includes("bệnh viện") ||
    title.includes("khám bệnh") ||
    title.includes("bác sĩ") ||
    title.includes("nhà thuốc") ||
    title.includes("病院") ||
    title.includes("体調")
  ) {
    return {
      japanese: "こんにちは。今日はどうされましたか？どこか具合が悪いですか？",
      furigana: "こんにちは。きょうはどうされましたか？どこかぐあいがわるいですか？",
      romaji: "Konnichiwa. Kyou wa dou saremashita ka? Dokoka guai ga warui desu ka?",
      translation: "Chào bạn. Hôm nay bạn thấy trong người thế nào? Bạn đang cảm thấy không khỏe ở đâu?",
    };
  }

  // 7. Cuộc sống & thói quen hàng ngày (毎日の生活 / 習慣)
  if (
    title.includes("cuộc sống") ||
    title.includes("thói quen") ||
    title.includes("hàng ngày") ||
    title.includes("thường nhật") ||
    title.includes("生活") ||
    title.includes("習慣") ||
    title.includes("毎日の生活")
  ) {
    return {
      japanese: "こんにちは！普段の毎日の生活や習慣について、色々お話ししましょう。普段は何時頃に起きますか？",
      furigana: "こんにちは！ふだんのまいにちのせいかつやしゅうかんについて、いろいろおはなししましょう。ふだんはなんじごろにおきますか？",
      romaji: "Konnichiwa! Fudan no mainichi no seikatsu ya shuukan ni tsuite, iroiro ohanashi shimashou. Fudan wa nanji goro ni okimasu ka?",
      translation: "Xin chào bạn! Hôm nay chúng mình cùng trò chuyện về thói quen sinh hoạt và nhịp sống hàng ngày nhé. Bình thường bạn hay thức dậy vào lúc mấy giờ?",
    };
  }

  // 8. Báo cáo công việc HORENSO (ビジネス会話 / 進捗報告)
  if (
    title.includes("tiến độ") ||
    title.includes("báo cáo") ||
    title.includes("horenso") ||
    title.includes("công việc") ||
    title.includes("kinh doanh") ||
    title.includes("進捗") ||
    title.includes("報告") ||
    title.includes("ビジネス")
  ) {
    return {
      japanese: "お疲れ様です。現在進めているタスクの進捗状況について、報告をお願いできますでしょうか？",
      furigana: "おつかれさまです。げんざいすすめているタスクのしんちょくじょうきょうについて、ほうこくをおねがいできますでしょうか？",
      romaji: "Otsukaresama desu. Genzai susumete iru tasuku no shinchoku joukyou ni tsuite, houkoku o onegai dekimasu deshou ka?",
      translation: "Chào bạn, vất vả cho bạn rồi. Bạn có thể báo cáo cho tôi về tình hình tiến độ của công việc/task đang thực hiện được không?",
    };
  }

  // 9. Quán nhậu Izakaya (居酒屋 / 乾杯 / 食事の誘い)
  if (
    title.includes("izakaya") ||
    title.includes("quán nhậu") ||
    title.includes("đi ăn") ||
    title.includes("nâng ly") ||
    title.includes("kanpai") ||
    title.includes("rủ bạn") ||
    title.includes("居酒屋") ||
    title.includes("乾杯") ||
    title.includes("飲み")
  ) {
    return {
      japanese: "今日もお仕事お疲れ様でした！駅前の居酒屋に行きませんか？軽く一杯飲みに行きましょう！",
      furigana: "きょうもおしごとおつかれさまでした！えきまえのいざかやにいきませんか？かるくいっぱいにのみにいきましょう！",
      romaji: "Kyou mo oshigoto otsukaresama deshita! Ekimae no izakaya ni ikimasen ka? Karuku ippai nomi ni ikimashou!",
      translation: "Hôm nay làm việc vất vả rồi! Chúng mình cùng ghé quán nhậu Izakaya ở trước ga nhé? Đi làm một ly xả hơi nào!",
    };
  }

  // Mặc định
  return {
    japanese: "こんにちは！今日はお会いできて嬉しいです。どうぞよろしくお願いします！",
    furigana: "こんにちは！きょうはおあいできてうれしいです。どうぞよろしくおねがいします！",
    romaji: "Konnichiwa! Kyou wa oai dekite ureshii desu. Douzo yoroshiku onegaishimasu!",
    translation: "Xin chào! Rất vui được gặp bạn hôm nay. Rất mong được giúp đỡ và cùng trò chuyện nhé!",
  };
};

/**
 * Intelligent instant contextual suggestions generator for zero-latency roleplay
 */
const getContextualRoleplaySuggestions = (
  scenarioTitle: string = "",
  aiText: string = "",
  _level: string = "N5",
  learnerName: string = "Học viên"
): Array<{ japanese: string; furigana?: string; romaji?: string; translation?: string }> => {
  const titleLower = scenarioTitle.toLowerCase();
  const textLower = aiText.toLowerCase();
  const identity = getLearnerJapaneseIdentity(learnerName);

  // 0. SPECIFIC INTENT MATCHING FIRST (Ưu tiên nhận diện chính xác ý đồ câu hỏi của AI trước)
  // A. AI hỏi tên (お名前は何ですか？ / お名前は？ / 誰ですか？ / お名前をお伺い)
  if (
    textLower.includes("名前") ||
    textLower.includes("なまえ") ||
    textLower.includes("お名前") ||
    textLower.includes("誰")
  ) {
    return [
      {
        japanese: `初めまして！私の名前は${identity.katakanaName}です。よろしくお願いします。`,
        furigana: `はじめまして！わたしのなまえは${identity.katakanaName}です。よろしくおねがいします。`,
        romaji: `Hajimemashite! Watashi no namae wa ${identity.romajiName} desu. Yoroshiku onegaishimasu.`,
        translation: `Rất vui được gặp bạn! Tên tôi là ${identity.givenName}. Rất mong được giúp đỡ.`,
      },
      {
        japanese: `${identity.katakanaName}と申します。ベトナムから来ました。どうぞよろしくお願いします。`,
        furigana: `${identity.katakanaName}ともうします。ベトナムからきました。どうぞよろしくおねがいします。`,
        romaji: `${identity.romajiName} to moushimasu. Betonamu kara kimashita. Douzo yoroshiku onegaishimasu.`,
        translation: `Tôi tên là ${identity.givenName}. Tôi đến từ Việt Nam. Rất mong được giúp đỡ ạ.`,
      },
      {
        japanese: `初めまして、${identity.katakanaName}です。趣味は日本語を勉強することです。`,
        furigana: `初めまして、${identity.katakanaName}です。しゅみはにほんごをべんきょうすることです。`,
        romaji: `Hajimemashite, ${identity.romajiName} desu. Shuumi wa Nihongo o benkyou suru koto desu.`,
        translation: `Xin chào, tôi là ${identity.givenName}. Sở thích của tôi là học tiếng Nhật.`,
      },
    ];
  }

  // B. AI hỏi xuất xứ / đến từ đâu / quê quán (どこから / 出身 / 国 / どちら)
  if (
    textLower.includes("どこから") ||
    textLower.includes("出身") ||
    textLower.includes("しゅっしん") ||
    textLower.includes("国は") ||
    textLower.includes("どちらから") ||
    textLower.includes("どちらのご出身")
  ) {
    return [
      {
        japanese: "ハノイから来ました。とても賑やかな街です。",
        furigana: "ハノイからきました。とてもにぎやかなまちです。",
        romaji: "Hanoi kara kimashita. Totemo nigiyaka na machi desu.",
        translation: "Tôi đến từ Hà Nội. Đó là một thành phố rất nhộn nhịp.",
      },
      {
        japanese: "ベトナムのダナンから来ました。海がとても綺麗です。",
        furigana: "ベトナムのダナンからきました。うみがとてもきれいです。",
        romaji: "Betonamu no Danan kara kimashita. Umi ga totemo kirei desu.",
        translation: "Tôi đến từ Đà Nẵng, Việt Nam. Biển ở đó rất đẹp.",
      },
    ];
  }

  // C. AI hỏi thời gian ở Nhật (どのくらい / いつ日本 / 何年 / 何ヶ月)
  if (
    textLower.includes("どのくらい") ||
    textLower.includes("どの位") ||
    textLower.includes("いつ日本") ||
    textLower.includes("何年") ||
    textLower.includes("何ヶ月")
  ) {
    return [
      {
        japanese: "日本に来てまだ半年くらいです。だんだん慣れてきました。",
        furigana: "にほんにきてまだはんとし・はんねんくらいです。だんだんなれてきました。",
        romaji: "Nihon ni kite mada hantoshi kurai desu. Dandan narete kimashita.",
        translation: "Tôi sang Nhật mới khoảng nửa năm thôi. Đang dần quen rồi ạ.",
      },
      {
        japanese: "先月日本に来たばかりなので、まだ少し緊張しています。",
        furigana: "せんげつにほんにきたばかりなので、まだすこしきんちょうしています。",
        romaji: "Sengetsu Nihon ni kita bakari na node, mada sukoshi kinchou shite imasu.",
        translation: "Tôi vừa sang Nhật hồi tháng trước nên vẫn còn hơi bỡ ngỡ một chút.",
      },
    ];
  }

  // D. AI hỏi về quen cuộc sống chưa / cảm nhận (慣れましたか / 生活 / どうですか)
  if (
    textLower.includes("慣れ") ||
    textLower.includes("なれ") ||
    textLower.includes("生活") ||
    textLower.includes("街はどう") ||
    textLower.includes("いかがですか")
  ) {
    return [
      {
        japanese: "はい、だんだん慣れてきました。街がとても綺麗ですね。",
        furigana: "はい、だんだんなれてきました。まちがとてもきれいですね。",
        romaji: "Hai, dandan narete kimashita. Machi ga totemo kirei desu ne.",
        translation: "Vâng, tôi dần quen rồi. Đường phố ở đây rất sạch đẹp ạ.",
      },
      {
        japanese: "まだ少し慣れていませんが、毎日とても楽しいです。",
        furigana: "まだすこしなれていませんが、まいにちとてもたのしいです。",
        romaji: "Mada sukoshi narete imasen ga, mainichi totemo tanoshii desu.",
        translation: "Tôi vẫn chưa quen lắm, nhưng mỗi ngày đều rất vui.",
      },
    ];
  }

  // D1. AI hỏi thời gian học tiếng Nhật & cảm nhận không khí lớp học (いつから始め / 勉強はいつ / 始めた / クラスの雰囲気 / 雰囲気はどう)
  if (
    textLower.includes("いつから始め") ||
    textLower.includes("いつからはじめ") ||
    textLower.includes("勉強はいつ") ||
    textLower.includes("クラスの雰囲気") ||
    textLower.includes("雰囲気はどう") ||
    textLower.includes("ふんいき") ||
    (textLower.includes("勉強") && textLower.includes("いつ"))
  ) {
    return [
      {
        japanese: "3ヶ月前から勉強を始めました。クラスの皆さんが親切で安心しました。",
        furigana: "さんかげつまえからべんきょうをはじめました。クラスのみなさんがしんせつであんしんしました。",
        romaji: "San-kagetsu mae kara benkyou o hajimemashita. Kurasu no minasan ga shinsetsu de anshin shimashita.",
        translation: "Tôi bắt đầu học từ 3 tháng trước. Mọi người trong lớp đều rất thân thiện nên tôi cũng yên tâm rồi.",
      },
      {
        japanese: "ベトナムで半年ほど勉強してきました。少し緊張していますが、とても楽しみです。",
        furigana: "ベトナムではんとしほどべんきょうしてきました。すこしきんちょうしていますが、とてもたのしみです。",
        romaji: "Betonamu de hantoshi hodo benkyou shite kimashita. Sukoshi kinchou shite imasu ga, totemo tanoshimi desu.",
        translation: "Tôi đã học khoảng nửa năm ở Việt Nam. Tuy có chút hồi hộp nhưng tôi rất hào hứng.",
      },
    ];
  }

  // D2. AI hỏi kỹ năng tiếng Nhật nào khó nhất (どれが一番難しい / 一番難しい / 漢字やリスニング / 何が難しい / 難しいと感じ)
  if (
    textLower.includes("一番難しい") ||
    textLower.includes("いちばんむずかしい") ||
    textLower.includes("どれが一番") ||
    textLower.includes("何が難しい") ||
    textLower.includes("難しいと感じ") ||
    (textLower.includes("難しい") && (textLower.includes("漢字") || textLower.includes("リスニング") || textLower.includes("会話")))
  ) {
    return [
      {
        japanese: "漢字を覚えるのが一番難しいです。似ている形が多くて大変です。",
        furigana: "かんじをおぼえるのがいちばんむずかしいです。にているかたちがおおくてたいへんです。",
        romaji: "Kanji o oboeru no ga ichiban muzukashii desu. Nite iru katachi ga ookute taihen desu.",
        translation: "Ghi nhớ chữ Hán là khó nhất. Có nhiều chữ nét na ná nhau nên rất vất vả.",
      },
      {
        japanese: "リスニングと会話が難しいです。ネイティブのスピードについていくのがまだ大変です。",
        furigana: "リスニングとかいわがむずかしいです。ネイティブのスピードについていくのがまだたいへんです。",
        romaji: "Risuningu to kaiwa ga muzukashii desu. Neitibu no supiido ni tsuite iku no ga mada taihen desu.",
        translation: "Luyện nghe và hội thoại là khó nhất. Bắt kịp tốc độ của người bản xứ vẫn còn hơi khó với tôi.",
      },
    ];
  }

  // D3. AI hỏi về phương pháp học tập hiệu quả (おすすめの勉強法 / どうやって日本語を勉強 / 勉強法はありますか / おすすめの勉強)
  if (
    textLower.includes("勉強法") ||
    textLower.includes("べんきょうほう") ||
    textLower.includes("どうやって日本語") ||
    textLower.includes("どうやって勉強") ||
    (textLower.includes("おすすめ") && textLower.includes("勉強"))
  ) {
    return [
      {
        japanese: "私は単語カード（フラッシュカード）アプリを使って、毎日すきま時間に復習しています。",
        furigana: "わたしはたんごカード（フラッシュカード）アプリをつかって、まいにちすきまじかんにふくしゅうしています。",
        romaji: "Watashi wa tango kaado (furasshu kaado) apuri o tsukatte, mainichi sukima jikan ni fukushuu shite imasu.",
        translation: "Tôi dùng app thẻ từ vựng flashcard để tranh thủ ôn tập mỗi khi có thời gian rảnh rỗi.",
      },
      {
        japanese: "好きなアニメやドラマを日本語の字幕で見たり、シャドーイングの練習をしています。",
        furigana: "すきなアニメやドラマをにほんごのじまくでみたり、シャドーイングのれんしゅうをしています。",
        romaji: "Suki na anime ya dorama o Nihongo no jimaku de mitari, shadooingu no renshuu o shite imasu.",
        translation: "Tôi xem anime hay phim Nhật với phụ đề tiếng Nhật và luyện tập phương pháp Shadowing.",
      },
    ];
  }

  // D4. AI rủ rê học nhóm sau giờ học tại thư viện (図書館 / 放課後 / 一緒に / 復習しませんか / 待ち合わせ)
  if (
    textLower.includes("図書館") ||
    textLower.includes("としょかん") ||
    textLower.includes("放課後") ||
    textLower.includes("ほうかご") ||
    textLower.includes("復習しませんか") ||
    (textLower.includes("一緒") && (textLower.includes("復習") || textLower.includes("勉強")))
  ) {
    return [
      {
        japanese: "ぜひ一緒にお願いします！分からない文法を教えてもらえると嬉しいです。",
        furigana: "ぜひいっしょにおねがいします！わからないぶんぽうをおしえてもらえるとうれしいです。",
        romaji: "Zehi issho ni onegaishimasu! Wakaranai bumpou o oshiete moraeru to ureshii desu.",
        translation: "Nhất định rồi, cho mình học cùng với! Nếu có ngữ pháp nào chưa hiểu thì nhờ bạn chỉ giúp nhé.",
      },
      {
        japanese: "はい、喜んで！一人で勉強するより、一緒に復習した方がモチベーションが上がりますね。",
        furigana: "はい、よろこんで！ひとりでべんきょうするより、いっしょにふくしゅうしたほうがモチベーションがあがりますね。",
        romaji: "Hai, yorokonde! Hitori de benkyou suru yori, issho ni fukushuu shita hou ga mochibeeshon ga agarimasu ne.",
        translation: "Vâng, mình rất sẵn lòng! Học cùng nhau chắc chắn sẽ có nhiều động lực hơn tự học một mình.",
      },
    ];
  }

  // E. AI hỏi về đồ ăn Nhật Bản (食べ物 / 料理 / 何が好き / ラーメン / 寿司)
  if (
    textLower.includes("食べ物") ||
    textLower.includes("たべもの") ||
    textLower.includes("料理") ||
    textLower.includes("りょうり") ||
    textLower.includes("何が好き")
  ) {
    return [
      {
        japanese: "ラーメンが大好きです！特に豚骨ラーメンが美味しいです。",
        furigana: "ラーメンがだいすきです！とくにとんこつラーメンがおいしいです。",
        romaji: "Raamen ga daisuki desu! Tokuni tonkotsu raamen ga oishii desu.",
        translation: "Tôi rất thích mì ramen! Đặc biệt là ramen xương hầm rất ngon.",
      },
      {
        japanese: "お寿司や天ぷらが好きです。何でも美味しく食べられます。",
        furigana: "おすしやてんぷらがすきです。なんでもおいしくたべられます。",
        romaji: "Osushi ya tempura ga suki desu. Nandemo oishiku taberaremasu.",
        translation: "Tôi thích sushi và tempura. Món ăn Nhật nào tôi cũng thấy ngon.",
      },
    ];
  }

  // F. AI hỏi về sở thích / ngày nghỉ (趣味 / 休み / 普段 / 何をして)
  if (
    textLower.includes("趣味") ||
    textLower.includes("しゅみ") ||
    textLower.includes("休み") ||
    textLower.includes("やすみ") ||
    textLower.includes("普段")
  ) {
    return [
      {
        japanese: "休みの日はよく公園を散歩したり、写真を撮ったりします。",
        furigana: "やすみのひはよくこうえんをさんぽしたり、しゃしんをとったりします。",
        romaji: "Yasumi no hi wa yoku kouen o sanpo shitari, shashin o tottari shimasu.",
        translation: "Ngày nghỉ tôi hay đi dạo công viên và chụp ảnh.",
      },
      {
        japanese: "家でアニメを見たり、日本語を勉強したりしています。",
        furigana: "いえでアニメをみたり、にほんごをべんきょうしたりしています。",
        romaji: "Ie de anime o mitari, Nihongo o benkyou shitari shite imasu.",
        translation: "Tôi ở nhà xem anime hoặc tự học tiếng Nhật.",
      },
    ];
  }

  // G. AI hỏi về lý do học tiếng Nhật / mục tiêu tương lai (どうして / 勉強しよう / 将来 / 目標)
  if (
    textLower.includes("どうして") ||
    textLower.includes("勉強しよう") ||
    textLower.includes("将来") ||
    textLower.includes("目標")
  ) {
    return [
      {
        japanese: "将来、日本のIT企業でエンジニアとして働きたいからです。",
        furigana: "しょうらい、にほんのアイティーきぎょうでエンジニアとしてはたらきたいからです。",
        romaji: "Shourai, Nihon no IT kigyou de enjinia toshite hatarakitai kara desu.",
        translation: "Vì trong tương lai tôi muốn làm kỹ sư IT tại một doanh nghiệp Nhật Bản.",
      },
      {
        japanese: "日本のアニメや文化が大好きで、自由に日本語で話せるようになりたいからです。",
        furigana: "にほんのアニメやぶんかがだいすきで、じゆうににほんごではなせるようになりたいからです。",
        romaji: "Nihon no anime ya bunka ga daisuki de, jiyuu ni Nihongo de hanaseru you ni naritai kara desu.",
        translation: "Vì tôi rất yêu thích văn hóa anime Nhật Bản và muốn giao tiếp tiếng Nhật lưu loát.",
      },
    ];
  }

  // I. AI hỏi về thói quen buổi sáng / giờ thức dậy (何時に起き / 起きる / 朝ごはん / 通勤)
  if (
    textLower.includes("起き") ||
    textLower.includes("おき") ||
    textLower.includes("朝ごはん") ||
    textLower.includes("朝は何時") ||
    textLower.includes("何時に")
  ) {
    return [
      {
        japanese: "普段は毎朝6時半頃に起きて、軽くジョギングをしています。",
        furigana: "ふだんはまいあさろくじはんごろにおきて、かるくジョギングをしています。",
        romaji: "Fudan wa maiasa rokuji-han goro ni okite, karuku jogingu o shite imasu.",
        translation: "Thường ngày tôi dậy lúc khoảng 6h30 sáng và chạy bộ nhẹ nhàng.",
      },
      {
        japanese: "朝7時に起きています。パンとコーヒーを飲んでから出かけます。",
        furigana: "あさしちじにおきています。パンとコーヒーをのんでからでかけます。",
        romaji: "Asa shichiji ni okite imasu. Pan to koohii o nonde kara dekakemasu.",
        translation: "Tôi thức dậy lúc 7 giờ sáng. Tôi ăn bánh mì và uống cà phê rồi mới ra ngoài.",
      },
      {
        japanese: "夜型なので、朝は少し苦手で8時頃に慌てて起きます。",
        furigana: "よるがたなので、あさはすこしにがてではちじごろにあわてておきます。",
        romaji: "Yorugata na node, asa wa sukoshi nigate de hachiji goro ni awatete okimasu.",
        translation: "Vì tôi quen cú đêm nên buổi sáng hơi vất vả, khoảng 8 giờ mới cuống cuồng dậy.",
      },
    ];
  }

  // J. AI hỏi về giờ ngủ / thư giãn buổi tối (何時に寝 / 夜 / リラックス / 過ごして)
  if (
    textLower.includes("寝") ||
    textLower.includes("ねる") ||
    textLower.includes("夜は") ||
    textLower.includes("リラックス") ||
    textLower.includes("晩")
  ) {
    return [
      {
        japanese: "夜11時半頃に寝ます。寝る前によく音楽を聴いてリラックスしています。",
        furigana: "よるじゅういちじはんごろにねます。ねるまえによくおんがくをきいてリラックスしています。",
        romaji: "Yoru juuichiji-han goro ni nemasu. Neru mae ni yoku ongaku o kiite rirakkusu shite imasu.",
        translation: "Tôi ngủ lúc khoảng 11h30 đêm. Trước khi ngủ tôi thường nghe nhạc để thư giãn.",
      },
      {
        japanese: "12時過ぎに寝ることが多いです。YouTubeを見たり本を読んだりしています。",
        furigana: "じゅうにじすぎにねることがおおいです。ユーチューブをみたりほんをよんだりしています。",
        romaji: "Juuniji sugi ni neru koto ga ooi desu. Yuuchuubu o mitari hon o yondari shite imasu.",
        translation: "Tôi hay ngủ sau 12 giờ đêm. Tôi thường xem YouTube hoặc đọc sách.",
      },
    ];
  }

  // K. AI hỏi về tiến độ công việc HORENSO (進捗状況 / 何％ / 課題 / トラブル / デプロイ)
  if (
    textLower.includes("進捗") ||
    textLower.includes("しんちょく") ||
    textLower.includes("課題") ||
    textLower.includes("問題点") ||
    textLower.includes("デプロイ") ||
    textLower.includes("報告")
  ) {
    return [
      {
        japanese: "現在80％ほど完了しており、予定通り今週中に納品できる見込みです。",
        furigana: "げんざいはちじっパーセントほどかんりょうしており、よていどおりこんしゅうちゅうにのうひんできるみこみです。",
        romaji: "Genzai hachiju-paasento hodo kanryou shite ori, yotei doori konshuuchuu ni nouhin dekiru mikomi desu.",
        translation: "Hiện tại đã hoàn thành khoảng 80% và dự kiến bàn giao đúng tiến độ trong tuần này ạ.",
      },
      {
        japanese: "外部APIの連携で少しエラーが発生しており、現在調査と修正を進めております。",
        furigana: "がいぶエーピーアイのれんけいですこしエラーがはっせいしており、げんざいちょうさとしゅうせいをすすめております。",
        romaji: "Gaibu API no renkei de sukoshi eraa ga hassei shite ori, genzai chousa to shuusei o susumete orimasu.",
        translation: "Đang có một chút lỗi phát sinh khi kết nối API bên thứ ba, chúng tôi đang tích cực điều tra và khắc phục ạ.",
      },
      {
        japanese: "設計書通りの実装が完了し、テスト環境での動作確認に入っております。",
        furigana: "せっけいしょどおりのじっそうがかんりょうし、テストかんきょうでのどうさかくにんにはいっております。",
        romaji: "Sekkeisho doori no jissou ga kanryou shi, tesuto kankyou de no dousa kakunin ni haitte orimasu.",
        translation: "Việc code theo tài liệu thiết kế đã hoàn tất, chúng tôi đang tiến hành kiểm thử trên môi trường test ạ.",
      },
    ];
  }

  // L. AI rủ uống rượu / Quán nhậu Izakaya / Nâng ly Kanpai (居酒屋 / 乾杯 / とりあえず / ビール / 焼き鳥 / 飲みに行)
  if (
    textLower.includes("居酒屋") ||
    textLower.includes("いざかや") ||
    textLower.includes("乾杯") ||
    textLower.includes("かんぱい") ||
    textLower.includes("飲みに行") ||
    textLower.includes("一杯") ||
    textLower.includes("生ビール")
  ) {
    return [
      {
        japanese: "ぜひ行きましょう！今日はずっと生ビールが飲みたかったんです！",
        furigana: "ぜひいきましょう！きょうはずっとなまビールがのみたかったんです！",
        romaji: "Zehi ikimashou! Kyou wa zutto nama biiru ga nomitakatta n desu!",
        translation: "Nhất định phải đi rồi! Cả ngày hôm nay tôi chỉ mong được uống một cốc bia tươi thôi!",
      },
      {
        japanese: "お疲れ様でした！乾杯！焼き鳥と枝豆も頼みましょうか？",
        furigana: "おつかれさまでした！かんぱい！やきとりとえだまめもたのみましょうか？",
        romaji: "Otsukaresama deshita! Kampai! Yakitori to edamame mo tanomimashou ka?",
        translation: "Vất vả rồi! Nâng ly nào! Tụi mình gọi thêm xiên gà nướng với đậu nành luộc nhé?",
      },
      {
        japanese: "すみません、お酒が少し弱いので、ウーロン茶でもいいですか？",
        furigana: "すみません、おさけがすこしよわいので、ウーロンちゃでもいいですか？",
        romaji: "Sumimasen, osake ga sukoshi yowai node, uuroncha demo ii desu ka?",
        translation: "Xin lỗi, tửu lượng tôi hơi kém nên tôi uống trà ô long được không?",
      },
    ];
  }

  // M. AI hỏi triệu chứng bệnh viện / khám bệnh (どうされました / 痛い / 熱 / 症状 / 処方箋 / お大事に)
  if (
    textLower.includes("どうされました") ||
    textLower.includes("痛い") ||
    textLower.includes("いたい") ||
    textLower.includes("熱") ||
    textLower.includes("ねつ") ||
    textLower.includes("アレルギー") ||
    textLower.includes("お大事に")
  ) {
    return [
      {
        japanese: "昨日から頭が痛くて、少し喉も痛みます。熱は37度5分あります。",
        furigana: "きのうからあたまがいたくて、すこしのどもいたみます。ねつはさんじゅうななどごぶあります。",
        romaji: "Kinou kara atama ga itakute, sukoshi nodo mo itamimasu. Netsu wa sanjuunana-do go-bu arimasu.",
        translation: "Từ hôm qua tôi bị đau đầu và hơi rát họng. Nhiệt độ cơ thể là 37.5 độ ạ.",
      },
      {
        japanese: "お腹がキリキリ痛くて、今朝から食欲がありません。",
        furigana: "おなかがキリキリいたくて、けさからしょくよくがありません。",
        romaji: "Onaka ga kirikiri itakute, kesa kara shokuyoku ga arimasen.",
        translation: "Bụng tôi bị đau quặn từng cơn, từ sáng nay tôi không ăn uống được gì.",
      },
      {
        japanese: "特に薬のアレルギーはありません。診察ありがとうございます。",
        furigana: "とくにくすりのアレルギーはありません。しんさつありがとうございます。",
        romaji: "Tokuni kusuri no arerugii wa arimasen. Shinsatsu arigatou gozaimasu.",
        translation: "Tôi không có tiền sử dị ứng thuốc gì đặc biệt. Cảm ơn bác sĩ đã thăm khám.",
      },
    ];
  }

  // N. AI hỏi trong phỏng vấn xin việc (自己紹介をお願い / 志望動機 / シフト / 長所)
  if (
    textLower.includes("自己紹介をお願い") ||
    textLower.includes("志望動機") ||
    textLower.includes("シフト") ||
    textLower.includes("週に何") ||
    textLower.includes("長所")
  ) {
    return [
      {
        japanese: "週に3回、平日の夕方からラストまで勤務可能です。土日も入れます。",
        furigana: "しゅうにさんかい、へいじつのゆうがたからラストまできんむかのうです。どにちもはいれます。",
        romaji: "Shuu ni sankai, heijitsu no yuugata kara rasuto made kimmu kanou desu. Donichi mo hairemasu.",
        translation: "Một tuần tôi có thể làm 3 buổi từ chiều tối đến khi đóng cửa. Thứ 7, Chủ Nhật tôi cũng có thể làm được ạ.",
      },
      {
        japanese: "日本の接客マナーを学び、実践的な日本語能力を高めたいと思い応募いたしました。",
        furigana: "にほんのせっきゃくマナーをまなび、じっせんてきなにほんごのうりょくをたかめたいとおもいおうぼいたしました。",
        romaji: "Nihon no sekkyaku manaa o manabi, jissenteki na Nihongo nouryoku o takametai to omoi oubo itashimashita.",
        translation: "Tôi ứng tuyển vì muốn học hỏi phong cách phục vụ của Nhật Bản và trau dồi khả năng tiếng Nhật thực tế ạ.",
      },
      {
        japanese: "私の長所は、真面目で最後まで粘り強くやり遂げる責任感があることです。",
        furigana: "わたしのちょうしょは、まじめでさいごまでねばりづよくやりとげるせきにんかんがあることです。",
        romaji: "Watashi no chousho wa, majime de saigo made nebarizuyoku yaritogeru sekininkan ga aru koto desu.",
        translation: "Điểm mạnh của tôi là sự chăm chỉ và tinh thần trách nhiệm, luôn kiên trì làm đến cùng ạ.",
      },
    ];
  }

  // H. AI chào tạm biệt / kết thúc (頑張りましょう / またね / 失礼 / また次回 / お疲れ様)
  if (
    textLower.includes("頑張りましょう") ||
    textLower.includes("がんばりましょう") ||
    textLower.includes("またね") ||
    textLower.includes("また次回") ||
    textLower.includes("お疲れ様") ||
    textLower.includes("よろしくおねがいしますね")
  ) {
    return [
      {
        japanese: "はい！こちらこそ、これからどうぞよろしくお願いします！",
        furigana: "はい！こちらこそ、これからどうぞよろしくおねがいします！",
        romaji: "Hai! Kochira koso, korekara douzo yoroshiku onegaishimasu!",
        translation: "Vâng! Tôi cũng rất mong nhận được sự giúp đỡ của bạn từ nay về sau ạ!",
      },
      {
        japanese: "お話しできてとても楽しかったです。ありがとうございました！",
        furigana: "おはなしできてとてもたのしかったです。ありがとうございました！",
        romaji: "Ohanashi dekite totemo tanoshikatta desu. Arigatou gozaimashita!",
        translation: "Nói chuyện với bạn rất vui. Cảm ơn bạn rất nhiều ạ!",
      },
    ];
  }

  // 1. Bakery / Bánh mì / Tiệm bánh (e.g. Mua bánh mì ở tiệm bánh Nhật Bản)
  if (
    titleLower.includes("bánh mì") ||
    titleLower.includes("tiệm bánh") ||
    titleLower.includes("bánh") ||
    titleLower.includes("bakery") ||
    titleLower.includes("パン") ||
    textLower.includes("パン")
  ) {
    if (
      textLower.includes("こんにちは") ||
      textLower.includes("いらっしゃい") ||
      textLower.includes("おはよう") ||
      textLower.includes("皆さん")
    ) {
      return [
        {
          japanese: "こんにちは！美味しそうなパンですね。",
          furigana: "こんにちは！おいしそうなパンですね。",
          romaji: "Konnichiwa! Oishisou na pan desu ne.",
          translation: "Chào bạn! Bánh mì trông ngon quá.",
        },
        {
          japanese: "こんにちは！おすすめのパンは何ですか？",
          furigana: "こんにちは！おすすめのパンはなんですか？",
          romaji: "Konnichiwa! Osusume no pan wa nan desu ka?",
          translation: "Chào bạn! Bánh mì gợi ý đặc biệt là gì vậy ạ?",
        },
        {
          japanese: "焼きたてのパンはありますか？",
          furigana: "やきたてのパンはありますか？",
          romaji: "Yakitate no pan wa arimasu ka?",
          translation: "Tiệm có bánh mì mới ra lò không ạ?",
        },
      ];
    }
    return [
      {
        japanese: "このクロワッサンを二つください。",
        furigana: "このクロワッサンをふたつください。",
        romaji: "Kono kurowassan o futatsu kudasai.",
        translation: "Cho tôi 2 chiếc bánh sừng bò này nhé.",
      },
      {
        japanese: "持ち帰りでお願いします。",
        furigana: "もちかえりでおねがいします。",
        romaji: "Mochikaeri de onegaishimasu.",
        translation: "Cho tôi mang về ạ.",
      },
    ];
  }

  // 2. Cafe / Cà phê / Đồ uống
  if (
    titleLower.includes("cafe") ||
    titleLower.includes("cà phê") ||
    titleLower.includes("カフェ") ||
    titleLower.includes("uống") ||
    textLower.includes("コーヒー") ||
    textLower.includes("ラテ")
  ) {
    if (
      textLower.includes("こんにちは") ||
      textLower.includes("いらっしゃい") ||
      textLower.includes("皆さん")
    ) {
      return [
        {
          japanese: "こんにちは！アイスカフェラテをお願いします。",
          furigana: "こんにちは！アイスカフェラテをおねがいします。",
          romaji: "Konnichiwa! Aisu kaferate o onegaishimasu.",
          translation: "Chào bạn! Cho tôi một ly cà phê latte đá nhé.",
        },
        {
          japanese: "おすすめのドリンクは何ですか？",
          furigana: "おすすめのドリンクはなんですか？",
          romaji: "Osusume no dorinku wa nan desu ka?",
          translation: "Đồ uống gợi ý của quán là gì vậy ạ?",
        },
      ];
    }
    return [
      {
        japanese: "店内でお願いします。",
        furigana: "てんないでおねがいします。",
        romaji: "Tennai de onegaishimasu.",
        translation: "Dùng tại quán ạ.",
      },
      {
        japanese: "持ち帰りでお願いします。",
        furigana: "もちかえりでおねがいします。",
        romaji: "Mochikaeri de onegaishimasu.",
        translation: "Mang về ạ.",
      },
    ];
  }

  // 3. Convenience Store / Siêu thị
  if (
    titleLower.includes("tiện lợi") ||
    titleLower.includes("siêu thị") ||
    titleLower.includes("mua") ||
    titleLower.includes("combini") ||
    titleLower.includes("コンビニ") ||
    titleLower.includes("スーパー")
  ) {
    return [
      {
        japanese: "袋は大丈夫です。",
        furigana: "ふくろはだいじょうぶです。",
        romaji: "Fukuro wa daijoubu desu.",
        translation: "Tôi không cần túi ni-lông ạ.",
      },
      {
        japanese: "Suicaで支払います。",
        furigana: "スイカでしはらいます。",
        romaji: "Suica de shiharaimasu.",
        translation: "Tôi thanh toán bằng thẻ Suica.",
      },
    ];
  }

  // 4. Asking directions / Station / Tàu điện
  if (
    titleLower.includes("đường") ||
    titleLower.includes("ga") ||
    titleLower.includes("tàu") ||
    titleLower.includes("駅") ||
    titleLower.includes("道") ||
    textLower.includes("駅")
  ) {
    return [
      {
        japanese: "すみません、新宿駅へはどう行けばいいですか？",
        furigana: "すみません、しんじゅくえきへはどういけばいいですか？",
        romaji: "Sumimasen, Shinjuku-eki e wa dou ikeba ii desu ka?",
        translation: "Xin lỗi, làm thế nào để đi đến ga Shinjuku ạ?",
      },
      {
        japanese: "切符売り場はどこにありますか？",
        furigana: "きっぷうりばはどこにありますか？",
        romaji: "Kippu uriba wa doko ni arimasu ka?",
        translation: "Quầy bán vé ở đâu vậy ạ?",
      },
    ];
  }

  // 5. Self-introduction / Meeting new people / Giới thiệu bản thân
  if (
    titleLower.includes("chào hỏi") ||
    titleLower.includes("giới thiệu") ||
    titleLower.includes("lớp học") ||
    titleLower.includes("自己紹介") ||
    textLower.includes("名前") ||
    textLower.includes("初めまして")
  ) {
    return [
      {
        japanese: `初めまして！私の名前は${identity.katakanaName}です。どうぞよろしくお願いします。`,
        furigana: `はじめまして！わたしのなまえは${identity.katakanaName}です。どうぞよろしくおねがいします。`,
        romaji: `Hajimemashite! Watashi no namae wa ${identity.romajiName} desu. Douzo yoroshiku onegaishimasu.`,
        translation: `Rất vui được gặp bạn! Tên tôi là ${identity.givenName}. Rất mong được giúp đỡ.`,
      },
      {
        japanese: `${identity.katakanaName}と申します。ベトナムから来ました。`,
        furigana: `${identity.katakanaName}ともうします。ベトナムからきました。`,
        romaji: `${identity.romajiName} to moushimasu. Betonamu kara kimashita.`,
        translation: `Tôi tên là ${identity.givenName}. Tôi đến từ Việt Nam.`,
      },
    ];
  }

  // 6. Job interview / Business / Công sở
  if (
    titleLower.includes("phỏng vấn") ||
    titleLower.includes("công việc") ||
    titleLower.includes("báo cáo") ||
    titleLower.includes("面接") ||
    titleLower.includes("ビジネス")
  ) {
    return [
      {
        japanese: `${identity.katakanaName}と申します。本日はお時間をいただきありがとうございます。`,
        furigana: `${identity.katakanaName}ともうします。ほんじつはおじかんをいただきありがとうございます。`,
        romaji: `${identity.romajiName} to moushimasu. Honjitsu wa ojikan o itadaki arigatou gozaimasu.`,
        translation: `Tôi tên là ${identity.givenName}. Cảm ơn quý công ty đã dành thời gian hôm nay ạ.`,
      },
      {
        japanese: "どうぞよろしくお願いいたします。",
        furigana: "どうぞよろしくおねがいいたします。",
        romaji: "Douzo yoroshiku onegai itashimasu.",
        translation: "Kính mong được sự quan tâm và giúp đỡ ạ.",
      },
    ];
  }

  // 7. General greeting match (e.g. 皆さんこんにちは, こんにちは)
  if (
    textLower.includes("こんにちは") ||
    textLower.includes("おはよう") ||
    textLower.includes("こんばんは") ||
    textLower.includes("皆さん")
  ) {
    return [
      {
        japanese: "こんにちは！よろしくお願いします。",
        furigana: "こんにちは！よろしくおねがいします。",
        romaji: "Konnichiwa! Yoroshiku onegaishimasu.",
        translation: "Xin chào bạn! Rất mong được giúp đỡ.",
      },
      {
        japanese: "こんにちは！今日もよろしくお願いします。",
        furigana: "こんにちは！きょうもよろしくおねがいします。",
        romaji: "Konnichiwa! Kyou mo yoroshiku onegaishimasu.",
        translation: "Xin chào! Hôm nay cũng nhờ bạn giúp đỡ nhé.",
      },
    ];
  }

  // 8. Default fallback
  return [
    {
      japanese: "はい、分かりました。",
      furigana: "はい、わかりました。",
      romaji: "Hai, wakarimashita.",
      translation: "Vâng, tôi hiểu rồi ạ.",
    },
    {
      japanese: "詳しく教えていただけますか？",
      furigana: "くわしくおしえていただけますか？",
      romaji: "Kuwashiku oshiete itadakemasu ka?",
      translation: "Bạn có thể chỉ rõ hơn giúp tôi được không ạ?",
    },
  ];
};

export const FreeRoleplayChat: React.FC<FreeRoleplayChatProps> = ({
  lessonId,
  scenarioTitle,
  level = "N5",
  initialAiDialogue,
  initialSuggestedAnswers,
  showFurigana,
  showRomaji,
  showTranslation,
  onToggleFurigana,
  onToggleRomaji,
  onToggleTranslation,
}) => {
  const authStore = useAuthStore();
  const rawUserName =
    authStore.user?.displayName ||
    authStore.user?.firstName ||
    (authStore.user?.lastName ? `${authStore.user.lastName} ${authStore.user?.firstName || ""}`.trim() : "") ||
    authStore.user?.username ||
    "Học viên";
  const learnerIdentity = getLearnerJapaneseIdentity(rawUserName);

  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Conversation progress & completion state
  const sessionStartTimeRef = useRef<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    overallScore: number;
    userTurns: number;
    durationSeconds: number;
    xpEarned: number;
    strengths: string[];
    betterExpressions: Array<{ original?: string; better: string; furigana?: string }>;
  } | null>(null);

  const targetTurns = 6;
  const userTurnCount = messages.filter((m) => m.sender === "user").length;
  const progressPercent = Math.min(100, Math.round((userTurnCount / targetTurns) * 100));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Warm up voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      handleVoices();
    }
  }, []);

  // Audio Speech Synthesis function (Microsoft Edge Neural TTS first, then Browser SpeechSynthesis)
  const speakText = useCallback(async (text: string, msgId?: string) => {
    if (!text) return;

    // 1. Cancel any active audio
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

    if (msgId) setPlayingMessageId(msgId);

    // 2. Primary Engine: Microsoft Edge Neural TTS (Studio-grade Tokyo Japanese)
    try {
      const ttsData = await practiceService.synthesizeVoice(
        text,
        "ja-JP-NanamiNeural",
        "FEMALE",
        0.95
      );

      if (ttsData?.audioContent) {
        const mimeType = ttsData.mimeType || "audio/mp3";
        const audio = new Audio(`data:${mimeType};base64,${ttsData.audioContent}`);
        audioElementRef.current = audio;
        audio.onended = () => {
          setPlayingMessageId(null);
          audioElementRef.current = null;
        };
        audio.onerror = () => {
          setPlayingMessageId(null);
          audioElementRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch (_) {
      // Backend TTS offline -> fallback to local browser SpeechSynthesis
    }

    // 3. Fallback: Browser SpeechSynthesis with Bunsetsu phrasing pauses
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const phrasedText = formatJapaneseForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(phrasedText);
        utterance.lang = "ja-JP";
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Prevent GC aborting audio in Chromium
        currentUtteranceRef.current = utterance;
        (window as unknown as { __jtalkUtterance: SpeechSynthesisUtterance }).__jtalkUtterance = utterance;

        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(
          (v) =>
            v.lang === "ja-JP" ||
            v.lang.startsWith("ja") ||
            v.lang.includes("JP") ||
            v.name.toLowerCase().includes("japanese")
        );
        if (jaVoice) {
          utterance.voice = jaVoice;
        }

        utterance.onend = () => {
          setPlayingMessageId(null);
          currentUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setPlayingMessageId(null);
          currentUtteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("TTS playback error:", e);
        setPlayingMessageId(null);
      }
    } else {
      setPlayingMessageId(null);
    }
  }, []);

  // Stop playing audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause();
        } catch (_) {}
      }
    };
  }, []);

  // Finish conversation and show comprehensive pedagogical summary modal
  const handleFinishConversation = useCallback(
    async (historyMsgs: RoleplayMessage[] = messages) => {
      const userMsgs = historyMsgs.filter((m) => m.sender === "user");
      const turns = userMsgs.length;

      // Calculate average naturalness score from user turns
      const scores = userMsgs
        .map((m) => m.evaluation?.naturalnessScore)
        .filter((s): s is number => typeof s === "number");

      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 88;

      const durationSeconds = Math.max(
        15,
        Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
      );
      const xpEarned = 30; // 30 XP completion reward for freeform Kaiwa!

      // Collect better expressions learned in this roleplay session
      const betterExpressions: Array<{ original?: string; better: string; furigana?: string }> = [];
      userMsgs.forEach((m) => {
        if (m.evaluation?.betterExpression) {
          betterExpressions.push({
            original: m.japanese,
            better: m.evaluation.betterExpression,
            furigana: m.evaluation.betterExpressionFurigana,
          });
        }
      });

      const strengths = [
        "Phản xạ đối đáp tự nhiên và trả lời đúng trọng tâm câu hỏi",
        "Tiếp thu ngữ cảnh nhanh và vận dụng từ vựng linh hoạt",
        "Có tinh thần tương tác chủ động và phát âm rõ ràng",
      ];

      setSummaryData({
        overallScore: avgScore,
        userTurns: Math.max(1, turns),
        durationSeconds,
        xpEarned,
        strengths,
        betterExpressions,
      });

      setShowSummaryModal(true);
      setIsCompleted(true);
      soundEffects.playSuccess();

      // Save practice result to database & increment gamification streak
      try {
        const saveRes = await practiceService.savePractice({
          lessonId: lessonId || "sc-roleplay",
          sampleSentence: scenarioTitle,
          transcript: userMsgs.map((m) => m.japanese).join(" | "),
          overallScore: avgScore,
          durationSeconds,
          scores: {
            pronunciation: avgScore,
            accuracy: Math.min(100, avgScore + 2),
            fluency: avgScore,
            completeness: 95,
          },
        });

        if (saveRes?.gamification) {
          authStore.updateUserGamification(saveRes.gamification);
        }
      } catch (err) {
        console.debug("Could not save roleplay session to history:", err);
      }
    },
    [messages, scenarioTitle, lessonId, authStore]
  );

  // Initialize conversation with scenario's opening dialogue
  const initConversation = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    sessionStartTimeRef.current = Date.now();
    setIsCompleted(false);
    setShowSummaryModal(false);
    setSummaryData(null);

    const defaultOpening = initialAiDialogue || getDefaultOpeningForScenario(scenarioTitle);

    // Bắt đầu trạng thái tải gợi ý thông minh từ AI (không để 1 câu đơn lẻ gây gò bó/lỗi thời)
    setIsLoadingSuggestions(true);

    const firstMessage: RoleplayMessage = {
      id: `ai-init-${Date.now()}`,
      sender: "ai",
      japanese: defaultOpening.japanese,
      furigana: defaultOpening.furigana,
      romaji: defaultOpening.romaji,
      translation: defaultOpening.translation,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedAnswers: [],
    };

    setMessages([firstMessage]);
    setShowSuggestions(true);
    setInputVal("");
    setLiveTranscript("");

    // Tải bộ gợi ý AI đa dạng, nếu có lỗi thì fallback về bộ gợi ý ngữ cảnh phong phú (2-3 lựa chọn)
    practiceService
      .getRoleplaySuggestions({
        lessonId,
        scenarioTitle,
        level,
        aiMessage: defaultOpening.japanese,
        userName: rawUserName,
      })
      .then((res) => {
        if (res?.suggestedAnswers && res.suggestedAnswers.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === firstMessage.id ? { ...m, suggestedAnswers: res.suggestedAnswers } : m
            )
          );
        } else {
          const fallback = getContextualRoleplaySuggestions(scenarioTitle, defaultOpening.japanese, level, rawUserName);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === firstMessage.id ? { ...m, suggestedAnswers: fallback } : m
            )
          );
        }
      })
      .catch((err) => {
        console.warn("Using local contextual suggestions for opening dialogue:", err);
        const fallback = getContextualRoleplaySuggestions(scenarioTitle, defaultOpening.japanese, level, rawUserName);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === firstMessage.id ? { ...m, suggestedAnswers: fallback } : m
          )
        );
      })
      .finally(() => {
        setIsLoadingSuggestions(false);
      });

    // Auto-play initial greeting if enabled
    if (autoPlayAudio) {
      setTimeout(() => {
        speakText(defaultOpening.japanese, firstMessage.id);
      }, 500);
    }
  }, [
    initialAiDialogue,
    initialSuggestedAnswers,
    scenarioTitle,
    level,
    lessonId,
    autoPlayAudio,
    speakText,
  ]);

  useEffect(() => {
    initConversation();
  }, [lessonId]);

  // Start recording Japanese speech (Web Speech API)
  const startRecording = useCallback(() => {
    // Check quota for free accounts
    const isPremium = authStore.user?.subscription?.tier === "premium";
    const userCount = authStore.user?.dailyUsage?.practiceCount ?? 0;
    const currentUsed = Math.max(userCount, authStore.dailyPracticeCount);

    const freeLimit =
      typeof authStore.user?.quota?.limit === "number" ? authStore.user.quota.limit : 5;

    if (!isPremium && currentUsed >= freeLimit) {
      toast.error(`Bạn đã dùng hết ${freeLimit} lượt luyện nói miễn phí trong ngày. Nâng cấp Premium để trò chuyện vô hạn!`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API. Bạn có thể nhập văn bản tiếng Nhật trực tiếp vào ô bên dưới.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      isRecordingRef.current = true;
      setIsRecording(true);
      setLiveTranscript("");

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ja-JP";

      let finalTrans = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += trans;
          } else {
            interim += trans;
          }
        }
        const full = finalTrans || interim;
        setLiveTranscript(full);
        setInputVal(full);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === "not-allowed") {
          toast.error("Vui lòng cho phép quyền truy cập Microphone trong trình duyệt.");
          isRecordingRef.current = false;
          setIsRecording(false);
        }
        // Do not abort on transient 'no-speech' error
      };

      recognition.onend = () => {
        // If user is still actively recording, restart recognition so it doesn't shut down
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        } else {
          setIsRecording(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Could not start recording:", err);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [authStore]);

  // Stop recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Send message to AI and receive dynamic roleplay reply
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal || liveTranscript).trim();
    if (!messageText || isLoading) return;

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: RoleplayMessage = {
      id: userMsgId,
      sender: "user",
      japanese: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Append user message immediately to chat stream
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputVal("");
    setLiveTranscript("");
    setIsLoading(true);

    try {
      // Increment quota count
      authStore.incrementDailyPracticeCount();

      const response = await practiceService.roleplayChat({
        lessonId,
        scenarioTitle,
        level,
        conversationHistory: updatedHistory,
        userMessage: messageText,
        userName: rawUserName,
      });

      if (response && response.aiReply) {
        // Update user message with evaluation feedback from AI
        if (response.userEvaluation) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId
                ? {
                    ...m,
                    evaluation: response.userEvaluation,
                  }
                : m
            )
          );
          // Automatically expand feedback card for the latest user turn
          setExpandedFeedbackId(userMsgId);
        }

        const aiMsgId = `ai-${Date.now()}`;
        const dynamicSuggestions =
          response.suggestedAnswers && response.suggestedAnswers.length > 0
            ? response.suggestedAnswers
            : getContextualRoleplaySuggestions(scenarioTitle, response.aiReply.japanese, level, rawUserName);

        const aiMsg: RoleplayMessage = {
          id: aiMsgId,
          sender: "ai",
          japanese: response.aiReply.japanese,
          furigana: response.aiReply.furigana,
          romaji: response.aiReply.romaji,
          translation: response.aiReply.translation,
          suggestedAnswers: dynamicSuggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setShowSuggestions(true);

        // Auto play audio response from AI
        if (autoPlayAudio) {
          setTimeout(() => {
            speakText(aiMsg.japanese, aiMsgId);
          }, 300);
        }

        // Auto trigger completion modal if AI finished the conversation (Turn 6+ or polite goodbye)
        if (response.isFinished) {
          setIsCompleted(true);
          setTimeout(() => {
            handleFinishConversation([...updatedHistory, aiMsg]);
          }, 3500);
        }
      }
    } catch (err) {
      console.error("Roleplay chat API error:", err);
      toast.error("Không thể kết nối tới gia sư AI. Đang hiển thị phản hồi mẫu.");

      const fallbackSuggestions = getContextualRoleplaySuggestions(
        scenarioTitle,
        "なるほど、分かりました！",
        level,
        rawUserName
      );

      // Friendly fallback message
      const fallbackAiMsg: RoleplayMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        japanese: "なるほど、分かりました！とても上手な日本語ですね。他に何か言いたいことはありますか？",
        furigana: "なるほど、わかりました！とてもじょうずなにほんごですね。ほかになにかいいたいことはありますか？",
        romaji: "Naruhodo, wakarimashita! Totemo jouzu na nihongo desu ne. Hoka ni nanika iitai koto wa arimasu ka?",
        translation: "Tôi hiểu rồi! Bạn nói tiếng Nhật rất tốt đó. Bạn còn điều gì muốn chia sẻ nữa không?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedAnswers: fallbackSuggestions,
      };

      setMessages((prev) => [...prev, fallbackAiMsg]);
      setShowSuggestions(true);
      if (autoPlayAudio) {
        speakText(fallbackAiMsg.japanese, fallbackAiMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get current suggested answers from the last AI message
  const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
  const suggestedReplies = lastAiMessage?.suggestedAnswers || [];

  // Refresh suggestions with AI for the current active AI dialogue
  const handleRefreshSuggestions = async () => {
    if (!lastAiMessage || isRefreshingSuggestions) return;
    setIsRefreshingSuggestions(true);
    try {
      const res = await practiceService.getRoleplaySuggestions({
        lessonId,
        scenarioTitle,
        level,
        aiMessage: lastAiMessage.japanese,
        conversationHistory: messages,
        userName: rawUserName,
      });
      if (res?.suggestedAnswers && res.suggestedAnswers.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === lastAiMessage.id ? { ...m, suggestedAnswers: res.suggestedAnswers } : m
          )
        );
        setShowSuggestions(true);
        toast.success("Đã làm mới câu gợi ý phản xạ!");
      }
    } catch (err) {
      console.warn("Could not refresh suggestions:", err);
      toast.error("Chưa thể làm mới câu gợi ý lúc này.");
    } finally {
      setIsRefreshingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors">
      {/* 1. Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs">
            AI
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{scenarioTitle}</h3>
              <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded text-2xs font-bold border border-rose-200/50 dark:border-rose-800/60">
                {level}
              </span>
              <span
                className="px-2 py-0.5 bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-2xs font-semibold border border-rose-200/70 dark:border-rose-800/60 flex items-center gap-1 shadow-2xs"
                title={`Họ tên học viên: ${learnerIdentity.originalName} (${learnerIdentity.katakanaFullName})`}
              >
                <span>🇯🇵</span>
                <span>{learnerIdentity.callingName}</span>
              </span>
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Đối đáp tự do theo ngữ cảnh thời gian thực</p>
          </div>
        </div>

        {/* Progress & Active Completion Control */}
        <div className="flex items-center gap-2">
          {/* Conversation Progress Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800/90 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs"
            title={`Tiến trình đàm thoại: ${userTurnCount}/${targetTurns} lượt`}
          >
            <div className="w-14 sm:w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-2xs whitespace-nowrap">
              Lượt {userTurnCount}/{targetTurns}
            </span>
            {userTurnCount >= targetTurns && (
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-3xs font-bold animate-pulse">
                Đủ lượt!
              </span>
            )}
          </div>

          {/* Manual Finish Button (active after at least 2 user turns) */}
          {userTurnCount >= 2 && (
            <button
              onClick={() => handleFinishConversation()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer animate-in fade-in"
              title="Kết thúc đàm thoại và xem tổng kết điểm phản xạ từ Sensei"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hoàn thành</span>
              <span>🏁</span>
            </button>
          )}

          {/* Audio Auto-Play Toggle */}
          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            type="button"
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              autoPlayAudio
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
            title={autoPlayAudio ? "Tự động phát âm thanh AI: BẬT" : "Tự động phát âm thanh AI: TẮT"}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            <span className="hidden lg:inline">{autoPlayAudio ? "Tự động đọc" : "Tắt đọc"}</span>
          </button>

          {/* Subtitle controls */}
          <button
            onClick={onToggleFurigana}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showFurigana
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Hiragana
          </button>
          <button
            onClick={onToggleRomaji}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showRomaji
                ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Romaji
          </button>
          <button
            onClick={onToggleTranslation}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showTranslation
                ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Bản dịch
          </button>

          {/* Reset button */}
          <button
            onClick={initConversation}
            type="button"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Làm mới cuộc trò chuyện từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-[#0c121e]/80 transition-colors">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          const isPlaying = playingMessageId === msg.id;
          const isFeedbackOpen = expandedFeedbackId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1.5 animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 dark:text-slate-500 px-1">
                <span>{isAi ? "Gia sư AI" : "Bạn"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2 relative ${
                  isAi
                    ? "bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-tl-sm"
                    : "bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white rounded-tr-sm"
                }`}
              >
                {/* Audio speaker button for AI messages */}
                {isAi && (
                  <button
                    onClick={() => speakText(msg.japanese, msg.id)}
                    type="button"
                    className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors cursor-pointer ${
                      isPlaying
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 animate-pulse"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                    title="Nghe lại phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Primary Japanese Text */}
                <p className="text-base sm:text-lg md:text-xl font-bold font-sans tracking-wide pr-6 leading-relaxed">
                  {msg.japanese}
                </p>

                {/* Hiragana / Furigana subtitle */}
                {showFurigana && msg.furigana && (
                  <p
                    className={`text-xs sm:text-sm font-semibold tracking-wider font-sans ${
                      isAi ? "text-rose-700 dark:text-rose-400" : "text-rose-100"
                    }`}
                  >
                    {msg.furigana}
                  </p>
                )}

                {/* Romaji */}
                {showRomaji && msg.romaji && (
                  <p
                    className={`text-xs font-mono tracking-wide ${
                      isAi ? "text-slate-400 dark:text-slate-400" : "text-amber-100"
                    }`}
                  >
                    {msg.romaji}
                  </p>
                )}

                {/* Vietnamese Translation */}
                {showTranslation && msg.translation && (
                  <p
                    className={`text-xs sm:text-sm font-medium pt-1 border-t ${
                      isAi
                        ? "border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300"
                        : "border-rose-400/40 text-rose-50"
                    }`}
                  >
                    {msg.translation}
                  </p>
                )}
              </div>

              {/* Feedback Accordion for User Messages */}
              {!isAi && msg.evaluation && (
                <div className="max-w-[85%] sm:max-w-[75%] w-full">
                  <button
                    onClick={() => setExpandedFeedbackId(isFeedbackOpen ? null : msg.id)}
                    type="button"
                    className="flex items-center justify-between w-full px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 border border-rose-200/90 dark:border-rose-800 rounded-xl text-2xs font-bold text-rose-800 dark:text-rose-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                      <span>Đánh giá phản xạ: {msg.evaluation.naturalnessScore ?? 85}/100</span>
                    </div>
                    {isFeedbackOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isFeedbackOpen && (
                    <div className="p-3 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/80 rounded-2xl mt-1.5 space-y-2 text-xs shadow-2xs animate-in fade-in duration-150">
                      {msg.evaluation.grammarAdvice && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                            <span>Nhận xét của AI:</span>
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{msg.evaluation.grammarAdvice}</p>
                        </div>
                      )}

                      {msg.evaluation.betterExpression && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                          <span className="font-bold text-rose-800 dark:text-rose-300 block">
                            Cách nói tự nhiên hơn chuẩn bản xứ:
                          </span>
                          <p className="font-bold text-rose-950 dark:text-rose-100 font-sans mt-0.5 text-sm">
                            {msg.evaluation.betterExpression}
                          </p>
                          {showFurigana && msg.evaluation.betterExpressionFurigana && (
                            <p className="text-2xs font-semibold text-rose-700 dark:text-rose-400 font-sans tracking-wide mt-0.5">
                              {msg.evaluation.betterExpressionFurigana}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble when AI is thinking */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs shrink-0">
              AI
            </div>
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl rounded-tl-sm p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-2xs font-semibold text-slate-400 dark:text-slate-500">Gia sư AI đang lắng nghe và suy nghĩ câu đối đáp...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Control & Interactive Recording Zone */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        {/* Trạng thái tải gợi ý: Thay vì để 1 câu lẻ thì hiển thị "Bạn cần trợ giúp chứ..." kèm 3 dấu chấm nảy lên và vòng tròn xoay */}
        {(isLoadingSuggestions || isRefreshingSuggestions) && !isLoading && (
          <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-600 dark:text-amber-400 shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <span>Bạn cần trợ giúp chứ</span>
                <span className="inline-flex items-center gap-1 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                </span>
              </div>
            </div>
            <span className="text-2xs font-medium text-amber-700/80 dark:text-amber-400/80 hidden sm:inline">
              Gia sư AI đang chuẩn bị các câu đối đáp gợi ý...
            </span>
          </div>
        )}

        {/* Suggested Quick Replies (Gợi ý câu đối đáp nhanh - hiển thị khi đã sẵn sàng bộ gợi ý) */}
        {!isLoadingSuggestions && !isRefreshingSuggestions && suggestedReplies.length > 0 && !isLoading && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 border border-amber-200/90 dark:border-amber-900 rounded-full text-2xs font-bold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 animate-spin-slow" />
                  <span>Gợi ý câu đối đáp ({suggestedReplies.length})</span>
                  {showSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={handleRefreshSuggestions}
                  disabled={isRefreshingSuggestions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Tạo gợi ý mới chuẩn ngữ cảnh bằng AI"
                >
                  <Sparkles
                    className={`w-3 h-3 text-amber-500 ${isRefreshingSuggestions ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isRefreshingSuggestions ? "Đang tạo..." : "Đổi gợi ý AI"}
                  </span>
                </button>
              </div>

              {showSuggestions && (
                <span className="text-3xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Bấm câu để điền nhanh & nghe giọng đọc
                </span>
              )}
            </div>

            {showSuggestions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 pb-1 pt-0.5 scrollbar-thin">
                {suggestedReplies.map((item, idx) => {
                  const jap = typeof item === "string" ? item : item.japanese;
                  const furi = typeof item === "object" ? item.furigana : undefined;
                  const rom = typeof item === "object" ? item.romaji : undefined;
                  const trans = typeof item === "object" ? item.translation : undefined;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setInputVal(jap);
                        soundEffects.playTap();
                        speakText(jap);
                        toast.success("Đã chọn câu gợi ý! Bạn có thể luyện nói hoặc bấm gửi.");
                      }}
                      className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-800/90 dark:to-slate-800/60 border border-slate-200/90 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 shadow-2xs hover:shadow-md transition-all cursor-pointer text-left"
                    >
                      <div className="space-y-1">
                        {/* Tầng 1: Furigana / Hiragana & Speaker Icon Button */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-2xs font-bold text-rose-600 dark:text-rose-400 font-sans tracking-wide truncate">
                            {furi || "ひらがな"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(jap);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer shrink-0"
                            title="Bấm để nghe phát âm mẫu chuẩn"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tầng 2: Kanji / Tiếng Nhật chính */}
                        <p className="text-sm font-bold text-slate-900 dark:text-white font-sans group-hover:text-rose-600 dark:group-hover:text-rose-300 leading-snug transition-colors">
                          {jap}
                        </p>

                        {/* Tầng 3: Romaji */}
                        {rom && (
                          <p className="text-3xs font-mono italic text-slate-500 dark:text-slate-400">
                            {rom}
                          </p>
                        )}
                      </div>

                      {/* Tầng 4: Bản dịch tiếng Việt */}
                      {trans && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                            {trans}
                          </p>
                          <span className="text-3xs text-rose-500 dark:text-rose-400 font-semibold shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Chọn câu →
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live speech feedback when recording */}
        {isRecording && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Đang lắng nghe giọng nói tiếng Nhật của bạn:
              </span>
              <span className="text-xs font-bold text-rose-950 dark:text-rose-100 font-sans">
                {liveTranscript || "..."}
              </span>
            </div>
            <button
              onClick={stopRecording}
              type="button"
              className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Xong
            </button>
          </div>
        )}

        {/* Input & Record Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Big Mic Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            type="button"
            className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isRecording
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                : "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white hover:shadow-md"
            }`}
            title={isRecording ? "Bấm để dừng ghi âm" : "Bấm để nói tiếng Nhật với AI"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
          </button>

          {/* Text input with transcript preview */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isRecording
                  ? "Đang nhận diện giọng nói của bạn..."
                  : "Bấm Micro để nói tiếng Nhật hoặc gõ câu trả lời..."
              }
              className="w-full pl-4 pr-10 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus:border-rose-500 dark:focus:border-rose-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm sm:text-base font-sans font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden transition-all"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => speakText(inputVal)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Nghe phát âm câu này"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-3 sm:p-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-105 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            title="Gửi câu trả lời"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* 4. Roleplay Completion & Pedagogical Summary Modal */}
      {summaryData && (
        <RoleplaySummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          onRestart={initConversation}
          scenarioTitle={scenarioTitle}
          level={level}
          overallScore={summaryData.overallScore}
          userTurns={summaryData.userTurns}
          durationSeconds={summaryData.durationSeconds}
          xpEarned={summaryData.xpEarned}
          strengths={summaryData.strengths}
          betterExpressions={summaryData.betterExpressions}
        />
      )}
    </div>
  );
};

export default FreeRoleplayChat;
