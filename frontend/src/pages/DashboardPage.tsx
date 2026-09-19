import {
  Flame,
  Clock3,
  Target,
  Mic,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  dashboardStats,
  weeklyStudy,
} from "@/data/progress";

import { useAuthStore } from "@/stores/useAuthStore";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const tasks = [
    {
      id: 1,
      title: "Word Practice",
      subtitle: "Practice 10 Japanese words",
      icon: <BookOpen size={20} />,
      completed: 6,
      total: 10,
    },
    {
      id: 2,
      title: "Sentence Practice",
      subtitle: "Practice 5 sentences",
      icon: <Mic size={20} />,
      completed: 1,
      total: 5,
    },
    {
      id: 3,
      title: "Dialogue Practice",
      subtitle: "Talk with AI teacher",
      icon: <MessageCircle size={20} />,
      completed: 0,
      total: 3,
    },
  ];

  const completedPercent = Math.round(
    (dashboardStats.goalCompleted /
      dashboardStats.goalTotal) *
      100
  );

  return (
    <div className="space-y-6">

      {/* Welcome */}

      <Card className="border-0 bg-pink-50">
        <CardContent className="p-8">
          <span className="inline-block rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-pink-600">
            Japanese Speaking Dashboard
          </span>

          <h1 className="mt-4 text-4xl font-bold">
            Xin chào {user?.displayName || user?.username || "bạn"} 👋
          </h1>

          <p className="mt-2 text-muted-foreground">
            Bạn đã học{" "}
            <span className="font-semibold text-pink-600">
              {dashboardStats.todayMinutes} phút
            </span>{" "}
            hôm nay.
            Hãy tiếp tục để duy trì chuỗi{" "}
            <span className="font-semibold text-pink-600">
              {dashboardStats.streak} ngày
            </span>
            .
          </p>
        </CardContent>
      </Card>

      {/* Stats */}

      <div className="grid gap-4 md:grid-cols-3">

        <Card>
          <CardContent className="flex items-center gap-4 p-6">

            <div className="flex size-12 items-center justify-center rounded-xl bg-pink-100">
              <Clock3 className="text-pink-600" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Hôm nay
              </p>

              <h3 className="text-2xl font-bold">
                {dashboardStats.todayMinutes} phút
              </h3>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">

            <div className="flex size-12 items-center justify-center rounded-xl bg-pink-100">
              <Flame className="text-pink-500" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Chuỗi học
              </p>

              <h3 className="text-2xl font-bold">
                {dashboardStats.streak} ngày
              </h3>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">

            <div className="flex size-12 items-center justify-center rounded-xl bg-pink-100">
              <Target className="text-pink-600" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Mục tiêu hôm nay
              </p>

              <h3 className="text-2xl font-bold">
                {completedPercent}%
              </h3>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Learning History */}

      <Card>
        <CardContent className="p-6">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-xl font-bold">
              Learning History
            </h2>

            <span className="font-semibold text-pink-500">
              🔥 {dashboardStats.streak} day streak
            </span>

          </div>

          <div className="grid grid-cols-7 gap-4">

            {weeklyStudy.map((item) => (
              <div
                key={item.day}
                className="rounded-xl border bg-pink-50 p-4 text-center transition hover:bg-pink-100"
              >
                <h4 className="font-semibold">
                  {item.day}
                </h4>

                <p className="mt-2 text-2xl font-bold text-pink-600">
                  {item.minutes}
                </p>

                <p className="text-xs text-muted-foreground">
                  phút
                </p>
              </div>
            ))}

          </div>

        </CardContent>
      </Card>

      {/* Today's Tasks */}

      <Card>

        <CardContent className="p-6">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-xl font-bold">
              Today's Tasks
            </h2>

            <span className="font-semibold text-pink-600">
              {completedPercent}% Completed
            </span>

          </div>

          <div className="space-y-4">

            {tasks.map((task) => {

              const percent =
                (task.completed / task.total) * 100;

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border p-5 transition hover:bg-pink-50"
                >
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex size-12 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                        {task.icon}
                      </div>

                      <div>

                        <h3 className="font-semibold">
                          {task.title}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {task.subtitle}
                        </p>

                        <div className="mt-3 h-2 w-60 rounded-full bg-pink-100">
                          <div
                            className="h-2 rounded-full bg-pink-500"
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </div>

                      </div>

                    </div>

                    <div className="flex items-center gap-4">

                      <span className="font-medium text-muted-foreground">
                        {task.completed}/{task.total}
                      </span>

                      <Button
                        className="bg-pink-500 hover:bg-pink-600"
                        onClick={() =>
                          navigate(`/speaking/${task.id}`)
                        }
                      >
                        Start
                      </Button>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>

        </CardContent>

      </Card>

    </div>
  );
};

export default DashboardPage;