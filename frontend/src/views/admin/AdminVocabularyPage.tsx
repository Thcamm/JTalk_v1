"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  BookMarked,
  Upload,
  FileSpreadsheet,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Download,
  Check,
  X,
  Layers,
  GraduationCap,
  ArrowRight,
  Loader2,
  ListFilter,
  ExternalLink,
  HelpCircle,
  FolderOpen,
  Info,
  Wand2,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  type SystemVocabItem,
  type AdminVocabResponse,
} from "@/services/admin.service";
import {
  parseQuizletContent,
  readUploadedFile,
  exportToCsv,
  containsKanji,
  hiraganaToRomaji,
  type ParsedVocabItem,
} from "@/utils/quizletParser";
import {
  isEnglishText,
  translateToVietnamese,
  getSinoVietnamese,
} from "@/utils/japaneseMeaningTranslator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { VocabularyQuizModal } from "@/components/vocabulary/VocabularyQuizModal";
import type { Course, Lesson } from "@/types";

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  N5: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  N4: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  N3: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  N2: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  N1: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

const WORD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  verb: { label: "Động từ", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  noun: { label: "Danh từ", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  adjective: { label: "Tính từ", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  adverb: { label: "Phó từ", color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
  phrase: { label: "Cụm từ", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  other: { label: "Khác", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

export default function AdminVocabularyPage() {
  const [activeTab, setActiveTab] = useState<"import" | "list">("import");

  // State cho Tab Import
  const [importMode, setImportMode] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [defaultLevel, setDefaultLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [targetType, setTargetType] = useState<"system" | "lesson">("system");
  const [overwrite, setOverwrite] = useState(false);

  // Tùy chọn nâng cao: nạp vào Bài học cụ thể nếu cần
  const [showAdvancedTarget, setShowAdvancedTarget] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Danh sách từ đã phân tích (Preview)
  const [parsedItems, setParsedItems] = useState<ParsedVocabItem[]>([]);
  const [previewFilter, setPreviewFilter] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isAiEnriching, setIsAiEnriching] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  // Số lượng từ có định nghĩa tiếng Anh từ Quizlet cần dịch sang tiếng Việt
  const englishItemCount = useMemo(() => {
    return parsedItems.filter((i) => isEnglishText(i.meaning)).length;
  }, [parsedItems]);

  // Danh sách các từ còn ô bị thiếu (Furigana, Romaji, Hán Việt, từ dính khoảng trắng, hoặc nghĩa tiếng Anh)
  const incompleteItems = useMemo(() => {
    return parsedItems.filter((i) => {
      const hasKanji = containsKanji(i.kanji);
      const isSpaceSeparated = /[\s\t]+/.test(i.kanji.trim());
      const hasMissingFurigana = !i.furigana?.trim() && hasKanji;
      const hasMissingRomaji =
        !i.romaji?.trim() ||
        /[぀-ヿ]/.test(i.romaji) ||
        /^[a-z]\s+[a-z]/.test(i.romaji.trim());
      const hasMissingSino = hasKanji && !i.sinoVietnamese?.trim();
      const isEnglish = isEnglishText(i.meaning);
      const hasTrailingSino = /^(.*?)\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s/]{2,})$/.test(
        i.meaning
      );
      const hasMissingExample = !i.exampleSentence?.trim();

      return (
        isSpaceSeparated ||
        hasMissingFurigana ||
        hasMissingRomaji ||
        hasMissingSino ||
        isEnglish ||
        hasTrailingSino ||
        hasMissingExample
      );
    });
  }, [parsedItems]);

  const incompleteItemCount = incompleteItems.length;

  // State cho Preview Quiz từ danh sách CSV
  const [isQuizPreviewOpen, setIsQuizPreviewOpen] = useState(false);
  const [quizQuestionCountSetting, setQuizQuestionCountSetting] = useState<number>(10);

  // State cho Tab List (Database)
  const [vocabList, setVocabList] = useState<SystemVocabItem[]>([]);
  const [vocabStats, setVocabStats] = useState({ total: 0, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Modal Xác nhận Reset toàn bộ kho từ vựng
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Modal Sửa/Thêm từ đơn lẻ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Partial<SystemVocabItem> | null>(null);
  const [isSavingWord, setIsSavingWord] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load danh sách khóa học khi bật tùy chọn nâng cao
  useEffect(() => {
    if (showAdvancedTarget && courses.length === 0) {
      adminService
        .getCourses()
        .then((data) => setCourses(data || []))
        .catch((err) => console.warn("Lỗi tải khóa học:", err));
    }
  }, [showAdvancedTarget, courses.length]);

  // Khi chọn Course -> tải danh sách Lesson
  useEffect(() => {
    if (selectedCourseId) {
      setLoadingLessons(true);
      adminService
        .getLessons({ courseId: selectedCourseId, limit: 100 })
        .then((res) => {
          setLessons(res.lessons || []);
          if (res.lessons?.length > 0) {
            setSelectedLessonId(res.lessons[0]._id);
          } else {
            setSelectedLessonId("");
          }
        })
        .catch((err) => {
          console.warn("Lỗi tải bài học:", err);
          setLessons([]);
        })
        .finally(() => setLoadingLessons(false));
    } else {
      setLessons([]);
      setSelectedLessonId("");
    }
  }, [selectedCourseId]);

  // Load danh sách kho từ vựng hệ thống
  const loadVocabList = async (targetPage = page) => {
    try {
      setIsLoadingList(true);
      const res = await adminService.getVocabularies({
        page: targetPage,
        limit: 25,
        search: searchQuery,
        level: selectedLevelFilter !== "all" ? selectedLevelFilter : undefined,
      });
      setVocabList(res.items || []);
      setVocabStats(res.stats || { total: 0, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 });
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
      setPage(targetPage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tải danh sách từ vựng.");
    } finally {
      setIsLoadingList(false);
    }
  };

  // Tải danh sách & thống kê ngay khi mở trang (đảm bảo KPI cards luôn hiển thị đúng số liệu)
  useEffect(() => {
    loadVocabList(1);
  }, [selectedLevelFilter]);

  // Làm mới danh sách khi chuyển qua tab List
  useEffect(() => {
    if (activeTab === "list") {
      loadVocabList(1);
    }
  }, [activeTab]);

  // Xử lý chọn file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Kéo thả file
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Bắt đầu phân tích dữ liệu (Parse CSV/Text)
  const handleParseData = async () => {
    try {
      setIsParsing(true);
      let content = "";

      if (importMode === "file") {
        if (!selectedFile) {
          toast.warning("Vui lòng chọn hoặc kéo thả file .csv trước khi phân tích!");
          return;
        }
        content = await readUploadedFile(selectedFile);
      } else {
        if (!pastedText.trim()) {
          toast.warning("Vui lòng dán nội dung từ vựng vào ô nhập liệu!");
          return;
        }
        content = pastedText;
      }

      const items = parseQuizletContent(content, defaultLevel);

      if (items.length === 0) {
        toast.error("Không tìm thấy từ vựng hợp lệ trong dữ liệu bạn cung cấp.");
        return;
      }

      setParsedItems(items);
      toast.success(
        `🎉 Đã nhận diện thành công ${items.length} từ vựng! Bạn có thể bấm "AI Phân loại Từ loại" để tối ưu độ chính xác.`
      );
    } catch (err: any) {
      toast.error("Lỗi khi đọc dữ liệu: " + (err?.message || "Định dạng file không hợp lệ"));
    } finally {
      setIsParsing(false);
    }
  };

  // Chuẩn hóa và làm sạch tức thì trên Client (Tách Kana/Kanji, sinh Romaji, bóc Hán Việt, dịch tức thì)
  const handleInstantNormalize = (showToast = true): ParsedVocabItem[] => {
    if (parsedItems.length === 0) return [];

    let fixedCount = 0;
    const normalized = parsedItems.map((item) => {
      let kanji = item.kanji.trim();
      let furigana = item.furigana?.trim() || "";
      let romaji = item.romaji?.trim() || "";
      let meaning = item.meaning?.trim() || "";
      let sino = item.sinoVietnamese?.trim() || "";
      let changed = false;

      // 1. Tách nếu kanji chứa cả Kana và Kanji có khoảng trắng dạng "よこ 横", "びん 瓶"
      if (/[\s\t]+/.test(kanji)) {
        const parts = kanji.split(/[\s\t]+/);
        if (parts.length >= 2) {
          const p1 = parts[0].trim();
          const p2 = parts.slice(1).join(" ").trim();
          if (containsKanji(p2) && !containsKanji(p1)) {
            kanji = p2;
            if (!furigana) furigana = p1;
            changed = true;
          } else if (containsKanji(p1) && !containsKanji(p2)) {
            kanji = p1;
            if (!furigana) furigana = p2;
            changed = true;
          }
        }
      }

      // 2. Bóc tách Âm Hán Việt in hoa dính ở cuối meaning dạng "Bên cạnh HOÀNH"
      const uppercaseSinoMatch = meaning.match(
        /^(.*?)\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s/]{2,})$/
      );
      if (uppercaseSinoMatch) {
        const rawMean = uppercaseSinoMatch[1].trim();
        const rawSino = uppercaseSinoMatch[2].trim();
        if (/^[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s/]+$/.test(rawSino)) {
          if (!sino) sino = rawSino;
          if (rawMean) meaning = rawMean;
          changed = true;
        }
      }

      // 3. Tra cứu Âm Hán Việt nếu từ có Kanji mà chưa có
      if (!sino && containsKanji(kanji)) {
        const autoSino = getSinoVietnamese(kanji);
        if (autoSino) {
          sino = autoSino;
          changed = true;
        }
      }

      // 4. Nếu Furigana trống và từ không có Kanji thì Furigana = Kanji
      if (!furigana && !containsKanji(kanji)) {
        furigana = kanji;
        changed = true;
      }

      // 5. Chuẩn hóa Romaji (nếu trống, còn là Katakana hoặc bị ngắt khoảng trắng như "zu i bu n")
      if (!romaji || /[぀-ヿ]/.test(romaji) || /^[a-z]\s+[a-z]/.test(romaji)) {
        const autoRomaji = hiraganaToRomaji(furigana || kanji);
        if (autoRomaji) {
          romaji = autoRomaji;
          changed = true;
        }
      }

      // 6. Dịch nếu là tiếng Anh và có trong từ điển
      const translatedMeaning = translateToVietnamese(kanji, meaning);
      if (translatedMeaning && translatedMeaning !== meaning) {
        meaning = translatedMeaning;
        changed = true;
      }

      // 7. Tạo câu ví dụ chuẩn nếu câu ví dụ đang dính chữ Hán Việt in hoa hoặc khoảng trắng
      let exampleSentence = item.exampleSentence || "";
      let exampleTranslation = item.exampleTranslation || "";
      if (!exampleSentence || (sino && exampleTranslation.toLowerCase().includes(sino.toLowerCase()))) {
        const safeMeaning = meaning.toLowerCase();
        if (item.wordType === "verb") {
          exampleSentence = `毎日、${kanji}。`;
          exampleTranslation = `Mỗi ngày đều ${safeMeaning}.`;
        } else if (item.wordType === "adjective") {
          exampleSentence = `これはとても${kanji}です。`;
          exampleTranslation = `Cái này rất ${safeMeaning}.`;
        } else {
          exampleSentence = `ここに${kanji}があります。`;
          exampleTranslation = `Ở đây có ${safeMeaning}.`;
        }
        changed = true;
      }

      if (changed) fixedCount++;

      return {
        ...item,
        kanji,
        furigana,
        romaji,
        meaning,
        sinoVietnamese: sino,
        exampleSentence,
        exampleTranslation,
      };
    });

    setParsedItems(normalized);
    if (showToast) {
      if (fixedCount > 0) {
        toast.success(`✨ Đã chuẩn hóa nhanh & điền tự động cho ${fixedCount} từ vựng!`);
      } else {
        toast.info("Dữ liệu từ vựng hiện tại đã ở trạng thái chuẩn hóa!");
      }
    }
    return normalized;
  };

  // Kích hoạt AI Phân tích sâu: Dịch 100% nghĩa tiếng Việt, Chuẩn hóa Kanji, Âm Hán Việt, Furigana & Ví dụ
  const handleAiEnrich = async (mode: "all" | "english" | "incomplete" | boolean = "all") => {
    const isEnglishOnly = mode === true || mode === "english";
    const isIncompleteOnly = mode === "incomplete";

    // Chạy chuẩn hóa nhanh trên client trước để tối ưu dữ liệu thô
    const baseItems = handleInstantNormalize(false) || parsedItems;

    let targetItems: ParsedVocabItem[] = [];
    if (isEnglishOnly) {
      targetItems = baseItems.filter((i) => isEnglishText(i.meaning));
    } else if (isIncompleteOnly) {
      targetItems = baseItems.filter((i) => {
        const hasKanji = containsKanji(i.kanji);
        const isSpaceSeparated = /[\s\t]+/.test(i.kanji.trim());
        const hasMissingFurigana = !i.furigana?.trim() && hasKanji;
        const hasMissingRomaji =
          !i.romaji?.trim() ||
          /[぀-ヿ]/.test(i.romaji) ||
          /^[a-z]\s+[a-z]/.test(i.romaji.trim());
        const hasMissingSino = hasKanji && !i.sinoVietnamese?.trim();
        const isEnglish = isEnglishText(i.meaning);
        const hasTrailingSino = /^(.*?)\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s/]{2,})$/.test(
          i.meaning
        );
        return (
          isSpaceSeparated ||
          hasMissingFurigana ||
          hasMissingRomaji ||
          hasMissingSino ||
          isEnglish ||
          hasTrailingSino ||
          !i.exampleSentence?.trim()
        );
      });
    } else {
      targetItems = baseItems;
    }

    if (targetItems.length === 0) {
      if (isEnglishOnly) {
        toast.info("Tất cả các từ trong danh sách đã có định nghĩa tiếng Việt chuẩn xác!");
      } else if (isIncompleteOnly) {
        toast.success("Tuyệt vời! Tất cả các ô từ vựng (Furigana, Romaji, Hán Việt, Ví dụ) đã hoàn thiện 100%!");
      }
      return;
    }

    try {
      setIsAiEnriching(true);
      setAiProgress({ current: 0, total: targetItems.length, percent: 0 });
      toast.info(
        isEnglishOnly
          ? `🤖 AI đang dịch và chuẩn hóa ${targetItems.length} từ có định nghĩa tiếng Anh sang tiếng Việt...`
          : isIncompleteOnly
          ? `🤖 AI đang phân tích và hoàn thiện nốt ${targetItems.length} ô còn thiếu (Furigana, Romaji, Hán Việt, Ví dụ)...`
          : `🤖 AI đang phân tích sâu nghĩa tiếng Việt, Hán tự, Âm Hán Việt & Ví dụ cho ${targetItems.length} từ vựng...`
      );

      const BATCH_SIZE = 25;
      let updatedItems = [...parsedItems];

      for (let i = 0; i < targetItems.length; i += BATCH_SIZE) {
        const slice = targetItems.slice(i, i + BATCH_SIZE);
        const res = await adminService.enrichVocabularyWithAi(
          slice.map((item) => ({
            id: item.id,
            kanji: item.kanji,
            furigana: item.furigana,
            meaning: item.meaning,
          })),
          defaultLevel
        );

        if (Array.isArray(res)) {
          const map = new Map(res.map((r: any) => [String(r.id), r]));
          updatedItems = updatedItems.map((orig) => {
            const found = map.get(String(orig.id));
            if (found) {
              return {
                ...orig,
                kanji: found.kanji || orig.kanji,
                furigana: found.furigana || orig.furigana,
                romaji: found.romaji || orig.romaji,
                meaning: found.meaning || orig.meaning,
                sinoVietnamese: found.sinoVietnamese || orig.sinoVietnamese || "",
                wordType: found.wordType || orig.wordType,
                exampleSentence: found.exampleSentence || orig.exampleSentence || "",
                exampleFurigana: found.exampleFurigana || orig.exampleFurigana || "",
                exampleTranslation: found.exampleTranslation || orig.exampleTranslation || "",
              };
            }
            return orig;
          });
        }

        const currentDone = Math.min(i + BATCH_SIZE, targetItems.length);
        setAiProgress({
          current: currentDone,
          total: targetItems.length,
          percent: Math.round((currentDone / targetItems.length) * 100),
        });
      }

      setParsedItems(updatedItems);
      toast.success(
        isEnglishOnly
          ? `✨ AI đã dịch hoàn tất ${targetItems.length} từ tiếng Anh sang 100% tiếng Việt!`
          : isIncompleteOnly
          ? `✨ AI đã bổ sung & hoàn thiện xuất sắc ${targetItems.length} từ vựng còn thiếu!`
          : `✨ AI đã phân tích chi tiết & làm giàu thông tin cho toàn bộ ${targetItems.length} từ vựng!`
      );
    } catch (err: any) {
      toast.error("Lỗi khi phân tích AI: " + (err?.response?.data?.message || err?.message));
    } finally {
      setIsAiEnriching(false);
      setAiProgress(null);
    }
  };

  // Cập nhật từng ô trong bảng xem trước
  const handleUpdateParsedItem = (id: string, field: keyof ParsedVocabItem, value: any) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Xóa một dòng trong bảng xem trước
  const handleDeleteParsedItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Chọn / Bỏ chọn tất cả
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  // Xóa các dòng không chọn
  const handleRemoveUnselected = () => {
    const remaining = parsedItems.filter((i) => i.selected);
    setParsedItems(remaining);
    toast.info(`Đã giữ lại ${remaining.length} từ vựng.`);
  };

  // Gửi lệnh Import lên Backend
  const handleExecuteImport = async () => {
    const selectedItems = parsedItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 từ vựng trong danh sách để nhập!");
      return;
    }

    try {
      setIsSubmittingImport(true);

      if (targetType === "system") {
        // Import vào Kho Từ vựng Hệ thống (Mặc định chính)
        const payload = {
          items: selectedItems.map((item) => ({
            kanji: item.kanji,
            furigana: item.furigana,
            romaji: item.romaji,
            meaning: item.meaning,
            sinoVietnamese: item.sinoVietnamese || "",
            level: item.level,
            wordType: item.wordType,
            exampleSentence: item.exampleSentence || "",
            exampleFurigana: item.exampleFurigana || "",
            exampleTranslation: item.exampleTranslation || "",
            source: "JTalk Master Bank",
            tags: ["jtalk", item.level.toLowerCase()],
          })),
          defaultLevel,
          overwrite,
          source: "JTalk Master Bank",
        };

        const res = await adminService.importVocabularies(payload);
        toast.success(
          `Đã lưu vào Kho từ vựng chung! +${res.insertedCount} từ mới, ${res.updatedCount} cập nhật, ${res.skippedCount} bỏ qua.`
        );

        // Chuyển sang tab Danh sách để xem thành quả
        setActiveTab("list");
        loadVocabList(1);
      } else {
        // Import vào một Bài học cụ thể (Nếu bật tùy chọn nâng cao)
        if (!selectedLessonId) {
          toast.warning("Vui lòng chọn bài học cần nạp từ vựng!");
          return;
        }

        const payload = {
          lessonId: selectedLessonId,
          items: selectedItems.map((item) => ({
            kanji: item.kanji,
            word: item.kanji,
            meaning: item.meaning,
            romaji: item.romaji,
          })),
          replaceExisting: overwrite,
        };

        const res = await adminService.importVocabulariesToLesson(payload);
        toast.success(
          `Đã nạp ${selectedItems.length} từ vựng vào bài học "${res.title}" thành công!`
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi nhập từ vựng lên máy chủ.");
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // Xóa 1 từ trong kho
  const handleDeleteWord = async (id: string, word: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ vựng "${word}" khỏi kho hệ thống không?`)) {
      return;
    }

    try {
      await adminService.deleteVocabulary(id);
      toast.success(`Đã xóa từ vựng "${word}".`);
      setVocabList((prev) => prev.filter((w) => w._id !== id));
      setVocabStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa từ vựng.");
    }
  };

  // Xóa toàn bộ từ vựng theo cấp độ
  const handleDeleteByLevel = async () => {
    if (selectedLevelFilter === "all") {
      toast.warning("Vui lòng chọn một cấp độ cụ thể (N5, N4...) để thực hiện xóa theo bộ.");
      return;
    }

    const count = (vocabStats as any)[selectedLevelFilter] || 0;
    if (count === 0) {
      toast.info(`Không có từ vựng nào thuộc cấp độ ${selectedLevelFilter}.`);
      return;
    }

    if (
      !confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ ${count} từ vựng thuộc cấp độ ${selectedLevelFilter} không? Thao tác này không thể hoàn tác!`
      )
    ) {
      return;
    }

    try {
      const res = await adminService.deleteVocabulariesBulk({ level: selectedLevelFilter });
      toast.success(res?.deletedCount ? `Đã xóa ${res.deletedCount} từ.` : "Đã dọn sạch từ vựng.");
      loadVocabList(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa từ vựng theo cấp độ.");
    }
  };

  // Reset toàn bộ kho từ vựng hệ thống
  const handleResetAllVocabularies = async () => {
    try {
      setIsResetting(true);
      const res = await adminService.resetAllVocabularies();
      toast.success(
        res?.deletedCount !== undefined
          ? `Đã xóa sạch toàn bộ ${res.deletedCount} từ vựng trong kho hệ thống!`
          : "Đã dọn sạch toàn bộ từ vựng trong kho!"
      );
      setIsResetConfirmOpen(false);
      await loadVocabList(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi reset kho từ vựng.");
    } finally {
      setIsResetting(false);
    }
  };

  // Xuất file CSV
  const handleExportCsv = () => {
    if (vocabList.length === 0) {
      toast.info("Không có dữ liệu từ vựng để xuất.");
      return;
    }
    exportToCsv(vocabList, `JTalk_Vocab_${selectedLevelFilter}_${Date.now()}.csv`);
    toast.success("Đã tải xuống file CSV thành công!");
  };

  // Mở modal sửa / thêm từ
  const handleOpenEditModal = (word?: SystemVocabItem) => {
    if (word) {
      setEditingWord(word);
    } else {
      setEditingWord({
        kanji: "",
        furigana: "",
        romaji: "",
        meaning: "",
        sinoVietnamese: "",
        level: "N5",
        wordType: "noun",
        exampleSentence: "",
        exampleFurigana: "",
        exampleTranslation: "",
        source: "JTalk Master Bank",
      });
    }
    setIsEditModalOpen(true);
  };

  // Lưu từ trong modal
  const handleSaveWord = async () => {
    if (!editingWord?.kanji?.trim() || !editingWord?.meaning?.trim()) {
      toast.warning("Vui lòng nhập Từ tiếng Nhật và Nghĩa!");
      return;
    }

    try {
      setIsSavingWord(true);
      if (editingWord._id) {
        // Cập nhật
        const updated = await adminService.updateVocabulary(editingWord._id, editingWord);
        toast.success("Đã cập nhật từ vựng!");
        setVocabList((prev) => prev.map((w) => (w._id === updated._id ? updated : w)));
      } else {
        // Tạo mới
        const created = await adminService.createVocabulary(editingWord);
        toast.success("Đã thêm từ vựng mới vào kho chung!");
        loadVocabList(1);
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi lưu từ vựng.");
    } finally {
      setIsSavingWord(false);
    }
  };

  // Lọc bảng xem trước
  const filteredPreview = useMemo(() => {
    if (!previewFilter.trim()) return parsedItems;
    const q = previewFilter.toLowerCase().trim();
    return parsedItems.filter(
      (i) =>
        i.kanji.toLowerCase().includes(q) ||
        i.furigana.toLowerCase().includes(q) ||
        i.meaning.toLowerCase().includes(q) ||
        i.romaji.toLowerCase().includes(q) ||
        (i.sinoVietnamese && i.sinoVietnamese.toLowerCase().includes(q))
    );
  }, [parsedItems, previewFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <BookMarked size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Kho Từ vựng Hệ thống & Nhập file
              </h1>
              <p className="text-xs text-slate-400">
                Nạp từ vựng trực tiếp vào kho chung JTalk với bộ phân loại AI và bóc tách Kanji/Furigana tự động
              </p>
            </div>
          </div>
        </div>

        {/* Nút Tab chuyển đổi & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "import"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Upload size={14} />
              <span>Nhập từ vựng mới</span>
              {parsedItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-3xs font-mono">
                  {parsedItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={14} />
              <span>Kho Từ vựng Chung ({vocabStats.total || 0})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-950/40"
            title="Reset toàn bộ từ vựng trong kho để nạp mới từ đầu"
          >
            <Trash2 size={13} />
            <span>Reset kho từ</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Tổng từ trong kho</div>
          <div className="text-xl font-black text-white mt-1">{vocabStats.total || 0}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-emerald-400 uppercase">JLPT N5</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 mt-1">{vocabStats.N5 || 0} từ</div>
        </div>
        <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-sky-400 uppercase">JLPT N4</span>
            <span className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 mt-1">{vocabStats.N4 || 0} từ</div>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-indigo-400 uppercase">JLPT N3</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <div className="text-xl font-black text-indigo-300 mt-1">{vocabStats.N3 || 0} từ</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-amber-400 uppercase">JLPT N2</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 mt-1">{vocabStats.N2 || 0} từ</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-rose-400 uppercase">JLPT N1</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-300 mt-1">{vocabStats.N1 || 0} từ</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NHẬP TỪ VỰNG MỚI */}
      {/* ========================================================================= */}
      {activeTab === "import" && (
        <div className="space-y-6">
          {/* Card Cấu hình & Nạp dữ liệu */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload size={18} className="text-indigo-400" />
                  Bước 1: Nạp file .CSV hoặc Dán dữ liệu từ vựng
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tải lên file .csv đã có hoặc dán văn bản trực tiếp (phân tách bằng dấu phẩy hoặc Tab)
                </p>
              </div>

              {/* Chuyển chế độ File / Text */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportMode("file")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    importMode === "file" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tải file .CSV
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("paste")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    importMode === "paste" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Dán nội dung
                </button>
              </div>
            </div>

            {/* Vùng nạp File hoặc Text */}
            {importMode === "file" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-950"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400">
                      <FileSpreadsheet size={36} />
                      <div className="font-bold text-sm text-white">{selectedFile.name}</div>
                      <div className="text-xs text-slate-400">
                        Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB • Bấm để chọn file khác
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Upload size={36} className="text-indigo-400 animate-bounce" />
                      <div className="font-bold text-sm text-white">
                        Kéo thả file .CSV của bạn vào đây, hoặc <span className="text-indigo-400 underline">bấm để chọn file</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Hỗ trợ file .CSV chuẩn UTF-8 (phân cách bằng dấu phẩy hoặc Tab)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Dán nội dung từ vựng vào đây (mỗi dòng một từ, phân cách bằng dấu phẩy hoặc Tab)...&#10;Ví dụ:&#10;ねる (寝る) (ichidan),sleep, go to bed&#10;あさ (朝),morning&#10;たべる (食べる),eat"
                  rows={6}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-y"
                />
              </div>
            )}

            {/* Bước 2: Tùy chọn cấu hình - Tối giản, tập trung vào Kho chung */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap flex-1">
                  {/* Cấp độ JLPT */}
                  <div className="min-w-[180px]">
                    <label className="block text-2xs font-semibold text-slate-400 mb-1">
                      Cấp độ JLPT mục tiêu
                    </label>
                    <select
                      value={defaultLevel}
                      onChange={(e) => setDefaultLevel(e.target.value as any)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="N5">JLPT N5</option>
                      <option value="N4">JLPT N4 (Sơ cấp)</option>
                      <option value="N3">JLPT N3 (Trung cấp)</option>
                      <option value="N2">JLPT N2 (Thượng cấp)</option>
                      <option value="N1">JLPT N1 (Cao cấp)</option>
                    </select>
                  </div>

                  {/* Cài đặt câu hỏi bài test trắc nghiệm  */}
                  <div className="min-w-[190px]">
                    <label className="block text-2xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <FlaskConical size={12} className="text-amber-400" />
                      <span>Số câu kiểm tra(Preview)</span>
                    </label>
                    <select
                      value={quizQuestionCountSetting}
                      onChange={(e) => setQuizQuestionCountSetting(Number(e.target.value))}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value={5}>5 câu hỏi nhanh</option>
                      <option value={10}>10 câu hỏi chuẩn</option>
                      <option value={15}>15 câu hỏi nâng cao</option>
                      <option value={20}>20 câu hỏi toàn diện</option>
                      <option value={50}>50 câu hỏi thử thách</option>
                      <option value={999}>Toàn bộ danh sách từ</option>
                    </select>
                  </div>

                  {/* Mục tiêu nạp: Mặc định Kho Từ vựng Chung */}
                  <div>
                    <label className="block text-2xs font-semibold text-slate-400 mb-1">
                      Đích đến lưu trữ
                    </label>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                      <Layers size={14} />
                      <span>Kho Từ vựng Chung JTalk</span>
                    </div>
                  </div>

                  {/* Checkbox Ghi đè */}
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Cập nhật nếu từ đã tồn tại (Ghi đè)</span>
                    </label>
                  </div>
                </div>

                {/* Nút Phân tích */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleParseData}
                    disabled={isParsing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 active:scale-97 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isParsing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    <span>Phân tích dữ liệu & Xem trước</span>
                  </button>
                </div>
              </div>

              {/* Tùy chọn mở rộng: nạp vào bài học cụ thể (Nếu người dùng muốn) */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedTarget(!showAdvancedTarget)}
                  className="text-2xs text-slate-400 hover:text-indigo-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAdvancedTarget ? "▼ Thu gọn tùy chọn nạp vào Bài học cụ thể" : "▶ Tùy chọn nâng cao: Nạp trực tiếp vào một Bài học cụ thể"}</span>
                </button>

                {showAdvancedTarget && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-2xs font-semibold text-slate-400 mb-1">
                        Chế độ đích đến
                      </label>
                      <select
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value as any)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="system">Kho Từ vựng Chung JTalk (Khuyên dùng)</option>
                        <option value="lesson">Gắn vào Bài học cụ thể</option>
                      </select>
                    </div>

                    {targetType === "lesson" && (
                      <>
                        <div>
                          <label className="block text-2xs font-semibold text-slate-400 mb-1">
                            Chọn Khóa học
                          </label>
                          <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">-- Chọn Khóa học --</option>
                            {courses.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.title} ({c.level})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-2xs font-semibold text-slate-400 mb-1">
                            Chọn Bài học
                          </label>
                          <select
                            value={selectedLessonId}
                            onChange={(e) => setSelectedLessonId(e.target.value)}
                            disabled={!selectedCourseId || loadingLessons}
                            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="">-- Chọn Bài học --</option>
                            {lessons.map((l) => (
                              <option key={l._id} value={l._id}>
                                {l.title} ({l.level})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BẢNG XEM TRƯỚC (PREVIEW TABLE) */}
          {/* ========================================================================= */}
          {parsedItems.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    Bước 2: Bảng xem trước & Tinh chỉnh dữ liệu ({parsedItems.length} từ vựng)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kiểm tra, sửa trực tiếp hoặc sử dụng AI để dịch định nghĩa tiếng Anh từ Quizlet sang tiếng Việt chuẩn và làm giàu câu ví dụ
                  </p>
                </div>

                {/* Các nút công cụ trên Bảng xem trước */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Nút Làm thử bài kiểm tra ngay (Preview Quiz) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (parsedItems.length < 2) {
                        toast.error("Cần ít nhất 2 từ vựng để tạo bài kiểm tra trắc nghiệm.");
                        return;
                      }
                      setIsQuizPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-bold shadow-md shadow-orange-500/20 active:scale-97 transition-all cursor-pointer"
                    title="Làm thử bài kiểm tra trắc nghiệm từ các từ vừa nạp từ CSV"
                  >
                    <FlaskConical size={14} className="text-amber-100" />
                    <span>🧪 Làm thử bài kiểm tra </span>
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-black/30 text-amber-100 text-3xs font-black">
                      {Math.min(quizQuestionCountSetting, parsedItems.length)} câu
                    </span>
                  </button>

                  {/* Nút Chuẩn hóa nhanh tức thì (Tách từ Kana/Kanji, sinh Romaji, bóc Hán Việt) */}
                  <button
                    type="button"
                    onClick={() => handleInstantNormalize(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-2xs font-bold border border-slate-700/70 transition-all cursor-pointer active:scale-97"
                    title="Tách Kana/Kanji dính khoảng trắng, sinh Romaji viết liền, bóc tách Âm Hán Việt tức thì trên máy"
                  >
                    <RefreshCw size={12} className="text-teal-400" />
                    <span>⚡ Chuẩn hóa nhanh</span>
                  </button>

                  {/* Nút AI Hoàn thiện các ô còn thiếu */}
                  {incompleteItemCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAiEnrich("incomplete")}
                      disabled={isAiEnriching}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-97"
                      title="AI tập trung điền nốt các ô còn thiếu (Furigana, Romaji, Hán Việt, câu ví dụ JLPT)"
                    >
                      {isAiEnriching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>✨ AI Hoàn thiện {incompleteItemCount} ô thiếu</span>
                    </button>
                  )}

                  {/* Nút AI Dịch riêng các từ tiếng Anh (Nếu có) */}
                  {englishItemCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAiEnrich(true)}
                      disabled={isAiEnriching}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                      title="AI tập trung dịch toàn bộ các từ vựng có định nghĩa tiếng Anh sang tiếng Việt"
                    >
                      {isAiEnriching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>Dịch {englishItemCount} từ tiếng Anh</span>
                    </button>
                  )}

                  {/* Nút AI Phân tích & Làm giàu toàn bộ */}
                  <button
                    type="button"
                    onClick={() => handleAiEnrich(false)}
                    disabled={isAiEnriching}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                    title="Dùng AI phân tích sâu nghĩa tiếng Việt, bóc tách Kanji, Furigana, Hán Việt và tạo ví dụ cho toàn bộ danh sách"
                  >
                    {isAiEnriching ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                    <span>AI Phân loại & Tối ưu Toàn bộ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveUnselected}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-2xs font-bold transition-all cursor-pointer"
                  >
                    Bỏ từ chưa chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedItems([])}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-300 text-2xs font-bold transition-all cursor-pointer"
                  >
                    Hủy xem trước
                  </button>
                </div>
              </div>

              {/* Banner Phát hiện từ còn ô bị thiếu (Furigana, Romaji, Hán Việt, hoặc dính khoảng trắng) */}
              {incompleteItemCount > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/5 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-teal-500/5">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-teal-300 flex items-center gap-2">
                        <span>Phát hiện {incompleteItemCount} từ còn ô bị thiếu (Furigana, Romaji, Hán Việt, hoặc từ dính khoảng trắng)</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-3xs font-black">
                          Cần hoàn thiện
                        </span>
                      </div>
                      <p className="text-2xs text-slate-300 mt-0.5">
                        Bạn có thể bấm <strong>"Chuẩn hóa nhanh"</strong> để phân tách Kanji/Kana và điền Hán Việt ngay lập tức, hoặc bấm <strong>"AI Hoàn thiện"</strong> để AI bổ sung toàn diện câu ví dụ và phiên âm.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInstantNormalize(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-97 border border-slate-700"
                      title="Chuẩn hóa ngay lập tức trên máy trong tích tắc"
                    >
                      <RefreshCw size={13} className="text-teal-400" />
                      <span>⚡ Chuẩn hóa nhanh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAiEnrich("incomplete")}
                      disabled={isAiEnriching}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-black shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-97"
                    >
                      {isAiEnriching ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                      <span>✨ AI Hoàn thiện {incompleteItemCount} ô còn thiếu</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Banner Phát hiện từ tiếng Anh từ nguồn Quizlet */}
              {englishItemCount > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <span>Phát hiện {englishItemCount} từ vựng có định nghĩa tiếng Anh từ Quizlet</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-3xs font-black">
                          Cần dịch tiếng Việt
                        </span>
                      </div>
                      <p className="text-2xs text-slate-300 mt-0.5">
                        AI có thể phân tích cả từ tiếng Nhật lẫn định nghĩa tiếng Anh để dịch 100% sang tiếng Việt chuẩn xác, chuẩn hóa chữ Hán, bổ sung âm Hán Việt và tạo câu ví dụ JLPT.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAiEnrich(true)}
                      disabled={isAiEnriching}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-97"
                    >
                      {isAiEnriching ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                      <span>AI Dịch {englishItemCount} từ tiếng Anh</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Thanh tiến độ AI (Batch Progress) */}
              {isAiEnriching && aiProgress && (
                <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-bold flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-indigo-400" />
                      Đang xử lý phân tích AI & Dịch thuật: {aiProgress.current} / {aiProgress.total} từ vựng
                    </span>
                    <span className="text-indigo-400 font-mono font-black">{aiProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${aiProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Thanh lọc & tìm kiếm trong bảng xem trước */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={previewFilter}
                    onChange={(e) => setPreviewFilter(e.target.value)}
                    placeholder="Lọc nhanh từ tiếng Nhật hoặc nghĩa..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  Đã chọn: <strong className="text-white">{parsedItems.filter((i) => i.selected).length}</strong> / {parsedItems.length} từ
                </div>
              </div>

              {/* Bảng dữ liệu có thể sửa trực tiếp (Inline Edit) */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-3xs sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={parsedItems.every((i) => i.selected)}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="w-3.5 h-3.5 rounded-xs"
                        />
                      </th>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 min-w-[130px]">Từ / Kanji</th>
                      <th className="p-3 min-w-[120px]">Furigana</th>
                      <th className="p-3 min-w-[110px]">Âm Hán Việt</th>
                      <th className="p-3 min-w-[110px]">Romaji</th>
                      <th className="p-3 min-w-[200px]">Định nghĩa / Ý nghĩa</th>
                      <th className="p-3 min-w-[240px]">Câu ví dụ & Dịch</th>
                      <th className="p-3 w-28">Loại từ</th>
                      <th className="p-3 w-20">Cấp độ</th>
                      <th className="p-3 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                    {filteredPreview.map((item, idx) => {
                      const typeConfig = WORD_TYPE_LABELS[item.wordType] || WORD_TYPE_LABELS.noun;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            !item.selected ? "opacity-40" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "selected", e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded-xs"
                            />
                          </td>
                          <td className="p-3 text-center text-slate-500 text-3xs">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.kanji}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "kanji", e.target.value)
                              }
                              title={
                                /[\s\t]+/.test(item.kanji.trim())
                                  ? "Từ dính cả Kana và Kanji - Hãy bấm 'Chuẩn hóa nhanh' hoặc 'AI Hoàn thiện' để tách riêng"
                                  : undefined
                              }
                              className={`w-full bg-slate-950/80 border rounded px-2 py-1 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none ${
                                /[\s\t]+/.test(item.kanji.trim())
                                  ? "border-amber-500/70 bg-amber-950/20 text-amber-200"
                                  : "border-slate-800"
                              }`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.furigana}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "furigana", e.target.value)
                              }
                              placeholder={
                                containsKanji(item.kanji) && !item.furigana?.trim()
                                  ? "Cần Furigana"
                                  : "Furigana"
                              }
                              className={`w-full bg-slate-950/80 border rounded px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none ${
                                containsKanji(item.kanji) && !item.furigana?.trim()
                                  ? "border-rose-500/60 bg-rose-950/20 placeholder:text-rose-400/70"
                                  : "border-slate-800"
                              }`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.sinoVietnamese || ""}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "sinoVietnamese", e.target.value)
                              }
                              placeholder={
                                containsKanji(item.kanji) && !item.sinoVietnamese?.trim()
                                  ? "Cần Hán Việt"
                                  : "Âm Hán Việt"
                              }
                              className={`w-full bg-slate-950/80 border rounded px-2 py-1 text-2xs text-amber-300 font-bold focus:border-indigo-500 focus:outline-none ${
                                containsKanji(item.kanji) && !item.sinoVietnamese?.trim()
                                  ? "border-amber-500/60 bg-amber-950/20 placeholder:text-amber-400/70"
                                  : "border-slate-800"
                              }`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.romaji}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "romaji", e.target.value)
                              }
                              placeholder={!item.romaji?.trim() ? "Cần Romaji" : "Romaji"}
                              className={`w-full bg-slate-950/80 border rounded px-2 py-1 text-2xs text-slate-400 focus:border-indigo-500 focus:outline-none ${
                                !item.romaji?.trim() ||
                                /[぀-ヿ]/.test(item.romaji) ||
                                /^[a-z]\s+[a-z]/.test(item.romaji.trim())
                                  ? "border-orange-500/60 bg-orange-950/20 text-orange-200 placeholder:text-orange-400/70"
                                  : "border-slate-800"
                              }`}
                            />
                          </td>
                          <td className="p-2 font-sans">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={item.meaning}
                                onChange={(e) =>
                                  handleUpdateParsedItem(item.id, "meaning", e.target.value)
                                }
                                className={`w-full bg-slate-950/80 border rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none ${
                                  isEnglishText(item.meaning)
                                    ? "border-amber-500/50 bg-amber-950/20 text-amber-200"
                                    : "border-slate-800"
                                }`}
                              />
                              {isEnglishText(item.meaning) && (
                                <span
                                  className="shrink-0 px-1.5 py-0.5 rounded text-3xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  title="Định nghĩa tiếng Anh từ Quizlet - Nhấn 'Dịch từ tiếng Anh' để chuyển sang tiếng Việt"
                                >
                                  EN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 space-y-1">
                            <input
                              type="text"
                              value={item.exampleSentence || ""}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "exampleSentence", e.target.value)
                              }
                              placeholder="Câu ví dụ tiếng Nhật"
                              className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-2xs text-slate-200 focus:border-indigo-500 focus:outline-none font-sans"
                            />
                            <input
                              type="text"
                              value={item.exampleTranslation || ""}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "exampleTranslation", e.target.value)
                              }
                              placeholder="Dịch nghĩa câu ví dụ"
                              className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-2xs text-emerald-400 focus:border-indigo-500 focus:outline-none font-sans"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.wordType}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "wordType", e.target.value)
                              }
                              className={`w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-2xs font-bold focus:border-indigo-500 focus:outline-none cursor-pointer ${typeConfig.color}`}
                            >
                              <option value="verb">Động từ (Verb)</option>
                              <option value="noun">Danh từ (Noun)</option>
                              <option value="adjective">Tính từ (Adj)</option>
                              <option value="adverb">Phó từ (Adv)</option>
                              <option value="phrase">Cụm từ (Phrase)</option>
                              <option value="other">Khác</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={item.level}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, "level", e.target.value)
                              }
                              className="w-full bg-slate-950/80 border border-slate-800 rounded px-1.5 py-1 text-2xs font-bold text-slate-300 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="N5">N5</option>
                              <option value="N4">N4</option>
                              <option value="N3">N3</option>
                              <option value="N2">N2</option>
                              <option value="N1">N1</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteParsedItem(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Nút Xác nhận Import lớn */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Sẵn sàng nhập <strong className="text-white">{parsedItems.filter((i) => i.selected).length}</strong> từ vựng vào{" "}
                  <strong className="text-indigo-400">
                    {targetType === "system" ? "Kho Từ vựng Chung JTalk" : "Bài học đã chọn"}
                  </strong>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (parsedItems.length < 2) {
                        toast.error("Cần ít nhất 2 từ vựng để tạo bài kiểm tra.");
                        return;
                      }
                      setIsQuizPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <FlaskConical size={15} />
                    <span>Làm thử bài kiểm tra ({Math.min(quizQuestionCountSetting, parsedItems.length)} câu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isSubmittingImport}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 active:scale-97 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingImport ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    <span>XÁC NHẬN NHẬP VÀO KHO TỪ VỰNG</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DANH SÁCH KHO TỪ VỰNG HỆ THỐNG */}
      {/* ========================================================================= */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Thanh công cụ: Search, Filter, Actions */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadVocabList(1)}
                  placeholder="Tìm từ Kanji, Furigana, Romaji hoặc nghĩa..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => loadVocabList(1)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tìm
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc Level */}
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Tất cả cấp độ ({vocabStats.total})</option>
                <option value="N5">N5 ({vocabStats.N5})</option>
                <option value="N4">N4 ({vocabStats.N4})</option>
                <option value="N3">N3 ({vocabStats.N3})</option>
                <option value="N2">N2 ({vocabStats.N2})</option>
                <option value="N1">N1 ({vocabStats.N1})</option>
              </select>

              {/* Nút Thêm mới */}
              <button
                type="button"
                onClick={() => handleOpenEditModal()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm từ</span>
              </button>

              {/* Nút Xuất CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Xuất danh sách ra file CSV"
              >
                <Download size={14} />
                <span>Xuất CSV</span>
              </button>

              {/* Nút Xóa theo bộ (Khi chọn Level cụ thể) */}
              {selectedLevelFilter !== "all" && (
                <button
                  type="button"
                  onClick={handleDeleteByLevel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title={`Xóa toàn bộ từ vựng cấp độ ${selectedLevelFilter}`}
                >
                  <Trash2 size={13} />
                  <span>Xóa hết {selectedLevelFilter}</span>
                </button>
              )}

              {/* Nút Reset toàn bộ kho */}
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Xóa toàn bộ từ vựng trong kho để nạp mới lại từ đầu"
              >
                <Trash2 size={13} />
                <span>Reset kho từ</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách từ vựng trong cơ sở dữ liệu */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            {isLoadingList ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <LoadingSpinner size="lg" />
                <span className="text-xs text-slate-400">Đang tải danh sách từ vựng...</span>
              </div>
            ) : vocabList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <BookMarked size={40} className="mx-auto text-slate-600" />
                <div className="text-sm font-bold text-slate-300">Chưa có từ vựng nào trong kho!</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy chuyển sang tab "Nhập từ vựng mới" để nạp 829 từ vựng N5 vào hệ thống.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("import")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Nhập ngay từ vựng
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-3xs border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 w-14 text-center">STT</th>
                      <th className="p-3.5 min-w-[150px]">Từ tiếng Nhật / Kanji</th>
                      <th className="p-3.5 min-w-[120px]">Âm Hán Việt</th>
                      <th className="p-3.5 min-w-[110px]">Romaji</th>
                      <th className="p-3.5 min-w-[200px]">Nghĩa tiếng Việt</th>
                      <th className="p-3.5 min-w-[240px]">Ví dụ & Dịch</th>
                      <th className="p-3.5 w-28">Loại từ</th>
                      <th className="p-3.5 w-24">Cấp độ</th>
                      <th className="p-3.5 w-20 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {vocabList.map((item, idx) => {
                      const levelStyle = LEVEL_COLORS[item.level] || LEVEL_COLORS.N5;
                      const typeConfig = WORD_TYPE_LABELS[item.wordType] || WORD_TYPE_LABELS.noun;
                      return (
                        <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 text-center text-slate-500 text-3xs font-mono">
                            {(page - 1) * 25 + idx + 1}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-base text-white tracking-wide">
                              {item.kanji}
                            </div>
                            {item.furigana && item.furigana !== item.kanji && (
                              <div className="text-2xs text-indigo-400 font-mono mt-0.5">
                                {item.furigana}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.sinoVietnamese ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                {item.sinoVietnamese}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-3xs font-mono">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-xs">
                            {item.romaji || "—"}
                          </td>
                          <td className="p-3.5 text-slate-200 font-medium">{item.meaning}</td>
                          <td className="p-3.5">
                            {item.exampleSentence ? (
                              <div className="space-y-1">
                                <div className="text-xs text-slate-200 font-medium">
                                  {item.exampleSentence}
                                </div>
                                {item.exampleTranslation && (
                                  <div className="text-2xs text-emerald-400/90 font-medium">
                                    {item.exampleTranslation}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-3xs italic">Chưa có ví dụ</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-3xs font-bold border ${typeConfig.color}`}
                            >
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-3xs font-extrabold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                            >
                              {item.level}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 cursor-pointer transition-colors"
                                title="Chỉnh sửa từ này"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWord(item._id, item.kanji)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                title="Xóa từ này"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Hiển thị {(page - 1) * 25 + 1} - {Math.min(page * 25, totalCount)} trên tổng số {totalCount} từ
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => loadVocabList(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1.5 font-bold text-white">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadVocabList(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / CHỈNH SỬA TỪ VỰNG THỦ CÔNG */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingWord._id ? "Chỉnh sửa từ vựng" : "Thêm từ vựng vào kho"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1">
                  Từ tiếng Nhật / Kanji <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingWord.kanji || ""}
                  onChange={(e) => setEditingWord({ ...editingWord, kanji: e.target.value })}
                  placeholder="VD: 食べる hoặc こんにちは"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">
                    Furigana (Cách đọc Hiragana)
                  </label>
                  <input
                    type="text"
                    value={editingWord.furigana || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, furigana: e.target.value })}
                    placeholder="VD: たべる"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">
                    Âm Hán Việt
                  </label>
                  <input
                    type="text"
                    value={editingWord.sinoVietnamese || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, sinoVietnamese: e.target.value })}
                    placeholder="VD: THỰC (cho 食べる)"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-amber-300 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">Romaji</label>
                  <input
                    type="text"
                    value={editingWord.romaji || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, romaji: e.target.value })}
                    placeholder="VD: taberu"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">Loại từ</label>
                  <select
                    value={editingWord.wordType || "noun"}
                    onChange={(e) => setEditingWord({ ...editingWord, wordType: e.target.value as any })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="verb">Động từ (Verb)</option>
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="adjective">Tính từ (Adj)</option>
                    <option value="adverb">Phó từ (Adv)</option>
                    <option value="phrase">Cụm từ (Phrase)</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1">
                  Định nghĩa / Ý nghĩa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingWord.meaning || ""}
                  onChange={(e) => setEditingWord({ ...editingWord, meaning: e.target.value })}
                  placeholder="VD: Ăn (cơm, bánh mì...)"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1">Cấp độ</label>
                <select
                  value={editingWord.level || "N5"}
                  onChange={(e) => setEditingWord({ ...editingWord, level: e.target.value as any })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              {/* Ví dụ & dịch nghĩa */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">
                    Câu ví dụ tiếng Nhật (JLPT)
                  </label>
                  <input
                    type="text"
                    value={editingWord.exampleSentence || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleSentence: e.target.value })}
                    placeholder="VD: 毎朝パンを食べます。"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">
                    Furigana câu ví dụ (Hiragana)
                  </label>
                  <input
                    type="text"
                    value={editingWord.exampleFurigana || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleFurigana: e.target.value })}
                    placeholder="VD: まいあさパンをたべます。"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-400 mb-1">
                    Dịch nghĩa câu ví dụ (Tiếng Việt)
                  </label>
                  <input
                    type="text"
                    value={editingWord.exampleTranslation || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleTranslation: e.target.value })}
                    placeholder="VD: Mỗi sáng tôi đều ăn bánh mì."
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveWord}
                disabled={isSavingWord}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingWord && <Loader2 size={13} className="animate-spin" />}
                <span>Lưu vào kho</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN RESET TOÀN BỘ KHO TỪ VỰNG */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white">
                Xác nhận Reset toàn bộ kho từ vựng?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hành động này sẽ <strong className="text-rose-400">xóa sạch vĩnh viễn toàn bộ từ vựng</strong> trong kho từ vựng chung của hệ thống (hiện có <strong className="text-white">{vocabStats.total}</strong> từ). Sau khi xóa, bạn có thể nạp lại file từ vựng mới với dữ liệu chuẩn.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetAllVocabularies}
                disabled={isResetting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isResetting && <Loader2 size={14} className="animate-spin" />}
                <span>Xóa sạch ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LÀM THỬ BÀI KIỂM TRA TRẮC NGHIỆM CHO ADMIN (PREVIEW QUIZ) */}
      {/* ========================================================================= */}
      {isQuizPreviewOpen && (
        <VocabularyQuizModal
          isOpen={isQuizPreviewOpen}
          onClose={() => setIsQuizPreviewOpen(false)}
          vocabList={parsedItems}
          title="🧪 Làm thử bài kiểm tra từ File CSV (Admin Preview)"
          defaultQuestionCount={quizQuestionCountSetting}
          onSaveWrongWordsToNotebook={async (wrongWords) => {
            toast.info(
              `Chế độ xem trước Admin: Có ${wrongWords.length} câu trả lời chưa chính xác trong đợt làm thử.`
            );
          }}
        />
      )}
    </div>
  );
}
