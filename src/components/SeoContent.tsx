import { useMemo } from 'react';

type SeoPage = {
  path: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  sections: [string, string][];
  faqs: [string, string][];
};

const pages: Record<string, SeoPage> = {
  "home": {
    "path": "/",
    "title": "Free Barcode & QR Code Generator | NPC Barcode",
    "description": "Create customizable QR codes and barcodes online. Generate, preview, and export barcode images with local browser processing.",
    "heading": "Free Online Barcode and QR Code Generator",
    "intro": "Create customizable QR codes and barcodes directly in your browser. Configure colors, sizes, and output formats, then preview and export your results.",
    "sections": [
      [
        "Create QR Codes and Barcodes",
        "Generate QR codes and a range of common barcode formats with controls for appearance and output. Your generation workflow runs in your browser."
      ],
      [
        "Customize Your Output",
        "Adjust foreground and background colors, configure available format options, and preview your result before exporting."
      ],
      [
        "Export and Process Locally",
        "Download generated barcode images and use batch processing for multiple records. Local browser processing helps keep your input data on your device."
      ]
    ],
    "faqs": [
      [
        "Can I create QR codes for free?",
        "Yes. You can use the generator in your browser without creating an account."
      ],
      [
        "Can I customize barcode colors?",
        "The generator provides foreground and background color controls for supported formats."
      ],
      [
        "Can I generate multiple barcodes?",
        "Use the batch processing workspace to process multiple records."
      ]
    ]
  },
  "qr": {
    "path": "/qr-code-generator/",
    "title": "Free QR Code Generator Online | Customize & Download",
    "description": "Create custom QR codes online. Adjust colors and error correction settings, preview your QR code, and export it from your browser.",
    "heading": "Free QR Code Generator",
    "intro": "Create and customize QR codes online. Configure supported QR options, choose colors, preview the result, and export an image for your project.",
    "sections": [
      [
        "Create a QR Code",
        "Enter the content you want your QR code to represent and generate a scannable QR symbol in your browser."
      ],
      [
        "Customize QR Appearance",
        "Adjust foreground and background colors and use the available error correction settings to fit your intended use."
      ],
      [
        "Test Before Sharing",
        "Scan the exported QR code with more than one device and test it at the size and print quality you plan to use."
      ]
    ],
    "faqs": [
      [
        "Can I change QR code colors?",
        "Yes. Use the foreground and background color controls."
      ],
      [
        "What is QR error correction?",
        "Error correction allows a QR code to remain readable when some symbol data is damaged or obscured. Higher levels generally add redundancy."
      ],
      [
        "Should I test my QR code before printing?",
        "Yes. Test the exported image with multiple scanners and at its final printed size."
      ]
    ]
  },
  "barcode": {
    "path": "/barcode-generator/",
    "title": "Free Barcode Generator Online | Create Custom Barcodes",
    "description": "Generate customizable 1D barcodes online. Choose a supported barcode format, configure its appearance, and export your result.",
    "heading": "Free Online Barcode Generator",
    "intro": "Generate one-dimensional barcodes for product labels, inventory workflows, and other projects. Choose a supported symbology and configure the output.",
    "sections": [
      [
        "Choose a Barcode Format",
        "Select an available barcode symbology based on the data you need to encode and the requirements of your scanner or workflow."
      ],
      [
        "Configure Barcode Appearance",
        "Customize supported visual settings such as foreground color, background color, and human-readable text."
      ],
      [
        "Verify Barcode Compatibility",
        "Barcode standards have different data and length requirements. Verify your selected format and test the output with your target scanner."
      ]
    ],
    "faqs": [
      [
        "Which barcode formats are supported?",
        "The generator provides multiple formats. Available options are shown in the barcode type selector."
      ],
      [
        "Can I show human-readable text?",
        "Human-readable text can be enabled for supported barcode formats."
      ],
      [
        "Are generated barcodes guaranteed to scan?",
        "Scanning depends on format requirements, data validity, image quality, printing, and scanner compatibility. Always test your output."
      ]
    ]
  },
  "batch": {
    "path": "/batch-barcode-generator/",
    "title": "Batch Barcode Generator | Create Multiple Barcodes",
    "description": "Generate multiple barcodes from structured data with the NPC Barcode batch processing tool. Preview and export your results.",
    "heading": "Batch Barcode Generator",
    "intro": "Create multiple barcode images from structured input in one workflow. Use batch processing to prepare sets of codes for labels, records, and internal operations.",
    "sections": [
      [
        "Prepare Your Input Data",
        "Organize your records and fields before processing. Check that each value meets the requirements of the selected barcode format."
      ],
      [
        "Generate Multiple Codes",
        "Use the batch processing workspace to generate a set of barcode outputs without repeating the single-item workflow."
      ],
      [
        "Review and Export Results",
        "Inspect generated results and verify representative codes with your target scanners before using or distributing them."
      ]
    ],
    "faqs": [
      [
        "Can I generate many barcodes at once?",
        "Yes. The batch processing workspace is designed to process multiple records."
      ],
      [
        "Do all records use the same barcode format?",
        "Choose the available format and configuration in the batch workspace before processing."
      ],
      [
        "Should I validate batch results?",
        "Yes. Review the output and test representative codes, especially when preparing production labels."
      ]
    ]
  },
  "api": {
    "path": "/barcode-api/",
    "title": "Barcode API Mock Generator | NPC Barcode",
    "description": "Explore barcode API request and response examples with the NPC Barcode API mock generator. Build and inspect sample API payloads.",
    "heading": "Barcode API Mock Generator",
    "intro": "Explore barcode API request patterns and build mock payloads for development and integration planning with the API mock workspace.",
    "sections": [
      [
        "Build API Mock Payloads",
        "Use the API mock generator to configure example request data and inspect the resulting payload structure."
      ],
      [
        "Plan an Integration",
        "Review the generated request details and adapt the example to the requirements of your own application and API provider."
      ],
      [
        "Verify Provider Requirements",
        "This tool creates mock examples. Check the official documentation of your chosen API provider for authentication, parameters, limits, and response formats."
      ]
    ],
    "faqs": [
      [
        "Does the API mock generator make live API requests?",
        "It is intended to help build and inspect mock request data. Verify any live integration separately."
      ],
      [
        "Can I use the generated payload in production?",
        "Treat generated payloads as examples and adapt them to your provider's current API documentation."
      ],
      [
        "Where can I find API requirements?",
        "Refer to the official documentation published by the API provider you intend to use."
      ]
    ]
  },
  "types": {
    "path": "/barcode-types/",
    "title": "Barcode Types Explained | QR, UPC, EAN, Code 128",
    "description": "Learn about common barcode types, including QR codes and 1D barcode formats, and understand how to choose a format for your use case.",
    "heading": "Barcode Types and Formats",
    "intro": "Barcode formats are designed for different data, scanning, and industry requirements. Learn the basic differences before choosing a format for your project.",
    "sections": [
      [
        "QR Codes",
        "QR codes are two-dimensional symbols that can encode data such as URLs and text. They are commonly scanned by mobile devices and dedicated readers."
      ],
      [
        "UPC and EAN",
        "UPC and EAN are linear barcode families widely used in retail product identification. Use the specific standard required by your product and distribution channel."
      ],
      [
        "Code 128 and Other Linear Formats",
        "Code 128 supports a broad range of alphanumeric data and is commonly used in logistics and internal identification workflows. Other formats have their own data and application requirements."
      ]
    ],
    "faqs": [
      [
        "What is the difference between 1D and 2D barcodes?",
        "1D barcodes encode data using patterns of lines and spaces. 2D barcodes use a two-dimensional arrangement of modules."
      ],
      [
        "Which barcode type should I choose?",
        "Choose based on your data, scanner compatibility, industry standard, and the requirements of the system that will read the code."
      ],
      [
        "Can one scanner read every barcode type?",
        "No. Scanner capabilities vary. Confirm that your scanner supports the symbology you plan to use."
      ]
    ]
  },
  "guides": {
    "path": "/guides/",
    "title": "Barcode and QR Code Guides | NPC Barcode",
    "description": "Read practical guides to creating, customizing, testing, and exporting barcodes and QR codes for common workflows.",
    "heading": "Barcode and QR Code Guides",
    "intro": "Use these practical starting points to create, customize, test, and prepare barcode and QR code images for your workflow.",
    "sections": [
      [
        "How to Create a QR Code",
        "Choose the QR code generator, enter the content to encode, adjust the available settings, and generate a preview. Scan the result before sharing it."
      ],
      [
        "How to Prepare a Barcode for Printing",
        "Select the correct symbology, validate the encoded data, choose suitable dimensions, and test a printed sample with the intended scanner."
      ],
      [
        "How to Generate Barcodes in Batches",
        "Prepare structured records, select the appropriate format, run batch processing, and review the output before using it in a production workflow."
      ]
    ],
    "faqs": [
      [
        "What should I check before printing a barcode?",
        "Check the symbology, encoded data, dimensions, contrast, print quality, and scanner compatibility."
      ],
      [
        "How can I improve QR code scanning?",
        "Use sufficient size and contrast, preserve the quiet zone, avoid covering important modules, and test with multiple devices."
      ],
      [
        "Can I use generated codes commercially?",
        "Check the requirements of the relevant barcode standard, your industry, and any third-party systems involved."
      ]
    ]
  }
};

