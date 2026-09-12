# FILEFORGE

## Product Requirements Document + Full Engineering Build Prompt

**Product:** FileForge
**Working tagline:** Simple tools for your files.
**Category:** Browser-based file utility suite
**Primary promise:** Compress, resize and convert files privately, directly in the browser.
**Deployment model:** Static/serverless
**Backend:** None
**Authentication:** None
**Database:** None
**File uploads:** None
**Primary target:** Desktop + mobile web
**Design direction:** Premium, minimal, trustworthy, Awwwards-quality without being visually excessive.

---

# PART 1 — PRODUCT VISION

## 1.1 Vision

Build a free browser-based file utility platform that feels dramatically simpler and more premium than traditional file-tool websites while providing powerful processing underneath.

The product should compete conceptually with:

* iLovePDF
* Smallpdf
* Adobe Acrobat web
* Squoosh
* TinyPNG
* PDF24

But the product should differentiate itself through:

1. Exact target-size compression.
2. Automatic quality optimization.
3. Completely local browser processing.
4. No account.
5. No upload.
6. No server processing.
7. No artificial daily limits.
8. Extremely simple UX.
9. Advanced controls only when the user asks for them.
10. Separate dedicated tools rather than one giant editor.

The fundamental UX principle is:

> **Simple surface. Sophisticated engine.**

A normal user should not need to understand DPI, JPEG quantization, PDF object streams, font subsets, entropy coding, WASM, codecs, or compression presets.

The application should understand those things for them.

---

# PART 2 — CORE PRODUCT PRINCIPLES

## 2.1 Privacy first

Files must remain on the user's device.

The application must NOT upload:

* PDFs
* images
* documents
* metadata
* thumbnails
* processed files

to a backend.

All processing should happen locally using browser APIs, Web Workers and WASM.

The UI should prominently communicate:

> Your files never leave your device.

Do not make unverifiable claims such as "military-grade privacy."

Use precise language:

> Files are processed locally in your browser.

---

## 2.2 No account

Do not implement:

* Login
* Signup
* Google authentication
* Email authentication
* User profiles
* Passwords
* Cloud storage

The user should open the website and immediately use a tool.

---

## 2.3 No backend

Do not create:

* Express server
* Node API
* Python API
* database
* Redis
* object storage
* server-side file processing

The application should be deployable as static assets.

---

## 2.4 Separate tools

Do NOT create one giant "File Editor."

The product has dedicated tools.

Primary navigation:

* Compress
* Resize
* Convert
* PDF Tools

The user enters a dedicated workflow after selecting a tool.

Examples:

`/compress`

`/compress/pdf`

`/compress/image`

`/resize`

`/resize/image`

`/convert`

`/convert/image`

`/convert/pdf`

`/pdf-tools`

`/pdf-tools/merge`

`/pdf-tools/split`

etc.

---

# PART 3 — TARGET USERS

## 3.1 Primary user

A normal person who wants to perform a file operation without understanding technical details.

Examples:

"I need this PDF under 200 KB."

"I need this image to be 100 KB."

"I need this image resized to 1080 × 1080."

"I need to convert PNG to JPG."

"I need to merge these PDFs."

---

## 3.2 Secondary user

Power user who wants more control.

They can open:

> Advanced settings

Only then should technical controls become visible.

---

# PART 4 — PRODUCT STRUCTURE

## 4.1 Homepage

Homepage should be extremely clean.

Header:

* FileForge logo
* Compress
* Resize
* Convert
* PDF Tools
* Privacy
* Theme toggle if implemented

Hero:

### Simple tools for your files.

Subheading:

> Compress, resize and convert files — privately, directly in your browser.

Trust indicators:

* Local processing
* No uploads
* Free to use

Then tool cards.

---

## 4.2 Main tool cards

### Compress

Description:

> Reduce file size while keeping the best possible quality.

Supported:

* PDF
* JPG/JPEG
* PNG
* WebP
* potentially AVIF

---

### Resize

Description:

> Change dimensions or file size without unnecessary complexity.

Supported:

* JPG
* PNG
* WebP
* AVIF

---

### Convert

Description:

> Convert files between popular formats directly in your browser.

Examples:

* JPG → PNG
* PNG → JPG
* JPG → WebP
* PNG → WebP
* WebP → JPG
* JPG → AVIF
* PNG → AVIF
* PDF → image where supported
* image → PDF

---

### PDF Tools

Description:

> Everyday PDF tools without uploading your documents.

Tools:

* Merge PDF
* Split PDF
* Rotate PDF
* Reorder pages
* Delete pages
* Extract pages
* PDF → images
* Images → PDF
* PDF metadata tools where technically safe

---

# PART 5 — COMPRESSION UX

## 5.1 The most important feature

The user can specify:

> Target size

Example:

`200 KB`

The system MUST interpret the requirement literally.

If the user says:

> 200 KB

the final downloaded file MUST be:

`<= 200 KB`

Never:

`200.4 KB`

Never:

`201 KB`

Never:

`205 KB`

Never display:

> Target achieved

if the actual generated file exceeds the requested target.

---

# PART 6 — TARGET SIZE INPUT

Use a compact input:

```text
Target size

[ 200 ] [ KB ▼ ]
```

Units:

* KB
* MB

Internally normalize the target into bytes.

Use a clearly documented convention.

Recommended:

* 1 KB = 1024 bytes
* 1 MB = 1024 × 1024 bytes

Display sizes consistently throughout the product.

---

# PART 7 — DEFAULT COMPRESSION EXPERIENCE

Do NOT expose a "Simple mode" and "Advanced mode."

There should only be:

### Normal UI

and an expandable:

### Advanced settings

The normal interface should contain:

1. File upload/dropzone
2. Target size
3. Compress button
4. Advanced settings accordion

That's it.

---

