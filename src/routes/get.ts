import { Context } from "hono";
import { verifySignature } from "../middleware/presignUrl";

interface Env {
  R2_BUCKET: R2Bucket;
}

export default async function (c: Context) {
  const useKey = c.req.header("x-api-key") === c.env.AUTH_KEY_SECRET;
  let key = c.req.param("key");
  if (c.env.PRIVATE_BUCKET) {
    if (!useKey) {
      const presignedUrl = c.req.query("PresignedUrl")?.toString();
      const expireTime = c.req.query("ExpireTime")?.toString() ?? '';
      if (!key || !presignedUrl) {
        return new Response(
          JSON.stringify({
            message: "PresignedUrl and ObjectKey is required",
            status: 400,
          }),
          { status: 400 }
        );
      }
      const check = await verifySignature(
        key,
        expireTime,
        c.env.AUTH_KEY_SECRET,
        presignedUrl
      );
      if (!check) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized or expired link",
            status: 401,
          }),
          { status: 401 }
        );
      }
    }
  }

  let object = await c.env.R2_BUCKET.get(key);

  if (object === null) {
    return new Response(
      JSON.stringify({
        message: "Object not found",
        status: 404,
      }),
      { status: 404 }
    );
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(object.body, {
    headers,
  });
}
