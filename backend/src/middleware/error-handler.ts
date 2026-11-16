import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

type PostgresErrorLike = {
  code: string;
  message?: string;
};

function isPostgresError(error: unknown): error is PostgresErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

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

  // Fel från databasen (Supabase/PostgREST skickar Postgres SQLSTATE i `code`)
  if (isPostgresError(error)) {
    switch (error.code) {
      // exclusion_violation: constraint no_overlapping_bookings
      // (två samtidiga bokningar för samma datum)
      case "23P01":
        return c.json(
          { error: "Property is already booked for these dates" },
          409,
        );

      // foreign_key_violation
      case "23503":
        return c.json(
          { error: "The request conflicts with existing data" },
          409,
        );

      // check_violation
      case "23514":
        return c.json(
          { error: "The data violates a database rule" },
          400,
        );

      // RAISE EXCEPTION i triggern protect_booking_columns
      case "P0001":
        return c.json({ error: error.message ?? "Forbidden" }, 403);
    }
  }

  console.error(error);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
};