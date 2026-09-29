import { useState } from "react";
import { Volume2 } from "lucide-react";

import { lesson1 } from "@/data/speaking";
import PremiumModal from "@/components/course/PremiumModal";

export default function SpeakingCourse() {
    const [currentScene, setCurrentScene] =
        useState(0);

    const [currentSentence, setCurrentSentence] =
        useState(0);

    const [showPremium, setShowPremium] =
        useState(false);

    const currentSceneData =
        lesson1[currentScene];

    const currentText =
        currentSceneData.dialogues[
        currentSentence
        ];

    // tổng số câu của toàn bộ bài
    const totalSentences =
        lesson1.reduce(
            (sum, scene) =>
                sum + scene.dialogues.length,
            0
        );

    // câu hiện tại trên toàn bộ khóa
    const completedCount =
        lesson1
            .slice(0, currentScene)
            .reduce(
                (sum, scene) =>
                    sum + scene.dialogues.length,
                0
            ) + currentSentence;

    const progress =
        (completedCount /
            totalSentences) *
        100;

    const speakJapanese = () => {
        const utterance =
            new SpeechSynthesisUtterance(
                currentText
            );

        utterance.lang = "ja-JP";
        utterance.rate = 0.85;
        utterance.pitch = 1;

        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    };

    const nextSentence = () => {
        // còn câu trong tranh hiện tại
        if (
            currentSentence <
            currentSceneData.dialogues.length - 1
        ) {
            setCurrentSentence(
                currentSentence + 1
            );
            return;
        }

        // sang tranh tiếp theo
        if (
            currentScene <
            lesson1.length - 1
        ) {
            setCurrentScene(
                currentScene + 1
            );
            setCurrentSentence(0);
        }
    };

    const prevSentence = () => {
        if (currentSentence > 0) {
            setCurrentSentence(
                currentSentence - 1
            );
            return;
        }

        if (currentScene > 0) {
            const prevScene =
                lesson1[currentScene - 1];

            setCurrentScene(
                currentScene - 1
            );

            setCurrentSentence(
                prevScene.dialogues.length - 1
            );
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="grid grid-cols-12 gap-6">

                {/* LEFT */}

                <div className="col-span-7">

                    <div className="bg-card rounded-3xl border border-border shadow-soft">
                        <img
                            src={currentSceneData.image}
                            alt=""
                            className="
                w-full
                h-[390px]
                object-contain
                bg-white
              "
                        />
                    </div>

                    <div className="flex gap-3 mt-4">

                        <button
                            className="
                border
                rounded-xl
                px-6 py-3
                bg-white
              "
                        >
                            Ẩn ảnh
                        </button>

                        <button
                            onClick={speakJapanese}
                            className="
                flex items-center gap-2
                rounded-xl
                px-6 py-3
                bg-primary text-primary-foreground
              "
                        >
                            <Volume2 size={18} />
                            Nghe mẫu
                        </button>

                    </div>

                    <div className="bg-card border border-border rounded-3xl shadow-soft mt-5 p-5">

                        <div className="flex justify-between mb-4">

                            <span className="font-semibold">
                                Đã hoàn thành{" "}
                                {completedCount} /{" "}
                                {totalSentences}
                            </span>

                            <span>
                                {Math.round(progress)}%
                            </span>

                        </div>

                        <div className="h-3 bg-secondary rounded-full rounded-full">

                            <div
                                className="
                  h-3
                  bg-primary
                  rounded-full
                "
                                style={{
                                    width: `${progress}%`,
                                }}
                            />

                        </div>

                    </div>

                </div>

                {/* RIGHT */}

                <div className="col-span-5">

                    <h2 className="font-bold text-3xl mb-4">
                        Luyện phát âm
                    </h2>

                    {/* Danh sách câu trong tranh */}

                    <div className="flex gap-3 mb-4 overflow-x-auto">

                        {currentSceneData.dialogues.map(
                            (_, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        setCurrentSentence(
                                            index
                                        )
                                    }
                                    className={`
                    min-w-[90px]
                    h-12
                    rounded-xl
                    ${currentSentence ===
                                            index
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-secondary-foreground"
                                        }
                  `}
                                >
                                    Câu {index + 1}
                                </button>
                            )
                        )}

                    </div>

                    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">

                        <div className="flex justify-between">

                            <h3 className="font-bold">
                                CÂU HIỆN TẠI
                            </h3>

                        </div>

                        <p className="text-5xl mt-8">
                            {currentText}
                        </p>

                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-5">

                        <button
                            onClick={speakJapanese}
                            className="
                border
                rounded-2xl
                bg-white
              "
                        >
                            Phát lại
                        </button>

                        <button
                            onClick={() =>
                                setShowPremium(true)
                            }
                            className="
                h-12
                rounded-xl
                bg-primary text-primary-foreground shadow-soft
              "
                        >
                            Kiểm tra phát âm
                        </button>

                        <button
                            onClick={prevSentence}
                            className="
                border
                rounded-2xl
                bg-white
              "
                        >
                            Trước
                        </button>

                    </div>

                    <button
                        onClick={nextSentence}
                        className="w-full
              h-12
              mt-4
              rounded-2xl
              bg-secondary
text-secondary-foreground
border border-border
              
            "
                    >
                        Tiếp
                    </button>

                    <div className="grid grid-cols-2 gap-4 mt-5">
                        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                            <p>Điểm phát âm</p>
                            <p className="text-primary text-3xl font-bold">
                                0.0
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                            <p>Độ chính xác</p>
                            <p className="text-primary text-3xl font-bold">
                                0.0
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                            <p>Độ trôi chảy</p>
                            <p className="text-primary text-3xl font-bold">
                                0.0
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                            <p>Độ hoàn thiện</p>
                            <p className="text-primary text-3xl font-bold">
                                0.0
                            </p>
                        </div>

                    </div>

                </div>

            </div>

            <PremiumModal
                open={showPremium}
                onClose={() =>
                    setShowPremium(false)
                }
            />
        </div>
    );
}