# PART 8 — PDF COMPRESSION PAGE

Example:

```text
Compress PDF

Reduce your PDF while keeping the best possible quality.

┌──────────────────────────────────┐
│                                  │
│       Drop your PDF here         │
│                                  │
│       or Browse files            │
│                                  │
└──────────────────────────────────┘

Target size

[ 200 ] [ KB ▼ ]

[ Compress PDF ]

⌄ Advanced settings
```

Do not overwhelm the user with:

* DPI
* JPEG quality
* image sampling
* color space
* font subset
* object streams
* compatibility
* quantization

unless Advanced settings is expanded.

---

# PART 9 — PDF ADVANCED SETTINGS

When expanded:

```text
Advanced settings

Image quality
[ Auto ▼ ]

Image resolution
[ Auto ▼ ]

Color
[ Automatic ▼ ]

Grayscale
[ □ Convert to grayscale ]

Metadata
[ □ Remove unnecessary metadata ]

Font optimization
[ ✓ Optimize embedded fonts ]

Compatibility
[ Automatic ▼ ]
```

Possible values should be human-readable.

Do not expose raw Ghostscript command-line arguments.

Do not expose internal implementation terminology unless absolutely necessary.

---

# PART 10 — PDF COMPRESSION ENGINE

## 10.1 Architecture

Create an abstraction:

```ts
interface PdfCompressionEngine {
  analyze(input: Uint8Array): Promise<PdfAnalysis>;
  compress(
    input: Uint8Array,
    options: PdfCompressionOptions
  ): Promise<Uint8Array>;
}
```

Possible implementation:

```text
GhostscriptPdfEngine
```

But the rest of the application must never directly depend on Ghostscript.

This is extremely important because the PDF engine may need to change later due to:

* licensing
* browser compatibility
* WASM size
* performance
* quality
* maintenance
* commercial deployment

---

# PART 11 — PDF ANALYSIS

Before compression, analyze the PDF.

Determine as much as technically possible:

* page count
* page dimensions
* whether pages contain raster images
* image count
* image dimensions
* image formats
* approximate image sizes
* text/vector presence
* embedded fonts
* metadata
* whether the PDF appears scan-heavy
* whether it is primarily text/vector
* whether it contains large raster images

Create:

```ts
interface PdfAnalysis {
  pageCount: number;
  hasImages: boolean;
  imageCount: number;
  hasText: boolean;
  hasVectorContent: boolean;
  estimatedComplexity: "low" | "medium" | "high";
  documentType:
    | "text"
    | "scan"
    | "mixed"
    | "image-heavy"
    | "unknown";
}
```

The analysis should influence compression strategy.

---

# PART 12 — PDF COMPRESSION STRATEGY

The compressor should NOT simply rasterize every page.

That would:

* destroy text selectability
* destroy vector quality
* potentially increase size
* reduce accessibility
* make PDFs look worse

Instead:

1. Preserve text where possible.
2. Preserve vector content where possible.
3. Recompress embedded raster images.
4. Downsample oversized images.
5. Remove unnecessary metadata where appropriate.
6. Optimize fonts where possible.
7. Optimize PDF structure.
8. Measure output.
9. Repeat until target is reached.

---

# PART 13 — TARGET-SIZE SEARCH ALGORITHM

This is one of the most important pieces of the entire application.

The engine must optimize for:

```text
outputSize <= targetSize
```

while maximizing quality.

Conceptually:

```text
Find:
    highestQuality(configuration)

subject to:
    outputBytes <= targetBytes
```

Do NOT assume that one compression setting produces a predictable file size.

---

## 13.1 Candidate generation

Generate compression candidates.

For example:

```text
Candidate 1
High quality / high DPI

Candidate 2
High quality / medium DPI

Candidate 3
Medium-high quality / medium DPI

Candidate 4
Medium quality / medium DPI

Candidate 5
Medium quality / low DPI

Candidate 6
Low quality / low DPI
```

Measure every result.

---

## 13.2 Binary-search style optimization

Once a suitable range has been identified, search the quality parameter.

Example:

```text
quality = 90
output = 480 KB
target = 200 KB

quality = 80
output = 310 KB

quality = 70
output = 214 KB

quality = 68
output = 201 KB

quality = 67
output = 198 KB
```

Choose:

```text
67
```

because it is the highest-quality candidate that satisfies:

```text
<= 200 KB
```

---

# PART 14 — SAFETY MARGIN

Do not target exactly the byte boundary.

If target is:

```text
204800 bytes
```

and the compressor returns:

```text
204799 bytes
```

that is technically valid.

However, use a small internal safety margin where appropriate because some pipeline stages may alter output size.

The final output MUST still be explicitly measured after all processing.

Final validation:

```ts
if (output.byteLength > targetBytes) {
  // NOT SUCCESS
}
```

---

# PART 15 — IMPOSSIBLE TARGETS

Some files cannot be compressed to an extremely small target without severe quality loss.

Example:

```text
Input: 25 MB
Target: 20 KB
```

Do not endlessly retry.

Implement a maximum candidate budget.

If the target cannot reasonably be reached:

Display:

> We couldn't reach 20 KB without severely reducing quality.

Then show:

```text
Best result

24.8 MB → 183 KB

Target: 20 KB
```

Provide:

* Download best result
* Try stronger compression
* Open advanced settings

Never falsely claim target achievement.

---

# PART 16 — QUALITY PRIORITY

The engine's priority should be:

```text
1. Stay under target
2. Preserve readability
3. Preserve text
4. Preserve vector content
5. Preserve visual detail
6. Minimize unnecessary transformations
```

The compressor should not destroy a readable document just to save a few additional kilobytes.

---

# PART 17 — IMAGE COMPRESSION

Use browser-based WASM codecs.

Primary stack:

