import fs from "fs";
import path from "path";
import crypto from "crypto";
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

    // 1. AWS S3 Provider (if credentials configured)
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

    // 2. Cloudinary Provider (if configured)
    if (
      config.storage.provider === "cloudinary" &&
      config.storage.cloudinary.cloudName &&
      config.storage.cloudinary.apiKey
    ) {
      try {
        return await this.uploadToCloudinary(buffer, filename);
      } catch (err) {
        console.error("Lỗi upload Cloudinary, fallback về local:", err.message);
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
   * Uploads to Cloudinary using direct REST API
   */
  static async uploadToCloudinary(buffer, filename) {
    const { cloudName, apiKey, apiSecret } = config.storage.cloudinary;
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = path.parse(filename).name;

    const signatureString = `public_id=${publicId}&resource_type=video&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    const formData = new FormData();
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    formData.append("file", blob, filename);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url || data.url;
  }
}

export default StorageService;
