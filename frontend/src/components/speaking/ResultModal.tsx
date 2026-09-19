import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

type Props = {
    open: boolean;
    score: number;
    onClose: () => void;
    onRetry: () => void;
};

export default function ResultModal({
    open,
    score,
    onClose,
    onRetry,
}: Props) {
    if (!open) return null;

    return (
        <div
            className="
        fixed
        inset-0
        bg-black/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
        z-50
      "
        >
            <div
                className="
            bg-white
    rounded-3xl
    p-6
    w-full
    max-w-2xl
    max-h-[90vh]
    overflow-y-auto
    relative
    shadow-2xl
        "
            >
                {/* Close */}

                <button
                    onClick={onClose}
                    className="
            absolute
            top-4
            right-4
            p-2
            rounded-full
            hover:bg-muted
            transition
          "
                >
                    <X size={20} />
                </button>

                {/* Header */}

                <div className="text-center">
                    <h2 className="text-2xl font-bold">
                        Pronunciation Result
                    </h2>

                    <div
                        className="
              text-8xl
              font-black
              text-emerald-500
              mt-4
            "
                    >
                        {score}
                    </div>

                    <p className="mt-2 text-muted-foreground">
                        Excellent pronunciation 🎉
                    </p>
                </div>

                {/* Metrics */}

                <div className="grid grid-cols-3 gap-4 mt-8">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-muted-foreground">
                                Accuracy
                            </p>

                            <p className="text-3xl font-bold">
                                94%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-muted-foreground">
                                Fluency
                            </p>

                            <p className="text-3xl font-bold">
                                90%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-muted-foreground">
                                Completeness
                            </p>

                            <p className="text-3xl font-bold">
                                93%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Mistakes */}

                <div className="mt-8">
                    <h3 className="font-semibold text-lg mb-3">
                        Words To Improve
                    </h3>

                    <div className="space-y-3">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <p className="text-red-600 font-medium">
                                ❌ わたし
                            </p>

                            <p className="text-green-600 mt-1">
                                ✅ わたくし
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <p className="text-red-600 font-medium">
                                ❌ おねがい
                            </p>

                            <p className="text-green-600 mt-1">
                                ✅ おねがいします
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transcript */}

                <div className="mt-8">
                    <h3 className="font-semibold text-lg mb-3">
                        Transcript
                    </h3>

                    <div className="bg-muted rounded-xl p-4">
                        <p>
                            こんにちは！
                        </p>

                        <p>
                            元気です。
                        </p>

                        <p>
                            勉強します。
                        </p>
                    </div>
                </div>

                {/* AI Feedback */}

                <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                    <h3 className="font-semibold">
                        AI Feedback
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Bạn phát âm khá tự nhiên và rõ ràng.
                        Hãy chú ý hơn đến trường âm
                        và ngữ điệu ở các cụm từ dài
                        để đạt điểm cao hơn.
                    </p>
                </div>

                {/* Buttons */}

                <div className="flex gap-3 mt-8">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Close
                    </Button>

                    <Button
                        className="flex-1"
                        onClick={onRetry}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}