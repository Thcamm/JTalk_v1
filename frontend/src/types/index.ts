export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
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
}

export type PracticeStatus = "pending" | "processing" | "completed" | "failed";

export interface Practice {
  _id: string;
  userId: string;
  lessonId: string;
  sampleSentence: string;
  audioUrl?: string;
  transcript?: string;
  score?: number;
  status: PracticeStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  _id: string;
  name: string;
  description?: string;
  level: string;
  image?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  topicId: string | Topic;
  title: string;
  description?: string;
  level: string;
  sampleSentence: string;
  translation?: string;
  image?: string;
  duration?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
