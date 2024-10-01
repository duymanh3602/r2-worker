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
        return c.body(
          JSON.stringify({ message: "Object not found", status: 404 }),
          404,
          {
            "X-Message": "Object not found",
            "Content-Type": "text/json",
          }
        );
      }
      const check = await verifySignature(
        key,
        expireTime,
        c.env.AUTH_KEY_SECRET,
        presignedUrl
      );
      if (!check) {
        return c.body(
          JSON.stringify({
            message: "Unauthorized or expired link",
            status: 401,
          }),
          401,
          {
            "X-Message": "Unauthorized or expired link",
            "Content-Type": "text/json",
          }
        );
      }
    }
  }

  let object = await c.env.R2_BUCKET.get(key);

  if (object === null) {
    return c.body(
      JSON.stringify({ message: "Object not found", status: 404 }),
      404,
      {
        "X-Message": "Object not found",
        "Content-Type": "text/json",
      }
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
