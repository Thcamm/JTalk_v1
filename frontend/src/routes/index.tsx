import { Route, Routes } from "react-router";

import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import SpeakingPage from "@/pages/SpeakingPage";
import LessonListPage from "@/pages/LessonListPage";
import SpeakingPracticePage from "@/pages/SpeakingPracticePage";
import CoursePage from "@/pages/CoursePage";
import LessonListCoursePage from "@/pages/LessonListCoursePage";
import SpeakingCourse from "@/pages/SpeakingCourse";
import ProgressPage from "@/pages/ProgressPage";

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
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/speaking/topic/:topicId" element={<LessonListPage />} />
          <Route path="/speaking/practice/:lessonId" element={<SpeakingPracticePage />} />
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/courses/:courseId" element={<LessonListCoursePage />} />
          <Route path="/courses/:courseId/lesson/:lessonId/speaking" element={<SpeakingCourse />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
