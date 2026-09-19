import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import MainLayout from "./components/layout/MainLayOut";

import DashboardPage from "./pages/DashboardPage";
import SpeakingPage from "./pages/SpeakingPage";
import LessonListPage from "./pages/LessonListPage";
import SpeakingPracticePage from "./pages/SpeakingPracticePage";
import CoursePage from "./pages/CourePage";
import LessonListCoursePage from "./pages/LessonListCoursePage";
import SpeakingCourse from "./pages/SpeakingCourse";
import ProgressPage from "./pages/ProgressPage";

function App() {
  return (
    <>
      <Toaster richColors />

      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>

            <Route
              path="/"
              element={<DashboardPage />}
            />

            <Route
              path="/speaking"
              element={<SpeakingPage />}
            />

            <Route
              path="/speaking/topic/:topicId"
              element={<LessonListPage />}
            />

            <Route
              path="/speaking/practice/:lessonId"
              element={<SpeakingPracticePage />}
            />

            <Route
              path="/courses"
              element={<CoursePage />}
            />

            <Route
              path="/courses/:courseId"
              element={<LessonListCoursePage />}
            />

            <Route
              path="/courses/:courseId/lesson/:lessonId/speaking"
              element={<SpeakingCourse />}
            />

            <Route
              path="/progress"
              element={<ProgressPage />}
            />

          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;