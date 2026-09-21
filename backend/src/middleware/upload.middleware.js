import multer from "multer";
import { errorResponse } from "../utils/apiResponse.js";

// Audio memory storage for fast streaming to STT / S3 without disk clutter
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/x-pn-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "video/webm", // Một số browser ghi âm MediaRecorder ra webm container
];

const fileFilter = (_req, file, cb) => {
  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.originalname.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Định dạng âm thanh không hợp lệ! Vui lòng upload file .mp3, .wav, .m4a, .webm hoặc .ogg"
      ),
      false
    );
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

/**
 * Express wrapper for multer to catch multer errors gracefully
 */
export const handleAudioUpload = (fieldName = "audio") => {
  return (req, res, next) => {
    const uploadSingle = uploadAudio.single(fieldName);

    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return errorResponse(res, "File ghi âm quá lớn! Kích thước tối đa là 15MB.", 400);
        }
        return errorResponse(res, `Lỗi upload file: ${err.message}`, 400);
      } else if (err) {
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};
