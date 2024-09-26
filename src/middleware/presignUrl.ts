import { Context } from "hono";
import jwt from "@tsndr/cloudflare-worker-jwt";

export const sharing = async (c: Context) => {
  const key = c.req.query("Key");
  let expireTime = c.req.query("ExpireTime");
//   let key = body['Key']?.toString();
//   let expireTime = body['ExpireTime']?.toString();
  const secret = c.env.AUTH_KEY_SECRET || 'manhdinh-demo-secret-key';
  if (!expireTime) {
    expireTime = "1-1-2050";
  }
  if (!key) {
    return c.text("file name is required", 400);
  }
  const token = await jwt.sign(
    {
      iss: "Manh Dinh",
      email: "manhdd362@gmail.com",
      aud: key,
      exp: Math.floor(new Date(expireTime).getTime() / 1000),
    },
    secret
  );
  return c.json(token);
};

export const validateToken = async (
  token: string,
  objectKey: string,
  secret: string
) => {
  if (!token) return false;
  const isValid = await jwt.verify(token, secret);
  if (!isValid) return false;
  const { payload } = jwt.decode(token);
  if (!payload) return false;
  const exp = payload.exp;
  const objKey = payload.aud;
  if (!objKey) return false;
  if (objKey !== objectKey) return false;
  if (!exp) return false;
  if (exp < Date.now()) return false;
  return true;
};
