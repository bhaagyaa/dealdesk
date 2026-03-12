// ============================================================
// FILE: app/api/ai/route.js
// PURPOSE: Backend proxy for Claude AI calls
// WHY: Keeps your Anthropic API key safe on the server.
//      The frontend calls THIS route, not the Anthropic API directly.
// ============================================================

import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  // 1. Verify the user is logged in
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: "Invalid session" }, { status: 401 });
  }

  // 2. Get the prompt from the request
  const { prompt, systemPrompt, messages } = await request.json();
  if (!prompt && (!messages || !messages.length)) {
    return Response.json({ error: "No prompt provided" }, { status: 400 });
  }

  // Support both single-prompt and multi-turn conversation modes
  const apiMessages = messages || [{ role: "user", content: prompt }];

  // 3. Call the Anthropic API with the key stored in environment variables
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt || "You are DealDesk AI, a business assistant for content creators who manage brand deals. Be concise, practical, and direct.",
        messages: apiMessages,
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "Unable to generate response.";

    return Response.json({ text });
  } catch (err) {
    console.error("AI API error:", err);
    return Response.json({ error: "AI service temporarily unavailable." }, { status: 500 });
  }
}
