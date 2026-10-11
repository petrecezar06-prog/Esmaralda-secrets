// worker.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};
var worker_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }
    try {
      let userMessage = "";
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
        return new Response(
          JSON.stringify({
            status: "success",
            response: "Sunt Esmeralda. Cu ce te pot ajuta ast\u0103zi?",
            reply: "Sunt Esmeralda. Cu ce te pot ajuta ast\u0103zi?"
          }),
          {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }
      const apiKey = env ? env.OPENROUTER_API_KEY : null;
      if (apiKey) {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nameless-block-036e.petrecezar06.workers.dev",
            "X-Title": "Esmeralda Secrets"
          },
          body: JSON.stringify({
            model: "openrouter/auto",
            messages: [
              {
                role: "system",
                content: "E\u0219ti Esmeralda, o asistent\u0103 AI personal\u0103 \u0219i investigatoare elegant\u0103, inteligent\u0103 \u0219i misterioas\u0103. R\u0103spunzi politicos, clar \u0219i perspicace \xEEn limba rom\xE2n\u0103 sau \xEEn limba utilizatorului."
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
          const reply = aiData.choices?.[0]?.message?.content || "Nu am putut genera un r\u0103spuns \xEEn acest moment.";
          return new Response(
            JSON.stringify({
              status: "success",
              response: reply,
              reply
            }),
            {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        } else {
          const errText = await openRouterRes.text();
          console.error("OpenRouter error:", errText);
        }
      }
      const fallbackReply = `[Esmeralda]: Am primit mesajul t\u0103u: "${userMessage}". Conexiunea cu serverul func\u021Bioneaz\u0103 corect. (Pentru r\u0103spunsuri AI complete, configureaz\u0103 OPENROUTER_API_KEY \xEEn Cloudflare Worker).`;
      return new Response(
        JSON.stringify({
          status: "success",
          response: fallbackReply,
          reply: fallbackReply
        }),
        {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: err.message || "A ap\u0103rut o eroare la procesarea cererii."
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