* jSquash JPEG/MozJPEG
* jSquash WebP
* jSquash AVIF
* jSquash OxiPNG
* jSquash resize

jSquash is specifically designed for browser and Web Worker environments and provides codecs including JPEG, WebP, AVIF, PNG optimization and resizing.

---

# PART 18 — IMAGE TARGET-SIZE ALGORITHM

For JPEG/WebP/AVIF:

```text
decode image
↓
inspect dimensions
↓
generate quality candidate
↓
encode
↓
measure bytes
↓
compare against target
↓
binary search quality
↓
return highest-quality result <= target
```

If quality alone cannot reach target:

```text
reduce dimensions gradually
↓
encode again
↓
measure
```

Prefer reducing dimensions before destroying visual quality excessively.

---

# PART 19 — PNG COMPRESSION

PNG is fundamentally different.

Lossless optimization may not be enough to reach an arbitrary target.

Therefore:

Default:

> Preserve PNG format.

Advanced option:

> Allow conversion to a smaller format

Potential options:

* WebP
* AVIF
* JPEG where appropriate

Do not silently convert a transparent PNG to JPEG because JPEG does not preserve alpha.

---

# PART 20 — IMAGE RESIZE TOOL

Dedicated page:

```text
Resize Image

[ Drop image ]

Width
[ 1080 ]

Height
[ 1080 ]

☑ Lock aspect ratio

Resize mode
[ Fit ▼ ]

[ Resize image ]
```

Modes:

* Fit
* Fill
* Exact
* Percentage

Optional:

```text
Output format
[ Keep original ▼ ]
```

---

# PART 21 — CONVERT TOOL

Dedicated page.

Example:

```text
Convert Image

[ Drop files ]

Convert to:

[ WebP ▼ ]

[ Convert ]
```

Do not show irrelevant technical settings.

Advanced settings may expose:

* quality
* metadata
* dimensions
* transparency behavior

---

# PART 22 — PDF TOOLS

Initial tools:

### Merge PDF

Input:

```text
[ file 1 ]
[ file 2 ]
[ file 3 ]
```

Allow drag-to-reorder.

CTA:

> Merge PDFs

---

### Split PDF

Options:

* Split by page range
* Every N pages
* Extract selected pages

---

### Rotate PDF

Allow:

* 90°
* 180°
* 270°

Per page or all pages.

---

### Delete Pages

Visual page thumbnails.

Click page → select → delete.

---

### Extract Pages

Select pages and create new PDF.

---

### Reorder Pages

Drag thumbnails.

---

# PART 23 — FILE PREVIEW

For PDFs:

Use PDF.js for rendering and previews. PDF.js provides browser-oriented PDF parsing/rendering and its display layer is intended for rendering PDF documents in web applications.

For images:

Use native browser decoding when possible.

Avoid unnecessary full-resolution canvas copies.

---

# PART 24 — PERFORMANCE ARCHITECTURE

Never perform heavy processing directly on the main UI thread.

Use:

```text
Main Thread
    |
    ├── UI
    ├── routing
    ├── user interaction
    |
    └── Workers
          ├── image worker
          ├── PDF worker
          └── compression worker
```

Workers should send progress events.

Example:

```ts
type ProcessingProgress = {
  stage:
    | "analyzing"
    | "optimizing"
    | "encoding"
    | "searching"
    | "validating"
    | "complete";

  progress: number;

  message: string;
};
```

---

# PART 25 — PROCESSING UI

Never show a fake progress bar.

Show actual stages.

Example:

```text
Compressing your PDF

✓ Analyzing document
✓ Optimizing images
● Finding best compression
○ Checking target size
```

Progress should reflect real work where possible.

---

# PART 26 — RESULT SCREEN

After processing:

```text
Compression complete

2.84 MB
↓
198.7 KB

93.0% smaller

✓ Target achieved
≤ 200 KB
```

Primary CTA:

```text
Download PDF
```

Secondary:

```text
Compare
```

Other:

```text
Compress another
```

---

# PART 27 — RESULT VALIDATION

Before rendering success:

```ts
const actualSize = result.byteLength;

const targetReached = actualSize <= targetBytes;
```

Only show:

```text
✓ Target achieved
```

if true.

Otherwise:

```text
Target not reached
```

Never trust an estimated output size.

Always measure the final Blob/Uint8Array.

---

# PART 28 — COMPARE VIEW

For image compression:

Use side-by-side:

```text
Original          Compressed
[preview]         [preview]
```

For PDF:

Show page preview comparison.

Display:

```text
Original: 2.84 MB
Compressed: 198.7 KB
```

Allow zoom.

Do not load unnecessarily large preview assets.

---

# PART 29 — BATCH PROCESSING

Support multiple images for:

* compression
* resize
* conversion

But do not process unlimited huge files simultaneously.

Implement a queue:

```text
Queue
↓
Worker
↓
Next item
```

Process large files sequentially when necessary to avoid browser memory exhaustion.

---

# PART 30 — MEMORY MANAGEMENT

Important.

A browser image can consume dramatically more RAM after decoding than its file size suggests.

For example:

```text
10 MB JPEG
```

may decode to hundreds of MB of raw pixel memory.

Therefore:

* inspect dimensions before decoding where possible
* process large files sequentially
* terminate workers after heavy jobs when appropriate
* release Blob URLs
* avoid retaining unnecessary ImageData
* avoid duplicate ArrayBuffers
* revoke object URLs
* implement cancellation

---

# PART 31 — CANCEL PROCESSING

Every long-running operation should support:

```text
Cancel
```

Worker must terminate gracefully.

Do not leave WASM memory or object URLs hanging around.

---

# PART 32 — DRAG AND DROP

Dropzone must support:

* drag/drop
* file picker
* mobile file picker

Visual states:

1. idle
2. hover
3. dragging
4. processing
5. success
6. error

---

# PART 33 — FILE VALIDATION

