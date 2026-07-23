import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function fromError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }

    if (error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }

    return fail(error.message, 400);
  }

  return fail("Unknown error", 500);
}
