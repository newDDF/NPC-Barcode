import { normalizeRetailBarcode } from '../shared/checkDigits';
import { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js/browser';
import { ErrorCorrectionLevel, QRCode } from '@rabbit-company/qrcode';
import { saveAs } from 'file-saver';
import { useBarcodeConfig } from '../shared/BarcodeConfigContext';

type Symbology = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

type BarcodePreset = {
  type: string;
  fg: string;
  bg: string;
  scale: number;
  height: number;
  ec: string;
  text: boolean;
  padding: number;
};

const symbologies: Symbology[] = [
  { id: 'qrcode', label: 'QR Code', description: '2D Square' , icon: 'fa-qrcode' },
  { id: 'code128', label: 'Code 128', description: '1D Linear' , icon: 'fa-barcode' },
  { id: 'ean13', label: 'EAN-13', description: 'Retail' , icon: 'fa-cart-shopping' },
  { id: 'datamatrix', label: 'Data Matrix', description: '2D Matrix' , icon: 'fa-grip' },
  { id: 'upca', label: 'UPC-A', description: 'Retail US' , icon: 'fa-box' },
  { id: 'code39', label: 'Code 39', description: '1D Alpha' , icon: 'fa-id-card' },
  { id: 'ean8', label: 'EAN-8', description: 'Compact' , icon: 'fa-tag' },
  { id: 'itf14', label: 'ITF-14', description: 'Shipping' , icon: 'fa-truck-ramp-box' },
  { id: 'pdf417', label: 'PDF417', description: '2D Stacked' , icon: 'fa-passport' },
  { id: 'azteccode', label: 'Aztec Code', description: '2D Square' , icon: 'fa-bullseye' },
];

const defaultPresets: Record<string, BarcodePreset> = {
  'Default QR Code': {
    type: 'qrcode',
    fg: '#000000',
    bg: '#ffffff',
    scale: 4,
    height: 50,
    ec: 'M',
    text: true,
    padding: 10,
  },
  'Standard Code 128': {
    type: 'code128',
    fg: '#0f172a',
    bg: '#ffffff',
    scale: 2,
    height: 60,
    ec: 'M',
    text: true,
    padding: 10,
  },
  'Retail EAN-13': {
    type: 'ean13',
    fg: '#000000',
    bg: '#ffffff',
    scale: 2,
    height: 50,
    ec: 'M',
    text: true,
    padding: 10,
  },
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

async function imageDataUrlToBlob(
  dataUrl: string,
  mimeType: string,
): Promise<Blob> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to render image.'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType);
  });

  if (!blob) throw new Error('Unable to create image data.');
  return blob;
}

