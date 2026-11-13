import { normalizeRetailBarcode } from '../shared/checkDigits';
import { useRef, useState } from 'react';
import type bwipjs from 'bwip-js/browser';
import { saveAs } from 'file-saver';
import { useBarcodeConfig } from '../shared/BarcodeConfigContext';

type SpreadsheetRow = unknown[];

const panelClass =
  'rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/90';

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-white';

function imageToPngDataUrl(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

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

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function createPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not create PNG image.'));
      }
    }, 'image/png');
  });
}

function createUniqueFilename(
  value: string,
  usedNames: Set<string>,
): string {
  const base = value.replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';
  let filename = `${base}.png`;
  let suffix = 2;

  while (usedNames.has(filename.toLowerCase())) {
    filename = `${base}_${suffix}.png`;
    suffix += 1;
  }

  usedNames.add(filename.toLowerCase());
  return filename;
}

export default function BatchProcessor() {
  const {
    barcodeType,
    foreground,
    background,
    scale,
    height,
    padding,
    errorLevel,
    showText,
    textColor,
    applyTextToBatchApi,
    logoImage,
    logoSize,
  } = useBarcodeConfig();

  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [namingMode, setNamingMode] = useState<'data' | 'index'>('data');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  async function loadFile(file?: File) {
    if (!file) return;

    setError('');
    setStatus('Reading spreadsheet...');
    setRows([]);
    setHeaders([]);
    setSelectedColumn('');
    setProgress(0);
    setGeneratedCount(0);
    setFailedCount(0);

    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error('The spreadsheet does not contain a worksheet.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as SpreadsheetRow[];

      if (matrix.length < 2) {
        throw new Error('The spreadsheet must contain a header row and at least one data row.');
      }

      const nextHeaders = matrix[0].map((value, index) => {
        const label = displayValue(value).trim();
        return label || `Unnamed Column ${index + 1}`;
      });

      const dataRows = matrix.slice(1);

      setFileName(file.name);
      setHeaders(nextHeaders);
      setRows(dataRows);
      setSelectedColumn('0');
      setStatus(`Loaded ${dataRows.length.toLocaleString()} data rows.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to read the spreadsheet.');
      setStatus('');
    }
  }

  async function processBatch() {
    if (!rows.length || selectedColumn === '') return;

    const columnIndex = Number(selectedColumn);

    if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= headers.length) {
      setError('Please select a valid data column.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setGeneratedCount(0);
    setFailedCount(0);
    setError('');
    setStatus('Preparing barcode archive...');

    const usedNames = new Set<string>();
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    const isSquare = ['qrcode', 'datamatrix', 'azteccode'].includes(barcodeType);
    const isQr = barcodeType === 'qrcode';

    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const folder = zip.folder(`NPC_Barcodes_${barcodeType}`);

      if (!folder) {
        throw new Error('Could not create the ZIP archive folder.');
      }

      const qrModule = isQr
        ? await import('@rabbit-company/qrcode')
        : undefined;
      const bwipjs = !isQr
        ? (await import('bwip-js/browser')).default
        : undefined;

      for (let index = 0; index < rows.length; index += 1) {
        const value = displayValue(rows[index]?.[columnIndex]).trim();

        if (!value) {
          skipped += 1;
        } else {
          try {
            const normalizedValue = normalizeRetailBarcode(barcodeType, value);
            let blob: Blob;

            if (isQr) {
              if (!qrModule) throw new Error('QR Code engine is unavailable.');
              const { ErrorCorrectionLevel, QRCode } = qrModule;
              const qr = QRCode.encode(normalizedValue, {
                errorCorrectionLevel: {
                  L: ErrorCorrectionLevel.LOW,
                  M: ErrorCorrectionLevel.MEDIUM,
                  Q: ErrorCorrectionLevel.QUARTILE,
                  H: ErrorCorrectionLevel.HIGH,
                }[errorLevel as 'L' | 'M' | 'Q' | 'H'] ?? ErrorCorrectionLevel.MEDIUM,
                boostEcc: false,
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

              blob = await imageDataUrlToBlob(
                qr.toDataURL(svgOptions),
                'image/png',
              );
            } else {
              if (!bwipjs) throw new Error('Barcode engine is unavailable.');
              const canvas = document.createElement('canvas');

              const options: bwipjs.RenderOptions = {
                bcid: barcodeType,
                text: normalizedValue,
                scale,
                padding,
                barcolor: foreground.replace('#', ''),
                backgroundcolor: background.replace('#', ''),
                textcolor: (textColor ?? foreground).replace('#', ''),
                includetext: applyTextToBatchApi && showText,
              };

              if (!isSquare) {
                options.height = height / 10;
              }

              bwipjs.toCanvas(canvas, options);
              blob = await createPngBlob(canvas);
            }

            const baseName = namingMode === 'index'
              ? `barcode_${index + 1}`
              : value;

            const outputName = createUniqueFilename(baseName, usedNames);

            folder.file(outputName, blob);
            succeeded += 1;
          } catch {
            failed += 1;
          }
        }

        const percentage = Math.round(((index + 1) / rows.length) * 100);
        setProgress(percentage);
        setGeneratedCount(succeeded);
        setFailedCount(failed);
        setStatus(`Processing record ${index + 1} of ${rows.length}...`);

        if ((index + 1) % 10 === 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        }
      }

      if (succeeded === 0) {
        throw new Error('No barcodes could be generated. Check the selected column and its values.');
      }

      setStatus('Creating ZIP archive...');

      const archive = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          setStatus(`Creating ZIP archive: ${Math.round(metadata.percent)}%`);
        },
      );

      saveAs(
        archive,
        `NPC_Batch_${barcodeType}_${Date.now()}.zip`,
      );

      setProgress(100);
      setGeneratedCount(succeeded);
      setFailedCount(failed);
      setStatus(
        `Completed: ${succeeded} generated, ${failed} failed, ${skipped} empty rows skipped.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Batch processing failed.');
      setStatus('Processing stopped.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void loadFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="space-y-6">
      <div className={panelClass}>
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <i className="fa-solid fa-layer-group text-brand" aria-hidden="true" />
              Batch Excel / CSV Processing
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Upload Excel/CSV spreadsheets, choose a data column, and download a ZIP archive of customized barcodes.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <span className="text-brand">◉</span>
            Inheriting style: {barcodeType} ({foreground})
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-3 md:col-span-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Step 1: Upload Spreadsheet File
            </h3>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => void loadFile(event.target.files?.[0])}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                isDragging
                  ? 'border-brand bg-brand/10'
                  : 'border-slate-300 bg-slate-50 hover:border-brand dark:border-slate-700 dark:bg-slate-950/50'
              }`}
            >
              <i className="fa-solid fa-file-excel mb-3 text-4xl text-slate-400 transition group-hover:text-brand dark:text-slate-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Click to upload or drag &amp; drop spreadsheet
              </span>
              <span className="mt-2 text-xs text-slate-500">
                Supports .xlsx, .xls and .csv · 1,000+ rows
              </span>
              {fileName && (
                <span className="mt-4 max-w-full break-all rounded-lg bg-brand/10 px-3 py-2 text-xs font-medium text-brand">
                  {fileName}
                </span>
              )}
            </div>

            {headers.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {headers.length} columns · {rows.length.toLocaleString()} data rows
              </p>
            )}
          </div>

          <div className="space-y-5 md:col-span-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Step 2: Configure Processing Settings
            </h3>

            <div>
              <label className={labelClass} htmlFor="batch-column">
                Target Data Column
              </label>
              <select
                id="batch-column"
                className={inputClass}
                value={selectedColumn}
                disabled={!headers.length || isProcessing}
                onChange={(event) => setSelectedColumn(event.target.value)}
              >
                {headers.length === 0 && <option value="">Upload a spreadsheet first</option>}
                {headers.map((header, index) => (
                  <option key={index} value={String(index)}>
                    Column {index + 1}: {header}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="batch-filename">
                Output Filename Scheme
              </label>
              <select
                id="batch-filename"
                className={inputClass}
                value={namingMode}
                disabled={!headers.length || isProcessing}
                onChange={(event) => setNamingMode(event.target.value as 'data' | 'index')}
              >
                <option value="data">Use Cell Content</option>
                <option value="index">Sequential Index (barcode_1, barcode_2...)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void processBatch()}
              disabled={!rows.length || selectedColumn === '' || isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffdd00] px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isProcessing ? 'Processing...' : 'Generate Batch Barcodes & Download ZIP'}
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{status}</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Generated: {generatedCount} · Failed: {failedCount}
            </p>
          </div>
        )}

        {!isProcessing && status && (
          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400" role="status">
            {status}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>

      {headers.length > 0 && (
        <div className={panelClass}>
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Spreadsheet Data Preview (First 5 Rows)
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {rows.length.toLocaleString()} total data rows
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Selected: {headers[Number(selectedColumn)] ?? 'None'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-max border-collapse text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className={`border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300 ${
                        selectedColumn === String(index) ? 'text-brand' : ''
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    {headers.map((_, columnIndex) => (
                      <td
                        key={columnIndex}
                        className={`max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-400 ${
                          selectedColumn === String(columnIndex) ? 'bg-brand/5' : ''
                        }`}
                      >
                        {displayValue(row[columnIndex]) || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
