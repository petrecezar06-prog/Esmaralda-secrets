export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8",
    };

    // Handle OPTIONS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      let userMessage = "";
      const url = new URL(request.url);

      if (request.method === "POST") {
        try {
          const body = await request.json();
          userMessage = body.message || body.msg || body.prompt || "";
        } catch (e) {
          userMessage = await request.text();
        }
      } else if (request.method === "GET") {
        userMessage =
          url.searchParams.get("msg") ||
          url.searchParams.get("message") ||
          url.searchParams.get("prompt") ||
          "";
      }

      if (!userMessage || userMessage.trim() === "") {
        return new Response(
          JSON.stringify({
            status: "ok",
            message:
              "Esmeralda Cloudflare Worker este funcțional. Trimite un mesaj via POST sau query param ?msg=...",
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      const result = await handleChat(userMessage.trim(), env);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || "A apărut o eroare pe server." }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

async function handleChat(userMessage, env) {
  const apiKey = env && env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      reply: `Salut! Sunt Esmeralda. Am primit mesajul tău: "${userMessage}". Cheia OPENROUTER_API_KEY nu este setată pe Worker, dar conexiunea funcționează perfect!`,
    };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nameless-block-036e.petrecezar06.workers.dev",
        "X-Title": "Esmeralda AI",
      },
      body: JSON.stringify({
        model: (env && env.OPENROUTER_MODEL) || "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "system",
            content:
              "Ești Esmeralda, un asistent inteligent, prietenos și util. Răspunzi clar, concis și politicos.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter Error:", response.status, errText);
      return {
        reply: `Am primit mesajul tău: "${userMessage}". Serviciul AI a returnat codul ${response.status}.`,
      };
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Răspuns primit de la modelul AI fără conținut text.";

    return { reply };
  } catch (err) {
    console.error("OpenRouter Fetch Exception:", err);
    return {
      reply: `Iartă-mă, a apărut o eroare la comunicarea cu OpenRouter: ${err.message}`,
    };
  }
}
