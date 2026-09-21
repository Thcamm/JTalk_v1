export type UserRole = "user" | "admin";
export type SubscriptionTier = "free" | "premium";

export interface UserProfile {
  targetLevel?: "N5" | "N4" | "N3" | "N2" | "N1";
  goal?: "daily_conversation" | "interview" | "business" | "travel";
  occupation?: "student" | "working" | "other";
  dailyTargetMinutes?: number;
}

export interface UserGamification {
  streak: number;
  longestStreak: number;
  lastActiveDate?: string;
  totalXp: number;
  level: number;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt?: string | null;
  subscriptionId?: string;
}

export interface UserDailyUsage {
  date?: string;
  practiceCount: number;
  minutesSpent: number;
}

export interface UserReferral {
  referralCode?: string;
  referredBy?: string | null;
  successfulInvites: number;
  bonusDaysEarned: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role?: UserRole;
  profile?: UserProfile;
  gamification?: UserGamification;
  subscription?: UserSubscription;
  dailyUsage?: UserDailyUsage;
  quota?: {
    isUnlimited?: boolean;
    limit?: number | string;
    usedToday?: number;
    remaining?: number | string;
  };
  referral?: UserReferral;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
  dailyPracticeCount: number;
  incrementDailyPracticeCount: () => void;
  updateUserGamification: (gamification: Partial<UserGamification>) => void;
  updateUserDailyUsage: (usage: Partial<UserDailyUsage>) => void;
  updateUserSubscription: (subscription: Partial<UserSubscription>) => void;
}

export type PracticeStatus = "pending" | "processing" | "completed" | "failed";

export interface WordFeedback {
  word: string;
  isCorrect: boolean; // Xanh (true) / Đỏ (false)
  accuracyScore?: number;
  errorType?: "none" | "mispronunciation" | "omission" | "insertion" | "grammar";
  suggestion?: string;
}

export interface PracticeScores {
  pronunciation: number;
  accuracy: number;
  fluency: number;
  completeness: number;
}

export interface PracticeFeedback {
  grammarSuggestions?: string[];
  generalAdvice?: string;
}

export interface Practice {
  _id: string;
  userId: string;
  lessonId: string | Lesson;
  sampleSentence: string;
  durationSeconds?: number;
  audioUrl?: string;
  transcript?: string;
  score?: number;
  overallScore?: number;
  scores?: PracticeScores;
  wordFeedback?: WordFeedback[];
  feedback?: PracticeFeedback;
  status: PracticeStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  level: string;
  category?: string;
  thumbnail?: string;
  channelName?: string;
  totalLessons?: number;
  isPublished: boolean;
  isPremiumOnly: boolean;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubtitleWord {
  kanji: string;
  furigana?: string;
  romaji?: string;
  meaning?: string;
}

export interface VideoSubtitle {
  startTime: number; // in seconds
  endTime: number;   // in seconds
  japanese: string;
  furigana?: string;
  romaji?: string;
  translation: string;
  words?: SubtitleWord[];
}

export interface Topic {
  _id: string;
  courseId?: string | Course;
  name: string;
  description?: string;
  level: string;
  image?: string;
  category?: string;
  isPremiumOnly?: boolean;
  isPublished: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dialogue {
  order: number;
  sceneIndex?: number;
  sceneImage?: string;
  speaker: "ai" | "user";
  japanese: string;
  romaji?: string;
  furigana?: string;
  translation: string;
  audioUrl?: string;
  expectedAnswer?: string;
  hints?: string[];
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  kanji?: string;
  romaji?: string;
}

export interface Lesson {
  _id: string;
  topicId: string | Topic;
  title: string;
  description?: string;
  level: string;
  sampleSentence?: string;
  translation?: string;
  image?: string;
  youtubeId?: string;
  videoUrl?: string;
  channelName?: string;
  subtitles?: VideoSubtitle[];
  duration?: string;
  durationMinutes?: number;
  isPremiumOnly?: boolean;
  isPublished: boolean;
  dialogues?: Dialogue[];
  vocabularyList?: VocabularyItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  planType: "monthly_99k" | "yearly_899k" | "referral_reward_7d";
  price: number;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderCode: string;
  userId: string;
  amount: number;
  paymentMethod: "momo" | "vnpay";
  status: "pending" | "completed" | "failed" | "cancelled";
  transactionId?: string;
  payUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyLog {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  minutesSpent: number;
  xpEarned: number;
  lessonsCompleted: number;
  practiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessVoiceResponse {
  audioUrl?: string;
  transcript: string;
  targetSentence: string;
  scores: PracticeScores;
  overallScore: number;
  wordFeedback: WordFeedback[];
  feedback: PracticeFeedback;
}

export interface SavePracticeResponse {
  practice: Practice;
  gamification: {
    streak: number;
    longestStreak: number;
    xpEarned: number;
    isStreakIncremented: boolean;
  };
  quota?: {
    remaining?: number;
    usedToday?: number;
  };
}

export interface CreatePaymentResponse {
  order: Order;
  payUrl?: string;
  qrCodeUrl?: string;
  message?: string;
}

export interface RoleplaySuggestedAnswer {
  japanese: string;
  furigana?: string;
  romaji?: string;
  translation?: string;
}

export interface RoleplayMessage {
  id: string;
  sender: "ai" | "user";
  japanese: string;
  furigana?: string;
  romaji?: string;
  translation?: string;
  timestamp?: string;
  evaluation?: {
    naturalnessScore?: number;
    grammarAdvice?: string;
    betterExpression?: string;
    betterExpressionFurigana?: string;
  };
  suggestedAnswers?: (string | RoleplaySuggestedAnswer)[];
}

export interface RoleplayChatResponse {
  aiReply: {
    japanese: string;
    furigana?: string;
    romaji?: string;
    translation?: string;
  };
  userEvaluation?: {
    naturalnessScore?: number;
    grammarAdvice?: string;
    betterExpression?: string;
    betterExpressionFurigana?: string;
  };
  suggestedAnswers?: (string | RoleplaySuggestedAnswer)[];
}


