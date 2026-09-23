import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  BookOpen,
  ChevronRight,
  Award,
  Sun,
  Moon,
  MessageCircle,
  Store,
  Laptop,
  GraduationCap,
  Zap,
  Target,
  Compass,
  Scale,
} from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { playHankoStampAudio } from "@/components/gamification/HankoStampCard";

export default function LandingPage() {
  const { isDark, toggleTheme } = useThemeStore();

  // Interactive Voice Demo state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [demoState, setDemoState] = useState<"idle" | "evaluating" | "scored">("idle");
  const [demoScore, setDemoScore] = useState<number | null>(null);
  const [userSpokenText, setUserSpokenText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Sample prompt for the interactive hero widget
  const sampleJapaneseQuestion = "初めまして！お名前と、日本で挑戦したいことを教えてください。";
  const sampleTranslationQuestion = "Rất vui được gặp bạn! Hãy cho tôi biết tên của bạn và điều bạn muốn thử thách tại Nhật Bản nhé.";
  const sampleAnswer = "初めまして、ナムと申します。ITエンジニアとして日本の技術を学びたいです！";

  // TTS speak function
  const speakJapanese = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find((v) => v.lang.startsWith("ja"));
      if (jpVoice) utterance.voice = jpVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle mock scoring or real trial
  const handleScoreTrial = (customText?: string) => {
    setDemoState("evaluating");
    const chosenText = customText || sampleAnswer;
    setUserSpokenText(chosenText);

    setTimeout(() => {
      setDemoScore(96);
      setDemoState("scored");
      playHankoStampAudio();
    }, 1100);
  };

  // Real Speech Recognition trial if supported
  const toggleRecording = () => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      // Fallback: evaluate sample directly
      handleScoreTrial();
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        setIsRecording(false);
        handleScoreTrial(transcript || sampleAnswer);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        handleScoreTrial();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      handleScoreTrial();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 relative selection:bg-rose-500/20 selection:text-rose-600">
      {/* Ambient Wa-Modern Background Blur Mesh */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-100/40 via-amber-50/20 to-transparent dark:from-rose-950/20 dark:via-indigo-950/10 pointer-events-none blur-3xl -z-10" />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 h-20 backdrop-blur-xl bg-white/80 dark:bg-[#0b0f17]/85 border-b border-rose-100 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-8">
          {/* Logo & Slogan */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-rose-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" />
              <Sparkles size={22} className="text-white animate-spin-slow relative z-10" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  JTalk
                </span>
                <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  AI Reflex
                </span>
              </div>
              <span className="text-3xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block -mt-1">
                会話特化型AI • Tokyo Accent
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#trial" className="hover:text-rose-600 dark:hover:text-rose-400 transition">
              Nói Thử Miễn Phí
            </a>
            <a href="#scenarios" className="hover:text-rose-600 dark:hover:text-rose-400 transition">
              Kịch Bản Sinh Viên
            </a>
            <a href="#hanko" className="hover:text-rose-600 dark:hover:text-rose-400 transition">
              Thẻ Hanko 7 Ngày
            </a>
            <a href="#compare" className="hover:text-rose-600 dark:hover:text-rose-400 transition">
              So Sánh
            </a>
            <a href="#pricing" className="hover:text-rose-600 dark:hover:text-rose-400 transition">
              Gói Sinh Viên
            </a>
          </nav>

          {/* Right Actions: Theme Toggle & Sign in / Sign up */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
              title={isDark ? "Giao diện Sáng" : "Giao diện Tối"}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            <Link
              to="/signin"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Đăng nhập
            </Link>

            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-black shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              Học thử Free
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Hook */}
          <div className="lg:col-span-6 space-y-6">
            {/* Japanese Aesthetic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-700 dark:text-rose-300 shadow-2xs">
              <Compass size={14} className="text-rose-600 dark:text-rose-400 animate-spin-slow" />
              <span>1日15分、AIと話して話せる自分へ</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl/tight font-black tracking-tight text-slate-900 dark:text-white">
              Tự tin bắn tiếng Nhật{" "}
              <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                chuẩn giọng Tokyo
              </span>{" "}
              sau 15 phút mỗi ngày!
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Không còn nỗi sợ phát âm sai hay ngại ngùng trước người lạ. Luyện phản xạ đàm thoại 1:1 cùng Sensei AI, bẻ gãy thói quen dịch ngầm, sẵn sàng phỏng vấn Baito Combini và IT BrSE/Comtor.
            </p>

            {/* Quick Benefits Bullet List */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-500 shrink-0" />
                <span>AI chấm 4 tiêu chí phát âm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-500 shrink-0" />
                <span>Phụ đề Furigana 1 chạm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-500 shrink-0" />
                <span>Thẻ Hanko điểm danh 7 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-rose-500 shrink-0" />
                <span>Kịch bản Baito & IT thực chiến</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm shadow-xl shadow-rose-600/25 active:scale-97 transition-all group"
              >
                <span>Bắt đầu học thử miễn phí</span>
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#trial"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
              >
                <Sparkles size={16} className="text-amber-500" />
                <span>Thử nói 1 câu ngay</span>
              </a>
            </div>

            <p className="text-3xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500 shrink-0" />
              <span>Tặng ngay 2 lượt luyện phản xạ Free mỗi ngày • Không yêu cầu thẻ tín dụng</span>
            </p>
          </div>

          {/* Right Column: Interactive Speaking Trial Widget */}
          <div id="trial" className="lg:col-span-6">
            <div className="relative rounded-3xl border-2 border-rose-200/90 dark:border-rose-900/60 bg-white/95 dark:bg-[#111827]/95 p-6 sm:p-8 shadow-2xl shadow-rose-500/10 backdrop-blur-md">
              {/* Widget Header */}
              <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                    AI
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Sensei Yuki • Phòng Luyện Thử Phản Xạ
                    </h3>
                    <p className="text-3xs text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wide">
                      Phỏng vấn xin việc thêm (Baito Combini)
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  <Zap size={11} className="fill-amber-500 text-amber-500 animate-bounce" />
                  <span>5s REFLEX</span>
                </span>
              </div>

              {/* Japanese Prompt Bubble */}
              <div className="mt-5 p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Câu hỏi từ Sensei AI:
                  </span>

                  <button
                    onClick={() => speakJapanese(sampleJapaneseQuestion)}
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs hover:scale-105 active:scale-95 transition"
                    title="Nghe phát âm chuẩn người Tokyo"
                  >
                    <Volume2 size={12} className={isPlayingAudio ? "animate-bounce" : ""} />
                    <span>{isPlayingAudio ? "Đang đọc..." : "Nghe Sensei đọc"}</span>
                  </button>
                </div>

                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-jp leading-[2.4] tracking-normal">
                  <ruby>初<rt className="text-rose-500 dark:text-rose-400 font-bold">はじ</rt></ruby>めまして！お<ruby>名前<rt className="text-rose-500 dark:text-rose-400 font-bold">なまえ</rt></ruby>と、<ruby>日本<rt className="text-rose-500 dark:text-rose-400 font-bold">にほん</rt></ruby>で<ruby>挑戦<rt className="text-rose-500 dark:text-rose-400 font-bold">ちょうせん</rt></ruby>したいことを<ruby>教<rt className="text-rose-500 dark:text-rose-400 font-bold">おし</rt></ruby>えてください。
                </p>

                <p className="text-2xs text-slate-500 dark:text-slate-400 italic font-medium">
                  "{sampleTranslationQuestion}"
                </p>
              </div>

              {/* User Practice Section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-2xs font-extrabold text-slate-500 dark:text-slate-400">
                  <span>Câu trả lời mẫu gợi ý:</span>
                  <button
                    onClick={() => speakJapanese(sampleAnswer)}
                    className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Volume2 size={11} />
                    <span>Nghe mẫu</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {userSpokenText || sampleAnswer}
                </div>

                {/* Score result overlay if triggered */}
                {demoState === "evaluating" && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-center animate-pulse">
                    <p className="text-xs font-black text-amber-800 dark:text-amber-300">
                      Sensei AI đang phân tích phát âm & trường âm của bạn...
                    </p>
                  </div>
                )}

                {demoState === "scored" && demoScore && (
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-slate-900 dark:to-rose-950/40 border-2 border-rose-500/80 animate-in zoom-in-95 duration-300 space-y-3">
                    {/* Top Result & Red Hanko Stamp */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-3xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                          Điểm phát âm AI
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                            {demoScore}
                          </span>
                          <span className="text-xs font-bold text-slate-400">/100</span>
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-3xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Xuất sắc! (大変よくできました)
                        </span>
                      </div>

                      {/* Red Stamp Seal */}
                      <div className="rotate-6 w-16 h-16 rounded-full border-2 border-rose-600 text-rose-600 flex flex-col items-center justify-center font-serif shadow-md animate-bounce">
                        <span className="text-xs font-black leading-none">合格</span>
                        <span className="text-4xs font-bold uppercase tracking-widest mt-0.5">PASSED</span>
                      </div>
                    </div>

                    {/* Criteria breakdown */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-rose-100 dark:border-slate-800 text-center">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-4xs font-bold text-slate-400 block">Phát âm</span>
                        <span className="text-xs font-black text-rose-600">98</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-4xs font-bold text-slate-400 block">Lưu loát</span>
                        <span className="text-xs font-black text-emerald-600">95</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-4xs font-bold text-slate-400 block">Độ chính xác</span>
                        <span className="text-xs font-black text-blue-600">96</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-4xs font-bold text-slate-400 block">Đầy đủ</span>
                        <span className="text-xs font-black text-amber-600">94</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions: Speak button or Simulate button */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={toggleRecording}
                    type="button"
                    className={`flex-1 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                      isRecording
                        ? "bg-rose-700 text-white animate-pulse"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                    }`}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    <span>{isRecording ? "Đang nghe bạn nói..." : "Bấm Micro & Nói Thử"}</span>
                  </button>

                  <button
                    onClick={() => handleScoreTrial()}
                    type="button"
                    className="px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95"
                    title="Chấm điểm câu trả lời mẫu ngay lập tức"
                  >
                    Chấm mẫu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST & IMPACT METRICS BAR ================= */}
      <section className="border-y border-rose-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">
              10,000+
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Lượt luyện phản xạ đàm thoại mỗi tháng
            </p>
          </div>

          <div>
            <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              94.8%
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Sinh viên tự tin giao tiếp sau 2 tuần
            </p>
          </div>

          <div>
            <p className="text-2xl sm:text-4xl font-black text-amber-500">
              4 Tiêu chí
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Chấm điểm chuẩn quốc tế (Phát âm, Ngữ điệu, Lưu loát, Đầy đủ)
            </p>
          </div>

          <div>
            <p className="text-2xl sm:text-4xl font-black text-emerald-500">
              50+ Kịch bản
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Thực chiến việc làm Baito, IT BrSE và du học
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4 STUDENT SURVIVAL SCENARIOS ================= */}
      <section id="scenarios" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <Target size={13} className="mr-1.5 text-rose-600 dark:text-rose-400" />
            <span>ĐO NI ĐÓNG GIÀY CHO SINH VIÊN</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            4 Gói Kịch Bản Thực Chiến Nhất
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Không học lý thuyết sách giáo khoa cứng nhắc. Tập trung 100% vào các tình huống sinh viên thường gặp nhất khi đi làm và giao tiếp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Scenario 1: Baito */}
          <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Store size={24} className="text-rose-600 dark:text-rose-400 animate-pulse" />
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                N5 - N4 • PHỔ BIẾN
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                Phỏng Vấn Baito Combini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Tập trả lời lịch rảnh cuối tuần, chào hỏi Tencho cửa hàng tiện lợi, xin phép đổi ca và lễ nghi phỏng vấn xin việc thêm.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between">
              <span className="text-3xs font-bold text-slate-400">8 kịch bản tình huống</span>
              <Link to="/speaking" className="text-xs font-black text-rose-600 hover:underline flex items-center gap-1">
                Luyện ngay <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Scenario 2: IT BrSE */}
          <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Laptop size={24} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                N4 - N3 • IT CAREER
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                IT BrSE & Comtor Starter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Báo cáo tiến độ Daily Scrum bằng tiếng Nhật, giải thích bug, trao đổi task Jira và giao tiếp chuyên nghiệp với PM Nhật.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between">
              <span className="text-3xs font-bold text-slate-400">12 kịch bản kỹ thuật</span>
              <Link to="/speaking" className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1">
                Luyện ngay <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Scenario 3: Campus & Subway Survival */}
          <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <GraduationCap size={24} className="text-blue-600 dark:text-blue-400 animate-float" />
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                N5 - N4 • ĐỜI THƯỜNG
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Sinh Tồn Ga Tàu & Trường Học
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Hỏi đường ga Shinjuku, kết bạn cùng trường đại học, xin phép giảng viên nộp bài muộn, đi khám bệnh tại phòng khám Nhật.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between">
              <span className="text-3xs font-bold text-slate-400">10 kịch bản sinh viên</span>
              <Link to="/speaking" className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                Luyện ngay <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Scenario 4: Speed 5s Reflex */}
          <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Zap size={24} className="fill-amber-500 text-amber-500 animate-bounce" />
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                MỌI TRÌNH ĐỘ • CHỐNG VẤP
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Phản Xạ Thần Tốc 5 Giây
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Đồng hồ đếm ngược 5 giây hình tròn áp lực thực chiến. Buộc cất giọng ngay, phá vỡ thói quen dịch ngầm Việt - Nhật trong não.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between">
              <span className="text-3xs font-bold text-slate-400">Không giới hạn câu hỏi</span>
              <Link to="/speaking" className="text-xs font-black text-amber-600 hover:underline flex items-center gap-1">
                Luyện ngay <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENTO GRID CORE FEATURES ================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/40 border-y border-rose-100 dark:border-slate-800 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <Sparkles size={13} className="mr-1.5 text-rose-600 dark:text-rose-400 animate-spin-slow" />
              <span>PHƯƠNG PHÁP CHUẨN NHẬT BẢN</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Vũ Khí Giúp Bạn Nói Chuẩn & Tự Nhiên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Thiết kế tối ưu cho thói quen học tập nhanh gọn của sinh viên Gen-Z
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: 4 criteria */}
            <div className="md:col-span-2 rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shadow-xs">
                  <Award size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Chấm Điểm 4 Tiêu Chí Chi Tiết Từng Âm Tiết
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Không nói chung chung "bạn nói sai". Sensei AI soi xét ngữ điệu bổng trầm (Pitch Accent), trường âm dài ngắn và biến âm xúc âm, giúp bạn chỉnh sửa ngay lập tức.
                </p>
              </div>

              {/* Visual simulated criteria bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <span className="text-3xs font-bold text-slate-400">Phát âm</span>
                  <p className="text-lg font-black text-rose-600">98%</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                    <div className="h-full bg-rose-500 w-[98%]" />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <span className="text-3xs font-bold text-slate-400">Lưu loát</span>
                  <p className="text-lg font-black text-emerald-600">95%</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%]" />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <span className="text-3xs font-bold text-slate-400">Ngữ điệu</span>
                  <p className="text-lg font-black text-blue-600">96%</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500 w-[96%]" />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-center">
                  <span className="text-3xs font-bold text-slate-400">Đầy đủ</span>
                  <p className="text-lg font-black text-amber-600">94%</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                    <div className="h-full bg-amber-500 w-[94%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Furigana 1-chạm */}
            <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shadow-xs">
                  <BookOpen size={24} className="animate-float" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Furigana & Kanji 1 Chạm
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Gặp từ mới hoặc chữ Hán phức tạp? Chỉ cần chạm vào từ để xem cách đọc Hiragana, Romaji và dịch nghĩa tiếng Việt ngay trên màn hình nói.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-center">
                <span className="text-2xs text-rose-700 dark:text-rose-300 font-extrabold block mb-1">
                  Chạm để tra cứu tức thì:
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white font-jp leading-[2.4]">
                  <ruby>勉強<rt className="text-rose-500 dark:text-rose-400 font-bold">べんきょう</rt></ruby>
                </p>
                <span className="text-3xs text-slate-500 block mt-0.5">→ Học tập (Benkyou)</span>
              </div>
            </div>

            {/* Bento Card 3: Hanko Stamp Card Teaser */}
            <div id="hanko" className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shadow-xs">
                  <span className="text-xl font-bold">判子</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Thẻ Con Dấu Hanko 7 Ngày
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Tái hiện nét đẹp điểm danh Radio Taisou học đường Nhật Bản. Hoàn thành 1 bài nói trong ngày để đóng mộc đỏ「済」kèm âm thanh gõ gỗ thỏa mãn.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <div className="w-8 h-8 rounded-full border border-rose-500 bg-white dark:bg-slate-800 text-rose-600 flex items-center justify-center text-xs font-black rotate-[-3deg] shadow-xs">
                  済
                </div>
                <div className="w-8 h-8 rounded-full border border-rose-500 bg-white dark:bg-slate-800 text-rose-600 flex items-center justify-center text-xs font-black rotate-[4deg] shadow-xs">
                  済
                </div>
                <div className="w-8 h-8 rounded-full border border-rose-500 bg-white dark:bg-slate-800 text-rose-600 flex items-center justify-center text-xs font-black rotate-[-2deg] shadow-xs">
                  済
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-rose-400 flex items-center justify-center text-rose-500 text-3xs font-extrabold animate-pulse">
                  Hôm nay
                </div>
              </div>
            </div>

            {/* Bento Card 4: LINE Call immersion */}
            <div className="md:col-span-2 rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-3 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shadow-xs">
                  <MessageCircle size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Mô Phỏng Cuộc Gọi Thoại LINE Call Với Người Bản Xứ
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Sinh viên Nhật giao tiếp 90% qua LINE. JTalk mô phỏng giao diện cuộc gọi thoại thực tế với sóng âm dao động sống động, giúp bạn quen với áp lực đàm thoại trực tiếp.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    Yuki
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Sensei Yuki (Tokyo)
                    </span>
                    <span className="text-3xs font-extrabold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      LINE Call Connected • 02:45
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-1 h-7 bg-emerald-500 rounded-full animate-bounce delay-100" />
                  <span className="w-1 h-5 bg-emerald-500 rounded-full animate-bounce delay-200" />
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPARISON TABLE ================= */}
      <section id="compare" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <Scale className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>SO SÁNH TRỰC QUAN</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Học Trung Tâm vs JTalk AI Reflex
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Tại sao hàng ngàn sinh viên lựa chọn chuyển sang luyện nói cùng AI mỗi ngày
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Tiêu chí
                </th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">
                  Trung tâm truyền thống
                </th>
                <th className="py-4 px-6 text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider w-1/3 bg-rose-50/50 dark:bg-rose-950/20 rounded-t-2xl">
                  <span className="inline-flex items-center gap-1.5">
                    JTalk AI Reflex
                    <Sparkles size={14} className="text-rose-500 animate-spin-slow" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <tr>
                <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                  Chi phí học tập
                </td>
                <td className="py-5 px-6 text-slate-500 dark:text-slate-400">
                  1.500.000đ - 3.000.000đ/tháng (khá đắt cho sinh viên)
                </td>
                <td className="py-5 px-6 font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                  Chỉ 99.000đ/tháng (bằng 2 cốc trà sữa)
                </td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                  Thời lượng được nói
                </td>
                <td className="py-5 px-6 text-slate-500 dark:text-slate-400">
                  Chỉ 3 - 5 phút/buổi vì lớp đông 15-20 học viên
                </td>
                <td className="py-5 px-6 font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                  100% thời lượng là bạn nói (1:1 với Sensei AI)
                </td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                  Tâm lý & Áp lực
                </td>
                <td className="py-5 px-6 text-slate-500 dark:text-slate-400">
                  Rất sợ phát âm sai, ngại ngùng trước bạn bè
                </td>
                <td className="py-5 px-6 font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                  Thoải mái tuyệt đối, không ai phán xét bạn
                </td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                  Tốc độ sửa lỗi phát âm
                </td>
                <td className="py-5 px-6 text-slate-500 dark:text-slate-400">
                  Giáo viên khó sửa cặn kẽ từng âm cho từng bạn
                </td>
                <td className="py-5 px-6 font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                  Phản hồi ngay sau 1 giây với 4 tiêu chí rõ ràng
                </td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                  Thời gian & Địa điểm
                </td>
                <td className="py-5 px-6 text-slate-500 dark:text-slate-400">
                  Cố định theo ca học, phải di chuyển kẹt xe
                </td>
                <td className="py-5 px-6 font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded-b-2xl">
                  Bất cứ lúc nào (trên xe bus, giờ nghỉ, đêm khuya)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= STUDENT TESTIMONIALS ================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/40 border-y border-rose-100 dark:border-slate-800 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <MessageCircle size={13} className="mr-1.5 text-rose-600 dark:text-rose-400" />
              <span>CHIA SẺ TỪ CỘNG ĐỒNG</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Sinh Viên Nói Gì Về JTalk?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Lắng nghe cảm nhận thực tế từ các bạn sinh viên đã vượt qua nỗi sợ nói tiếng Nhật
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                "Mình học tiếng Nhật 2 năm đậu N3 nhưng gặp người Nhật là câm nín vì sợ sai. Nhờ luyện kịch bản Baito Combini trên JTalk mà tuần trước mình đã tự tin phỏng vấn đỗ ngay quán Lawson ở Tokyo!"
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                  HN
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Hoàng Nam</h4>
                  <span className="text-3xs text-slate-400 block font-medium">Du học sinh Tokyo • N3</span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                "Thích nhất tính năng thẻ đóng mộc Hanko 7 ngày! Mỗi ngày vào luyện 1 bài để nghe tiếng 'cộp' đóng dấu sướng tai dã man. Tạo thói quen tự học cực tốt cho đứa lười như mình."
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                  MA
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Mai Anh</h4>
                  <span className="text-3xs text-slate-400 block font-medium">Sinh viên ĐH Ngoại Ngữ Hà Nội</span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
                <Star size={16} className="fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                "Bộ kịch bản IT BrSE/Comtor rất thực tế. Cách báo cáo Daily Scrum, giải thích lỗi hệ thống chuẩn ngữ cảnh công ty Nhật. Giá sinh viên 99k quá rẻ so với giá trị nhận được."
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                  TQ
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Trần Quang</h4>
                  <span className="text-3xs text-slate-400 block font-medium">Sinh viên CNTT ĐH Bách Khoa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STUDENT PRICING & FINAL CTA ================= */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl border-2 border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-[#111827] dark:via-slate-900 dark:to-rose-950/30 p-8 sm:p-14 shadow-2xl text-center space-y-8">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-rose-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
              <GraduationCap size={14} className="mr-1.5" />
              <span>GÓI ƯU ĐÃI SINH VIÊN</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Mở Khóa Toàn Diện Chỉ{" "}
              <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                99.000đ / tháng
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Không giới hạn lượt luyện nói AI • Mở khóa toàn bộ 50+ kịch bản Baito & IT • Chấm 4 tiêu chí chi tiết
            </p>
          </div>

          {/* Pricing Features List */}
          <div className="max-w-xl mx-auto grid grid-cols-2 gap-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 relative z-10">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-rose-500" />
              <span>Luyện phản xạ không giới hạn</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-rose-500" />
              <span>Phân tích giọng chuẩn Tokyo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-rose-500" />
              <span>Hỗ trợ thanh toán MoMo tiện lợi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-rose-500" />
              <span>Miễn phí 2 lượt trải nghiệm mỗi ngày</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-base shadow-xl shadow-rose-600/30 active:scale-97 transition-all flex items-center justify-center gap-2"
            >
              <span>Đăng Ký Tài Khoản Sinh Viên</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/signin"
              className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-rose-100 dark:border-slate-800 bg-white/60 dark:bg-[#0b0f17] py-12 text-slate-500 dark:text-slate-400 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs relative overflow-hidden">
              <Sparkles size={16} className="text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 dark:text-white">JTalk</span>
              <span className="text-3xs block text-slate-400">
                Nền tảng luyện phản xạ Kaiwa tiếng Nhật cùng AI
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs">
            <a href="#trial" className="hover:text-rose-600 transition">Nói Thử Miễn Phí</a>
            <a href="#scenarios" className="hover:text-rose-600 transition">Kịch Bản Baito & IT</a>
            <a href="#hanko" className="hover:text-rose-600 transition">Thẻ Hanko</a>
            <Link to="/signin" className="hover:text-rose-600 transition">Đăng nhập</Link>
            <Link to="/signup" className="hover:text-rose-600 transition">Đăng ký</Link>
          </div>

          <p className="text-3xs text-slate-400 text-center md:text-right">
            © 2026 JTalk. Thiết kế chuẩn Tokyo Dialect & Minna no Nihongo.
          </p>
        </div>
      </footer>
    </div>
  );
}
