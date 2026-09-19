import { Link } from "react-router";
import { ArrowRight, PlayCircle } from "lucide-react";

// import hero from "@/assets/hero.png";
// import japan from "@/assets/japan.png";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-purple">

            {/* ================= HEADER ================= */}

            <header className="max-w-7xl mx-auto h-20 flex items-center justify-between px-8">

                <div className="flex items-center gap-3">

                    <h1 className="text-4xl font-black text-primary">
                        JTalk
                    </h1>

                    {/* <img
            src={japan}
            className="w-9 h-9 rounded-full shadow"
          /> */}

                </div>

                <nav className="hidden lg:flex gap-10 text-muted-foreground">

                    <a href="#">Home</a>

                    <a href="#">Courses</a>

                    <a href="#">Speaking AI</a>

                    <a href="#">Vocabulary</a>

                    <a href="#">About</a>

                </nav>

                <div className="flex gap-4">

                    <Link
                        to="/login"
                        className="
              px-6
              py-3
              rounded-full
              bg-card
              shadow-soft
              font-semibold
            "
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="
              px-6
              py-3
              rounded-full
              bg-gradient-primary
              text-white
              shadow-soft
            "
                    >
                        Sign Up
                    </Link>

                </div>

            </header>

            {/* ================= HERO ================= */}

            <section className="max-w-7xl mx-auto px-10 py-24">

                <div className="grid lg:grid-cols-2 items-center gap-10">

                    {/* LEFT */}

                    <div>

                        <span className="
              inline-block
              px-4
              py-2
              rounded-full
              bg-secondary
              text-primary
              font-semibold
              mb-6
            ">
                            🇯🇵 Learn Japanese with AI
                        </span>

                        <h1 className="
              text-7xl
              font-black
              leading-tight
            ">
                            Learn Japanese
                            <br />
                            Naturally
                        </h1>

                        <p className="
              mt-8
              text-xl
              leading-9
              text-muted-foreground
              max-w-xl
            ">
                            Practice speaking Japanese with AI,
                            real conversations, vocabulary,
                            pronunciation scoring and interactive
                            lessons inspired by Minna no Nihongo.
                        </p>

                        <div className="flex gap-5 mt-10">

                            <Link
                                to="/register"
                                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  px-8
                  py-5
                  bg-gradient-primary
                  text-white
                  shadow-soft
                "
                            >
                                Start Learning

                                <ArrowRight size={20} />

                            </Link>

                            <Link
                                to="/course/speaking"
                                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  px-8
                  py-5
                  bg-card
                  border
                  shadow-soft
                "
                            >
                                <PlayCircle />

                                Demo Lesson

                            </Link>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="relative flex justify-center">

                        <div
                            className="
                absolute
                w-[420px]
                h-[420px]
                rounded-full
                bg-primary/15
                blur-3xl
              "
                        />

                        <img
                            src="/homepage/ld1.jpg"
                            alt="Hero"
                            className="w-full"
                        />

                    </div>

                </div>

            </section>

            {/* ================= FEATURES ================= */}

            <section className="max-w-7xl mx-auto px-10 pb-24">

                <div className="grid md:grid-cols-3 gap-8">

                    <div className="
            rounded-3xl
            bg-card
            p-8
            shadow-soft
          ">
                        <h3 className="text-2xl font-bold">
                            🎙 AI Speaking
                        </h3>

                        <p className="mt-3 text-muted-foreground">
                            Speak naturally with instant
                            pronunciation feedback.
                        </p>
                    </div>

                    <div className="
            rounded-3xl
            bg-card
            p-8
            shadow-soft
          ">
                        <h3 className="text-2xl font-bold">
                            📚 Minna no Nihongo
                        </h3>

                        <p className="mt-3 text-muted-foreground">
                            Learn with structured dialogues and
                            vocabulary.
                        </p>
                    </div>

                    <div className="
            rounded-3xl
            bg-card
            p-8
            shadow-soft
          ">
                        <h3 className="text-2xl font-bold">
                            🤖 AI Tutor
                        </h3>

                        <p className="mt-3 text-muted-foreground">
                            Ask questions anytime and receive
                            personalized explanations.
                        </p>
                    </div>

                </div>

            </section>

        </div>
    );
}