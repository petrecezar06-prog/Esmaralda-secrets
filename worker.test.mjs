import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

test('OPTIONS request returns 204 with CORS headers', async () => {
  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://cezar06-prog.github.io',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });

  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
});

test('POST request without API key returns warning response with CORS headers', async () => {
  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://cezar06-prog.github.io',
    },
    body: JSON.stringify({ message: 'Hello' }),
  });

  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));

  const body = await res.json();
  assert.equal(body.status, 'warning');
  assert.ok(body.reply.includes('Hello'));
});

test('POST request with API key calls OpenRouter with system prompt and returns AI reply', async () => {
  const mockFetch = async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    const parsedBody = JSON.parse(options.body);
    assert.equal(parsedBody.messages[0].role, 'system');
    assert.ok(parsedBody.messages[0].content.includes('Ești Esmeralda'));
    assert.equal(parsedBody.messages[1].role, 'user');
    assert.equal(parsedBody.messages[1].content, 'Ce poți face?');

    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Răspuns Esmeralda AI' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://cezar06-prog.github.io',
    },
    body: JSON.stringify({ message: 'Ce poți face?' }),
  });

  const res = await worker.fetch(req, {
    OPENROUTER_API_KEY: 'test-key',
    fetch: mockFetch
  }, {});

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'success');
  assert.equal(body.reply, 'Răspuns Esmeralda AI');
  assert.equal(body.model, 'openrouter/auto');
});

test('POST request with conversation history passes messages array correctly', async () => {
  const mockFetch = async (url, options) => {
    const parsedBody = JSON.parse(options.body);
    assert.equal(parsedBody.messages.length, 3);
    assert.equal(parsedBody.messages[0].role, 'system');
    assert.equal(parsedBody.messages[1].role, 'user');
    assert.equal(parsedBody.messages[1].content, 'Mă numesc Alex');
    assert.equal(parsedBody.messages[2].role, 'assistant');
    assert.equal(parsedBody.messages[2].content, 'Încântat de cunoștință, Alex!');

    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Cu ce te pot ajuta azi, Alex?' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://cezar06-prog.github.io',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Mă numesc Alex' },
        { role: 'assistant', content: 'Încântat de cunoștință, Alex!' }
      ]
    }),
  });

  const res = await worker.fetch(req, {
    OPENROUTER_API_KEY: 'test-key',
    fetch: mockFetch
  }, {});

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.reply, 'Cu ce te pot ajuta azi, Alex?');
});

test('POST request with stream: true returns SSE event-stream', async () => {
  const mockFetch = async (url, options) => {
    const parsedBody = JSON.parse(options.body);
    assert.equal(parsedBody.stream, true);

    const streamData = 'data: {"choices":[{"delta":{"content":"Salut!"}}]}\n\ndata: [DONE]\n\n';
    return new Response(streamData, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' }
    });
  };

  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://cezar06-prog.github.io',
    },
    body: JSON.stringify({ message: 'Buzzer', stream: true }),
  });

  const res = await worker.fetch(req, {
    OPENROUTER_API_KEY: 'test-key',
    fetch: mockFetch
  }, {});

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'text/event-stream; charset=utf-8');
  const text = await res.text();
  assert.ok(text.includes('data: {"choices":[{"delta":{"content":"Salut!"}}]}'));
});

test('POST request when OpenRouter returns error returns status 500 with CORS headers', async () => {
  const mockFetch = async (url, options) => {
    return new Response('Unauthorized', { status: 401, headers: { 'Content-Type': 'text/plain' } });
  };

  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://cezar06-prog.github.io',
    },
    body: JSON.stringify({ message: 'Test error' }),
  });

  const res = await worker.fetch(req, {
    OPENROUTER_API_KEY: 'invalid-key',
    fetch: mockFetch
  }, {});

  assert.equal(res.status, 500);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));

  const body = await res.json();
  assert.equal(body.status, 'error');
  assert.ok(body.error.includes('OpenRouter API Error (401)'));
});

test('GET request returns response with CORS headers', async () => {
  const req = new Request('https://nameless-block-036e.workers.dev/?msg=Test', {
    method: 'GET',
    headers: {
      'Origin': 'https://cezar06-prog.github.io',
    },
  });

  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));

  const body = await res.json();
  assert.equal(body.status, 'warning');
});

test('Unexpected exception returns 500 JSON response with CORS headers', async () => {
  const invalidReq = {
    get method() {
      throw new Error('Unexpected internal error');
    }
  };

  const res = await worker.fetch(invalidReq, {}, {});
  assert.equal(res.status, 500);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  const body = await res.json();
  assert.equal(body.status, 'error');
  assert.ok(body.error.includes('Unexpected internal error'));
});
