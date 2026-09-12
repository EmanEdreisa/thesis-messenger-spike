const GRAPH_API_VERSION = "v26.0";

const FIXED_REPLY_TEXT =
  "Salamat sa pag-order! Nakatala na po ang mensahe ninyo. Hintayin po ninyo ang confirmation.";

// Fixed reply only — no AI yet. That comes later, for other group members' work.
export async function sendReply(senderId: string, pageAccessToken: string): Promise<void> {
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: { text: FIXED_REPLY_TEXT },
    }),
  });

  // Never log sender_id or the reply text — just whether the send worked.
  if (response.ok) {
    console.log("reply sent");
  } else {
    console.log("failed to send reply, status:", response.status);
  }
}
