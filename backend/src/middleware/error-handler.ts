import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: error.message,
      },
      error.status,
    );
  }

  // Felaktigt JSON-format från klienten
  if (error instanceof SyntaxError) {
    return c.json(
      {
        error: "Invalid JSON body",
      },
      400,
    );
  }

  console.error(error);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
};