// Esmeralda Secrets - Cloudflare Worker Backend

/**
 * Generates dynamic CORS headers based on incoming request origin and requested headers.
 */
function getCorsHeaders(request) {
  const origin = (request && request.headers.get("Origin")) || "*";
  return {
    "Access-Control-Allow-Origin": origin === "null" ? "*" : origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function createJsonResponse(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env = {}, ctx = {}) {
    // Handle OPTIONS preflight requests globally with 204 No Content
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    try {
      let userMessage = "";

      // Safely parse request payload for POST requests or URL params for GET
      if (request.method === "POST") {
        try {
          const body = await request.json();
          userMessage = body.message || body.msg || body.prompt || "";
        } catch (e) {
          userMessage = "";
        }
      } else if (request.method === "GET") {
        const url = new URL(request.url);
        userMessage = url.searchParams.get("msg") || url.searchParams.get("message") || url.searchParams.get("prompt") || "";
      }

      if (!userMessage || userMessage.trim() === "") {
        return createJsonResponse({
          status: "success",
          response: "Sunt Esmeralda. Cu ce te pot ajuta astăzi?",
          reply: "Sunt Esmeralda. Cu ce te pot ajuta astăzi?",
        }, 200, request);
      }

      // If OPENROUTER_API_KEY is configured in env secrets, call OpenRouter
      const apiKey = env ? env.OPENROUTER_API_KEY : null;
      const model = (env && env.OPENROUTER_MODEL) ? env.OPENROUTER_MODEL : "openrouter/auto";

      if (apiKey) {
        const fetchImpl = (env && env.fetch) ? env.fetch : fetch;
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
            messages: [
              {
                role: "system",
                content: "Ești Esmeralda, o asistentă AI personală și investigatoare elegantă, inteligentă și misterioasă. Răspunzi politicos, clar și perspicace în limba română sau în limba utilizatorului."
              },
              {
                role: "user",
                content: userMessage
              }
            ]
          })
        });

        if (openRouterRes.ok) {
          const aiData = await openRouterRes.json();
          const reply = aiData.choices?.[0]?.message?.content || "Nu am putut genera un răspuns în acest moment.";
          return createJsonResponse({
            status: "success",
            response: reply,
            reply: reply,
            model: model
          }, 200, request);
        } else {
          const errText = await openRouterRes.text().catch(() => "");
          console.error("OpenRouter error:", errText);
          return createJsonResponse({
            status: "error",
            error: `OpenRouter API Error (${openRouterRes.status}): ${errText || openRouterRes.statusText}`,
            reply: `Eroare OpenRouter API (${openRouterRes.status}). Te rugăm să încerci din nou.`
          }, openRouterRes.status >= 400 && openRouterRes.status < 600 ? openRouterRes.status : 502, request);
        }
      }

      // If OPENROUTER_API_KEY is not configured, inform the client with clear status
      const fallbackReply = `[Esmeralda]: Am primit mesajul tău: "${userMessage}". Cheia OPENROUTER_API_KEY nu este configurată în Cloudflare Worker secrets.`;

      return createJsonResponse({
        status: "warning",
        response: fallbackReply,
        reply: fallbackReply,
        error: "OPENROUTER_API_KEY is not set."
      }, 200, request);

    } catch (err) {
      console.error("Worker fetch error:", err);
      return createJsonResponse(
        {
          status: "error",
          error: err.message || "A apărut o eroare la procesarea cererii.",
          reply: `Eroare server: ${err.message || "Eroare necunoscută"}`
        },
        500,
        request
      );
    }
  }
};
