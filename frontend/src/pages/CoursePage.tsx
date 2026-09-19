import CourseCard from "@/components/course/CourseCard";

export const courses = [
  {
    id: 1,
    language: "Japanese",
    title: "Bài 1 - Giới thiệu bản thân",
    description:
      "Luyện các mẫu câu chào hỏi, giới thiệu tên, quốc tịch, nghề nghiệp và giao tiếp lần đầu gặp.",
    lessons: 2,
    topics: 1,
  },
  {
    id: 2,
    language: "Japanese",
    title: "Bài 2 - Mua sắm",
    description:
      "Học cách hỏi giá, thanh toán, mua hàng và giao tiếp trong cửa hàng bằng tiếng Nhật.",
    lessons: 2,
    topics: 1,
  },
  {
    id: 3,
    language: "Japanese",
    title: "Bài 3 - Gia đình",
    description:
      "Làm quen với từ vựng về gia đình và cách giới thiệu các thành viên trong gia đình.",
    lessons: 2,
    topics: 1,
  },
  {
    id: 4,
    language: "Japanese",
    title: "Bài 4 - Trường học",
    description:
      "Học từ vựng về trường học, lớp học và các mẫu hội thoại giữa giáo viên và học sinh.",
    lessons: 2,
    topics: 1,
  },
];

const CoursePage = () => {
  return (
    <div className="flex-1 p-8 overflow-auto">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Khóa học
        </h1>

        <p className="text-muted-foreground mt-2">
          Chọn khóa học và bắt đầu hành trình học ngoại ngữ của bạn
        </p>
      </div>

      {/* Filter */}


      {/* Courses */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            {...course}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursePage;