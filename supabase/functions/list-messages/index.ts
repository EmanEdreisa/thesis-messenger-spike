const ALLOWED_ORIGIN = "https://emanedreisa.github.io";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type MessageRow = {
  message_text: string | null;
  sender_id: string;
  created_at: string;
};

// One-way hash so the demo page never sees a real Facebook sender ID.
async function maskSenderId(senderId: string): Promise<string> {
  const hashBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(senderId));
  const hashHex = Array.from(new Uint8Array(hashBytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return "Customer " + hashHex.slice(0, 6);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response("method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/messages?select=message_text,sender_id,created_at&order=created_at.desc&limit=20`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!response.ok) {
      console.log("failed to load messages, status:", response.status);
      return new Response("failed to load messages", { status: 500, headers: CORS_HEADERS });
    }

    const rows: MessageRow[] = await response.json();

    const messages = await Promise.all(
      rows.map(async (row) => ({
        messageText: row.message_text,
        createdAt: row.created_at,
        sender: await maskSenderId(row.sender_id),
      })),
    );

    return Response.json({ messages }, { headers: CORS_HEADERS });
  } catch (error) {
    console.log("failed to load messages:", error);
    return new Response("failed to load messages", { status: 500, headers: CORS_HEADERS });
  }
});
