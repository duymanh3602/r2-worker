import { Context } from "hono";

async function generateSignature(data: string, key: string) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export const verifySignature = async (
  objectKey: string,
  expireTime: string,
  secret: string,
  signature: string
) => {
  if (!signature) {
    return false;
  }
  let dataToSign = objectKey + " manhdd-admin-root";

  if (expireTime != "" && expireTime != null) {
    dataToSign += ` ${expireTime}`;
  } else {
    dataToSign += " non-expired-link";
  }
  const computedSignature = await generateSignature(dataToSign, secret);
  if (signature === computedSignature) {
    if (expireTime == "" || expireTime == null) {
      return true;
    } else {
      let currentDate = new Date();
      let timestamp = Math.floor(currentDate.getTime() / 1000);
      const expireTimeStr = `${expireTime}T00:00:00`;
      let timestampExp = new Date(expireTimeStr).getTime() / 1000;
      return timestamp <= timestampExp;
    }
  } else {
    return false;
  }
};

export const generateKey = async (c: Context) => {
  let dataToSign = c.req.query("Key")?.toString() + " manhdd-admin-root";
  const secretKey = c.env.AUTH_KEY_SECRET || "manhdinh-demo-secret-key";
  const timeStamp = c.req.query("ExpireTime")?.toString();
  if (timeStamp == "" || timeStamp == null) {
    dataToSign += " non-expired-link";
  } else {
    dataToSign += ` ${timeStamp}`;
  }
  const signature = await generateSignature(dataToSign, secretKey);
  return c.json(
    `${signature}${timeStamp != "" ? `&ExpireTime=${timeStamp}` : ""}`
  );
};