Validate:

* MIME type
* file extension
* size
* corruption
* browser support

Error examples:

> This file type isn't supported.

> This PDF appears to be damaged.

> This file is too large for reliable browser processing.

Avoid technical stack traces in the UI.

---

# PART 34 — SECURITY

Since files are local:

Do not:

* upload files
* send analytics containing file names
* log file contents
* store file contents remotely

Avoid:

```text
fetch("/upload")
```

There should be no upload endpoint.

Do not accidentally transmit:

* file name
* file size
* metadata
* EXIF
* PDF metadata
* document text

through analytics.

---

# PART 35 — ANALYTICS

MVP can ship without analytics.

If analytics is eventually added:

Only collect anonymous product events such as:

```text
tool_opened
compression_completed
conversion_completed
```

Never send:

* file name
* file contents
* document metadata
* image data
* PDF text

Privacy should remain a core differentiator.

---

# PART 36 — DESIGN SYSTEM

## Visual direction

The site should look:

* premium
* minimal
* editorial
* trustworthy
* modern
* calm
* fast
* polished

Avoid:

* excessive gradients
* excessive glassmorphism
* giant blobs
* AI-looking neon UI
* excessive animations
* 3D decoration everywhere
* noisy dashboards
* rainbow colors
* excessive cards

Think:

> premium productivity software

rather than:

> AI SaaS landing page.

---

# PART 37 — COLORS

Primary:

* White
* Near-white
* Black
* Dark charcoal

Functional accent colors can be restrained.

Suggested semantic accents:

PDF:

* muted red

Image:

* muted blue

Conversion:

* muted purple

Success:

* muted green

Do not make every component colorful.

---

# PART 38 — TYPOGRAPHY

Use a modern sans-serif.

Preferred:

* Inter
* Geist

Large headings should have tight tracking and strong hierarchy.

Example:

```text
Simple tools
for your files.
```

Do not use excessively oversized typography that destroys usability.

---

# PART 39 — COMPONENTS

Use shadcn/ui components rather than inventing every primitive from scratch.

Core components:

* Button
* Card
* Input
* Select
* Accordion
* Progress
* Badge
* Dialog
* Tooltip
* Tabs
* Dropdown
* Separator
* Toast
* Scroll Area

shadcn officially supports Vite projects and its current CLI supports Vite templates.

---

# PART 40 — ROUTING

Use React Router.

Suggested routes:

```text
/
 /compress
 /compress/pdf
 /compress/image

 /resize
 /resize/image

 /convert
 /convert/image
 /convert/pdf

 /pdf-tools
 /pdf-tools/merge
 /pdf-tools/split
 /pdf-tools/rotate
 /pdf-tools/reorder
 /pdf-tools/delete-pages
 /pdf-tools/extract-pages

 /privacy
```

Unknown routes should show a polished 404.

---

# PART 41 — PROJECT STRUCTURE

Use feature-oriented architecture.

```text
fileforge/
│
├── public/
│   ├── icons/
│   ├── fonts/
│   └── wasm/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── file-dropzone/
│   │   ├── file-list/
│   │   ├── file-preview/
│   │   ├── size-input/
│   │   ├── processing/
│   │   └── result/
│   │
│   ├── features/
│   │   ├── compress/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types.ts
│   │   │   └── utils/
│   │   │
│   │   ├── resize/
│   │   ├── convert/
│   │   │
│   │   └── pdf-tools/
│   │
│   ├── engines/
│   │   ├── pdf/
│   │   │   ├── PdfCompressionEngine.ts
│   │   │   ├── GhostscriptPdfEngine.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── image/
│   │   │   ├── ImageCompressionEngine.ts
│   │   │   ├── JsquashImageEngine.ts
│   │   │   └── types.ts
│   │   │
│   │   └── pdf-renderer/
│   │
│   ├── workers/
│   │   ├── image.worker.ts
│   │   ├── pdf.worker.ts
│   │   └── compression.worker.ts
│   │
│   ├── lib/
│   │   ├── bytes.ts
│   │   ├── file.ts
│   │   ├── validation.ts
│   │   ├── target-size/
│   │   │   ├── search.ts
│   │   │   ├── candidates.ts
│   │   │   └── scoring.ts
│   │   ├── memory/
│   │   └── download/
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CompressPdf.tsx
│   │   ├── CompressImage.tsx
│   │   ├── ResizeImage.tsx
│   │   ├── ConvertImage.tsx
│   │   ├── PdfTools.tsx
│   │   └── Privacy.tsx
│   │
│   ├── styles/
│   │
│   └── types/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── LICENSE
```

---

# PART 42 — TECHNOLOGY STACK

## Frontend

React + TypeScript + Vite.

## Styling

Tailwind CSS.

## UI

shadcn/ui.

## Icons

Lucide.

## Animation

Motion, used sparingly.

## PDF rendering

PDF.js.

## PDF manipulation

pdf-lib.

pdf-lib is designed to create and modify PDFs in browser/JavaScript environments and supports operations such as adding/removing pages, copying pages, drawing content and manipulating metadata.

## Image processing

jSquash.

## Processing

Web Workers.

## Storage

In-memory:

* ArrayBuffer
* Uint8Array
* Blob

Optional:

* OPFS for temporary/local workflows

Never cloud storage.

## ZIP

fflate.

## PWA

Service Worker.

## Hosting

Cloudflare Pages Free.

Current Free-plan Pages limits include 500 builds/month, 20,000 files/site and 25 MiB per deployed asset.

---

# PART 43 — WASM STRATEGY

Do NOT load every WASM codec on initial page load.

Use lazy loading.

Example:

Homepage:

```text
No compression WASM loaded.
```

User opens image compressor:

```text
Load image codec.
```

User opens PDF compressor:

```text
Load PDF engine.
```

