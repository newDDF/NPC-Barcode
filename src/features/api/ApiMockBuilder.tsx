import { useEffect, useState } from 'react';
import { useBarcodeConfig } from '../shared/BarcodeConfigContext';

const BASE_URL = 'https://api.npc-barcode.com/v1/generate';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition-all duration-150 focus:border-brand focus:bg-white focus:font-semibold focus:text-slate-950 focus:ring-2 focus:ring-brand/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:bg-slate-950 dark:focus:text-white';

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard access is unavailable.');
  }
}

export default function ApiMockBuilder() {
  const {
    barcodeType,
    payload,
    foreground,
    background,
    scale,
    height,
    errorLevel,
    showText,
  } = useBarcodeConfig();

  const [apiPayload, setApiPayload] = useState(payload);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setApiPayload(payload);
  }, [payload]);

  const params = new URLSearchParams({
    type: barcodeType,
    data: apiPayload,
    scale: String(scale),
    height: String(height),
    fg: foreground,
    bg: background,
    ec: errorLevel,
    text: showText ? '1' : '0',
  });

  const endpoint = `${BASE_URL}?${params.toString()}`;
  const imageTag = `<img src="${escapeAttribute(endpoint)}" alt="NPC-Barcode ${escapeAttribute(apiPayload)}" />`;

  async function handleCopy(value: string, label: string) {
    try {
      await copyText(value);
      setNotice(`${label} copied to clipboard.`);
    } catch {
      setNotice(`Could not copy ${label.toLowerCase()}.`);
    }

    window.setTimeout(() => setNotice(''), 2800);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <i className="fa-solid fa-code text-brand" aria-hidden="true" />
            Dynamic API URL Mock Builder
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Construct dynamic endpoint URLs with configured query parameters for web apps, image tags, and Markdown documents.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                API Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="api-base-url">
                    Base URL
                  </label>
                  <input
                    id="api-base-url"
                    className={inputClass}
                    value={BASE_URL}
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="api-type">
                      Barcode Type
                    </label>
                    <input
                      id="api-type"
                      className={inputClass}
                      value={barcodeType}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="api-error-level">
                      Error Correction
                    </label>
                    <input
                      id="api-error-level"
                      className={inputClass}
                      value={errorLevel}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="api-payload">
                    Barcode Payload
                  </label>
                  <textarea
                    id="api-payload"
                    rows={4}
                    className={`${inputClass} resize-y`}
                    value={apiPayload}
                    onChange={(event) => setApiPayload(event.target.value)}
                    placeholder="Enter barcode content..."
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This input is independent of the Single Generator.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Foreground</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <span
                        className="h-6 w-6 shrink-0 rounded-md border border-slate-300 dark:border-slate-700"
                        style={{ backgroundColor: foreground }}
                      />
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {foreground}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Background</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <span
                        className="h-6 w-6 shrink-0 rounded-md border border-slate-300 dark:border-slate-700"
                        style={{ backgroundColor: background }}
                      />
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {background}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Scale</label>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{scale}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Height</label>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{height}px</p>
                  </div>
                  <div>
                    <label className={labelClass}>Text</label>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                      {showText ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Generated GET Endpoint
                </h3>
                <span className="rounded-lg bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                  Live Preview
                </span>
              </div>

              <textarea
                aria-label="Generated GET endpoint"
                rows={5}
                className="w-full resize-y rounded-xl border border-[#1e293b] bg-[#0f172a] p-3 font-mono text-sm leading-6 text-[#34d399] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 selection:bg-brand/30"
                value={endpoint}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />

              <button
                type="button"
                onClick={() => void handleCopy(endpoint, 'URL')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffdd00] px-4 py-2.5 text-sm font-bold text-[#493900] shadow-sm transition hover:brightness-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#e7ca55]/40"
              >
                <i className="fa-solid fa-copy" aria-hidden="true" />
                Copy URL
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                HTML Image Tag
              </h3>

              <textarea
                aria-label="Generated HTML image tag"
                rows={4}
                className="w-full resize-y rounded-xl border border-[#1e293b] bg-[#0f172a] p-3 font-mono text-sm leading-6 text-[#34d399] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 selection:bg-brand/30"
                value={imageTag}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />

              <button
                type="button"
                onClick={() => void handleCopy(imageTag, 'HTML')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffdd00] px-4 py-2.5 text-sm font-bold text-[#493900] shadow-sm transition hover:brightness-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#e7ca55]/40"
              >
                <i className="fa-solid fa-copy" aria-hidden="true" />
                Copy HTML
              </button>
            </div>

            {notice && (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" role="status">
                {notice}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
