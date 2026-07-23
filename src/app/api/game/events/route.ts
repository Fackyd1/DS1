import { getRecentEvents } from "@/services/realtime-service";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const snapshot = getRecentEvents(20);
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
