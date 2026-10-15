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
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.equal(res.headers.get('Access-Control-Allow-Headers'), 'Content-Type, Authorization');
});

test('POST request returns response with CORS headers', async () => {
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
  assert.equal(body.status, 'success');
  assert.ok(body.reply.includes('Hello'));
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
  assert.equal(body.status, 'success');
});