const links = [
  ['/qr-code-generator/', 'QR Code Generator'],
  ['/barcode-generator/', 'Barcode Generator'],
  ['/batch-barcode-generator/', 'Batch Barcode Generator'],
  ['/barcode-api/', 'Barcode API'],
  ['/barcode-types/', 'Barcode Types'],
  ['/guides/', 'Guides'],
];

export default function SeoContent() {
  const page = useMemo(() => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const keyByPath: Record<string, string> = {
      '/': 'home',
      '/qr-code-generator': 'qr',
      '/barcode-generator': 'barcode',
      '/batch-barcode-generator': 'batch',
      '/barcode-api': 'api',
      '/barcode-types': 'types',
      '/guides': 'guides',
    };
    return pages[keyByPath[path]] ?? pages.home;
  }, []);

  return (
    <section className="mx-auto mt-12 w-full max-w-5xl border-t border-slate-200 pt-10 dark:border-slate-800" aria-labelledby="seo-page-heading">
      <header className="mb-8">
        <h1 id="seo-page-heading" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {page.heading}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
          {page.intro}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {page.sections.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p>
          </article>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="seo-faq-heading">
        <h2 id="seo-faq-heading" className="text-2xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {page.faqs.map(([question, answer]) => (
            <details key={question} className="py-4">
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{question}</summary>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800" aria-label="Explore barcode tools and guides">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Explore NPC Barcode</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {links.map(([href, label]) => (
            <li key={href}><a className="text-slate-600 underline decoration-[#ffdd00] underline-offset-4 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" href={href}>{label}</a></li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
