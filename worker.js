// Esmeralda Secrets - Cloudflare Worker Backend

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
  "Access-Control-Max-Age": "86400",
};

function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

const SYSTEM_PROMPT = "Ești Esmeralda, o asistentă AI de elită, elegantă, caldă și extrem de inteligentă pentru Esmeralda Secrets Virtual Club. Răspunzi clar, natural și adaptat preferințelor utilizatorului. Îți amintești numele și detaliile menționate de utilizator pe parcursul conversației.";

export default {
  async fetch(request, env = {}, ctx = {}) {
    try {
      // Explicitly handle OPTIONS preflight requests at the very top of fetch handler
      if (request && request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }
      let userMessage = "";
      let conversationMessages = null;
      let isStreaming = false;
      let requestedModel = null;

      // Safely parse request payload for POST requests or URL params for GET
      if (request.method === "POST") {
        try {
          const body = await request.json();
          userMessage = body.message || body.msg || body.prompt || "";
          isStreaming = Boolean(body.stream);
          requestedModel = body.model || null;
          if (Array.isArray(body.messages) && body.messages.length > 0) {
            conversationMessages = body.messages;
          }
        } catch (e) {
          userMessage = "";
        }
      } else if (request.method === "GET") {
        const url = new URL(request.url);
        userMessage = url.searchParams.get("msg") || url.searchParams.get("message") || url.searchParams.get("prompt") || "";
        isStreaming = url.searchParams.get("stream") === "true";
      }

      // Build payload messages array with system prompt
      let apiMessages = [];
      if (conversationMessages && conversationMessages.length > 0) {
        const nonSystemMsgs = conversationMessages.filter(m => m && m.role !== "system");
        apiMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...nonSystemMsgs];
      } else if (userMessage && userMessage.trim() !== "") {
        apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ];
      }

      if (apiMessages.length <= 1 && (!userMessage || userMessage.trim() === "")) {
        const welcomeText = "Sunt Esmeralda. Cu ce te pot ajuta astăzi?";
        if (isStreaming) {
          const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: welcomeText } }] })}\n\ndata: [DONE]\n\n`;
          return new Response(sseData, {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
            }
          });
        }
        return createJsonResponse({
          status: "success",
          response: welcomeText,
          reply: welcomeText,
        }, 200);
      }

      // Reference OPENROUTER_API_KEY correctly from env
      const apiKey = env ? env.OPENROUTER_API_KEY : null;
      const model = requestedModel || ((env && env.OPENROUTER_MODEL) ? env.OPENROUTER_MODEL : "openrouter/auto");

      if (apiKey) {
        const fetchImpl = (env && env.fetch) ? env.fetch : fetch;
        try {
          const openRouterRes = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://cezar06-prog.github.io",
              "X-Title": "Esmeralda Secrets",
            },
            body: JSON.stringify({
              model: model,
              messages: apiMessages,
              stream: isStreaming,
            })
          });

          if (openRouterRes.ok) {
            if (isStreaming) {
              return new Response(openRouterRes.body, {
                status: 200,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "text/event-stream; charset=utf-8",
                  "Cache-Control": "no-cache",
                  "Connection": "keep-alive"
                }
              });
            }

            const aiData = await openRouterRes.json();
            const reply = aiData.choices?.[0]?.message?.content || "Nu am putut genera un răspuns în acest moment.";
            return createJsonResponse({
              status: "success",
              response: reply,
              reply: reply,
              model: model,
              choices: aiData.choices
            }, 200);
          } else {
            const errText = await openRouterRes.text().catch(() => "");
            console.error("OpenRouter error:", errText);
            return createJsonResponse({
              status: "error",
              error: `OpenRouter API Error (${openRouterRes.status}): ${errText || openRouterRes.statusText}`,
              reply: `Eroare OpenRouter API (${openRouterRes.status}). Te rugăm să încerci din nou.`
            }, 500);
          }
        } catch (openRouterErr) {
          console.error("OpenRouter fetch exception:", openRouterErr);
          return createJsonResponse({
            status: "error",
            error: openRouterErr.message || "A apărut o eroare la comunicarea cu OpenRouter.",
            reply: `Eroare OpenRouter: ${openRouterErr.message || "Eroare rețea/serviciu"}`
          }, 500);
        }
      }

      // If OPENROUTER_API_KEY is not configured, inform the client
      const lastMsg = apiMessages[apiMessages.length - 1]?.content || userMessage;
      const fallbackReply = `[Esmeralda]: Am primit mesajul tău: "${lastMsg}". Cheia OPENROUTER_API_KEY nu este configurată în Cloudflare Worker secrets.`;

      if (isStreaming) {
        const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: fallbackReply } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sseData, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
          }
        });
      }

      return createJsonResponse({
        status: "warning",
        response: fallbackReply,
        reply: fallbackReply,
        error: "OPENROUTER_API_KEY is not set."
      }, 200);

    } catch (err) {
      console.error("Worker fetch error:", err);
      return createJsonResponse(
        {
          status: "error",
          error: err.message || "A apărut o eroare la procesarea cererii.",
          reply: `Eroare server: ${err.message || "Eroare necunoscută"}`
        },
        500
      );
    }
  }
};
