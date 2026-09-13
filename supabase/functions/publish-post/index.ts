const GRAPH_API_VERSION = "v26.0";

// This function is only ever called by us (not Meta), so unlike the webhook it
// keeps Supabase's default JWT check on — deploy WITHOUT --no-verify-jwt.
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  let caption: string;
  try {
    const body = await req.json();
    caption = body.caption;
  } catch (error) {
    console.log("failed to parse request body:", error);
    return new Response("invalid request body", { status: 400 });
  }

  if (!caption) {
    return new Response("caption is required", { status: 400 });
  }

  const pageAccessToken = Deno.env.get("PAGE_ACCESS_TOKEN") ?? "";
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/feed`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: caption,
        access_token: pageAccessToken,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log("failed to publish post:", result.error);
      return new Response("failed to publish post", { status: 500 });
    }

    return Response.json({ postId: result.id });
  } catch (error) {
    console.log("failed to publish post:", error);
    return new Response("failed to publish post", { status: 500 });
  }
});
