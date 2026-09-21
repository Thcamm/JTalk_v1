import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Sparkles,
  Flame,
  ChevronRight,
} from "lucide-react";
import { curriculumService } from "@/services/curriculum.service";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { useAuth } from "@/hooks/useAuth";
import { Waveform } from "@/components/practice/Waveform";
import { MicRecorder } from "@/components/practice/MicRecorder";
import { FeedbackCard } from "@/components/practice/FeedbackCard";
import { WordHighlight } from "@/components/practice/WordHighlight";
import { AudioPlayer } from "@/components/practice/AudioPlayer";
import { FreeRoleplayChat } from "@/components/practice/FreeRoleplayChat";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Lesson } from "@/types";

// Fallback scenarios with full multi-turn authentic Japanese dialogues
const SCENARIO_FALLBACKS: Record<string, Partial<Lesson>> = {
  "sc-1": {
    title: "新しいクラスでの自己紹介 (Tự giới thiệu trong lớp học mới)",
    sampleSentence: "初めまして、ナムと申します。どうぞよろしくお願いします。",
    translation: "Rất vui được gặp bạn, tôi tên là Nam. Rất mong nhận được sự giúp đỡ.",
    level: "N5",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "こんにちは！新しいクラスへようこそ。お名前は何ですか？",
        furigana: "こんにちは！あたらしいクラスへようこそ。おなまえはなんですか？",
        romaji: "Konnichiwa! Atarashii kurasu e youkoso. Onamae wa nan desu ka?",
        translation: "Xin chào! Chào mừng bạn tới lớp học mới. Bạn tên là gì thế?",
        expectedAnswer: "初めまして、ナムと申します。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "初めまして、ナムと申します。ベトナムから来ました。",
        furigana: "はじめまして、ナムともうします。ベトナムからきました。",
        romaji: "Hajimemashite, Namu to moushimasu. Betonamu kara kimashita.",
        translation: "Rất vui được gặp bạn, tôi tên là Nam. Tôi đến từ Việt Nam.",
        expectedAnswer: "初めまして、ナムと申します。ベトナムから来ました。",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "ナムさんですね！趣味は何ですか？休みの日は何をしますか？",
        furigana: "ナムさんですね！しゅみはなんですか？やすみのひはなにをしますか？",
        romaji: "Namu-san desu ne! Shuumi wa nan desu ka? Yasumi no hi wa nani o shimasu ka?",
        translation: "Bạn Nam đúng không! Sở thích của bạn là gì? Ngày nghỉ bạn làm gì?",
        expectedAnswer: "私の趣味は音楽を聴くことです。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "私の趣味は音楽を聴くことです。休みの日はよく散歩します。",
        furigana: "わたしのしゅみはおんがくをきくことです。やすみのひはよくさんぽします。",
        romaji: "Watashi no shuumi wa ongaku o kiku koto desu. Yasumi no hi wa yoku sanpo shimasu.",
        translation: "Sở thích của tôi là nghe nhạc. Ngày nghỉ tôi thường hay đi dạo.",
        expectedAnswer: "私の趣味は音楽を聴くことです。休みの日はよく散歩します。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "いいですね！日本語の勉強を一緒に頑張りましょう。よろしくね！",
        furigana: "いいですね！にほんごのべんきょうをいっしょにがんばりましょう。よろしくね！",
        romaji: "Ii desu ne! Nihongo no benkyou o issho ni gambarimashou. Yoroshiku ne!",
        translation: "Hay quá! Chúng mình cùng cố gắng học tiếng Nhật nhé. Rất vui được quen bạn!",
        expectedAnswer: "はい、こちらこそどうぞよろしくお願いします！",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "はい、こちらこそどうぞよろしくお願いします！",
        furigana: "はい、こちらこそどうぞよろしくおねがいします！",
        romaji: "Hai, kochira koso douzo yoroshiku onegaishimasu!",
        translation: "Vâng, chính tôi cũng rất mong nhận được sự giúp đỡ của bạn!",
        expectedAnswer: "はい、こちらこそどうぞよろしくお願いします！",
      },
    ],
  },
  "sc-2": {
    title: "毎日の生活と習慣 (Cuộc sống và thói quen hàng ngày)",
    sampleSentence: "わたしは毎朝6時に起きます。それから軽くジョギングをします。",
    translation: "Tôi thức dậy vào 6 giờ sáng mỗi ngày. Sau đó tôi đi chạy bộ nhẹ nhàng.",
    level: "N5",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "ナムさんは毎朝、いつも何時に起きますか？",
        furigana: "ナムさんはまいあさ、いつもなんじにおきますか？",
        romaji: "Namu-san wa maiasa, itsumo nanji ni okimasu ka?",
        translation: "Bạn Nam mỗi buổi sáng thường thức dậy lúc mấy giờ?",
        expectedAnswer: "わたしは毎朝6時に起きます。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "わたしは毎朝6時に起きます。それから軽くジョギングをします。",
        furigana: "わたしはまいあさろくじにおきます。それからかるくジョギングをします。",
        romaji: "Watashi wa maiasa rokuji ni okimasu. Sorekara karuku jogingu o shimasu.",
        translation: "Tôi thức dậy vào 6 giờ sáng mỗi ngày. Sau đó tôi đi chạy bộ nhẹ nhàng.",
        expectedAnswer: "わたしは毎朝6時に起きます。それから軽くジョギングをします。",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "健康的な生活ですね！朝ごはんは何をよく食べますか？",
        furigana: "けんこうてきなせいかつですね！あさごはんはなにをよくたべますか？",
        romaji: "Kenkouteki na seikatsu desu ne! Asagohan wa nani o yoku tabemasu ka?",
        translation: "Lối sống thật lành mạnh! Bữa sáng bạn thường ăn món gì?",
        expectedAnswer: "パンと卵を食べます。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "パンと目玉焼きを食べて、温かいコーヒーを飲みます。",
        furigana: "パンとめだまやきをたべて、あたたかいコーヒーをのみます。",
        romaji: "Pan to medamayaki o tabete, atatakai koohii o nomimasu.",
        translation: "Tôi ăn bánh mì với trứng ốp la, rồi uống một cốc cà phê ấm.",
        expectedAnswer: "パンと目玉焼きを食べて、温かいコーヒーを飲みます。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "夜は何時頃に寝ますか？ぐっすり眠れていますか？",
        furigana: "よるはなんじごろにねますか？ぐっすりねむれていますか？",
        romaji: "Yoru wa nanji goro ni nemasu ka? Gussuri nemurete imasu ka?",
        translation: "Buổi tối khoảng mấy giờ bạn đi ngủ? Bạn có ngủ ngon giấc không?",
        expectedAnswer: "夜11時半頃に寝ます。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "夜11時半頃に寝ます。いつもよく眠れますよ。",
        furigana: "よるじゅういちじはんごろにねます。いつもよくねむれますよ。",
        romaji: "Yoru juuichijihan goro ni nemasu. Itsumo yoku nemuremasu yo.",
        translation: "Tôi đi ngủ vào khoảng 11 giờ rưỡi tối. Lúc nào tôi cũng ngủ rất ngon.",
        expectedAnswer: "夜11時半頃に寝ます。いつもよく眠れますよ。",
      },
    ],
  },
  "sc-3": {
    title: "病院で診察を受ける (Khám bệnh tại phòng khám Nhật)",
    sampleSentence: "昨日から頭がズキズキ痛くて、少し熱もあります。",
    translation: "Từ hôm qua đầu tôi đau nhói và tôi cũng có hơi sốt một chút.",
    level: "N4",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "こんにちは。今日はどのような症状で来られましたか？",
        furigana: "こんにちは。きょうはどのようなしょうじょうでこられましたか？",
        romaji: "Konnichiwa. Kyou wa dono you na shoujou de koraremashita ka?",
        translation: "Xin chào bạn. Hôm nay bạn đến khám với những triệu chứng như thế nào?",
        expectedAnswer: "昨日から頭が痛いです。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "昨日から頭がズキズキ痛くて、少し熱もあります。",
        furigana: "きのうからあたまがズキズキいたくて、すこしねつもあります。",
        romaji: "Kinou kara atama ga zukizuki itakute, sukoshi netsu mo arimasu.",
        translation: "Từ hôm qua đầu tôi đau nhói và tôi cũng có hơi sốt một chút.",
        expectedAnswer: "昨日から頭がズキズキ痛くて、少し熱もあります。",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "喉の痛みや咳はありますか？熱は何度くらいですか？",
        furigana: "のどのいたみやせきはありますか？ねつはなんどくらいですか？",
        romaji: "Nodo no itami ya seki wa arimasu ka? Netsu wa nando kurai desu ka?",
        translation: "Bạn có bị đau họng hay ho không? Bạn sốt khoảng bao nhiêu độ?",
        expectedAnswer: "喉が痛くて、熱は37度5分あります。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "喉が痛くて、熱は37度5分あります。咳も少し出ます。",
        furigana: "のどがいたくて、ねつはさんじゅうななどごぶあります。せきもすこしでます。",
        romaji: "Nodo ga itakute, netsu wa sanjuunanado gobu arimasu. Seki mo sukoshi demasu.",
        translation: "Họng tôi đau rát, nhiệt độ là 37 độ 5. Tôi cũng bị ho nhẹ nữa.",
        expectedAnswer: "喉が痛くて、熱は37度5分あります。咳も少し出ます。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "風邪の初期症状ですね。3日分の薬を出しますので、食後に飲んでください。",
        furigana: "かぜのしょきしょうじょうですね。みっかぶんのくすりをだしますので、しょくごにのんでください。",
        romaji: "Kaze no shoki shoujou desu ne. Mikkabun no kusuri o dashimasu node, shokugo ni nonde kudasai.",
        translation: "Đây là triệu chứng cảm cúm giai đoạn đầu. Tôi kê thuốc 3 ngày, hãy uống sau bữa ăn nhé.",
        expectedAnswer: "わかりました。温かくしてゆっくり休みます。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "わかりました。温かくしてゆっくり休みます。ありがとうございました。",
        furigana: "わかりました。あたたかくしてゆっくりやすみます。ありがとうございました。",
        romaji: "Wakarimashita. Atatakaku shite yukkuri yasumimasu. Arigatou gozaimashita.",
        translation: "Tôi hiểu rồi. Tôi sẽ giữ ấm và nghỉ ngơi tĩnh dưỡng. Cảm ơn bác sĩ nhiều ạ.",
        expectedAnswer: "わかりました。温かくしてゆっくり休みます。ありがとうございました。",
      },
    ],
  },
  "sc-4": {
    title: "カフェで飲み物を注文する (Gọi đồ uống tại quán Cafe)",
    sampleSentence: "アイスカフェラテのMサイズをひとつと、チーズケーキをください。",
    translation: "Cho tôi một ly cà phê latte đá size M và một phần bánh cheesecake.",
    level: "N4",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "いらっしゃいませ！店内でお召し上がりですか、お持ち帰りですか？",
        furigana: "いらっしゃいませ！てんないでおめしあがりですか、おもちかえりですか？",
        romaji: "Irasshaimase! Tennai de omeshiagari desu ka, omochikaeri desu ka?",
        translation: "Kính chào quý khách! Quý khách dùng tại quán hay mang về ạ?",
        expectedAnswer: "店内でお願いします。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "店内でお願いします。窓側の席に座ってもいいですか？",
        furigana: "てんないでおねがいします。まどがわのせきにすわってもいいですか？",
        romaji: "Tennai de onegaishimasu. Madogiwa no seki ni suwatte mo ii desu ka?",
        translation: "Tôi dùng tại quán. Tôi có thể ngồi bàn cạnh cửa sổ được không ạ?",
        expectedAnswer: "店内でお願いします。窓側の席に座ってもいいですか？",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "もちろん大丈夫ですよ。ご注文はお決まりになりましたか？",
        furigana: "もちろんだいじょうぶですよ。ごちゅうもんはおきまりになりましたか？",
        romaji: "Mochiron daijoubu desu yo. Gochuumon wa okimari ni narimashita ka?",
        translation: "Dạ được chứ ạ. Quý khách đã quyết định chọn đồ uống gì chưa ạ?",
        expectedAnswer: "アイスカフェラテのMサイズをひとつください。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "アイスカフェラテのMサイズをひとつと、チーズケーキをください。",
        furigana: "アイスカフェラテのエムサイズをひとつと、チーズケーキをください。",
        romaji: "Aisukaferate no M-saizu o hitotsu to, chiizukeeki o kudasai.",
        translation: "Cho tôi một ly cafe latte đá size M và một phần bánh cheesecake.",
        expectedAnswer: "アイスカフェラテのMサイズをひとつと、チーズケーキをください。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "かしこまりました。お会計は750円になります。お支払いはどうされますか？",
        furigana: "かしこまりました。おかいけいはななひゃくごじゅうえんになります。おしはらいはどうされますか？",
        romaji: "Kashikomarimashita. Okaikei wa nanahyaku-gojuu-en ni narimasu. Oshiharai wa dou saremasu ka?",
        translation: "Dạ vâng. Hóa đơn là 750 yên. Quý khách muốn thanh toán bằng hình thức nào ạ?",
        expectedAnswer: "PayPayで支払いたいです。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "PayPayで支払いたいのですが、QRコードを読み取ってもいいですか？",
        furigana: "ペイペイでしはらいたいのですが、キューアールコードをよみとってもいいですか？",
        romaji: "Peipei de shiharaitai no desu ga, kyuuaarukoudo o yomitotte mo ii desu ka?",
        translation: "Tôi muốn thanh toán bằng PayPay, tôi quét mã QR này được không?",
        expectedAnswer: "PayPayで支払いたいのですが、QRコードを読み取ってもいいですか？",
      },
    ],
  },
  "sc-5": {
    title: "駅で道を尋ねる・乗換案内 (Hỏi đường và đi tàu điện Shinjuku)",
    sampleSentence: "すみません、新宿駅に行きたいんですが、どの電車に乗ればいいですか？",
    translation: "Xin lỗi, tôi muốn đi ga Shinjuku thì nên lên chuyến tàu nào ạ?",
    level: "N5",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "すみません、駅員です。何かお困りですか？",
        furigana: "すみません、えきいんです。なにかおこまりですか？",
        romaji: "Sumimasen, ekiin desu. Nanika okomari desu ka?",
        translation: "Xin lỗi bạn, tôi là nhân viên nhà ga. Bạn đang gặp khó khăn gì chăng?",
        expectedAnswer: "新宿駅に行きたいです。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "すみません、新宿駅に行きたいんですが、どの電車に乗ればいいですか？",
        furigana: "すみません、しんじゅくえきにいきたいんですが、どのでんしゃにのればいいですか？",
        romaji: "Sumimasen, Shinjuku-eki ni ikitai n desu ga, dono densha ni noreba ii desu ka?",
        translation: "Xin lỗi, tôi muốn đến ga Shinjuku thì tôi nên bắt chuyến tàu nào ạ?",
        expectedAnswer: "すみません、新宿駅に行きたいんですが、どの電車に乗ればいいですか？",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "3番線の山手線外回りに乗ってください。約15分で到着しますよ。",
        furigana: "さんばんせんのやまのてせんそとまわりにのってください。やくじゅうごふんでとうちゃくしますよ。",
        romaji: "Sanban-sen no Yamanote-sen sotomawari ni notte kudasai. Yaku juugofun de touchaku shimasu yo.",
        translation: "Bạn hãy đón tuyến Yamanote vòng ngoài ở đường ray số 3 nhé. Khoảng 15 phút là đến nơi.",
        expectedAnswer: "ありがとうございます。Suicaのチャージ機はどこですか？",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "ありがとうございます。Suicaのチャージ機はどこにありますか？",
        furigana: "ありがとうございます。スイカのチャージきはどこにありますか？",
        romaji: "Arigatou gozaimasu. Suica no chaaji-ki wa doko ni arimasu ka?",
        translation: "Cảm ơn bạn. Cho tôi hỏi máy nạp tiền thẻ Suica nằm ở đâu vậy?",
        expectedAnswer: "ありがとうございます。Suicaのチャージ機はどこにありますか？",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "改札の手前、左側にピンクの券売機があります。そこでチャージできますよ。",
        furigana: "かいさつのてまえ、ひだりがわにピンクのけんばいきがあります。そこでチャージできますよ。",
        romaji: "Kaisatsu no temae, hidarigawa ni pinku no kenbaiki ga arimasu. Sokode chaaji dekimasu yo.",
        translation: "Ngay trước cổng soát vé, phía bên trái có cây bán vé màu hồng. Nạp tiền tại đó nhé.",
        expectedAnswer: "分かりました！教えていただきありがとうございます。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "分かりました！とても親切に教えていただき、助かりました。",
        furigana: "わかりました！とてもしんせつにおしえていただき、たすかりました。",
        romaji: "Wakarimashita! Totemo shinsetsu ni oshiete itadaki, tasukarimashita.",
        translation: "Tôi rõ rồi! Bạn chỉ dẫn nhiệt tình quá, may có bạn giúp đỡ.",
        expectedAnswer: "分かりました！とても親切に教えていただき、助かりました。",
      },
    ],
  },
  "sc-6": {
    title: "採用面接・自己PRと志望動機 (Phỏng vấn xin việc Jikoshoukai)",
    sampleSentence: "わたしの強みは問題解決力と粘り強さです。御社でスキルを活かしたいです。",
    translation: "Thế mạnh của tôi là khả năng giải quyết vấn đề và sự kiên trì. Tôi muốn cống hiến tại quý công ty.",
    level: "N4",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "本日は面接にお越しいただきありがとうございます。まず自己紹介をお願いします。",
        furigana: "ほんじつはめんせつにおこしいただきありがとうございます。まずじこしょうかいをおねがいします。",
        romaji: "Honjitsu wa mensetsu ni okoshi itadaki arigatou gozaimasu. Mazu jikoshoukai o onegaishimasu.",
        translation: "Cảm ơn bạn đã đến tham gia buổi phỏng vấn hôm nay. Trước tiên xin mời bạn tự giới thiệu.",
        expectedAnswer: "ナムと申します。大学でITを専攻していました。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "ナムと申します。大学でITを専攻し、2年間ウェブ開発の経験があります。",
        furigana: "ナムともうします。だいがくでアイティーをせんこうし、にねんかんウェブかいはつのけいけんがあります。",
        romaji: "Namu to moushimasu. Daigaku de IT o senkou shi, ninenkan webu kaihatsu no keiken ga arimasu.",
        translation: "Tôi tên là Nam. Tôi chuyên ngành CNTT tại đại học và có 2 năm kinh nghiệm phát triển Web.",
        expectedAnswer: "ナムと申します。大学でITを専攻し、2年間ウェブ開発の経験があります。",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "ご経歴ありがとうございます。数ある企業の中で、なぜ当社を志望されたのですか？",
        furigana: "ごけいれきありがとうございます。かずあるきぎょうのなかで、なぜとうしゃをしぼうされたのですか？",
        romaji: "Gokeireki arigatou gozaimasu. Kazu aru kigyou no naka de, naze tousha o shibou sareta no desu ka?",
        translation: "Cảm ơn bạn. Giữa nhiều công ty, vì sao bạn lại chọn ứng tuyển vào công ty chúng tôi?",
        expectedAnswer: "御社のクラウド技術に惹かれたからです。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "御社の先進的なクラウド技術と、グローバルな開発環境に強く惹かれたからです。",
        furigana: "おんしゃのせんしんてきなクラウドぎじゅつと、グローバルなかいはつかんきょうにつよくひかれたからです。",
        romaji: "Onsha no senshinteki na kuraudo gijutsu to, guroobaru na kaihatsu kankyou ni tsuyoku hikareta kara desu.",
        translation: "Bởi vì tôi bị thu hút mạnh mẽ bởi công nghệ đám mây tiên tiến và môi trường toàn cầu của quý công ty.",
        expectedAnswer: "御社の先進的なクラウド技術と、グローバルな開発環境に強く惹かれたからです。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "チーム開発で意見が対立した時は、どのように対処していますか？",
        furigana: "チームかいはつでいけんがたいりつしたときは、どのようにたいしょしていますか？",
        romaji: "Chiimu kaihatsu de iken ga tairitsu shita toki wa, dono you ni taisho shite imasu ka?",
        translation: "Khi làm việc nhóm mà có bất đồng quan điểm, bạn thường giải quyết như thế nào?",
        expectedAnswer: "相手の視点をまず傾聴し、合意点を探します。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "相手の視点をまず傾聴し、プロジェクトの目的を再確認しながら建設的に合意点を探します。",
        furigana: "あいてのしてんをまずけいちょうし、プロジェクトのもくてきをさいかくにんしながらけんせつてきにごういてんをさがします。",
        romaji: "Aite no shiten o mazu keichou shi, purojekuto no mokuteki o saikakunin shinagara kensetsuteki ni gouiten o sagashimasu.",
        translation: "Trước hết tôi luôn lắng nghe góc nhìn của đồng nghiệp, cùng nhìn lại mục tiêu dự án và tìm tiếng nói chung.",
        expectedAnswer: "相手の視点をまず傾聴し、プロジェクトの目的を再確認しながら建設的に合意点を探します。",
      },
    ],
  },
  "sc-7": {
    title: "ビジネス会話・進捗報告 (HORENSO trong công việc)",
    sampleSentence: "課長、現在進捗は85%で、ユニットテストまで順調に完了しております。",
    translation: "Thưa Trưởng phòng, hiện tiến độ đạt 85% và đã hoàn tất bài test unit một cách thuận lợi ạ.",
    level: "N3",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "ナムさん、お疲れ様です。先週依頼した決済APIの実装状況はどうなっていますか？",
        furigana: "ナムさん、おつかれさまです。せんしゅういらいしたけっさいエーピーアイのじっそうじょうきょうはどうなっていますか？",
        romaji: "Namu-san, otsukaresama desu. Senshuu irai shita kessai API no jissou joukyou wa dou natte imasu ka?",
        translation: "Nam ơi, vất vả rồi. Tình hình triển khai API thanh toán tuần trước giao tiến độ thế nào rồi?",
        expectedAnswer: "課長、現在85%完了しております。",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "課長、お疲れ様です。現在進捗は85%で、ユニットテストまで順調に完了しております。",
        furigana: "かちょう、おつかれさまです。げんざいしんちょくははちじゅうごパーセントで、ユニットテストまでじゅんちょうにかんりょうしております。",
        romaji: "Kachou, otsukaresama desu. Genzai shinchou wa hachijuugo-paasento de, yunitto tesuto made junchou ni kanryou shite orimasu.",
        translation: "Thưa Trưởng phòng, hiện tiến độ đạt 85% và đã hoàn tất bài test unit một cách thuận lợi ạ.",
        expectedAnswer: "課長、お疲れ様です。現在進捗は85%で、ユニットテストまで順調に完了しております。",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "順調ですね！外部決済ゲートウェイの仕様変更について何か問題はありませんか？",
        furigana: "じゅんちょうですね！がいぶけっさいゲートウェイのしようへんこうについてなにかもんだいはありませんか？",
        romaji: "Junchou desu ne! Gaibu kessai geetowei no shiyou henkou ni tsuite nanika mondai wa arimasen ka?",
        translation: "Tiến độ tốt đấy! Vụ thay đổi đặc tả của cổng thanh toán ngoài có gặp trở ngại gì không?",
        expectedAnswer: "先方と調整済みですので問題ありません。",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "先方担当者と直接ミーティングを行い、例外処理の擦り合わせを完了しましたので大丈夫です。",
        furigana: "せんぽうたんとうしゃとちょくせつミーティングをおこない、れいがいしょりのすりあわせをかんりょうしましたのでだいじょうぶです。",
        romaji: "Sempou tantousha to chokusetsu miitingu o okonai, reigaishori no suriawase o kanryou shimashita node daijoubu desu.",
        translation: "Tôi đã họp trực tiếp với phụ trách bên đối tác và thống nhất phần xử lý ngoại lệ nên không sao ạ.",
        expectedAnswer: "先方担当者と直接ミーティングを行い、例外処理の擦り合わせを完了しましたので大丈夫です。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "迅速な対応で助かりました。今週金曜日のステージング環境へのデプロイを頼みますね。",
        furigana: "じんそくなたいおうでたすかりました。こんしゅうきんようびのステージングかんきょうへのデプロイをたのみますね。",
        romaji: "Jinsoku na taiou de tasukarimashita. Konshuu kin'youbi no suteejingu kankyou e no depuroi o tanomimasu ne.",
        translation: "Xử lý nhanh nhẹn như vậy tốt lắm. Thứ 6 này nhờ bạn deploy lên môi trường staging nhé.",
        expectedAnswer: "かしこまりました。デプロイ手順書を作成します。",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "かしこまりました。デプロイ手順書を事前に作成し、改めて共有いたします。",
        furigana: "かしこまりました。デプロイてじゅんしょをじぜんにさくせいし、あらためてきょうゆういたします。",
        romaji: "Kashikomarimashita. Depuroi tejunsho o jizen ni sakusei shi, aratamete kyouyuu itashimasu.",
        translation: "Vâng tôi hiểu rồi ạ. Tôi sẽ soạn trước tài liệu quy trình deploy và gửi lại cho Trưởng phòng.",
        expectedAnswer: "かしこまりました。デプロイ手順書を事前に作成し、改めて共有いたします。",
      },
    ],
  },
  "sc-8": {
    title: "居酒屋で乾杯・食事の誘い (Rủ đồng nghiệp đi nhậu Izakaya)",
    sampleSentence: "もし時間があれば、駅前の居酒屋で軽く一杯どうですか？",
    translation: "Nếu bạn có thời gian, đi làm một chầu nhẹ ở quán Izakaya trước ga không?",
    level: "N3",
    dialogues: [
      {
        order: 1,
        speaker: "ai",
        japanese: "ナムさん、今週のスプリントレビュー無事に終わりましたね！お疲れ様でした。",
        furigana: "ナムさん、こんしゅうのスプリントレビューぶじにおわりましたね！おつかれさまでした。",
        romaji: "Namu-san, konshuu no supurinto rebyuu buji ni owarimashita ne! Otsukaresama deshita.",
        translation: "Nam ơi, buổi sprint review tuần này hoàn thành suôn sẻ rồi nhỉ! Bạn vất vả rồi.",
        expectedAnswer: "お疲れ様でした！今夜軽く飲みに行きませんか？",
      },
      {
        order: 2,
        speaker: "user",
        japanese: "田中さんもお疲れ様でした！もしご都合がよろしければ、今夜軽く飲みに行きませんか？",
        furigana: "たなかさんもおつかれさまでした！もしごつごうがよろしければ、こんやかるくのみにいきませんか？",
        romaji: "Tanaka-san mo otsukaresama deshita! Moshi gotsugou ga yoroshikereba, kon'ya karuku nomi ni ikimasen ka?",
        translation: "Anh Tanaka cũng vất vả rồi ạ! Nếu tiện thì tối nay anh em mình đi làm chầu nhẹ nhé?",
        expectedAnswer: "田中さんもお疲れ様でした！もしご都合がよろしければ、今夜軽く飲みに行きませんか？",
      },
      {
        order: 3,
        speaker: "ai",
        japanese: "いいですね！ぜひ行きましょう。何か食べたいものや行きたいお店はありますか？",
        furigana: "いいですね！ぜひいきましょう。なにかたべたいものやいきたいおみせはありますか？",
        romaji: "Ii desu ne! Zehi ikimashou. Nanika tabetai mono ya ikitai omise wa arimasu ka?",
        translation: "Ý hay đấy! Đi liền chứ. Bạn có muốn ăn gì hay có quán nào muốn đến không?",
        expectedAnswer: "駅前の海鮮居酒屋はいかがですか？",
      },
      {
        order: 4,
        speaker: "user",
        japanese: "駅前にある海鮮居酒屋はいかがですか？刺身と地酒がとても美味しいと評判です。",
        furigana: "えきまえにあるかいせんいざかやはいかがですか？さしみとじざけがとてもおいしいとひょうばんです。",
        romaji: "Ekimae ni aru kaisen izakaya wa ikaga desu ka? Sashimi to jizake ga totemo oishii to hyouban desu.",
        translation: "Quán nhậu hải sản trước ga thì sao ạ? Nghe mọi người khen cá hồi sashimi và rượu địa phương ở đó ngon lắm.",
        expectedAnswer: "駅前にある海鮮居酒屋はいかがですか？刺身と地酒がとても美味しいと評判です。",
      },
      {
        order: 5,
        speaker: "ai",
        japanese: "魚料理、最高ですね！人気店だから混むかもしれませんね。予約はできますか？",
        furigana: "さかなりょうり、さいこうですね！にんきてんだからこむかもしれませんね。よやくはできますか？",
        romaji: "Sakana ryouri, saikou desu ne! Ninki-ten dakara komu kamoshiremasen ne. Yoyaku wa dekimasu ka?",
        translation: "Món cá thì tuyệt quá rồi! Quán nổi tiếng có khi đông khách đấy. Đặt bàn trước được không nhỉ?",
        expectedAnswer: "今すぐ電話して予約しておきます！",
      },
      {
        order: 6,
        speaker: "user",
        japanese: "今すぐ電話して19時に2名で予約しておきます。仕事が終わったらロビーで集合しましょう！",
        furigana: "いますぐでんわしてじゅうくじににめいでよやくしておきます。しごとがおわったらロビーでしゅうごうしましょう！",
        romaji: "Ima sugu denwa shite juukuji ni nimei de yoyaku shite okimasu. Shigoto ga owattara robii de shuugou shimashou!",
        translation: "Em sẽ gọi điện ngay để đặt bàn 2 người lúc 7 giờ tối. Tan làm hẹn gặp anh ở sảnh nhé!",
        expectedAnswer: "今すぐ電話して19時に2名で予約しておきます。仕事が終わったらロビーで集合しましょう！",
      },
    ],
  },
};

