import { HTTPException } from "hono/http-exception";

export function notFound(message = "Resource not found") {
  throw new HTTPException(404, {
    message
  });
}

export function unauthorized(
  message = "Unauthorized"
) {
  throw new HTTPException(401, {
    message
  });
}

export function forbidden(
  message = "Forbidden"
) {
  throw new HTTPException(403, {
    message
  });
}

export function badRequest(
  message = "Invalid request"
) {
  throw new HTTPException(400, {
    message
  });
}