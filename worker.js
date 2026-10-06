const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env, ctx) {
    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
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
            response: "Sunt Esmeralda. Cu ce te pot ajuta astăzi?",
            reply: "Sunt Esmeralda. Cu ce te pot ajuta astăzi?",
          }),
          {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "application/json; charset=utf-8",
            },
          }
        );
      }

      // If OPENROUTER_API_KEY is configured in env secrets, call OpenRouter
      const apiKey = env ? env.OPENROUTER_API_KEY : null;

      if (apiKey) {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nameless-block-036e.petrecezar06.workers.dev",
            "X-Title": "Esmeralda Secrets",
          },
          body: JSON.stringify({
            model: "openrouter/auto",
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
          return new Response(
            JSON.stringify({
              status: "success",
              response: reply,
              reply: reply
            }),
            {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json; charset=utf-8",
              },
            }
          );
        } else {
          const errText = await openRouterRes.text();
          console.error("OpenRouter error:", errText);
        }
      }

      // Default / fallback response when API key is missing or OpenRouter fails
      const fallbackReply = `[Esmeralda]: Am primit mesajul tău: "${userMessage}". Conexiunea cu serverul funcționează corect. (Pentru răspunsuri AI complete, configurează OPENROUTER_API_KEY în Cloudflare Worker).`;

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
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: err.message || "A apărut o eroare la procesarea cererii.",
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }
  }
};
