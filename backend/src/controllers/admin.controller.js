import User from "../models/User.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";
import Practice from "../models/Practice.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { AiService } from "../services/ai.service.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/admin/stats
 * Overview dashboard KPIs
 */
export const getStats = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalPremiumUsers,
      totalCourses,
      totalTopics,
      totalLessons,
      totalVideoLessons,
      totalPractices,
      recentUsers,
      recentLessons,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ "subscription.tier": "premium" }),
      Course.countDocuments(),
      Topic.countDocuments(),
      Lesson.countDocuments(),
      Lesson.countDocuments({
        $or: [
          { youtubeId: { $exists: true, $ne: "" } },
          { videoUrl: { $exists: true, $ne: "" } },
        ],
      }),
      Practice.countDocuments(),
      User.find()
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Lesson.find()
        .select("title level youtubeId isPublished duration createdAt topicId")
        .populate("topicId", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return successResponse(res, {
      kpi: {
        totalUsers,
        totalAdmins,
        totalPremiumUsers,
        totalCourses,
        totalTopics,
        totalLessons,
        totalVideoLessons,
        totalPractices,
      },
      recentUsers,
      recentLessons,
    }, "Lấy số liệu thống kê thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * Paginated user list with filters & search
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, role, tier, level } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { username: regex },
        { email: regex },
        { displayName: regex },
      ];
    }

    if (role && ["user", "admin"].includes(role)) {
      filter.role = role;
    }

    if (tier && ["free", "premium"].includes(tier)) {
      filter["subscription.tier"] = tier;
    }

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      filter["profile.targetLevel"] = level;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return successResponse(res, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Lấy danh sách người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update user role (user <-> admin)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (!["user", "admin"].includes(role)) {
      return errorResponse(res, "Vai trò không hợp lệ (phải là 'user' hoặc 'admin').", 400);
    }

    // Prevent demoting oneself
    if (id === req.user._id.toString() && role !== "admin") {
      return errorResponse(res, "Bạn không thể tự hạ quyền quản trị viên của chính mình.", 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).select("-hashedPassword");

    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng.", 404);
    }

    return successResponse(res, user, `Đã cập nhật vai trò người dùng thành '${role}'!`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/subscription
 * Grant or revoke Premium access
 */
export const updateUserSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tier, durationDays } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (!["free", "premium"].includes(tier)) {
      return errorResponse(res, "Gói học không hợp lệ (phải là 'free' hoặc 'premium').", 400);
    }

    const updateData = {
      "subscription.tier": tier,
    };

    if (tier === "premium") {
      const days = parseInt(durationDays) || 30;
      updateData["subscription.expiresAt"] = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      updateData["subscription.expiresAt"] = null;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-hashedPassword");

    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng.", 404);
    }

    return successResponse(res, user, "Đã cập nhật gói học của người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user account
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (id === req.user._id.toString()) {
      return errorResponse(res, "Bạn không thể tự xóa tài khoản của chính mình.", 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng để xoá.", 404);
    }

    return successResponse(res, null, "Xoá tài khoản người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/lessons
 * Full lesson management list with populate & filters
 */
export const getAdminLessons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { search, topicId, level, isPublished, hasVideo } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { channelName: regex },
      ];
    }

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
      filter.topicId = topicId;
    }

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      filter.level = level;
    }

    if (isPublished !== undefined && isPublished !== "") {
      filter.isPublished = isPublished === "true" || isPublished === true;
    }

    if (hasVideo === "true") {
      filter.$or = [
        { youtubeId: { $exists: true, $ne: "" } },
        { videoUrl: { $exists: true, $ne: "" } },
      ];
    }

    const [lessons, total] = await Promise.all([
      Lesson.find(filter)
        .populate({
          path: "topicId",
          select: "name courseId",
          populate: { path: "courseId", select: "title" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lesson.countDocuments(filter),
    ]);

    return successResponse(res, {
      lessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Lấy danh sách bài học quản trị thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/courses
 * Course list with topics count
 */
export const getAdminCourses = async (_req, res, next) => {
  try {
    const courses = await Course.find().sort({ orderIndex: 1, createdAt: -1 }).lean();
    return successResponse(res, courses, "Lấy danh sách khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/courses
 * Create course
 */
export const createAdminCourse = async (req, res, next) => {
  try {
    const { title, description, level, thumbnail, category, channelName, isPublished, isPremiumOnly, orderIndex } = req.body;

    if (!title) {
      return errorResponse(res, "Tiêu đề khóa học là bắt buộc.", 400);
    }

    const course = await Course.create({
      title,
      description: description || "",
      level: level || "N5",
      thumbnail: thumbnail || "",
      category: category || "kaiwa",
      channelName: channelName || "",
      isPublished: isPublished !== undefined ? isPublished : true,
      isPremiumOnly: !!isPremiumOnly,
      orderIndex: orderIndex || 0,
    });

    return successResponse(res, course, "Tạo khóa học thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/courses/:id
 * Update course
 */
export const updateAdminCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Course ID không hợp lệ.", 400);
    }

    const course = await Course.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!course) {
      return errorResponse(res, "Không tìm thấy khóa học.", 404);
    }

    return successResponse(res, course, "Cập nhật khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/courses/:id
 * Delete course
 */
export const deleteAdminCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Course ID không hợp lệ.", 400);
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return errorResponse(res, "Không tìm thấy khóa học.", 404);
    }

    return successResponse(res, null, "Xoá khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/topics
 * Get topics with optional courseId filter
 */
export const getAdminTopics = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = {};
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }

    const topics = await Topic.find(filter)
      .populate("courseId", "title")
      .sort({ orderIndex: 1, createdAt: -1 })
      .lean();

    return successResponse(res, topics, "Lấy danh sách chủ đề thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/topics
 * Create topic
 */
export const createAdminTopic = async (req, res, next) => {
  try {
    const { courseId, name, description, level, image, category, isPremiumOnly, isPublished, orderIndex } = req.body;

    if (!name) {
      return errorResponse(res, "Tên chủ đề là bắt buộc.", 400);
    }

    const topic = await Topic.create({
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined,
      name,
      description: description || "",
      level: level || "N5",
      image: image || "",
      category: category || "daily",
      isPremiumOnly: !!isPremiumOnly,
      isPublished: isPublished !== undefined ? isPublished : true,
      orderIndex: orderIndex || 0,
    });

    return successResponse(res, topic, "Tạo chủ đề thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/youtube/transcript
 * Extract timed subtitles directly from a YouTube video
 */
export const getYoutubeTranscript = async (req, res, next) => {
  try {
    const { url, videoId: rawVideoId } = req.query;
    const input = url || rawVideoId;
    if (!input) {
      return errorResponse(res, "Vui lòng cung cấp URL hoặc videoId YouTube.", 400);
    }

    // Extract 11-char YouTube ID
    let videoId = String(input).trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      const match = videoId.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (match) {
        videoId = match[1];
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return errorResponse(res, "ID video YouTube không hợp lệ (cần đúng 11 ký tự).", 400);
    }

    // 1. Fetch YouTube watch page HTML
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    if (!pageRes.ok) {
      return errorResponse(res, `Không thể truy cập video YouTube (HTTP ${pageRes.status}).`, 400);
    }

    const html = await pageRes.text();

    // 2. Extract ytInitialPlayerResponse
    let playerResponse = null;
    const match =
      html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var|\n|<\/script>)/s) ||
      html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (match) {
      try {
        playerResponse = JSON.parse(match[1]);
      } catch (_) {}
    }

    let videoTitle = playerResponse?.videoDetails?.title || "";
    let channelName = playerResponse?.videoDetails?.author || "";
    let lengthSeconds = parseInt(playerResponse?.videoDetails?.lengthSeconds, 10) || 0;

    let captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    // Fallback: If watch page HTML was blocked or didn't yield captionTracks, query Innertube API
    if (!captionTracks || captionTracks.length === 0) {
      try {
        const innertubeRes = await fetch("https://www.youtube.com/youtubei/v1/player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
            "X-YouTube-Client-Name": "3",
            "X-YouTube-Client-Version": "19.09.37",
          },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                clientName: "ANDROID",
                clientVersion: "19.09.37",
                hl: "ja",
                gl: "JP",
              },
            },
          }),
        });

        if (innertubeRes.ok) {
          const innertubeData = await innertubeRes.json();
          if (!videoTitle && innertubeData?.videoDetails?.title) {
            videoTitle = innertubeData.videoDetails.title;
          }
          if (!channelName && innertubeData?.videoDetails?.author) {
            channelName = innertubeData.videoDetails.author;
          }
          if (!lengthSeconds && innertubeData?.videoDetails?.lengthSeconds) {
            lengthSeconds = parseInt(innertubeData.videoDetails.lengthSeconds, 10) || 0;
          }
          const tracks = innertubeData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (Array.isArray(tracks) && tracks.length > 0) {
            captionTracks = tracks;
          }
        }
      } catch (innerErr) {
        console.error("Innertube fallback fetch error:", innerErr.message);
      }
    }

    const durationFormatted = `${Math.floor(lengthSeconds / 60)
      .toString()
      .padStart(2, "0")}:${(lengthSeconds % 60).toString().padStart(2, "0")}`;

    if (!captionTracks || captionTracks.length === 0) {
      return errorResponse(
        res,
        "Video này không có sẵn phụ đề tự động hoặc phụ đề tiếng Nhật trên YouTube. Bạn có thể sử dụng chức năng 'Nhập file SRT / VTT' để nạp phụ đề.",
        404,
        { videoId, title: videoTitle, channelName, duration: durationFormatted }
      );
    }

    // Prefer Japanese track (native or auto), fallback to first available
    const chosenTrack =
      captionTracks.find((t) => t.languageCode === "ja" && !t.vssId?.startsWith("a.")) ||
      captionTracks.find((t) => t.languageCode === "ja") ||
      captionTracks.find((t) => t.vssId?.includes("ja")) ||
      captionTracks[0];

    let timedtextUrl = chosenTrack.baseUrl;
    if (!timedtextUrl.includes("fmt=")) {
      timedtextUrl += "&fmt=json3";
    }

    const subRes = await fetch(timedtextUrl);
    if (!subRes.ok) {
      return errorResponse(res, "Không thể tải nội dung phụ đề từ YouTube.", 502);
    }

    const rawText = await subRes.text();
    const subtitles = [];

    // Try parsing json3 format first
    try {
      const data = JSON.parse(rawText);
      if (data.events && Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (!ev.segs || ev.segs.length === 0) continue;
          const text = ev.segs
            .map((s) => s.utf8 || "")
            .join("")
            .replace(/[\n\r]+/g, " ")
            .trim();
          if (!text || text === "[音楽]" || text === "[Applause]" || text === "[Music]") {
            continue;
          }

          const startTime = +(ev.tStartMs / 1000).toFixed(2);
          const duration = +((ev.dDurationMs || 3000) / 1000).toFixed(2);
          const endTime = +(startTime + duration).toFixed(2);

          subtitles.push({
            startTime,
            endTime,
            japanese: text,
            translation: "",
          });
        }
      }
    } catch (_) {
      // Fallback XML parsing if fmt=json3 was ignored
      const xmlMatches = [
        ...rawText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g),
      ];
      for (const m of xmlMatches) {
        const startTime = parseFloat(m[1]);
        const duration = parseFloat(m[2]);
        const text = m[3]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/[\n\r]+/g, " ")
          .trim();
        if (text && text !== "[音楽]" && text !== "[Applause]" && text !== "[Music]") {
          subtitles.push({
            startTime: +startTime.toFixed(2),
            endTime: +(startTime + duration).toFixed(2),
            japanese: text,
            translation: "",
          });
        }
      }
    }

    return successResponse(
      res,
      {
        videoId,
        title: videoTitle,
        channelName,
        duration: durationFormatted,
        language: chosenTrack.name?.simpleText || chosenTrack.languageCode || "ja",
        subtitles,
      },
      `Trích xuất thành công ${subtitles.length} câu phụ đề từ YouTube!`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/subtitles/enrich
 * Automatically generate Furigana, Romaji and Vietnamese translation for Japanese subtitles using AI
 */
export const enrichSubtitlesWithAi = async (req, res, next) => {
  try {
    const { subtitles } = req.body;
    if (!Array.isArray(subtitles) || subtitles.length === 0) {
      return errorResponse(res, "Danh sách phụ đề trống.", 400);
    }

    const sentencesToTranslate = subtitles
      .map((s, idx) => ({
        index: idx,
        japanese: s.japanese || "",
      }))
      .filter((s) => s.japanese.trim().length > 0);

    if (sentencesToTranslate.length === 0) {
      return successResponse(res, subtitles, "Không có câu nào cần xử lý.");
    }

    const prompt = `You are a professional Japanese language educator and translator.
I have a list of Japanese dialogue sentences extracted from a conversation video.
For each sentence in the array, generate:
1. "furigana": The full reading in Hiragana (for example "今日は" -> "きょうは").
2. "romaji": The standard Hepburn Romaji transliteration.
3. "translation": A natural, fluent Vietnamese translation suited for conversational context.

Input sentences:
${JSON.stringify(sentencesToTranslate, null, 2)}

Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "index": number,
    "furigana": string,
    "romaji": string,
    "translation": string
  }
]`;

    let enrichedData = [];
    try {
      const aiResponseText = await AiService.callGemini({
        prompt,
        temperature: 0.2,
        isJson: true,
      });

      const parsed = JSON.parse(aiResponseText);
      enrichedData = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("AI Enrich call failed, attempting fallback:", err.message);
    }

    const enrichedMap = new Map();
    for (const item of enrichedData) {
      enrichedMap.set(item.index, item);
    }

    const result = subtitles.map((sub, idx) => {
      const match = enrichedMap.get(idx);
      if (match) {
        return {
          ...sub,
          furigana: sub.furigana || match.furigana || "",
          romaji: sub.romaji || match.romaji || "",
          translation: sub.translation || match.translation || "",
        };
      }
      return sub;
    });

    return successResponse(
      res,
      result,
      `Đã dịch và tạo Furigana/Romaji tự động cho ${enrichedData.length} câu phụ đề!`
    );
  } catch (error) {
    next(error);
  }
};
