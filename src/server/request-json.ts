export class JsonRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Bound the bytes retained before decoding or parsing. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new JsonRequestError('请使用 JSON 请求。', 415);
  }
  const tooLarge = () => new JsonRequestError('请求内容过长。', 413);
  if (Number(request.headers.get('content-length')) > maxBytes) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing request body');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw tooLarge();
      try { text += decoder.decode(value, { stream: true }); }
      catch { throw new SyntaxError('Invalid UTF-8'); }
    }
    try { text += decoder.decode(); }
    catch { throw new SyntaxError('Invalid UTF-8'); }
    return JSON.parse(text);
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
}
