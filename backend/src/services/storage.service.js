import fs from "fs";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";

/**
 * Cloud and Local Storage Service for user audio recordings
 */
export class StorageService {
  /**
   * Uploads an audio buffer to Cloud Storage or Local Storage
   * @param {Buffer} buffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - File MIME type
   * @param {string} userId - User identifier
   * @returns {Promise<string>} Public URL of the uploaded audio
   */
  static async uploadAudio(buffer, originalName = "recording.mp3", mimeType = "audio/mpeg", userId = "guest") {
    const ext = path.extname(originalName) || ".mp3";
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(6).toString("hex");
    const filename = `practice_${userId}_${timestamp}_${randomHash}${ext}`;

    // 1. Cloudinary Provider (Priority Free Cloud Storage)
    const { cloudName, apiKey, apiSecret } = config.storage.cloudinary;
    const isCloudinaryConfigured =
      cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== "your_cloudinary_cloud_name" &&
      apiKey !== "your_cloudinary_api_key";

    if (config.storage.provider === "cloudinary" || isCloudinaryConfigured) {
      try {
        const cloudUrl = await this.uploadToCloudinary(buffer, filename, mimeType);
        if (cloudUrl) return cloudUrl;
      } catch (err) {
        console.error("Lỗi upload Cloudinary, tự động chuyển lưu tạm ổ đĩa cục bộ:", err.message);
      }
    }

    // 2. AWS S3 Provider (if credentials configured)
    if (
      config.storage.provider === "s3" &&
      config.storage.s3.bucket &&
      config.storage.s3.accessKeyId
    ) {
      try {
        return await this.uploadToS3(buffer, filename, mimeType);
      } catch (err) {
        console.error("Lỗi upload AWS S3, fallback về local:", err.message);
      }
    }

    // 3. Local disk storage (Default Development & Robust MVP fallback)
    return this.saveToLocalDisk(buffer, filename);
  }

  /**
   * Saves audio buffer to backend/uploads/audio/ and returns local URL
   */
  static saveToLocalDisk(buffer, filename) {
    const uploadDir = path.join(process.cwd(), "uploads", "audio");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Return accessible URL
    const baseUrl = config.env === "production" ? config.clientUrl : `http://localhost:${config.port}`;
    return `${baseUrl}/uploads/audio/${filename}`;
  }

  /**
   * Uploads to AWS S3 using REST API PutObject with AWS V4 signature
   */
  static async uploadToS3(buffer, filename, mimeType) {
    const { bucket, region, accessKeyId, secretAccessKey } = config.storage.s3;
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const endpoint = `https://${host}/${filename}`;

    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const canonicalUri = `/${encodeURIComponent(filename)}`;
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex")}`;

    const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Host: host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorization,
        "Content-Type": mimeType,
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }

    return endpoint;
  }

  /**
   * Uploads audio buffer to Cloudinary using official SDK upload_stream
   * Audio files are stored under resource_type "video" on Cloudinary
   */
  static async uploadToCloudinary(buffer, filename, mimeType = "audio/mpeg") {
    const { cloudName, apiKey, apiSecret } = config.storage.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Chưa cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET");
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const publicId = path.parse(filename).name;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video", // Cloudinary treats audio as resource_type: "video"
          public_id: publicId,
          folder: "jtalk_audio",
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload_stream error:", error);
            return reject(error);
          }
          resolve(result?.secure_url || result?.url);
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export default StorageService;
