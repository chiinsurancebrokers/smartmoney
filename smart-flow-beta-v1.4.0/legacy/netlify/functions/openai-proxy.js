const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return response(405, { error: { message: 'Method not allowed.' } });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { error: { message: 'Invalid JSON request.' } });
  }

  // LEGACY / REFERENCE ONLY — not used by the current Railway deploy (see
  // server/index.js). This function has no authentication of its own. It
  // previously fell back to process.env.OPENAI_API_KEY when no client key
  // was supplied, which would let anyone who finds a live copy of this
  // Netlify site spend your OpenAI credit with no login. That fallback has
  // been removed; a per-caller key is now required. Do not redeploy this
  // function without adding real auth in front of it.
  const headers = event.headers || {};
  const clientKey = headers['x-openai-key'] || headers['X-OpenAI-Key'];
  const apiKey = clientKey;

  if (!apiKey) {
    return response(401, {
      error: {
        message: 'Δεν έχει οριστεί OpenAI API key. Βάλε το στο Settings ή πρόσθεσε OPENAI_API_KEY στα Netlify Environment Variables.',
      },
    });
  }

  const model = payload.model || process.env.OPENAI_MODEL || 'gpt-5.2';
  const input = payload.input;
  if (!input) {
    return response(400, { error: { message: 'Missing input.' } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        ...(payload.instructions ? { instructions: payload.instructions } : {}),
        max_output_tokens: Math.max(100, Math.min(12000, Number(payload.max_output_tokens) || 3500)),
      }),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: { message: text || `OpenAI HTTP ${upstream.status}` } };
    }

    return response(upstream.status, data);
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Το OpenAI request ξεπέρασε το χρονικό όριο της Netlify Function.'
      : `OpenAI proxy error: ${error?.message || String(error)}`;
    return response(502, { error: { message } });
  } finally {
    clearTimeout(timeout);
  }
};