This keeps initial page load fast.

---

# PART 44 — WASM ASSETS

WASM must be bundled and served locally.

Do not rely on random third-party CDN execution for the production application.

Use version-pinned dependencies.

Verify production Vite/WASM behavior.

jSquash's documentation specifically notes Vite/WASM integration considerations, so production bundling must be tested rather than assuming default imports will always work.

---

# PART 45 — PWA

After initial installation:

The application should ideally continue functioning offline.

Cache:

* application shell
* JavaScript
* CSS
* icons
* WASM assets
* fonts

Do not cache user files permanently by default.

---

# PART 46 — ACCESSIBILITY

Target:

WCAG 2.2 AA where practical.

Requirements:

* keyboard navigation
* visible focus
* semantic HTML
* accessible buttons
* labels for inputs
* screen-reader friendly progress
* sufficient contrast
* reduced-motion support
* no interaction dependent solely on drag/drop

---

# PART 47 — MOBILE

The product must work on:

* Android Chrome
* iPhone Safari
* desktop Chrome
* desktop Edge
* desktop Firefox
* Safari where feasible

Mobile UX:

* large upload target
* large buttons
* bottom-friendly controls
* no hover-only features
* compact advanced settings
* no giant desktop-only preview

---

# PART 48 — BROWSER LIMITS

Do not pretend that browsers can process infinite files.

For very large files:

Show:

> This file may require significant memory to process in your browser.

If necessary:

> For reliable processing, try a smaller file.

Do not crash the page.

---

# PART 49 — ERROR HANDLING

Errors must be user-friendly.

Never show:

```text
RuntimeError: abort(...
```

Instead:

```text
Something went wrong while processing this file.

The original file is untouched.

Try again or use a less aggressive setting.
```

Developer details should be logged only locally during development.

---

# PART 50 — DOWNLOADS

Generated files should download locally.

Use:

```ts
URL.createObjectURL(blob)
```

Then:

```ts
URL.revokeObjectURL(url)
```

after download.

Generate sensible names:

```text
document-compressed.pdf
photo-compressed.webp
image-resized.jpg
merged.pdf
```

---

# PART 51 — FILE NAME HANDLING

Sanitize filenames.

Do not inject filenames directly into HTML.

Preserve useful names.

Example:

```text
My Document.pdf
```

becomes:

```text
My Document-compressed.pdf
```

---

# PART 52 — PDF ENGINE LICENSING

This is a mandatory architecture requirement.

Ghostscript is an excellent candidate for PDF compression, but it is available under AGPL and commercial licensing. Artifex states that proprietary distribution/SaaS use requires the appropriate commercial licensing.

Therefore:

```text
Application
    |
    v
PdfCompressionEngine interface
    |
    ├── Ghostscript adapter
    |
    ├── Future permissive engine
    |
    └── Future commercial engine
```

Do NOT scatter Ghostscript-specific logic throughout the React application.

Create a clear licensing note in:

```text
/docs/licensing.md
```

Do not claim that the final product is legally cleared for commercial distribution.

---

# PART 53 — LICENSE FILE

Before publishing:

Determine the licensing strategy.

If the application includes AGPL Ghostscript components, do not simply publish the project as MIT without reviewing the resulting obligations.

The engineering agent must create:

```text
LICENSE
THIRD_PARTY_LICENSES.md
docs/licensing.md
```

where appropriate.

---

# PART 54 — TESTING

Testing is mandatory.

## Unit tests

Test:

* byte conversion
* target parsing
* size formatting
* filename generation
* target-size algorithm
* binary search
* candidate scoring
* cancellation
* validation

---

## Compression tests

Given:

```text
input
target = 200 KB
```

assert:

```text
output.byteLength <= 204800
```

when the engine reports target achieved.

---

## Boundary tests

Test:

```text
target = 1 KB
target = 10 KB
target = 200 KB
target = 1 MB
target = 10 MB
```

---

## Regression tests

Create fixture files:

* text PDF
* image-heavy PDF
* scanned PDF
* mixed PDF
* JPG
* PNG with transparency
* WebP
* very large image
* small image

---

# PART 55 — ACCEPTANCE CRITERIA

The MVP is not complete unless:

### UX

* Homepage looks premium.
* User immediately understands what the site does.
* Tools are separated.
* No technical terminology appears unnecessarily.
* Advanced settings are hidden by default.
* Mobile layout works.

### Privacy

* No file upload requests.
* No backend required.
* Processing occurs locally.

### Compression

* User can enter a target.
* Target can be KB or MB.
* Output is measured.
* "Target achieved" only appears when actual bytes <= target bytes.
* Quality is maximized within target.
* Impossible targets are handled honestly.

### Performance

* Heavy work happens in workers.
* UI stays responsive.
* WASM is lazy loaded.
* Object URLs are cleaned up.
* Cancellation works.

### PDF

* PDF preview works.
* PDF compression works through an engine adapter.
* Text/vector preservation is prioritized.
* Output is validated.

### Images

* JPEG compression works.
* PNG optimization works.
* WebP works.
* AVIF support is architecturally prepared.
* Resize works.

### Deployment

* `npm run build` succeeds.
* Production build works on Cloudflare Pages.
* No server is required.

---

# PART 56 — MVP PRIORITY

Do NOT attempt to build everything simultaneously.

Build in this order.

## Phase 1

Foundation:

* Vite
* React
* TypeScript
* Tailwind
* shadcn
* routing
* design system
* homepage
* navigation
* dropzone
* responsive layout

---

## Phase 2

Image compressor:

* JPEG
* PNG
* WebP
* target size
* quality search
* worker
* result screen

This validates the core target-size engine.

---

## Phase 3

PDF compressor:

* PDF upload
* PDF analysis
* PDF preview
* compression engine adapter
* target-size search
* result validation
* advanced settings

---

