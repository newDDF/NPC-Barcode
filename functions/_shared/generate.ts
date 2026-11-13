import * as bwipjs from 'bwip-js/generic';

const allowedMethods = 'GET, OPTIONS';
const allowedHeaders = 'Content-Type';

function responseHeaders(contentType: string): Headers {
  return new Headers({
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}

function jsonResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: responseHeaders('application/json; charset=utf-8'),
  });
}

function readNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number | null {
  const raw = params.get(key);
  if (raw === null || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

function normalizeColor(value: string | null, fallback: string): string | null {
  const color = value || fallback;
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) return null;
  return color.slice(1);
}

export async function handleGenerate({
  request,
}: {
  request: Request;
}): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders('text/plain') });
  }

  if (request.method !== 'GET') {
    return jsonResponse('Method not allowed. Use GET.', 405);
  }

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const type = (params.get('type') || 'qrcode').toLowerCase();
    const data = params.get('data') || '';

    if (!data.trim()) {
      return jsonResponse('The data parameter is required.', 400);
    }

    if (data.length > 4096) {
      return jsonResponse('The data parameter must not exceed 4096 characters.', 400);
    }

    if (!bwipjs.symbolList.some((item) => item.bcid === type)) {
      return jsonResponse('Unsupported barcode type.', 400);
    }

    const scale = readNumber(params, 'scale', 4, 1, 10);
    const height = readNumber(params, 'height', 50, 1, 200);
    const padding = readNumber(params, 'padding', 10, 0, 50);

    if (scale === null || height === null || padding === null) {
      return jsonResponse('Invalid scale, height, or padding value.', 400);
    }

    const foreground = normalizeColor(params.get('fg'), '#000000');
    const background = normalizeColor(params.get('bg'), '#ffffff');
    const textColor = normalizeColor(params.get('textcolor'), '#000000');

    if (!foreground || !background || !textColor) {
      return jsonResponse('Colors must be valid 3- or 6-digit hex values.', 400);
    }

    const errorLevel = (params.get('ec') || 'M').toUpperCase();
    if (!['L', 'M', 'Q', 'H'].includes(errorLevel)) {
      return jsonResponse('QR error correction must be L, M, Q, or H.', 400);
    }

    const includeText = params.get('text') === '1';

    const options = {
      bcid: type,
      text: data,
      scale,
      padding,
      barcolor: foreground,
      backgroundcolor: background,
      textcolor: textColor,
      includetext: includeText,
      textxalign: 'center' as const,
      textyalign: 'below' as const,
      ...(type === 'qrcode'
        ? { eclevel: errorLevel }
        : { height: height / 10 }),
    } as Parameters<typeof bwipjs.toSVG>[0];

    const svg = bwipjs.toSVG(options);

    return new Response(svg, {
      status: 200,
      headers: responseHeaders('image/svg+xml; charset=utf-8'),
    });
  } catch {
    return jsonResponse('Unable to generate this barcode. Check the input and options.', 400);
  }
}
