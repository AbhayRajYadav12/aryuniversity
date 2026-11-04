let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch('/api/auth/csrf', { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await ensureCsrf();
    headers['X-CSRF-Token'] = token;
  }

  const res = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body === 'object'
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.blob();

  if (isJson && data?.csrfToken) {
    csrfToken = data.csrfToken;
  }

  if (!res.ok) {
    const err = new Error((isJson && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function fetchDocumentBlob(bookId) {
  const res = await fetch(`/api/documents/${bookId}/content`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let message = 'Unable to load document';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}