## Phase 4

Resize.

---

## Phase 5

Convert.

---

## Phase 6

PDF tools.

---

## Phase 7

PWA/offline.

---

## Phase 8

Polish.

---

# PART 57 — SUCCESS METRICS

Primary:

### Target accuracy

Percentage of successful jobs where:

```text
actual output <= requested target
```

Goal:

> 100% for jobs reported as "target achieved."

---

### Quality

Output should remain visually usable.

For PDF:

* text readable
* pages not visibly destroyed
* images reasonably clear

For images:

* no obvious artifacts at normal viewing size

---

### UX

A first-time user should be able to:

```text
open website
↓
choose Compress
↓
drop file
↓
enter target
↓
click Compress
↓
download result
```

without documentation.

---

# PART 58 — FINAL PRODUCT FEEL

The final website should feel like:

> "I don't need to know how this works. I just tell it what I need and it handles the rest."

The product should NOT feel like:

> "Here are 37 compression parameters. Good luck."

The complexity belongs inside the engine.

The simplicity belongs in the interface.

---

# PART 59 — FULL OPENCODE BUILD PROMPT

The following is the implementation prompt to give to OpenCode.

---

## OPENCODE MASTER PROMPT

You are the lead engineer, product designer and QA engineer for a production-quality browser application called **FileForge**.

Build the application completely, not as a mockup.

Do not stop after creating the UI.

Do not leave major functionality as TODOs.

Do not create fake compression logic.

Do not create fake progress bars.

Do not create fake "privacy" behavior while secretly uploading files.

Everything must work locally in the browser.

---

## PRODUCT

FileForge is a free browser-based file utility application.

Core promise:

> Compress, resize and convert files privately, directly in your browser.

The product should compete conceptually with iLovePDF, Smallpdf, Adobe Acrobat web and Squoosh, but provide a cleaner UX and exact target-size workflows.

The primary differentiator is:

> If the user asks for 200 KB, the final output must be <= 200 KB.

The interface should remain extremely simple.

Complexity belongs inside the processing engine.

---

# NON-NEGOTIABLE REQUIREMENTS

1. No backend.
2. No database.
3. No authentication.
4. No cloud storage.
5. No file uploads.
6. No server-side file processing.
7. All file processing must happen locally.
8. Heavy processing must use Web Workers.
9. WASM must be lazy-loaded.
10. Final file size must always be measured.
11. Never report target success when output > target.
12. Do not rasterize PDFs unnecessarily.
13. Preserve PDF text/vector content where possible.
14. Advanced settings are hidden by default.
15. Do not create Simple/Advanced modes.
16. Tools must be separate pages.
17. UI must be premium, minimal and non-technical.
18. Do not overuse animations.
19. Do not create an all-in-one editor.
20. Build reusable architecture instead of one giant component.

---

# STEP 1 — INSPECT THE REPOSITORY

Before modifying anything:

1. Inspect the repository.
2. Identify the existing framework.
3. Inspect package.json.
4. Inspect source structure.
5. Inspect current routes.
6. Inspect existing styles.
7. Determine whether the repository already contains useful components.
8. Do not destroy working functionality unnecessarily.

If this is an empty repository, scaffold the project.

If an existing implementation exists, integrate with it rather than blindly replacing everything.

---

# STEP 2 — STACK

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide
* React Router
* Motion where useful
* PDF.js
* pdf-lib
* jSquash
* Web Workers
* browser Blob/ArrayBuffer APIs

Do not add unnecessary dependencies.

Every dependency must have a clear purpose.

---

# STEP 3 — DESIGN SYSTEM

Create a premium white-first design.

Visual language:

* white / off-white background
* black typography
* subtle gray borders
* subtle shadows
* restrained accents
* generous whitespace
* rounded but not excessively rounded cards
* excellent typography
* excellent spacing
* strong visual hierarchy

Avoid:

* neon
* excessive gradients
* giant glass effects
* excessive blobs
* AI slop aesthetics
* huge decorative illustrations
* unnecessary 3D
* excessive motion

The product should look like premium productivity software.

---

# STEP 4 — GLOBAL LAYOUT

Create:

```text
Header
Main
Footer
```

Header:

```text
FileForge
Compress
Resize
Convert
PDF Tools
Privacy
```

Responsive navigation.

Desktop:

horizontal navigation.

Mobile:

compact menu.

---

# STEP 5 — HOMEPAGE

Create:

Hero:

```text
Simple tools
for your files.
```

Subheading:

```text
Compress, resize and convert files —
privately, directly in your browser.
```

Trust badges:

```text
Local processing
No uploads
Free to use
```

Then four primary cards:

```text
Compress
Resize
Convert
PDF Tools
```

Each card must navigate to its dedicated route.

Do not make the cards fake.

---

# STEP 6 — ROUTES

Implement:

```text
/
 /compress
 /compress/pdf
 /compress/image

 /resize
 /resize/image

 /convert
 /convert/image

 /pdf-tools
 /pdf-tools/merge
 /pdf-tools/split
 /pdf-tools/rotate
 /pdf-tools/reorder
 /pdf-tools/delete-pages
 /pdf-tools/extract-pages

 /privacy
```

Create polished 404.

---

# STEP 7 — REUSABLE FILE DROPZONE

Create:

```text
FileDropzone
```

Features:

* drag/drop
* browse
* keyboard accessible
* mobile picker
* accepted file types
* file validation
* drag-over state
* error state

Props should support:

```ts
accept
multiple
maxSize
onFiles
disabled
```

---

# STEP 8 — SIZE INPUT

Create reusable:

```text
TargetSizeInput
```

UI:

```text
[ 200 ] [ KB ▼ ]
```

Units:

* KB
* MB

Normalize to bytes.

Create utilities:

```ts
parseTargetSize()
formatBytes()
```