function imageToPngDataUrl(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function readSavedPresets(): Record<string, BarcodePreset> {
  try {
    const saved = localStorage.getItem('npc_barcode_templates');
    if (saved) {
      return { ...defaultPresets, ...JSON.parse(saved) };
    }
  } catch {
    // Use built-in presets when stored data is unavailable.
  }

  return defaultPresets;
}

function getInitialPayload(type: string): string {
  if (type === 'ean13') return '690123456789';
  if (type === 'ean8') return '96385074';
  if (type === 'upca') return '012345678905';
  return 'https://npc-barcode.com';
}

export default function SingleGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    barcodeType, setBarcodeType, payload, setPayload,
    foreground, setForeground, background, setBackground,
    scale, setScale, height, setHeight, padding, setPadding,
    errorLevel, setErrorLevel, showText, setShowText,
    logoSize, setLogoSize, logoImage, setLogoImage,
  } = useBarcodeConfig();
  const [page, setPage] = useState(0);
  const [presets, setPresets] = useState(readSavedPresets);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [dimensions, setDimensions] = useState('0 × 0 px');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const isQr = barcodeType === 'qrcode';
  const isSquare = ['qrcode', 'datamatrix', 'azteccode'].includes(barcodeType);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isQr && !canvas) return;

    if (!payload.trim()) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setQrSvg('');
      setQrDataUrl('');
      setDimensions('0 × 0 px');
      setError('');
      return;
    }

    try {
      const normalizedPayload = normalizeRetailBarcode(barcodeType, payload);

      if (isQr) {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }

        const qr = QRCode.encode(normalizedPayload, {
          errorCorrectionLevel: logoImage
            ? ErrorCorrectionLevel.HIGH
            : ({
                L: ErrorCorrectionLevel.LOW,
                M: ErrorCorrectionLevel.MEDIUM,
                Q: ErrorCorrectionLevel.QUARTILE,
                H: ErrorCorrectionLevel.HIGH,
              }[errorLevel as 'L' | 'M' | 'Q' | 'H'] ?? ErrorCorrectionLevel.MEDIUM),
          boostEcc: true,
        });

        const logo = logoImage
          ? {
              content: imageToPngDataUrl(logoImage),
              size: Math.max(1, Math.floor(qr.size * Math.min(logoSize, 20) / 100)),
              padding: 1,
              background,
            }
          : undefined;

        const svgOptions = {
          scale: Math.max(1, scale),
          margin: Math.max(4, Math.round(padding / 2)),
          dark: foreground,
          light: background,
          title: 'QR Code',
          logo,
        };

        const svg = qr.toSVG(svgOptions);
        const dataUrl = qr.toDataURL(svgOptions);

        setQrSvg(svg);
        setQrDataUrl(dataUrl);
        setDimensions(
          `${(qr.size + svgOptions.margin * 2) * svgOptions.scale} × ${(qr.size + svgOptions.margin * 2) * svgOptions.scale} px`,
        );
      } else {
        if (!canvas) throw new Error('Barcode preview is unavailable.');

        setQrSvg('');
        setQrDataUrl('');

        const options: bwipjs.RenderOptions = {
          bcid: barcodeType,
          text: normalizedPayload,
          scale,
          padding,
          barcolor: foreground.replace('#', ''),
          backgroundcolor: background.replace('#', ''),
          includetext: showText,
          textxalign: 'center',
        };

        if (!isSquare) options.height = height / 10;

        bwipjs.toCanvas(canvas, options);
        setDimensions(`${canvas.width} × ${canvas.height} px`);
      }

      setError('');
    } catch (renderError) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setQrSvg('');
      setQrDataUrl('');
      setDimensions('Invalid barcode');
      setError(
        renderError instanceof Error
          ? renderError.message
          : 'Invalid content for the selected symbology.',
      );
    }
  }, [
    barcodeType,
    payload,
    foreground,
    background,
    scale,
    height,
    padding,
    errorLevel,
    showText,
    logoImage,
    logoSize,
    isQr,
    isSquare,
  ]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  }

  function selectSymbology(type: string) {
    setBarcodeType(type);
    setPayload((current) => {
      if (type === 'ean13' && !/^\d{12,13}$/.test(current)) return getInitialPayload(type);
      if (type === 'ean8' && !/^\d{7,8}$/.test(current)) return getInitialPayload(type);
      if (type === 'upca' && !/^\d{11,12}$/.test(current)) return getInitialPayload(type);
      return current;
    });
  }

  function handleLogoUpload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        setLogoImage(image);
        notify('Logo overlay added.');
      };

      image.onerror = () => notify('Unable to load this image.');
      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoImage(null);
    const input = document.getElementById('single-logo-input') as HTMLInputElement | null;
    if (input) input.value = '';
    notify('Logo overlay removed.');
  }

  async function downloadPng() {
    if (error || (isQr ? !qrDataUrl : !canvasRef.current?.width)) {
      notify('Please generate a valid barcode first.');
      return;
    }

    try {
      const blob = isQr
        ? await imageDataUrlToBlob(qrDataUrl, 'image/png')
        : await new Promise<Blob>((resolve, reject) => {
            canvasRef.current!.toBlob((result) => {
              if (result) resolve(result);
              else reject(new Error('Unable to export this barcode.'));
            }, 'image/png');
          });

      saveAs(blob, `NPC_${barcodeType}_${safeFileName()}.png`);
      notify('PNG downloaded successfully.');
    } catch {
      notify('Unable to export this barcode.');
    }
  }

  function downloadSvg() {
    if (error || (isQr ? !qrSvg : !canvasRef.current?.width)) {
      notify('Please generate a valid barcode first.');
      return;
    }

    if (isQr) {
      saveAs(
        new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' }),
        `NPC_${barcodeType}_${safeFileName()}.svg`,
      );
      notify('SVG downloaded successfully.');
      return;
    }

    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/></svg>`;

    saveAs(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
      `NPC_${barcodeType}_${safeFileName()}.svg`,
    );
    notify('SVG wrapper downloaded. Barcode image remains raster-based.');
  }

  function safeFileName() {
    return (payload.trim() || 'barcode')
      .slice(0, 15)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  async function copyImage() {
    if (error || (isQr ? !qrDataUrl : !canvasRef.current?.width)) {
      notify('Please generate a valid barcode first.');
      return;
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      notify('Image clipboard is not supported in this browser.');
      return;
    }

    try {
      const blob = isQr
        ? await imageDataUrlToBlob(qrDataUrl, 'image/png')
        : await new Promise<Blob>((resolve, reject) => {
            canvasRef.current!.toBlob((result) => {
              if (result) resolve(result);
              else reject(new Error('Unable to create image.'));
            }, 'image/png');
          });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      notify('Image copied to clipboard.');
    } catch {
      notify('Unable to copy image. Check browser permissions.');
    }
  }

  function savePreset() {
    const name = window.prompt(
      'Enter a name for this template:',
      `Preset_${Date.now().toString().slice(-4)}`,
    );

    if (!name?.trim()) return;

    const updated = {
      ...presets,
      [name.trim()]: {
        type: barcodeType,
        fg: foreground,
        bg: background,
        scale,
        height,
        ec: errorLevel,
        text: showText,
        padding,
      },
    };

    setPresets(updated);
    setSelectedPreset(name.trim());

    try {
      localStorage.setItem('npc_barcode_templates', JSON.stringify(updated));
      notify('Template saved.');
    } catch {
      notify('Unable to save template in browser storage.');
    }
  }

  function loadPreset(name: string) {
    setSelectedPreset(name);
    const preset = presets[name];
    if (!preset) return;

    setForeground(preset.fg || '#000000');
    setBackground(preset.bg || '#ffffff');
    setScale(preset.scale || 4);
    setHeight(preset.height || 50);
    setPadding(preset.padding ?? 10);
    setErrorLevel(preset.ec || 'M');
    setShowText(preset.text ?? true);
    setBarcodeType(preset.type || 'qrcode');
    setPayload(getInitialPayload(preset.type || 'qrcode'));
    setLogoImage(null);
    notify(`Loaded template: ${name}`);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <i className="fa-solid fa-pen-to-square text-brand" aria-hidden="true" />
              Symbology & Payload Configuration
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedPreset}
                onChange={(event) => loadPreset(event.target.value)}
                className="max-w-44 rounded-lg border border-slate-300 bg-slate-50 px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Saved Presets</option>
                {Object.keys(presets).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={savePreset}
                className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand/20"
              >
                <i className="fa-solid fa-floppy-disk mr-1" aria-hidden="true" /> Save
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <label className={labelClass}>Select Symbology (10 Formats)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => (current + 1) % 2 === 0 ? 1 : 0)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Previous symbology page"
                >
                  <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
                </button>
                <span className="font-mono text-xs text-slate-500">{page + 1}/2</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => (current + 1) % 2)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Next symbology page"
                >
                  <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-5">
              {symbologies.slice(page * 5, page * 5 + 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSymbology(item.id)}
                  className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                    barcodeType === item.id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <i
                    className={`fa-solid ${item.icon} mb-1 text-xl`}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                  <span className="mt-1 text-[9px] text-slate-400">{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass}>Payload Text / URL Content</label>
              <span className="text-[10px] text-slate-500">
                {barcodeType === 'ean13'
                  ? 'Must be 12 or 13 digits'
                  : barcodeType === 'ean8'
                    ? 'Must be 7 or 8 digits'
                    : barcodeType === 'upca'
                      ? 'Must be 11 or 12 digits'
                      : 'Supports text, URL and numeric values'}
              </span>
            </div>
            <textarea
              rows={3}
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              placeholder="Type text or website link..."
              className={`${inputClass} resize-y font-mono`}
            />
            {error && (
              <p className="mt-2 text-xs text-rose-500">
                Format Error: {error}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <i className="fa-solid fa-sliders text-brand" aria-hidden="true" />
              Customization & Visual Styling
            </h3>
            <button
              type="button"
              onClick={() => notify('Settings are already shared with Batch and API modules.')}
              className="inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand transition hover:bg-brand/20"
            >
              <i className="fa-solid fa-share-nodes" aria-hidden="true" />
              Apply to Batch & API Modules
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Colors (Foreground / Background)</label>
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="color"
                    value={foreground}
                    onChange={(event) => setForeground(event.target.value)}
                    className="barcode-color-input h-8 w-8 shrink-0 cursor-pointer"
                    aria-label="Foreground color"
                  />
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">Foreground</span>
                </div>
                <div className="h-6 w-px shrink-0 bg-slate-300 dark:bg-slate-800" />
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    className="barcode-color-input h-8 w-8 shrink-0 cursor-pointer"
                    aria-label="Background color"
                  />
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">Background</span>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Module Scale / Resolution: <span className="font-mono text-brand">{scale}</span></label>
              <input
                type="range"
                min="1"
                max="10"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className={labelClass}>Height (Linear Barcodes): <span className="font-mono text-brand">{height}px</span></label>
              <input
                type="range"
                min="20"
                max="150"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className={labelClass}>Margin / Quiet Zone: <span className="font-mono text-brand">{padding}px</span></label>
              <input
                type="range"
                min="0"
                max="40"
                value={padding}
                onChange={(event) => setPadding(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className={labelClass}>Error Correction Level</label>
              <select
                value={errorLevel}
                onChange={(event) => setErrorLevel(event.target.value)}
                disabled={!isQr}
                className={`${inputClass} disabled:opacity-40`}
              >
                <option value="L">L - Low (~7% recovery)</option>
                <option value="M">M - Medium (~15% recovery)</option>
                <option value="Q">Q - Quartile (~25% recovery)</option>
                <option value="H">H - High (~30% recovery)</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:col-span-2">
              <div>
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-300">Show Human Readable Text</span>
                <span className="text-[10px] text-slate-500">Applicable to 1D linear barcodes</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(event) => setShowText(event.target.checked)}
                  aria-label="Show Human Readable Text"
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors before:absolute before:left-[2px] before:top-[2px] before:h-5 before:w-5 before:rounded-full before:border before:border-slate-300 before:bg-white before:transition-transform before:content-[''] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-checked:bg-brand peer-checked:before:translate-x-5 peer-checked:before:border-white dark:bg-slate-800" />
              </label>
            </div>
          </div>

          {isQr && (
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <label className={labelClass}>QR Code Center Logo Overlay</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold transition hover:border-brand dark:border-slate-700 dark:bg-slate-950">
                  <i className="fa-solid fa-upload mr-1" aria-hidden="true" /> Upload Logo
                  <input
                    id="single-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                  />
                </label>
                {logoImage && (
                  <button type="button" onClick={removeLogo} className="text-xs text-rose-500 hover:underline">
                    <i className="fa-solid fa-trash-can mr-1" aria-hidden="true" /> Remove Logo
                  </button>
                )}
                <div className="flex min-w-44 flex-1 items-center gap-3">
                  <span className="whitespace-nowrap text-xs text-slate-500">Logo Scale: {logoSize}%</span>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    value={Math.min(logoSize, 20)}
                    onChange={(event) => setLogoSize(Number(event.target.value))}
                    className="w-full accent-brand"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:col-span-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 sm:sticky sm:top-24 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><i className="fa-solid fa-eye text-brand" aria-hidden="true" /> Live Render Preview</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[10px] text-slate-500 dark:bg-slate-800">
              {dimensions}
            </span>
          </div>

          <div className="flex min-h-[300px] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            {isQr && qrDataUrl && !error && payload.trim() ? (
              <img
                src={qrDataUrl}
                alt="Generated QR code"
                className="h-auto max-h-[350px] max-w-full rounded-sm object-contain shadow-md"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className={`h-auto max-h-[350px] max-w-full rounded-sm object-contain shadow-md ${
                  isQr || error || !payload.trim() ? 'hidden' : ''
                }`}
              />
            )}
            {(error || !payload.trim()) && (
              <p className="text-center text-xs text-slate-400">
                {error ? 'Unable to render this barcode.' : 'Enter content to preview rendering.'}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={downloadPng}
                className="rounded-xl bg-gradient-to-br from-brand-hover via-brand to-brand-dark px-3 py-3 text-xs font-bold text-slate-950 shadow-lg transition hover:brightness-110"
              >
                <i className="fa-solid fa-download mr-1" aria-hidden="true" /> Download PNG
              </button>
              <button
                type="button"
                onClick={downloadSvg}
                className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-3 text-xs font-semibold text-slate-800 transition hover:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <i className="fa-solid fa-file-code mr-1" aria-hidden="true" /> Download SVG
              </button>
            </div>
            <button
              type="button"
              onClick={copyImage}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 transition hover:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <i className="fa-solid fa-copy mr-1" aria-hidden="true" /> Copy Image to Clipboard
            </button>
          </div>
        </section>
      </aside>

      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-2xl">
          <span className="mr-2 text-brand">●</span>{notice}
        </div>
      )}
    </div>
  );
}
