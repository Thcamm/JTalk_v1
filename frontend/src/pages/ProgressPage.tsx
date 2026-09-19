import StatCard from "@/components/progress/StatCard";
import CourseProgressCard from "@/components/progress/CourseProgressCard";
import ActivityItem from "@/components/progress/ActivityItem";
import AchievementCard from "@/components/progress/AchievementCard";
import WeeklyChart from "@/components/progress/WeeklyChart";

import {
  overviewStats,
  courseProgress,
  weeklyStudy,
  activities,
  achievements,
} from "@/data/progress";

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          Tiến trình học tập
        </h1>

        <p className="mt-2 text-muted-foreground">
          Theo dõi quá trình học tiếng Nhật
          của bạn
        </p>
      </div>

      {/* Stats */}
      <section className="mt-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              color={item.color}
            />
          ))}
        </div>
      </section>

      {/* Weekly Chart */}
      <section className="mt-10">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Thời gian học 7 ngày gần nhất
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Số phút học mỗi ngày
          </p>

          <div className="mt-6">
            <WeeklyChart
              data={weeklyStudy}
            />
          </div>
        </div>
      </section>

      {/* Course Progress */}
      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold">
          Tiến độ khóa học
        </h2>

        <div className="grid gap-5 lg:grid-cols-2">
          {courseProgress.map((course) => (
            <CourseProgressCard
              key={course.id}
              title={course.title}
              lessons={course.lessons}
              completed={course.completed}
              progress={course.progress}
            />
          ))}
        </div>
      </section>

      {/* Activities + Achievements */}
      <section className="mt-10 grid gap-8 lg:grid-cols-2">

        {/* Activity */}
        <div>
          <h2 className="mb-5 text-2xl font-bold">
            Hoạt động gần đây
          </h2>

          <div className="space-y-4">
            {activities.map((item) => (
              <ActivityItem
                key={item.id}
                title={item.title}
                time={item.time}
              />
            ))}
          </div>
        </div>

        {/* Achievement */}
        <div>
          <h2 className="mb-5 text-2xl font-bold">
            Thành tích
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {achievements.map(
              (achievement) => (
                <AchievementCard
                  key={achievement.id}
                  icon={achievement.icon}
                  title={achievement.title}
                />
              )
            )}
          </div>
        </div>

      </section>
    </div>
  );
}