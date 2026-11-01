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
      // 1. Handle CORS preflight (OPTIONS) requests immediately
      if (request && request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Check method support
      if (request && request.method !== "POST" && request.method !== "GET") {
        return createJsonResponse({
          status: "error",
          error: `Method ${request.method} Not Allowed`,
          reply: `Metoda HTTP ${request.method} nu este suportată. Folosiți GET sau POST.`
        }, 405);
      }

      let userMessage = "";
      let conversationMessages = null;
      let isStreaming = false;
      let requestedModel = null;

      // 2. Safely parse request payload for POST requests or URL params for GET
      if (request && request.method === "POST") {
        try {
          const body = await request.json();
          if (body && typeof body === "object") {
            userMessage = body.message || body.msg || body.prompt || "";
            isStreaming = Boolean(body.stream);
            requestedModel = body.model || null;
            if (Array.isArray(body.messages) && body.messages.length > 0) {
              conversationMessages = body.messages;
            }
          }
        } catch (parseErr) {
          userMessage = "";
        }
      } else if (request && request.method === "GET") {
        try {
          const url = new URL(request.url);
          userMessage = url.searchParams.get("msg") || url.searchParams.get("message") || url.searchParams.get("prompt") || "";
          isStreaming = url.searchParams.get("stream") === "true";
        } catch (urlErr) {
          userMessage = "";
        }
      }

      // 3. Build payload messages array with system prompt
      let apiMessages = [];
      if (conversationMessages && conversationMessages.length > 0) {
        const nonSystemMsgs = conversationMessages.filter(m => m && typeof m === "object" && m.role !== "system");
        apiMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...nonSystemMsgs];
      } else if (userMessage && typeof userMessage === "string" && userMessage.trim() !== "") {
        apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage.trim() }
        ];
      }

      // Default greeting if no message provided
      if (apiMessages.length <= 1 && (!userMessage || typeof userMessage !== "string" || userMessage.trim() === "")) {
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

      // 4. Reference OPENROUTER_API_KEY and model from env
      const apiKey = env ? env.OPENROUTER_API_KEY : null;
      const model = requestedModel || ((env && env.OPENROUTER_MODEL) ? env.OPENROUTER_MODEL : "openrouter/auto");

      if (apiKey) {
        const fetchImpl = (env && typeof env.fetch === "function") ? env.fetch : fetch;
        const controller = new AbortController();
        const timeoutMs = 25000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const openRouterRes = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://petrecezar06-prog.github.io",
              "X-Title": "Esmeralda Secrets",
            },
            body: JSON.stringify({
              model: model,
              messages: apiMessages,
              stream: isStreaming,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

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
          clearTimeout(timeoutId);
          console.error("OpenRouter fetch exception:", openRouterErr);
          const isTimeout = openRouterErr.name === "AbortError";
          const statusCode = isTimeout ? 504 : 500;
          const errMsg = isTimeout
            ? "Conexiunea către OpenRouter API a expirat (timeout)."
            : (openRouterErr.message || "A apărut o eroare la comunicarea cu OpenRouter.");
          return createJsonResponse({
            status: "error",
            error: errMsg,
            reply: `Eroare serviciu AI: ${errMsg}`
          }, statusCode);
        }
      }

      // If OPENROUTER_API_KEY is not configured, inform the client safely
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
