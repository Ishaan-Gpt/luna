import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Waitlist sign-up. Validates the address and acknowledges it.
 * TODO: connect a real store (database or email list) before launch; nothing is persisted yet.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Please send an email address." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "That email doesn't look right. Try again?" }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
