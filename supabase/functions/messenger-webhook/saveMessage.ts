export type MessagingEvent = {
  sender: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string };
  postback?: unknown;
  referral?: unknown;
};

// Only real messages come with a Meta-issued id. Postbacks and referrals don't,
// so we build our own from sender + timestamp — stable enough that a retried
// delivery of the same event produces the same id and gets skipped.
function getMetaMessageId(event: MessagingEvent): string {
  if (event.message?.mid) {
    return event.message.mid;
  }
  return `${event.sender.id}:${event.timestamp}`;
}

function getEventType(event: MessagingEvent): string {
  if (event.message) return "message";
  if (event.postback) return "messaging_postback";
  if (event.referral) return "messaging_referral";
  return "unknown";
}

// Returns whether the row is now saved (either just inserted, or already
// there from an earlier delivery) so the caller knows if it's safe to reply.
export async function saveMessage(
  event: MessagingEvent,
  pageId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<boolean> {
  const row = {
    meta_message_id: getMetaMessageId(event),
    page_id: pageId,
    sender_id: event.sender.id,
    message_text: event.message?.text ?? null,
    event_type: getEventType(event),
  };

  // on_conflict + ignore-duplicates makes this a no-op insert when the
  // meta_message_id already exists, instead of throwing on the unique constraint.
  const response = await fetch(
    `${supabaseUrl}/rest/v1/messages?on_conflict=meta_message_id`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );

  if (!response.ok) {
    // Never log message_text or sender_id — just that a save failed.
    console.log("failed to save message, status:", response.status);
  }

  return response.ok;
}
