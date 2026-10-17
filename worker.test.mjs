import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

test('OPTIONS request returns 204 with CORS headers', async () => {
  const req = new Request('https://nameless-block-036e.workers.dev/', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://cezar06-prog.github.io',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
  });

  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://cezar06-prog.github.io');
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
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://cezar06-prog.github.io');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));

  const body = await res.json();
  assert.equal(body.status, 'warning');
  assert.ok(body.reply.includes('Hello'));
});

test('POST request with API key calls OpenRouter and returns AI reply', async () => {
  const mockFetch = async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
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

test('GET request returns response with CORS headers', async () => {
  const req = new Request('https://nameless-block-036e.workers.dev/?msg=Test', {
    method: 'GET',
    headers: {
      'Origin': 'https://cezar06-prog.github.io',
    },
  });

  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://cezar06-prog.github.io');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));

  const body = await res.json();
  assert.equal(body.status, 'warning');
});
