import { getRealmEvents } from "@/services/realm-backend-service";

export async function GET() {
  const encoder = new TextEncoder();
  const snapshot = await getRealmEvents(20);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "snapshot", events: snapshot })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