Use a single consistent byte convention throughout the application.

---

# STEP 9 — IMAGE ENGINE

Create:

```text
ImageCompressionEngine
```

with an implementation based on jSquash.

Support:

* JPEG
* PNG
* WebP

Architecturally prepare:

* AVIF

Do not load all codecs on application startup.

Load them only when needed.

---

# STEP 10 — IMAGE TARGET SIZE

Implement a real target-size optimizer.

Algorithm:

```text
input
↓
decode
↓
inspect dimensions
↓
try high-quality encoding
↓
measure
↓
if <= target:
    attempt higher quality
else:
    lower quality
↓
binary search
↓
if quality floor reached:
    reduce dimensions
↓
repeat
↓
validate final bytes
```

The algorithm must return:

```ts
{
  blob,
  bytes,
  quality,
  width,
  height,
  targetReached
}
```

---

# STEP 11 — PDF ENGINE ABSTRACTION

Create:

```ts
interface PdfCompressionEngine {
  analyze(input: Uint8Array): Promise<PdfAnalysis>;

  compress(
    input: Uint8Array,
    options: PdfCompressionOptions
  ): Promise<Uint8Array>;
}
```

Never directly couple React components to Ghostscript.

Create an adapter:

```text
GhostscriptPdfEngine
```

if the repository's licensing/deployment strategy permits it.

Keep the interface replaceable.

Create documentation explaining the licensing dependency.

---

# STEP 12 — PDF ANALYSIS

Analyze:

* pages
* images
* text
* vectors
* metadata
* approximate complexity

Determine:

```text
text
scan
mixed
image-heavy
unknown
```

Use the result to select compression candidates.

---

# STEP 13 — PDF COMPRESSION

Default behavior should resemble the "good quality / good compression" philosophy of mainstream PDF compressors.

Do not expose technical settings by default.

Preserve:

* text
* vectors
* page structure

Optimize:

* raster images
* oversized images
* metadata
* fonts where safe
* PDF structure

Do not rasterize the whole document by default.

---

# STEP 14 — PDF TARGET SIZE

Implement candidate search.

For each candidate:

```text
compress
↓
measure actual bytes
↓
record quality metrics
```

Find the highest-quality candidate where:

```text
bytes <= targetBytes
```

Do not estimate.

Do not trust compression presets blindly.

Do not stop merely because a candidate "should" be under the target.

Actually inspect its byte length.

---

# STEP 15 — QUALITY SCORING

Create an internal score.

For example:

```ts
score =
  visualQuality
  + textPreservation
  + resolutionQuality
  + structuralPreservation
```

subject to:

```text
outputBytes <= targetBytes
```

The precise scoring implementation is up to you, but document it.

The engine should prefer:

```text
higher quality
```

when multiple outputs satisfy the target.

---

# STEP 16 — IMPOSSIBLE TARGETS

Implement a maximum number of attempts.

Do not run infinite compression loops.

If target cannot be reached:

Show:

```text
We couldn't reach your target without severely reducing quality.
```

Then show the best available result.

Never falsely show:

```text
Target achieved
```

---

# STEP 17 — ADVANCED SETTINGS

Create an accordion:

```text
Advanced settings
```

Collapsed initially.

Possible settings:

```text
Image quality
Resolution
Color mode
Grayscale
Metadata
Font optimization
Compatibility
```

Default everything to:

```text
Auto
```

Do not expose raw engine flags.

---

# STEP 18 — PROCESSING UI

Create reusable:

```text
ProcessingView
```

Stages:

```text
Analyzing file
Optimizing
Finding best compression
Checking target size
Finalizing
```

Only mark a stage complete when it is actually complete.

Allow:

```text
Cancel
```

---

# STEP 19 — WORKERS

Create:

```text
image.worker.ts
pdf.worker.ts
compression.worker.ts
```

Do not perform heavy WASM compression on the main thread.

Define typed worker messages.

Example:

```ts
type WorkerMessage =
  | {
      type: "progress";
      stage: string;
      progress: number;
    }
  | {
      type: "result";
      data: ArrayBuffer;
    }
  | {
      type: "error";
      message: string;
    };
```

---

# STEP 20 — MEMORY SAFETY

Implement:

* Blob URL cleanup
* worker cleanup
* cancellation
* buffer release where possible
* sequential processing for large files
* no unnecessary copies

Do not process dozens of huge images simultaneously.

Use a queue.

---

# STEP 21 — RESULT SCREEN

Create reusable:

```text
CompressionResult
```

Example:

```text
Compression complete

2.84 MB
↓
198.7 KB

93.0% smaller

✓ Target achieved
≤ 200 KB

[ Download PDF ]

[ Compare ]

[ Compress another ]
```

Only display target success if:

```ts
result.byteLength <= targetBytes
```

---

# STEP 22 — COMPARE

Implement a clean comparison UI.

Images:

```text
Original | Compressed
```

PDF:

Allow page preview comparison.

Do not create a giant complicated editor.

---

# STEP 23 — RESIZE

Implement:

```text
Resize Image
```

Controls:

```text
Width
Height
Lock aspect ratio
Resize mode
Output format
```

Modes:

* Fit
* Fill
* Exact
* Percentage

---

# STEP 24 — CONVERSION

Implement:

```text
JPG → PNG
PNG → JPG
JPG → WebP
PNG → WebP
WebP → JPG
JPG → AVIF
PNG → AVIF
```

Only show valid output formats.

Handle transparency safely.

Never silently destroy transparency without informing the user.

---

# STEP 25 — PDF TOOLS

Implement:

### Merge

* multiple PDFs
* reorder
* merge

### Split

* page ranges
* selected pages
* every N pages

### Rotate

* selected pages
* all pages

### Delete

* thumbnail selection
* delete selected pages

### Extract

* select pages
* generate new PDF

### Reorder