const getFallbackScenario = (id?: string): Partial<Lesson> => {
  if (id && SCENARIO_FALLBACKS[id]) {
    return SCENARIO_FALLBACKS[id];
  }
  return SCENARIO_FALLBACKS["sc-1"];
};

const hasKanji = (text?: string): boolean => {
  if (!text) return false;
  return /[一-龯㐀-䶿]/.test(text);
};

export const PracticeRoomPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const { isPremium, remainingFreePractices, streak } = useAuth();
  const session = usePracticeSession();

  const [loadingLesson, setLoadingLesson] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [practiceMode, setPracticeMode] = useState<"script" | "roleplay">("script");
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);

  // Load Lesson from backend or fallback scenario
  useEffect(() => {
    let isMounted = true;

    const fetchLesson = async () => {
      if (!lessonId) return;

      // If lessonId directly matches a known fallback scenario
      if (lessonId.startsWith("sc-")) {
        const fb = getFallbackScenario(lessonId);
        session.setLesson({
          _id: lessonId,
          topicId: "topic-fb",
          title: fb.title || "Luyện nói phản xạ AI",
          sampleSentence: fb.sampleSentence || "",
          translation: fb.translation || "",
          level: fb.level || "N5",
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dialogues: fb.dialogues,
        });
        setLoadingLesson(false);
        return;
      }

      try {
        setLoadingLesson(true);
        const data = await curriculumService.getLessonById(lessonId);
        if (isMounted && data) {
          session.setLesson(data);
        }
      } catch (err: unknown) {
        console.error("Failed to load lesson from API:", err);
        if (isMounted) {
          const fb = getFallbackScenario(lessonId);
          const fallbackLesson: Lesson = {
            _id: lessonId,
            topicId: "topic-1",
            title: fb.title || "Hội thoại chào hỏi và giới thiệu bản thân",
            sampleSentence: fb.sampleSentence || "はじめまして、どうぞよろしくお願いします。",
            translation: fb.translation || "Rất vui được gặp bạn, mong được giúp đỡ.",
            level: fb.level || "N5",
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dialogues: fb.dialogues,
          };
          session.setLesson(fallbackLesson);
        }
      } finally {
        if (isMounted) setLoadingLesson(false);
      }
    };

    fetchLesson();

    return () => {
      isMounted = false;
      session.stopAudio();
      session.resetSessionState();
    };
  }, [lessonId]);

  // Clean up any playing audio when unmounting
  useEffect(() => {
    return () => {
      session.stopAudio();
    };
  }, []);

  // Sync quota exceeded from session
  useEffect(() => {
    if (session.quotaExceeded) {
      setShowPremiumModal(true);
    }
  }, [session.quotaExceeded]);

  const currentDialogue = session.dialogues[session.currentDialogueIndex];
  const isLastDialogue = session.currentDialogueIndex === session.dialogues.length - 1;

  const handleNextDialogue = () => {
    session.stopAudio();
    if (isLastDialogue) {
      navigate("/progress");
    } else {
      session.nextDialogue();
    }
  };

  const handleRetryCurrent = () => {
    session.stopAudio();
    session.setCurrentEvaluation(null);
    session.setClientTranscript("");
    session.recorder.resetRecording();
  };

  if (loadingLesson) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang chuẩn bị phòng luyện nói AI..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden transition-colors duration-200">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-teal-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              session.stopAudio();
              navigate(-1);
            }}
            type="button"
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {session.currentLesson?.title || "Phòng luyện phản xạ AI"}
              </h1>
              <Badge variant="success" size="sm">
                {session.currentLesson?.level || "N5"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Hội thoại {session.currentDialogueIndex + 1} / {session.dialogues.length}
            </p>
          </div>
        </div>

        {/* Right stats & Quota badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{streak} ngày</span>
          </div>

          {/* Quota status */}
          {isPremium ? (
            <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3" />}>
              Premium Vô Hạn
            </Badge>
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                remainingFreePractices > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold animate-pulse"
              }`}
            >
              <span>
                {remainingFreePractices > 0
                  ? `Còn ${remainingFreePractices}/2 lượt`
                  : "Hết lượt hôm nay (0/2)"}
              </span>
              <span
                className={`${
                  remainingFreePractices > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                } font-bold underline ml-0.5`}
              >
                Nâng cấp
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Mode Selector Navigation */}
      <div className="bg-slate-100/80 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 py-2.5 px-4 flex items-center justify-center transition-colors">
        <div className="inline-flex p-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <button
            onClick={() => {
              session.stopAudio();
              setPracticeMode("script");
            }}
            type="button"
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              practiceMode === "script"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>🎯 Luyện theo câu mẫu</span>
            <span className="hidden sm:inline text-2xs font-normal opacity-80">(Chấm phát âm)</span>
          </button>

          <button
            onClick={() => {
              session.stopAudio();
              setPracticeMode("roleplay");
            }}
            type="button"
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              practiceMode === "roleplay"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Đối đáp tự do với AI</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/40 text-emerald-100 rounded text-2xs font-bold uppercase tracking-wider">
              Mới
            </span>
          </button>
        </div>
      </div>

      {/* 2. Main Practice Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 justify-between relative z-10">
        {practiceMode === "roleplay" ? (
          <FreeRoleplayChat
            lessonId={lessonId}
            scenarioTitle={session.currentLesson?.title || "Đối đáp tự do với AI"}
            level={session.currentLesson?.level || "N5"}
            initialAiDialogue={
              session.dialogues?.[0]
                ? {
                    japanese: session.dialogues[0].japanese,
                    furigana: session.dialogues[0].furigana,
                    romaji: session.dialogues[0].romaji,
                    translation: session.dialogues[0].translation,
                  }
                : undefined
            }
            showFurigana={showFurigana}
            showRomaji={showRomaji}
            showTranslation={showTranslation}
            onToggleFurigana={() => setShowFurigana(!showFurigana)}
            onToggleRomaji={() => setShowRomaji(!showRomaji)}
            onToggleTranslation={() => setShowTranslation(!showTranslation)}
          />
        ) : (
          <>
            {/* Progress bar across current dialogue items */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${((session.currentDialogueIndex + 1) / (session.dialogues.length || 1)) * 100}%`,
                }}
              />
            </div>

            {/* Central Dialogue Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
              {/* Speaker label & Audio TTS button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      currentDialogue?.speaker === "ai" ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {currentDialogue?.speaker === "ai" ? "GIA SƯ AI" : "BẠN HÃY PHẢN XẠ CÂU NÀY"}
                  </span>
                </div>

                <AudioPlayer
                  textToSpeak={currentDialogue?.japanese}
                  onNativeTts={() => session.playNativeAudio(currentDialogue?.japanese)}
                  label="Nghe giọng chuẩn"
                />
              </div>

              {/* Target Japanese Sentence Display */}
              <div className="text-center py-4 sm:py-6 space-y-3.5">
                {/* 1. Kanji Primary Text */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-wide font-sans leading-relaxed">
                  {currentDialogue?.japanese}
                </h2>

                {/* 2. Hiragana / Katakana Phonetic Subtitle (Phiên âm Hiragana/Katakana cho chữ Hán) */}
                {showFurigana && currentDialogue && (currentDialogue.furigana || hasKanji(currentDialogue.japanese)) && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 rounded-2xl shadow-2xs">
                    <span className="text-2xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Hiragana:
                    </span>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-200 tracking-wider font-sans">
                      {currentDialogue.furigana || currentDialogue.japanese}
                    </p>
                  </div>
                )}

                {/* 3. Romaji Latin line */}
                {showRomaji && currentDialogue?.romaji && (
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide font-mono">
                    {currentDialogue.romaji}
                  </p>
                )}

                {/* 4. Vietnamese Meaning */}
                {showTranslation && currentDialogue?.translation && (
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
                    {currentDialogue.translation}
                  </p>
                )}
              </div>

              {/* Toggle buttons for Hiragana, Romaji and Translation */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => setShowFurigana(!showFurigana)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-semibold ${
                    showFurigana
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {showFurigana ? "Ẩn Hiragana" : "Hiện Hiragana"}
                </button>
                <button
                  onClick={() => setShowRomaji(!showRomaji)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-semibold ${
                    showRomaji
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {showRomaji ? "Ẩn Romaji" : "Hiện Romaji"}
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-semibold ${
                    showTranslation
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {showTranslation ? "Ẩn Bản dịch" : "Hiện Bản dịch"}
                </button>
              </div>
            </div>

            {/* Real-time Web Speech Transcript & Waveform during recording */}
            {session.isRecording && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <Waveform isRecording={session.isRecording} waveformData={session.recorder.audioWaveformData} />

                {session.clientTranscript ? (
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                      Nhận diện trực tiếp (Web Speech API):
                    </span>
                    <p className="text-lg font-bold text-emerald-950 dark:text-emerald-100 font-sans">
                      {session.clientTranscript}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                    Đang lắng nghe giọng nói tiếng Nhật của bạn...
                  </p>
                )}
              </div>
            )}

            {/* 3. Evaluation Result Display */}
            {session.currentEvaluation && (
              <div className="space-y-6">
                {/* Audio Transcript & Target Sentence Verification Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Đối chiếu câu luyện tập & Giọng đọc của bạn
                      </h4>
                    </div>
                    <Badge variant="success" size="sm">
                      Đã ghi âm thành công
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* User spoken transcript */}
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 rounded-2xl space-y-1.5">
                      <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        🎤 Bạn đã nói (Nhận diện thực tế):
                      </span>
                      <p className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-100 font-sans">
                        {session.currentEvaluation.transcript || session.clientTranscript || currentDialogue?.japanese}
                      </p>
                    </div>

                    {/* Target Japanese sentence */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-1.5">
                      <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        🎯 Câu mẫu cần phản xạ:
                      </span>
                      <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 font-sans">
                        {session.currentEvaluation.targetSentence || currentDialogue?.japanese}
                      </p>
                    </div>
                  </div>

                  {/* Word-by-word green/red breakdown */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Phân tích phát âm chi tiết từng từ:
                    </span>
                    <WordHighlight
                      wordFeedback={session.currentEvaluation.wordFeedback}
                      fallbackText={session.currentEvaluation.transcript}
                    />
                  </div>
                </div>

                {/* 4 criteria breakdown & AI score */}
                <FeedbackCard
                  evaluation={session.currentEvaluation}
                  onRetry={handleRetryCurrent}
                  onNext={handleNextDialogue}
                  hasNext={!isLastDialogue}
                />
              </div>
            )}

            {/* 4. Controls / Bottom Zone */}
            {!session.currentEvaluation && (
              <div className="py-4 flex flex-col items-center justify-center gap-3">
                {currentDialogue?.speaker === "ai" ? (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={handleNextDialogue}
                      type="button"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <span>Đến lượt bạn phản xạ câu trả lời</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <span className="text-2xs text-slate-400 dark:text-slate-500 font-medium">
                      Nghe xong câu hỏi của AI, bấm nút để bắt đầu luyện phản xạ
                    </span>
                  </div>
                ) : !isPremium && remainingFreePractices <= 0 ? (
                  <div className="flex flex-col items-center gap-2.5 p-5 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800 rounded-3xl text-center max-w-md shadow-xs animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-sm">
                      0/2
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Bạn đã hoàn thành hết 2 lượt luyện nói miễn phí hôm nay
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Nâng cấp tài khoản JTalk Premium (chỉ 99k/tháng) để luyện phản xạ AI không giới hạn, mở khóa toàn bộ kịch bản chuyên sâu!
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      type="button"
                      className="mt-1 inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <Sparkles size={14} className="fill-amber-300 text-amber-300" />
                      <span>Nâng cấp Premium ngay</span>
                    </button>
                  </div>
                ) : (
                  <MicRecorder
                    isRecording={session.isRecording}
                    isEvaluating={session.isEvaluating}
                    durationSeconds={session.recorder.recordingDuration}
                    onStart={session.startSpeaking}
                    onStop={session.stopAndEvaluate}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MoMo Premium Upgrade Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="quota_exceeded"
      />
    </div>
  );
};

export default PracticeRoomPage;
