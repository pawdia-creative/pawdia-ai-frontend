// Safe JSON parsing helper for fetch responses
// Returns { data } when JSON parsed successfully, or { data: null, text } when not JSON or parsing failed.
export async function safeParseJsonResponse(response: Response): Promise<{ data: any | null; text?: string }> {
  if (!response || typeof response !== 'object') {
    return { data: null, text: '' };
  }

  const contentType = response.headers.get('content-type') || '';

  // No body (e.g., 204)
  try {
    // Some runtimes expose bodyUsed; guard defensively.
    if (response.status === 204 || response.body === null) {
      return { data: null, text: '' };
    }
  } catch (e) {
    // ignore and continue
  }

  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      return { data };
    } catch (err) {
      // Invalid JSON or empty body - fallback to text
      const text = await response.text().catch(() => '');
      return { data: null, text };
    }
  }

  // Not JSON - return text
  const text = await response.text().catch(() => '');
  return { data: null, text };
}


