import crypto from "crypto";

/**
 * Generates HMAC-SHA256 signature for MoMo payment creation
 */
export const createMoMoPaymentSignature = ({
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  partnerCode,
  redirectUrl,
  requestId,
  requestType,
  secretKey,
}) => {
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
};

/**
 * Verifies HMAC-SHA256 signature for MoMo IPN callback
 */
export const verifyMoMoIpnSignature = (payload, secretKey) => {
  const {
    accessKey,
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = payload;

  if (!signature) return false;

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return signature === expectedSignature;
  }
};
