import {
  Bell,
  Search,
  Flame,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 h-20 px-8 flex items-center justify-between bg-card border-b border-border shadow-soft"
    >
      {/* SEARCH */}

      <div className="relative w-[420px]">
        <Search
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-muted-foreground
          "
        />

        <input
          placeholder="Tìm kiếm bài học..."
          className="
            h-12
            w-full
            rounded-2xl
            bg-muted/50
            pl-11
            pr-4
            outline-none
            border
            border-border/20
            transition-all
            focus:border-primary/40
            focus:ring-4
            focus:ring-primary/10
          "
        />
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-4">
        {/* STREAK */}

        <div
          className="
            flex
            items-center
            gap-2
            rounded-2xl
            bg-orange-50
            px-4
            py-2
          "
        >
          <Flame
            size={18}
            className="text-orange-500"
          />

          <span className="font-medium">
            12 ngày
          </span>
        </div>

        {/* NOTIFICATION */}

        <button
          className="
            relative
            h-11
            w-11
            rounded-xl
            bg-muted/50
            flex
            items-center
            justify-center
            hover:bg-muted
          "
        >
          <Bell size={20} />

          <span
            className="
              absolute
              top-2
              right-2
              h-2.5
              w-2.5
              rounded-full
              bg-red-500
            "
          />
        </button>

        {/* USER */}

        <button
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            px-2
            py-1
            hover:bg-muted/50
          "
        >
          <div
            className="
              h-11
              w-11
              rounded-full
              bg-gradient-primary
              p-[2px]
            "
          >
            <img
              src="https://i.pravatar.cc/100"
              alt=""
              className="
                h-full
                w-full
                rounded-full
                object-cover
              "
            />
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold">
              Minh Trịnh
            </p>

            <p className="text-xs text-muted-foreground">
              N5 Learner
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-muted-foreground"
          />
        </button>
      </div>
    </header>
  );
}