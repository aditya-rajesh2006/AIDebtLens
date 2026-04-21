import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to create streaming response for text
function createStreamingResponse(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send the content in chunks
      const chunks = text.split(' ');
      let i = 0;
      const interval = setInterval(() => {
        if (i < chunks.length) {
          const chunk = chunks[i] + ' ';
          const data = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`;
          controller.enqueue(encoder.encode(data));
          i++;
        } else {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearInterval(interval);
        }
      }, 50); // Small delay for streaming effect
    }
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Required environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const queryHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userMessage)).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Check knowledge base first
    const userWords = userMessage.split(/\s+/).filter(word => word.length > 2);
    let bestMatch = null;
    for (const word of userWords) {
      const { data: knowledge } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .contains('keywords', [word]);
      if (knowledge && knowledge.length > 0) {
        bestMatch = knowledge[0];
        break;
      }
    }

    if (bestMatch) {
      return createStreamingResponse(bestMatch.answer);
    }

    // Check cache
    const { data: cached } = await supabase
      .from('chatbot_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .single();

    if (cached) {
      // Update last_used
      await supabase
        .from('chatbot_cache')
        .update({ last_used: new Date().toISOString() })
        .eq('id', cached.id);

      return createStreamingResponse(cached.response);
    }

    // If not in cache or knowledge, call API
    const systemPrompt = `You are AIDebt Assistant — an expert in software engineering, technical debt, cognitive debt, and AI-generated code analysis.

You help developers understand:
- Technical debt metrics (complexity, duplication, nesting, modularity)
- Cognitive debt metrics (readability, naming clarity, abstraction gaps)
- AI-generated code detection (structural uniformity, pattern repetition, comment redundancy)
- Debt propagation across codebases
- Refactoring strategies and priorities

When users ask about metrics like AITDIS, DCS, ACTDI, DPS, CDS, TDS — explain them clearly with examples.
When users describe code issues, suggest concrete fixes.
Keep answers concise, actionable, and developer-friendly. Use code examples when helpful.
Format responses with markdown for readability.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming responses, we need to collect the full response to cache it
    // But since it's streaming, this might be tricky. For now, we'll cache after the fact or modify to not stream for caching.
    // Actually, for simplicity, let's not cache streaming responses yet, or collect the stream.

    // To handle streaming, we might need to proxy the stream and also save to cache.
    // For now, let's return the stream as is, and cache can be added later with a non-streaming version.

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
