import { isValidSignature } from "./verifySignature.ts";
import { saveMessage } from "./saveMessage.ts";

// Meta calls this with GET once, when you save the webhook URL in the App Dashboard,
// to confirm you control this endpoint before it will send real events here.
function handleVerification(req: Request): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedVerifyToken = Deno.env.get("META_VERIFY_TOKEN");

  if (mode === "subscribe" && verifyToken === expectedVerifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("verification failed", { status: 403 });
}

async function handleEvent(req: Request): Promise<Response> {
  // Read the raw text before touching JSON — the signature is over these exact bytes.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("X-Hub-Signature-256");
  const appSecret = Deno.env.get("META_APP_SECRET") ?? "";

  const signatureOk = await isValidSignature(rawBody, signatureHeader, appSecret);
  if (!signatureOk) {
    console.log("webhook signature check failed");
    return new Response("invalid signature", { status: 403 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    const body = JSON.parse(rawBody);
    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        await saveMessage(event, entry.id, supabaseUrl, serviceRoleKey);
      }
    }
  } catch (error) {
    console.log("failed to process webhook event:", error);
  }

  return new Response(null, { status: 200 });
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return handleVerification(req);
  }

  return await handleEvent(req);
});
