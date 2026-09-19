import {
    ArrowLeft,
    LayoutGrid,
    PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

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
    items-center
    justify-between
    rounded-2xl
    bg-card
    border
    border-border/20
    px-6
    py-4
    mb-6
    shadow-sm
      "
        >
            {/* Left */}

            <div className="flex items-center gap-6">

                <button
                    onClick={() => navigate("/speaking")}
                    className="
            flex
            items-center
            gap-2
            text-sm
            hover:text-primary
            transition
          "
                >
                    <ArrowLeft size={18} />
                    Trở về
                </button>

                <div className="h-8 w-px bg-border" />

                <h1
                    className="
            text-4xl
            font-bold
            text-emerald-500
          "
                >
                    {title}
                </h1>

            </div>

            {/* Right */}

            <div className="flex items-center">

                <Button
                    variant="outline"
                    className="
            rounded-r-none
            border-r-0
            h-12
            px-5
          "
                >
                    <LayoutGrid
                        size={18}
                        className="mr-2"
                    />
                    Chọn kịch bản khác
                </Button>

                <Button
                    variant="outline"
                    onClick={onEndChat}
                    className="rounded-l-none h-12 px-5 text-red-500 hover:text-red-600"
                >
                    <PhoneOff
                        size={18}
                        className="mr-2"
                    />
                    Kết thúc cuộc hội thoại
                </Button>

            </div>
        </div>
    );
}