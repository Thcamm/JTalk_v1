import config from "../config/index.js";

/**
 * MailService: Dịch vụ gửi email xác thực OTP cho JTalk
 * Tự động hỗ trợ:
 * 1. Gmail / SMTP thật khi cấu hình SMTP_USER và SMTP_PASS trong .env
 * 2. Ethereal Test Account (tự sinh hộp thư ảo kiểm thử) khi chưa cấu hình SMTP thật
 * 3. Graceful fallback (ghi log console) nếu chưa cài nodemailer hoặc lỗi mạng
 */
class MailService {
  constructor() {
    this.transporter = null;
    this.nodemailer = null;
    this.isTestAccount = false;
  }

  /**
   * Khởi tạo hoặc lấy transporter gửi email
   */
  async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      // Dynamic import để tránh crash server nếu chưa chạy npm install nodemailer
      const nodemailerModule = await import("nodemailer");
      this.nodemailer = nodemailerModule.default || nodemailerModule;

      const { host, port, secure, user, pass } = config.mail || {};

      // 1. Nếu đã cấu hình tài khoản SMTP thật trong .env
      if (user && pass) {
        this.transporter = this.nodemailer.createTransport({
          host: host || "smtp.gmail.com",
          port: port || 465,
          secure: secure !== undefined ? secure : true,
          auth: {
            user,
            pass,
          },
        });
        this.isTestAccount = false;
        console.log(`[MAIL] ✅ Đã cấu hình SMTP transporter với tài khoản: ${user}`);
        return this.transporter;
      }

      // 2. Nếu chưa cấu hình, tự động tạo Ethereal Test Account miễn phí cho server dev/test
      console.log("[MAIL] ℹ️ Chưa có SMTP_USER/SMTP_PASS, đang tạo Ethereal test inbox...");
      const testAccount = await this.nodemailer.createTestAccount();
      this.transporter = this.nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isTestAccount = true;
      console.log(`[MAIL] 🧪 Ethereal test account khởi tạo thành công: ${testAccount.user}`);
      return this.transporter;
    } catch (err) {
      console.warn("[MAIL] ⚠️ Không thể khởi tạo nodemailer transporter:", err.message);
      return null;
    }
  }

  /**
   * Gửi email chứa mã OTP khôi phục mật khẩu
   */
  async sendResetPasswordOtp({ toEmail, displayName, otpCode }) {
    if (!toEmail) {
      throw new Error("Địa chỉ email người nhận không hợp lệ.");
    }

    const transporter = await this.getTransporter();

    // Mẫu HTML giao diện chuẩn thương hiệu JTalk
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #f59e0b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
          .tagline { font-size: 13px; opacity: 0.95; margin-top: 6px; font-weight: 500; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .otp-box { background: #fff1f2; border: 2px dashed #fda4af; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #be123c; margin-bottom: 8px; }
          .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #e11d48; margin: 0; }
          .expiry { font-size: 13px; color: #e11d48; font-weight: 600; margin-top: 10px; }
          .warning { background: #f8fafc; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.5; border-left: 4px solid #94a3b8; margin-top: 24px; }
          .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand">JTalk AI</h1>
            <div class="tagline">Học Tiếng Nhật Phản Xạ Chuẩn Tokyo</div>
          </div>
          <div class="content">
            <div class="greeting">Xin chào ${displayName || "bạn"},</div>
            <p class="desc">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản JTalk liên kết với email này. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất:
            </p>
            <div class="otp-box">
              <div class="otp-label">Mã xác thực của bạn</div>
              <div class="otp-code">${otpCode}</div>
              <div class="expiry">⏱️ Mã có hiệu lực trong vòng 15 phút</div>
            </div>
            <div class="warning">
              <strong>Lưu ý bảo mật:</strong> Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay để bảo vệ tài khoản. Không chia sẻ mã OTP cho bất kỳ ai khác.
            </div>
          </div>
          <div class="footer">
            © 2026 JTalk - Nền tảng luyện giao tiếp tiếng Nhật với AI phản xạ tức thì.<br>Email tự động, vui lòng không phản hồi thư này.
          </div>
        </div>
      </body>
      </html>
    `;

    // Nếu có transporter khả dụng (Gmail thật hoặc Ethereal test)
    if (transporter) {
      try {
        const fromAddress = config.mail?.from || '"JTalk Support" <support@jtalk.com>';
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `[JTalk] Mã xác thực OTP đặt lại mật khẩu: ${otpCode}`,
          text: `Xin chào ${displayName || "bạn"},\nMã xác thực OTP của bạn là: ${otpCode} (có hiệu lực trong 15 phút).\nTuyệt đối không chia sẻ mã này cho ai.`,
          html: htmlTemplate,
        });

        let previewUrl = null;
        if (this.isTestAccount && this.nodemailer) {
          previewUrl = this.nodemailer.getTestMessageUrl(info);
          console.log(`[MAIL] 📬 Email xem thử đã sẵn sàng tại URL: ${previewUrl}`);
        } else {
          console.log(`[MAIL] 📨 Email đã gửi thành công tới: ${toEmail} (ID: ${info.messageId})`);
        }

        return {
          success: true,
          messageId: info.messageId,
          previewUrl,
          isTestAccount: this.isTestAccount,
        };
      } catch (sendError) {
        console.error(`[MAIL] ❌ Lỗi khi gửi email tới ${toEmail}:`, sendError.message);
        // Không ném lỗi ra ngoài làm nghẽn API mà fallback ghi nhận để người dùng test được
      }
    }

    // Fallback nếu không có transporter hoặc gửi lỗi
    console.log(`[MAIL-FALLBACK] 🔑 OTP cho ${toEmail}: ${otpCode}`);
    return {
      success: true,
      simulated: true,
      otpCode,
    };
  }
}

export const mailService = new MailService();
export default mailService;
