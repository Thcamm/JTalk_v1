"use client";

import {
    ArrowLeft,
    LayoutGrid,
    PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@/lib/react-router-compat";

type Props = {
    title: string;
    onEndChat: () => void;
};

export default function ConversationHeader({
    title,
    onEndChat,
}: Props) {
    const navigate = useNavigate();

    return (
        <div
            className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-3
        sm:gap-4
        rounded-2xl
        bg-card
        border
        border-border/20
        px-4
        sm:px-6
        py-3
        sm:py-4
        mb-4
        sm:mb-6
        shadow-xs
        sm:shadow-sm
      "
        >
            {/* Left */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0 w-full sm:w-auto">
                <button
                    onClick={() => navigate("/speaking")}
                    className="
            flex
            items-center
            gap-1.5
            sm:gap-2
            text-xs
            sm:text-sm
            font-medium
            text-slate-600
            dark:text-slate-300
            hover:text-primary
            transition
            shrink-0
            cursor-pointer
          "
                >
                    <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>Trở về</span>
                </button>

                <div className="h-6 sm:h-8 w-px bg-border shrink-0" />

                <h1
                    className="
            text-base
            sm:text-xl
            md:text-2xl
            font-bold
            text-rose-600
            dark:text-rose-400
            truncate
            min-w-0
          "
                    title={title}
                >
                    {title}
                </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                    variant="outline"
                    className="
            flex-1
            sm:flex-none
            h-9
            sm:h-10
            px-3
            sm:px-4
            text-xs
            sm:text-sm
            rounded-xl
          "
                >
                    <LayoutGrid
                        size={16}
                        className="mr-1.5 sm:mr-2"
                    />
                    <span className="truncate">Đổi kịch bản</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={onEndChat}
                    className="
            flex-1
            sm:flex-none
            h-9
            sm:h-10
            px-3
            sm:px-4
            text-xs
            sm:text-sm
            rounded-xl
            text-red-500
            hover:text-red-600
            border-red-200
            dark:border-red-900/50
            hover:bg-red-50
            dark:hover:bg-red-950/30
          "
                >
                    <PhoneOff
                        size={16}
                        className="mr-1.5 sm:mr-2"
                    />
                    <span className="truncate">Kết thúc</span>
                </Button>
            </div>
        </div>
    );
}
