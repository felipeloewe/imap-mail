import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status },
  );
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 400, err.flatten());
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal error";
  return jsonError(message, 500);
}
