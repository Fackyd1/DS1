import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { contactSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";

type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  submittedAt: string;
};

const inbox: ContactMessage[] = [];

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const limit = checkRateLimit(`contact:${clientIp}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      }
    );
  }

  const payload = await request.json();
  if (payload.website) {
    return NextResponse.json({ message: "Spam rejected." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid payload." }, { status: 400 });
  }

  const entry = {
    ...parsed.data,
    submittedAt: new Date().toISOString(),
  };

  inbox.push(entry);

  try {
    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });
  } catch {
    // Keep API operational even before DB is configured.
  }

  return NextResponse.json({ message: "Message received.", totalMessages: inbox.length }, { status: 201 });
}
