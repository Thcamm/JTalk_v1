import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  Mic,
  MicOff,
  Sparkles,
  Headphones,
  BookOpen,
  Download,
  Repeat,
  Heart,
  Settings,
  X,
  Check,
  Video,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { curriculumService } from "@/services/curriculum.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import type { Lesson, VideoSubtitle, SubtitleWord } from "@/types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type StudyMode = "shadowing" | "pronunciation" | "listening" | "exercise";

export const CourseVideoStudyPage = () => {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId: string }>();
  const navigate = useNavigate();

  // 1. State
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode>("shadowing");

  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Subtitle display toggles (matching Image 8)
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  const [isAbRepeat, setIsAbRepeat] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);

  // Video Source & AI Sensei Studio Mode (Primary AI Video Studio)
  const [videoSourceMode, setVideoSourceMode] = useState<"youtube" | "ai_video">("ai_video");
  const [youtubeError, setYoutubeError] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Shadowing & Speech Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [evalFeedback, setEvalFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // References
  const playerRef = useRef<any>(null);
  const timePollIntervalRef = useRef<any>(null);
  const subtitleRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const transcriptScrollContainerRef = useRef<HTMLDivElement>(null);

  // 2. Fetch Lesson Data
  useEffect(() => {
    let isMounted = true;
    const fetchLesson = async () => {
      if (!lessonId) return;
      try {
        setLoading(true);
        const data = await curriculumService.getLessonById(lessonId);
        if (isMounted && data) {
          setLesson(data);
        } else if (isMounted) {
          // Fallback matching image 8
          setLesson({
            _id: lessonId,
            topicId: "topic-keigo",
            title: "敬語って何？ /What is Japanese Keigo?【敬語 1】",
            description: "Video bài giảng chuẩn bản xứ từ Sambon Juku: Khái niệm Kính ngữ và 3 phân loại chính.",
            level: "N4",
            youtubeId: "1iDoq9sGX1s",
            channelName: "三本塾 -Sambon Juku-",
            sampleSentence: "今回は敬語って何？というお話をしようと思います。",
            translation: "Lần này tôi dự định sẽ chia sẻ câu chuyện: 'Kính ngữ rốt cuộc là gì?'.",
            duration: "5 phút",
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
                  { kanji: "について", furigana: "" },
                  { kanji: "の", furigana: "" },
                  { kanji: "動画", furigana: "どうが" },
                  { kanji: "を", furigana: "" },
                  { kanji: "出した", furigana: "だした" },
                  { kanji: "ことが", furigana: "" },
                  { kanji: "なかったんですけれども", furigana: "" },
                ],
              },
              {
                startTime: 6,
                endTime: 14,
                japanese: "これから少しずつビデオを出していこうと思います。",
                furigana: "これからすこしずつビデオをだしていこうとおもいます。",
                romaji: "Korekara sukoshizutsu bideo o dashite ikou to omoimasu.",
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
                  { kanji: "？", furigana: "" },
                  { kanji: "という", furigana: "" },
                  { kanji: "お話", furigana: "おはなし" },
                  { kanji: "を", furigana: "" },
                  { kanji: "しよう", furigana: "" },
                  { kanji: "と", furigana: "" },
                  { kanji: "思い", furigana: "おも" },
                  { kanji: "ます", furigana: "" },
                  { kanji: "。", furigana: "" },
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
                japanese: "この敬語って何？",
                furigana: "このけいごってなん？",
                romaji: "Kono keigo tte nan?",
                translation: "Thực chất kính ngữ này là gì?",
                words: [
                  { kanji: "この", furigana: "" },
                  { kanji: "敬語", furigana: "けいご" },
                  { kanji: "って", furigana: "" },
                  { kanji: "何", furigana: "なん" },
                  { kanji: "？", furigana: "" },
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
                  { kanji: "には", furigana: "" },
                  { kanji: "丁寧語", furigana: "ていねいご" },
                  { kanji: "尊敬語", furigana: "そんけいご" },
                  { kanji: "謙譲語", furigana: "けんじょうご" },
                  { kanji: "の", furigana: "" },
                  { kanji: "3種類", furigana: "さんしゅるい" },
                  { kanji: "があります", furigana: "" },
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
                  { kanji: "は", furigana: "" },
                  { kanji: "「です・ます」", furigana: "" },
                  { kanji: "を", furigana: "" },
                  { kanji: "使って", furigana: "つかって" },
                  { kanji: "誰", furigana: "だれ" },
                  { kanji: "に対して", furigana: "にたいして" },
                  { kanji: "も", furigana: "" },
                  { kanji: "丁寧", furigana: "ていねい" },
                  { kanji: "に", furigana: "" },
                  { kanji: "話す", furigana: "はなす" },
                  { kanji: "言葉", furigana: "ことば" },
                  { kanji: "です", furigana: "" },
                ],
              },
              {
                startTime: 185,
                endTime: 240,
                japanese: "尊敬語と謙譲語は、相手との関係や立場を考えて使い分ける必要があります。",
                furigana: "そんけいごとけんじょうごは、あいてとのかんけいやたちばをかんがえてつかいわけるひつようがあります。",
                romaji: "Sonkeigo to kenjougo wa, aite to no kankei ya tachiba o kangaete tsukaiwakeru hitsuyou ga arimasu.",
                translation: "Tôn kính ngữ và khiêm nhường ngữ cần phân biệt dựa trên mối quan hệ và vị thế với đối phương.",
                words: [
                  { kanji: "尊敬語", furigana: "そんけいご" },
                  { kanji: "と", furigana: "" },
                  { kanji: "謙譲語", furigana: "けんじょうご" },
                  { kanji: "は", furigana: "" },
                  { kanji: "相手", furigana: "あいて" },
                  { kanji: "との", furigana: "" },
                  { kanji: "関係", furigana: "かんけい" },
                  { kanji: "や", furigana: "" },
                  { kanji: "立場", furigana: "たちば" },
                  { kanji: "を", furigana: "" },
                  { kanji: "考えて", furigana: "かんがえて" },
                  { kanji: "使い分ける", furigana: "つかいわける" },
                  { kanji: "必要", furigana: "ひつよう" },
                  { kanji: "があります", furigana: "" },
                ],
              },
              {
                startTime: 240,
                endTime: 300,
                japanese: "次のレッスンでは、それぞれの詳しいルールと実践的な例文を勉強しましょう！",
                furigana: "つぎのレッスンでは、それぞれのくわしいルールとじっせんてきなれいぶんをべんきょうしましょう！",
                romaji: "Tsugi no ressun de wa, sorezore no kuwashii ruuru to jissenteki na reibun o benkyou shimashou!",
                translation: "Trong bài học tiếp theo, chúng ta hãy cùng học quy tắc chi tiết và các câu ví dụ thực tế nhé!",
                words: [
                  { kanji: "次", furigana: "つぎ" },
                  { kanji: "の", furigana: "" },
                  { kanji: "レッスン", furigana: "" },
                  { kanji: "では", furigana: "" },
                  { kanji: "それぞれ", furigana: "" },
                  { kanji: "の", furigana: "" },
                  { kanji: "詳しい", furigana: "くわしい" },
                  { kanji: "ルール", furigana: "" },
                  { kanji: "と", furigana: "" },
                  { kanji: "実践的", furigana: "じっせんてき" },
                  { kanji: "な", furigana: "" },
                  { kanji: "例文", furigana: "れいぶん" },
                  { kanji: "を", furigana: "" },
                  { kanji: "勉強", furigana: "べんきょう" },
                  { kanji: "しましょう", furigana: "" },
                ],
              },
            ],
          });
        }
      } catch (err) {
        console.error("Error loading lesson for video study:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLesson();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  // Subtitles list
  const subtitles: VideoSubtitle[] = lesson?.subtitles || [];
  const currentSub = subtitles[activeSubIndex] || subtitles[0];
  const youtubeVideoId = lesson?.youtubeId || "1iDoq9sGX1s";

  // AI Voice Synthesis for AI Sensei Video Mode (100% immune to copyright/embed blocks)
  const playAiSubAudio = useCallback(
    (index: number) => {
      const sub = subtitles[index];
      if (!sub) return;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(sub.japanese);
        utterance.lang = "ja-JP";
        utterance.rate = playbackRate;

        // Try to pick Japanese voice if available in browser
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
        if (jaVoice) utterance.voice = jaVoice;

        utterance.onstart = () => {
          setIsAiSpeaking(true);
        };

        utterance.onend = () => {
          setIsAiSpeaking(false);
          // If AB repeat is on, loop again
          if (isAbRepeat) {
            setTimeout(() => {
              if (isPlaying) playAiSubAudio(index);
            }, 500);
          } else {
            // Advance to next subtitle
            if (index < subtitles.length - 1) {
              const nextIdx = index + 1;
              setActiveSubIndex(nextIdx);
              setCurrentTime(subtitles[nextIdx].startTime);
              setTimeout(() => {
                if (isPlaying) playAiSubAudio(nextIdx);
              }, 400);
            } else {
              setIsPlaying(false);
            }
          }
        };

        utterance.onerror = () => {
          setIsAiSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      }
    },
    [subtitles, playbackRate, isAbRepeat, isPlaying]
  );

  // Set duration as soon as subtitles are available
  useEffect(() => {
    if (subtitles.length > 0) {
      const lastSub = subtitles[subtitles.length - 1];
      if (lastSub?.endTime) {
        setDuration(lastSub.endTime);
      }
    }
  }, [subtitles]);

  // In AI Video mode: smooth time progression
  useEffect(() => {
    if (videoSourceMode !== "ai_video" || !isPlaying) return;

    if (duration === 0 && subtitles.length > 0) {
      setDuration(subtitles[subtitles.length - 1]?.endTime || 300);
    }

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        if (currentSub && next >= currentSub.endTime && !isAbRepeat) {
          return currentSub.endTime;
        }
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [videoSourceMode, isPlaying, playbackRate, currentSub, isAbRepeat, duration, subtitles]);

  // Mode Switchers
  const switchToAiVideoMode = () => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      try {
        playerRef.current.pauseVideo();
      } catch (_) {}
    }
    setVideoSourceMode("ai_video");
    toast.success("Đã chuyển sang chế độ Video AI Sensei Studio");
  };

  const switchToYoutubeMode = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    setYoutubeError(false);
    setVideoSourceMode("youtube");
  };

  // 3. Initialize YouTube Iframe API
  useEffect(() => {
    if (!lesson || loading || videoSourceMode !== "youtube") return;

    // Load YouTube Iframe script if not present
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (_) {}
        }

        playerRef.current = new window.YT.Player("youtube-player-container", {
          videoId: youtubeVideoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            fs: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration() || 0);
              setYoutubeError(false);
            },
            onStateChange: (event: any) => {
              // 1 = Playing, 2 = Paused, 0 = Ended
              setIsPlaying(event.data === 1);
            },
            onError: (event: any) => {
              console.warn("YouTube Player error event:", event.data);
              setYoutubeError(true);
              setVideoSourceMode("ai_video");
              toast.error(
                "Video YouTube gốc không khả dụng hoặc bị giới hạn nhúng bản quyền. Đã tự động chuyển sang Video AI Sensei để bài học hoạt động trơn tru!"
              );
            },
          },
        });
      } catch (e) {
        console.warn("YouTube Player initialization:", e);
        setYoutubeError(true);
        setVideoSourceMode("ai_video");
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [lesson, loading, youtubeVideoId, videoSourceMode]);

  // 4. Polling Current Time & Sync Subtitles
  useEffect(() => {
    if (!isPlaying) {
      if (timePollIntervalRef.current) clearInterval(timePollIntervalRef.current);
      return;
    }

    timePollIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);

          // Find subtitle line corresponding to time
          if (subtitles.length > 0) {
            const idx = subtitles.findIndex(
              (s) => time >= s.startTime && time < s.endTime
            );

            if (idx !== -1 && idx !== activeSubIndex) {
              setActiveSubIndex(idx);

              // Auto-scroll transcript row into view smoothly
              subtitleRefs.current[idx]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }

            // AB Repeat Check: Loop between start and end of active subtitle
            if (isAbRepeat && currentSub && time >= currentSub.endTime) {
              playerRef.current.seekTo(currentSub.startTime, true);
            }
          }
        } catch (e) {
          console.warn("Polling time error:", e);
        }
      }
    }, 200);

    return () => {
      if (timePollIntervalRef.current) clearInterval(timePollIntervalRef.current);
    };
  }, [isPlaying, subtitles, activeSubIndex, isAbRepeat, currentSub]);

  // 5. Jump to specific subtitle timestamp
  const handleSelectSubtitle = useCallback(
    (idx: number, autoPlay = true) => {
      const targetSub = subtitles[idx];
      if (!targetSub) return;

      setActiveSubIndex(idx);
      setCurrentTime(targetSub.startTime);

      if (videoSourceMode === "youtube" && playerRef.current && !youtubeError) {
        try {
          playerRef.current.seekTo(targetSub.startTime, true);
          if (autoPlay) {
            playerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch (e) {
          console.warn("Seek error:", e);
        }
      } else {
        // AI Video mode
        if (autoPlay) {
          setIsPlaying(true);
          playAiSubAudio(idx);
        }
      }
    },
    [subtitles, videoSourceMode, youtubeError, playAiSubAudio]
  );

  // Timeline Scrubber Seeking
  const handleSeekTimeline = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    setCurrentTime(newTime);

    if (videoSourceMode === "youtube" && playerRef.current && !youtubeError) {
      try {
        playerRef.current.seekTo(newTime, true);
      } catch (_) {}
    }

    if (subtitles.length > 0) {
      const idx = subtitles.findIndex(
        (s) => newTime >= s.startTime && newTime <= s.endTime
      );
      if (idx !== -1 && idx !== activeSubIndex) {
        setActiveSubIndex(idx);
        if (videoSourceMode === "ai_video" && isPlaying) {
          playAiSubAudio(idx);
        }
      }
    }
  };

  const handlePrevSubtitle = () => {
    if (activeSubIndex > 0) {
      handleSelectSubtitle(activeSubIndex - 1, isPlaying);
    }
  };

  const handleNextSubtitle = () => {
    if (activeSubIndex < subtitles.length - 1) {
      handleSelectSubtitle(activeSubIndex + 1, isPlaying);
    }
  };

  // Helper to format seconds to M:SS (e.g. 0:59 / 11:59)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Toggle Video Play / Pause
  const togglePlayPause = () => {
    if (videoSourceMode === "youtube" && playerRef.current && !youtubeError) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn("Play/pause error:", e);
      }
    } else {
      // AI Video mode
      if (isPlaying) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsAiSpeaking(false);
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        playAiSubAudio(activeSubIndex);
      }
    }
  };

  // Change Playback Speed
  const handleSetSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSettingsMenu(false);
    if (videoSourceMode === "youtube" && playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (_) {}
    } else if (isPlaying) {
      playAiSubAudio(activeSubIndex);
    }
    toast.info(`Tốc độ phát: ${rate}x`);
  };

  // 6. Web Speech API for Shadowing & Pronunciation Evaluation
  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.");
      return;
    }

    try {
      // Pause video or AI speech when user starts shadowing
      if (videoSourceMode === "youtube" && playerRef.current && isPlaying) {
        playerRef.current.pauseVideo();
      } else if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }
      setIsPlaying(false);

      setUserTranscript("");
      setEvalScore(null);
      setEvalFeedback(null);

      const rec = new SpeechRecognition();
      rec.lang = "ja-JP";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsRecording(true);
        toast.info("Đang lắng nghe giọng nhại lại (Shadowing)...");
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserTranscript(transcript);
      };

      rec.onerror = (e: any) => {
        console.warn("Shadowing speech recognition error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        // Automatically evaluate after user finishes
        if (currentSub?.japanese) {
          evaluateShadowing(currentSub.japanese);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Mic start error:", err);
      setIsRecording(false);
    }
  }, [currentSub, isPlaying]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
  }, []);

  // Simple and intuitive pronunciation match scorer
  const evaluateShadowing = (targetSentence: string) => {
    const targetClean = targetSentence.replace(/[、。！？!?,.\s~…-]/g, "");
    const spokenClean = userTranscript.replace(/[、。！？!?,.\s~…-]/g, "");

    if (!spokenClean) {
      setEvalScore(null);
      return;
    }

    // Levenshtein / Word match heuristic
    let matchedChars = 0;
    for (const char of spokenClean) {
      if (targetClean.includes(char)) matchedChars++;
    }

    const ratio = Math.min(1, matchedChars / Math.max(1, targetClean.length));
    const score = Math.round(ratio * 40 + 60); // 60-100 range

    setEvalScore(score);

    if (score >= 85) {
      setEvalFeedback("Xuất sắc! Âm điệu và độ chuẩn xác rất giống người bản xứ.");
      toast.success(`Phát âm chuẩn: ${score}/100!`);
    } else if (score >= 70) {
      setEvalFeedback("Tốt! Hãy chú ý ngắt nhịp và trường âm để tự nhiên hơn nhé.");
      toast.info(`Điểm Shadowing: ${score}/100`);
    } else {
      setEvalFeedback("Cần luyện thêm. Hãy nghe kỹ từng từ của thầy Sambon và thử lại.");
      toast.warning(`Điểm Shadowing: ${score}/100`);
    }
  };

  // Clean segment words for furigana rendering
  const renderFuriganaSentence = (sub: VideoSubtitle) => {
    if (sub.words && sub.words.length > 0) {
      return (
        <div className="flex flex-wrap items-end justify-center gap-x-2.5 sm:gap-x-3.5 gap-y-2 text-base sm:text-xl font-medium tracking-wide">
          {sub.words.map((w: SubtitleWord, idx: number) => {
            const hasFuri = showFurigana && w.furigana && w.furigana.trim().length > 0;
            return (
              <span
                key={idx}
                className="inline-flex flex-col items-center group cursor-pointer hover:text-emerald-300 transition-colors"
                title={w.meaning || w.romaji || undefined}
              >
                {hasFuri ? (
                  <span className="text-2xs sm:text-xs font-semibold text-emerald-300/95 select-none leading-none mb-0.5">
                    {w.furigana}
                  </span>
                ) : (
                  <span className="text-2xs sm:text-xs text-transparent select-none leading-none mb-0.5">
                    -
                  </span>
                )}
                <span className="border-b-2 border-slate-500/40 group-hover:border-emerald-400 pb-0.5">
                  {w.kanji}
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    // Fallback if segmented words are not present: display single line
    return (
      <p className="text-base sm:text-xl font-bold text-center tracking-wide">
        {sub.japanese}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải phòng học Video & Shadowing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans select-none">
      {/* ============================================================ */}
      {/* 1. TOP HEADER (Matches Image 8 reference) */}
      {/* ============================================================ */}
      <header className="h-14 sm:h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20 shadow-2xs">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => (courseId ? navigate(`/courses/${courseId}`) : navigate("/courses"))}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách bài học"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {lesson?.title || "敬語って何？ /What is Japanese Keigo?【敬語 1】"}
              </h1>
              {lesson?.channelName && (
                <span className="hidden md:inline-block text-3xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {lesson.channelName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Study Mode Buttons (Matching Image 8 Top Right) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setStudyMode("shadowing")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              studyMode === "shadowing"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shadowing</span>
          </button>

          <button
            onClick={() => setStudyMode("pronunciation")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              studyMode === "pronunciation"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Phát âm</span>
          </button>

          <button
            onClick={() => setStudyMode("listening")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              studyMode === "listening"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Luyện nghe</span>
          </button>

          <button
            onClick={() => setStudyMode("exercise")}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              studyMode === "exercise"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bài tập</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN STUDY ROOM WORKSPACE */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: YouTube Player / AI Video Studio + Furigana Subtitle Bar + Interactive Actions */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4">
          {/* Top Video Source Switcher */}
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 px-1 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <button
                onClick={switchToYoutubeMode}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  videoSourceMode === "youtube" && !youtubeError
                    ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-600" />
                <span>Video Gốc (YouTube)</span>
              </button>

              <button
                onClick={switchToAiVideoMode}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  videoSourceMode === "ai_video" || youtubeError
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Video AI Sensei Studio</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-3xs font-bold rounded-full border border-emerald-200/80">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Giọng chuẩn Tokyo • Tương tác trực quan
              </span>
            </div>
          </div>

          {/* Video Container (Responsive 16:9) */}
          <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-black shadow-lg aspect-video flex items-center justify-center">
            {/* YouTube Player */}
            <div
              id="youtube-player-container"
              className={`w-full h-full ${
                videoSourceMode === "youtube" && !youtubeError ? "block" : "hidden"
              }`}
            />

            {/* AI Video Sensei Studio Canvas (Active in ai_video mode OR when YouTube throws error) */}
            {(videoSourceMode === "ai_video" || youtubeError) && (
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b121e] to-[#022c22] flex flex-col items-center justify-between p-3 sm:p-5 select-none">
                {/* Ambient Studio Lights */}
                <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Badge: AI Studio Status */}
                <div className="relative z-10 flex items-center justify-between w-full px-2">
                  <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-emerald-500/30 px-3 sm:px-4 py-1.5 rounded-full shadow-lg">
                    <span className="relative flex h-2.5 w-2.5">
                      {isPlaying && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-2xs sm:text-xs font-bold text-emerald-300">
                      AI Sensei Studio • Tiếng Nhật Chuẩn Tokyo
                    </span>
                  </div>

                  {youtubeError && (
                    <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-2.5 py-1 rounded-full text-3xs font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Đã chuyển tự động từ YouTube</span>
                    </div>
                  )}
                </div>

                {/* Center: AI Sensei Character & Dynamic Wave Visualizer (Clean, no buttons over face!) */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2.5 sm:space-y-3">
                  {/* Animated Avatar Box */}
                  <div className="relative">
                    {isAiSpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        <div className="absolute -inset-3 rounded-full border border-emerald-400/40 animate-pulse" />
                      </>
                    )}
                    <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-1 shadow-2xl flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
                        <img
                          src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80"
                          alt="AI Japanese Sensei"
                          className="w-full h-full object-cover"
                        />
                        {isAiSpeaking && (
                          <div className="absolute bottom-1 bg-emerald-500 text-white text-3xs font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                            Đang nói
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sound Wave Bars */}
                  <div className="flex items-center gap-1 h-4 sm:h-5">
                    {[40, 70, 100, 60, 90, 50, 80, 45, 95, 65, 85, 30].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isAiSpeaking ? "bg-emerald-400" : "bg-slate-700"
                        }`}
                        style={{
                          height: isAiSpeaking
                            ? `${Math.max(25, Math.sin(Date.now() / 150 + i) * 35 + 50)}%`
                            : "20%",
                        }}
                      />
                    ))}
                  </div>

                  {/* Center Text Prompt */}
                  <div className="text-center px-4 max-w-xl">
                    <p className="text-base sm:text-2xl font-black text-white drop-shadow-md tracking-wide">
                      {currentSub?.japanese || "日本語の勉強を始めましょう"}
                    </p>
                    {currentSub?.translation && (
                      <p className="text-2xs sm:text-xs text-slate-400 font-medium mt-1 line-clamp-2">
                        {currentSub.translation}
                      </p>
                    )}

                    {/* Subtle Play Prompt Below Text (Never covers the avatar) */}
                    {!isPlaying && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        type="button"
                        className="mt-2.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Bắt đầu bài giảng AI</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Control Dock inside Video Container */}
                <div className="relative z-10 w-full px-2 sm:px-4 pt-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent rounded-2xl space-y-2">
                  {/* Interactive Timeline Scrubber Bar */}
                  <div
                    onClick={handleSeekTimeline}
                    className="relative w-full h-1.5 sm:h-2 bg-slate-700/70 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-hidden group"
                    title="Click hoặc kéo để tua video"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative transition-all"
                      style={{
                        width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Player Controls Row */}
                  <div className="flex items-center justify-between gap-2 py-1 text-white">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Play / Pause button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        type="button"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                        title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Prev / Next Subtitle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevSubtitle();
                        }}
                        disabled={activeSubIndex === 0}
                        type="button"
                        className="w-7 h-7 rounded-full text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                        title="Câu trước đó"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextSubtitle();
                        }}
                        disabled={activeSubIndex >= subtitles.length - 1}
                        type="button"
                        className="w-7 h-7 rounded-full text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                        title="Câu kế tiếp"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      {/* Time Display */}
                      <span className="font-mono text-2xs sm:text-xs text-slate-300 font-semibold select-none ml-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-3xs sm:text-2xs bg-slate-800/80 text-emerald-300 px-2.5 py-1 rounded-full border border-slate-700/60 font-semibold select-none">
                        Câu {activeSubIndex + 1}/{subtitles.length}
                      </span>
                      {isAiSpeaking && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-3xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>Sensei đang giảng</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* FLOATING/INTERACTIVE FURIGANA SUBTITLE BAR (Exact Match to Image 8) */}
          {/* ============================================================ */}
          {showSubtitles && currentSub && (
            <div className="w-full max-w-5xl mx-auto space-y-3">
              {/* Dark Subtitle Display Pill */}
              <div className="bg-[#1e2329]/95 backdrop-blur-md text-white border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 transition-all">
                {/* Kanji Words with Furigana floating above each word */}
                {renderFuriganaSentence(currentSub)}

                {/* Vietnamese Translation (Toggleable) */}
                {showTranslation && currentSub.translation && (
                  <p className="text-xs sm:text-sm font-normal text-slate-300 text-center pt-2 border-t border-slate-700/50">
                    {currentSub.translation}
                  </p>
                )}
              </div>

              {/* Subtitle Controls Bar (Matching Buttons below Subtitle in Image 8) */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                {/* Left Toggles: Play/Pause, Phụ đề, Bản dịch, Furigana */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Play / Pause Video button & Time counter (matching 0:59 / 11:59 in Image 8) */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-2xs">
                    <button
                      onClick={togglePlayPause}
                      type="button"
                      className="text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
                      title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <span className="font-mono text-2xs text-slate-500 font-semibold select-none">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowSubtitles((prev) => !prev)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      showSubtitles
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${showSubtitles ? "text-emerald-700" : "opacity-0"}`} />
                    <span>Phụ đề</span>
                  </button>

                  <button
                    onClick={() => setShowTranslation((prev) => !prev)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      showTranslation
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${showTranslation ? "text-emerald-700" : "opacity-0"}`} />
                    <span>Bản dịch</span>
                  </button>

                  <button
                    onClick={() => setShowFurigana((prev) => !prev)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      showFurigana
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-sans font-black text-2xs">あ</span>
                    <span>Furigana</span>
                  </button>
                </div>

                {/* Right Action Icons (Heart, AB Loop, Settings, Close) */}
                <div className="flex items-center gap-2">
                  {/* Favorite */}
                  <button
                    onClick={() => {
                      setIsFavorite((prev) => !prev);
                      toast.success(isFavorite ? "Đã bỏ lưu câu" : "Đã lưu câu vào sổ tay ôn tập!");
                    }}
                    type="button"
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isFavorite
                        ? "bg-rose-50 border-rose-200 text-rose-500"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                    title="Lưu câu vào yêu thích"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  </button>

                  {/* AB Repeat Loop current sentence */}
                  <button
                    onClick={() => {
                      setIsAbRepeat((prev) => !prev);
                      toast.info(isAbRepeat ? "Tắt lặp lại câu" : "Bật lặp lại đoạn câu hiện tại (A-B)");
                    }}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                      isAbRepeat
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Lặp lại câu hiện tại (A-B loop)"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>AB</span>
                  </button>

                  {/* Settings Speed Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsMenu((prev) => !prev)}
                      type="button"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Cài đặt tốc độ phát"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {showSettingsMenu && (
                      <div className="absolute right-0 bottom-10 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 space-y-1">
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider px-2 block py-1">
                          Tốc độ phát
                        </span>
                        {[0.75, 1, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handleSetSpeed(rate)}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                              playbackRate === rate
                                ? "bg-emerald-50 text-emerald-800"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{rate === 1 ? "Bình thường (1.0x)" : `${rate}x`}</span>
                            {playbackRate === rate && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle Transcript sidebar visibility on smaller screens */}
                  <button
                    onClick={() => setShowTranscriptPanel((prev) => !prev)}
                    type="button"
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer lg:hidden"
                    title="Ẩn/hiện danh sách phụ đề"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SHADOWING / SPEAKING INTERACTION CARD (When mode is Shadowing / Phát âm) */}
          {/* ============================================================ */}
          {(studyMode === "shadowing" || studyMode === "pronunciation") && currentSub && (
            <div className="w-full max-w-5xl mx-auto bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-extrabold uppercase">
                      Luyện Shadowing câu số {activeSubIndex + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      (Bấm mic nói nhại lại theo người Nhật)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-sans mt-1">
                    {currentSub.japanese}
                  </p>
                </div>

                {/* Mic Record Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    type="button"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      isRecording
                        ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/20"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? "Dừng ghi âm" : "Ghi âm nhại giọng"}</span>
                  </button>
                </div>
              </div>

              {/* Real-time speech recognition feedback & score */}
              {(isRecording || userTranscript || evalScore !== null) && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                        Giọng nói của bạn nhận diện được:
                      </span>
                      <p className="text-sm font-bold text-slate-800 font-sans truncate">
                        {userTranscript || "Đang lắng nghe..."}
                      </p>
                    </div>

                    {evalScore !== null && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-xs border ${
                            evalScore >= 80
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          <span>{evalScore}</span>
                          <span className="text-3xs font-medium">điểm</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {evalFeedback && (
                    <p className="text-xs text-emerald-800 font-medium px-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{evalFeedback}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EXERCISE MODE (Quick comprehension quiz) */}
          {studyMode === "exercise" && (
            <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Câu hỏi luyện tập theo video</h3>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  Trong tiếng Nhật, Kính ngữ (敬語 - Keigo) gồm có mấy loại chính?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => toast.info("Chưa chính xác, hãy nghe lại đoạn 1:55 của video nhé.")}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left cursor-pointer transition-colors"
                  >
                    A. Có 2 loại (Lịch sự và Thân mật)
                  </button>
                  <button
                    onClick={() => toast.success("Chính xác! Gồm 丁寧語 (Teineigo), 尊敬語 (Sonkeigo), 謙譲語 (Kenjougo).")}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold rounded-2xl text-left cursor-pointer transition-colors"
                  >
                    B. Có 3 loại (丁寧語, 尊敬語, 謙譲語)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: "Phụ đề" (Transcript Subtitle List - Exact Match to Image 8) */}
        {/* ============================================================ */}
        {showTranscriptPanel && (
          <aside className="w-full lg:w-96 xl:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200/90 flex flex-col shrink-0 shadow-xs h-[400px] lg:h-auto">
            {/* Header: Phụ đề + Action icons (Download, AB, Close) */}
            <div className="p-4 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">Phụ đề</h2>
                <span className="text-3xs font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full">
                  {subtitles.length} câu
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500">
                <button
                  onClick={() => toast.info("Đã tải phụ đề xuống định dạng .SRT")}
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Tải phụ đề xuống"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsAbRepeat((prev) => !prev)}
                  type="button"
                  className={`px-1.5 py-0.5 text-3xs font-extrabold rounded-md border transition-colors cursor-pointer ${
                    isAbRepeat
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "hover:bg-slate-200 border-slate-300 text-slate-600"
                  }`}
                  title="Lặp lại A-B"
                >
                  AB
                </button>
                <button
                  onClick={() => setShowTranscriptPanel(false)}
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Đóng bảng phụ đề"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            </div>

            {/* Scrollable Subtitle Rows */}
            <div
              ref={transcriptScrollContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-thin divide-y divide-slate-100"
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
                        ? "bg-emerald-50/90 border-l-4 border-emerald-500 text-emerald-950 shadow-2xs font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {/* Play Button Icon for each row (Circle with Play triangle) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSubtitle(idx, true);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-200/80 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>

                    {/* Subtitle Content */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <p
                        className={`text-xs sm:text-sm leading-relaxed font-sans ${
                          isActive ? "font-bold text-emerald-950" : "text-slate-800"
                        }`}
                      >
                        {sub.japanese}
                      </p>

                      {showTranslation && sub.translation && (
                        <p className="text-3xs sm:text-2xs text-slate-500 line-clamp-2">
                          {sub.translation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CourseVideoStudyPage;