* drag thumbnails

Use pdf-lib where appropriate.

---

# STEP 26 — PDF PREVIEW

Use PDF.js.

Create reusable:

```text
PdfPreview
PdfPageThumbnail
PdfPageGrid
```

Lazy render pages where possible.

Do not render hundreds of high-resolution pages simultaneously.

---

# STEP 27 — ERROR UX

Never expose raw errors.

Bad:

```text
RuntimeError: abort
```

Good:

```text
We couldn't process this file.

The original file hasn't been changed.

Try again or use a less aggressive setting.
```

Keep detailed error information available through development logging.

---

# STEP 28 — PRIVACY PAGE

Create a concise privacy page.

Explain:

```text
Your files are processed locally in your browser.

They are not uploaded to FileForge's servers.
```

Do not make claims that aren't technically true.

Explain that browser/device limitations may affect very large files.

---

# STEP 29 — PWA

Implement a service worker after core functionality works.

Cache:

* app shell
* JS
* CSS
* icons
* fonts
* WASM assets

Do not permanently cache user files.

---

# STEP 30 — PERFORMANCE

Optimize for:

* fast first paint
* lazy-loaded routes
* lazy-loaded codecs
* worker processing
* code splitting
* no unnecessary dependencies
* no giant initial WASM bundle

The homepage must not load every compressor.

---

# STEP 31 — ACCESSIBILITY

Implement:

* keyboard navigation
* visible focus
* semantic labels
* accessible dialogs
* accessible accordions
* progress announcements
* reduced-motion preference
* sufficient contrast

Drag/drop must never be the only way to select files.

---

# STEP 32 — RESPONSIVE DESIGN

Test:

* 320px mobile
* 375px
* 390px
* 768px
* 1024px
* 1440px
* 1920px

The UI must remain usable at every size.

---

# STEP 33 — TESTS

Create unit tests for:

```text
parseTargetSize
formatBytes
target-size search
candidate scoring
filename generation
validation
```

Create integration tests for:

```text
upload image
compress image
target achieved
target not achieved
download
cancel
PDF upload
PDF preview
```

Add regression fixtures.

---

# STEP 34 — TARGET SIZE TEST

This test is mandatory.

Given:

```text
target = 200 KB
```

if the engine reports success:

```ts
expect(result.byteLength).toBeLessThanOrEqual(204800);
```

Also test targets around boundaries.

---

# STEP 35 — NO FAKE FEATURES

Do not implement placeholders such as:

```text
// TODO: compression
return originalFile;
```

Do not implement fake:

```text
97% smaller
```

Do not hard-code result sizes.

Do not use simulated compression.

Do not fake progress.

Everything displayed must correspond to real processing.

---

# STEP 36 — NO OVERENGINEERING

Do not introduce:

* Redux unless actually necessary
* backend
* database
* authentication
* cloud storage
* unnecessary state management
* unnecessary component abstractions

Prefer simple React state and feature-local hooks.

---

# STEP 37 — DOCUMENTATION

Create:

```text
README.md
docs/architecture.md
docs/compression.md
docs/licensing.md
docs/deployment.md
docs/testing.md
```

Explain:

* architecture
* target-size algorithm
* worker architecture
* WASM handling
* PDF engine abstraction
* licensing considerations
* deployment

---

# STEP 38 — DEPLOYMENT

Make the application deployable to Cloudflare Pages.

Required:

```text
npm install
npm run dev
npm run build
npm run preview
```

Build must produce a static site.

No server process should be required.

---

# STEP 39 — PRODUCTION CHECK

Before considering the project finished:

Run:

```text
typecheck
lint
tests
build
```

Fix all errors.

Then manually inspect:

* homepage
* compression
* resize
* conversion
* PDF tools
* mobile
* dark/light if implemented
* error states
* empty states
* loading states
* success states

---

# STEP 40 — FINAL QUALITY BAR

Do not stop at "technically works."

The final result should feel like a real product.

Ask yourself:

1. Does it look premium?
2. Can a non-technical user understand it immediately?
3. Is the primary CTA obvious?
4. Is there unnecessary UI?
5. Is the compression result trustworthy?
6. Does target-size behavior actually work?
7. Is the UI responsive?
8. Does processing remain responsive?
9. Are errors understandable?
10. Is the privacy claim technically honest?

If the answer to any is no, fix it.

---

# FINAL IMPLEMENTATION ORDER

Implement in this exact sequence:

```text
1. Repository inspection
2. Project foundation
3. Design system
4. Global layout
5. Routing
6. Homepage
7. FileDropzone
8. TargetSizeInput
9. Worker infrastructure
10. Image engine
11. Image target-size algorithm
12. Image result UI
13. PDF rendering
14. PDF engine abstraction
15. PDF compression engine
16. PDF target-size algorithm
17. PDF result UI
18. Resize
19. Convert
20. PDF tools
21. Error handling
22. Cancellation
23. Memory cleanup
24. Testing
25. PWA
26. Performance optimization
27. Accessibility
28. Documentation
29. Production build
30. Final QA
```

Do not jump directly to advanced PDF tools before the core compression pipeline is actually working.

The most important feature is the target-size compression engine.

Prioritize correctness over adding more tools.

---

# DEFINITION OF DONE

FileForge is considered complete when a real user can:

```text
Open FileForge
↓
Click Compress
↓
Choose PDF
↓
Drop a PDF
↓
Enter 200 KB
↓
Click Compress
↓
Wait while the actual browser engine processes it
↓
Receive a real compressed PDF
↓
Verify that its actual byte size is <= 200 KB
↓
Download it
```

while:

* no file was uploaded
* no backend was required
* the UI stayed responsive
* the PDF remained usable
* the result was actually measured
* the target claim was truthful
* the interface remained simple

That is the core product.

Build that extremely well before expanding the platform.
