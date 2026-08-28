import axios from 'axios';

export interface StreamProbeResult {
  status: number;
  captcha: boolean;
  unavailable: boolean;
  cloudflare: boolean;
  server: string;
  ray?: string;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  Referer: 'https://www.google.com/',
};

function classifyBody(status: number, body: string): { captcha: boolean; unavailable: boolean } {
  const slice = body.slice(0, 24000);
  const captcha =
    status === 403 ||
    /cf-turnstile|challenge-platform|cdn-cgi\/challenge|just a moment|verificar que voc[eê] [eé] humano/i.test(
      slice,
    );

  const unavailable =
    !captcha &&
    (status >= 400 ||
      /internal server error|error code:\s*500|unable to complete your request|oops!\s*something went wrong/i.test(
        slice,
      ));

  return { captcha, unavailable };
}

export async function probeStreamUrl(url: string): Promise<StreamProbeResult> {
  const target = url.split('#')[0];

  try {
    const resp = await axios.get(target, {
      headers: BROWSER_HEADERS,
      timeout: 8000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const server = String(resp.headers['server'] || '');
    const cfRay = resp.headers['cf-ray'] as string | undefined;
    const body = typeof resp.data === 'string' ? resp.data : '';
    const { captcha, unavailable } = classifyBody(resp.status, body);

    return {
      status: resp.status,
      captcha,
      unavailable,
      cloudflare: server.toLowerCase().includes('cloudflare') || !!cfRay,
      server,
      ray: cfRay,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unreachable';
    return {
      status: 0,
      captcha: false,
      unavailable: true,
      cloudflare: false,
      server: message,
    };
  }
}
