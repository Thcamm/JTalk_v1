import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // 1. Profile học viên
    profile: {
      targetLevel: {
        type: String,
        enum: ["N5", "N4", "N3", "N2", "N1"],
        default: "N5",
      },
      goal: {
        type: String,
        enum: ["daily_conversation", "interview", "business", "travel"],
        default: "daily_conversation",
      },
      occupation: {
        type: String,
        enum: ["student", "working", "other"],
        default: "student",
      },
      dailyTargetMinutes: {
        type: Number,
        default: 15,
      },
    },

    // 2. Retention & Gamification (Streak & XP)
    gamification: {
      streak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: Date,
      },
      totalXp: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
    },

    // 3. Freemium Quota & Subscription Snapshot
    subscription: {
      tier: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
      },
    },

    dailyUsage: {
      date: {
        type: String, // YYYY-MM-DD
      },
      practiceCount: {
        type: Number,
        default: 0,
      },
      minutesSpent: {
        type: Number,
        default: 0,
      },
    },

    // 4. Referral Loop (Viral)
    referral: {
      referralCode: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true,
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      successfulInvites: {
        type: Number,
        default: 0,
      },
      bonusDaysEarned: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("streak_count").get(function () {
  return this.gamification?.streak || 0;
});

const User = mongoose.model("User", userSchema);
export default User;
