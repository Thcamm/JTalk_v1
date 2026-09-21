import { Route, Routes } from "react-router";

import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import SpeakingPage from "@/pages/SpeakingPage";
import LessonListPage from "@/pages/LessonListPage";
import PracticeRoomPage from "@/pages/PracticeRoomPage";
import CoursePage from "@/pages/CoursePage";
import LessonListCoursePage from "@/pages/LessonListCoursePage";
import CourseVideoStudyPage from "@/pages/CourseVideoStudyPage";
import ProfilePage from "@/pages/ProfilePage";
import ProgressPage from "@/pages/ProgressPage";
import CheckoutPage from "@/pages/CheckoutPage";
import MoMoCallbackPage from "@/pages/MoMoCallbackPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/courses/:courseId" element={<LessonListCoursePage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/speaking/topic/:topicId" element={<LessonListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/momo/callback" element={<MoMoCallbackPage />} />
        </Route>

        {/* Video Learning & Shadowing Study Room (Matching Image 8 Sambon Juku & YouTube Courses) */}
        <Route path="/courses/:courseId/lesson/:lessonId" element={<CourseVideoStudyPage />} />
        <Route path="/courses/learn/:lessonId" element={<CourseVideoStudyPage />} />
        <Route path="/learn/:lessonId" element={<CourseVideoStudyPage />} />

        {/* Focused Speaking Room (Full-screen interactive turn-based AI speaking experience) */}
        <Route path="/practice/:lessonId" element={<PracticeRoomPage />} />
        <Route path="/speaking/practice/:lessonId" element={<PracticeRoomPage />} />
        <Route path="/courses/:courseId/lesson/:lessonId/speaking" element={<PracticeRoomPage />} />
      </Route>
    </Routes>
  );
}
