import { useEffect, useRef } from 'react';

export type LegalDocument = 'privacy' | 'terms';

interface LegalModalProps {
  document: LegalDocument;
  onClose: () => void;
}

const content = {
  privacy: {
    title: 'Privacy Policy',
    icon: 'fa-shield-halved',
    sections: [
      {
        title: '1. Information We Process',
        icon: 'fa-circle-info',
        body: 'NPC Barcode does not require an account. Barcode generation, QR code generation, and batch file processing are designed to run locally in your browser. Your input data and uploaded files are not intentionally transmitted to NPC Barcode servers by these local generation features.',
      },
      {
        title: '2. Local Storage',
        icon: 'fa-hard-drive',
        body: 'The website stores your theme preference in your browser local storage. This preference remains on your device and can be cleared through your browser settings.',
      },
      {
        title: '3. Hosting and Third-Party Services',
        icon: 'fa-cloud',
        body: 'The website is hosted through Cloudflare. Cloudflare may process technical request information, such as IP addresses, browser details, and request timestamps, for website delivery, security, and reliability. The website also loads the Font Awesome stylesheet from a third-party CDN.',
      },
      {
        title: '4. External Services',
        icon: 'fa-arrow-up-right-from-square',
        body: 'Some tools may generate URLs for external barcode API services. If you choose to visit or use an external service, your interactions are governed by that service’s own privacy policy and terms.',
      },
      {
        title: '5. Changes to This Policy',
        icon: 'fa-clock-rotate-left',
        body: 'This policy may be updated as the website and its services evolve. The latest revision date is shown below.',
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    icon: 'fa-file-contract',
    sections: [
      {
        title: '1. Acceptable Use',
        icon: 'fa-scale-balanced',
        body: 'You may use NPC Barcode to generate barcodes and QR codes for lawful purposes. You are responsible for ensuring that your use complies with applicable laws and third-party requirements.',
      },
      {
        title: '2. Accuracy and Verification',
        icon: 'fa-circle-check',
        body: 'Generated barcodes are provided as tools, without a guarantee that they will meet every scanner, industry, regulatory, or printing requirement. You are responsible for testing generated codes before production or distribution.',
      },
      {
        title: '3. User Content',
        icon: 'fa-file-lines',
        body: 'You retain responsibility for the data and files you enter or upload. Do not use the service to process content that you are not authorized to use.',
      },
      {
        title: '4. Availability',
        icon: 'fa-server',
        body: 'The service is provided on an “as is” and “as available” basis. Features may change, become unavailable, or contain errors. No guarantee of uninterrupted operation is made.',
      },
      {
        title: '5. Limitation of Liability',
        icon: 'fa-triangle-exclamation',
        body: 'To the extent permitted by applicable law, NPC Barcode and its operators are not liable for losses arising from the use of generated codes, service interruptions, or reliance on generated output.',
      },
      {
        title: '6. Changes to These Terms',
        icon: 'fa-rotate',
        body: 'These terms may be updated when the service changes. Continued use of the website after an update constitutes acceptance of the revised terms, to the extent permitted by law.',
      },
    ],
  },
};

export default function LegalModal({ document, onClose }: LegalModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const selected = content[document];

  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        tabIndex={-1}
        className="flex aspect-[4/3] max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-700">
          <h2 id="legal-modal-title" className="flex items-center gap-3 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
            <i className={`fa-solid ${selected.icon} text-[#ffdd00]`} aria-hidden="true" />
            {selected.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <p className="mb-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <i className="fa-regular fa-calendar-days" aria-hidden="true" />
            <span>Last updated: November 12, 2026</span>
          </p>
          <div className="space-y-5 sm:space-y-6">
            {selected.sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <i className={`fa-solid ${section.icon} w-4 text-center text-[#ffdd00]`} aria-hidden="true" />
                  <span>{section.title}</span>
                </h3>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
