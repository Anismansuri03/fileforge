You are continuing development of the existing FileForge application.

DO NOT rebuild the application from scratch.

First inspect the current project, understand what is already implemented, preserve working functionality, and then upgrade the application according to this specification.

This is a PRODUCT + UX + RELIABILITY upgrade.

The most important requirement is:

# FILEFORGE MUST BE EXTREMELY EASY FOR A NON-TECHNICAL PERSON.

A person who has never used a PDF tool, image compressor, converter, or file utility should be able to understand every screen immediately.

The application must feel:

* obvious
* calm
* smooth
* predictable
* trustworthy
* fast
* premium
* forgiving
* accessible
* beginner-friendly

It must NOT feel:

* technical
* complicated
* cluttered
* like developer software
* like an admin dashboard
* like a configuration panel
* like an engineering tool
* like a giant PDF editor

==================================================

1. PRODUCT PHILOSOPHY
   ==================================================

FileForge follows one fundamental rule:

SIMPLE SURFACE.
POWERFUL ENGINE.

The user should see only what they need.

The application internally handles:

* codecs
* compression algorithms
* DPI
* PPI
* PDF object optimization
* font optimization
* image recompression
* WASM
* workers
* binary search
* quality scoring
* PDF structure
* format selection

The user should NOT need to understand any of those things.

Technical complexity belongs behind:

"Advanced settings"

==================================================
2. CONSISTENT UX FOR EVERY TOOL
===============================

EVERY FileForge tool must follow a consistent structure.

Do not create completely different interaction patterns for different tools.

The standard flow is:

1. Tool introduction
2. File selection
3. Simple primary settings
4. Optional Advanced settings
5. Primary action
6. Processing
7. Result
8. Download
9. Next action

Example:

---

Compress PDF

Reduce your PDF to the size you need.

[ Drop PDF here ]

or

[ Choose PDF ]

Target size

[ 200 ] [ KB ▼ ]

We'll automatically find the best quality
that fits your target.

[ Compress PDF ]

⌄ Advanced settings

---

The same mental model should apply to:

Compress Image
Resize Image
Convert Image
Merge PDF
Split PDF
Rotate PDF
Delete PDF Pages
Extract PDF Pages
JPG → PDF
PDF → JPG
etc.

==================================================
3. EVERY TOOL MUST HAVE ITS OWN SECTION
=======================================

Do NOT create one giant "File Tools" page where every operation happens inside one interface.

Every major task has its own dedicated route and page.

Examples:

/compress/pdf
/compress/image
/resize/image
/convert/jpg-to-webp
/convert/png-to-jpg
/pdf/merge
/pdf/split
/pdf/rotate
/pdf/delete-pages
/pdf/extract-pages

Each page must immediately communicate:

WHAT THIS TOOL DOES
WHAT FILE IT ACCEPTS
WHAT THE USER NEEDS TO DO

Example:

Compress PDF

Make your PDF smaller while keeping the best possible quality.

Compress Image

Reduce image file size without unnecessary quality loss.

Resize Image

Change image dimensions without complicated settings.

Merge PDF

Combine multiple PDF files into one document.

Split PDF

Separate a PDF into smaller documents.

Do not make users figure out what a tool does from an icon.

==================================================
4. EVERY TOOL MUST HAVE ADVANCED SETTINGS
=========================================

Every tool must have an:

Advanced settings

button or expandable section.

This is a universal FileForge design pattern.

IMPORTANT:

Do NOT create:

Simple Mode
Advanced Mode

The user should always be in the simple interface.

Advanced settings are optional.

Default state:

COLLAPSED.

Example:

⌄ Advanced settings

When clicked:

Advanced settings
────────────────────

[section]
Output

[section]
Quality

[section]
Processing

[section]
Compatibility

The advanced interface should never overwhelm the normal workflow.

==================================================
5. ADVANCED SETTINGS MUST BE CONTEXTUAL
=======================================

Do not show irrelevant settings.

For Compress PDF:

Advanced settings may include:

Image quality
Automatic

Maximum image resolution
Automatic

Color mode
Automatic

Optimize fonts
On

Remove unnecessary metadata
On

PDF compatibility
Automatic

For Resize Image:

Advanced settings may include:

Resampling method
Automatic

Sharpening
Automatic

Output quality
Automatic

Metadata
Keep / Remove

For JPG → WebP:

Advanced settings may include:

Quality
Automatic

Lossless
Off

Metadata
Keep / Remove

For Merge PDF:

Advanced settings may include:

Page size
Keep original

Margins
None

Bookmarks
Preserve

Metadata
Preserve

DO NOT show compression settings on a merge tool.

DO NOT show PDF-page settings on an image converter.

Every advanced panel must be relevant to that tool.

==================================================
6. ZERO TECHNICAL JARGON IN DEFAULT UI
======================================

Avoid words such as:

DPI
PPI
codec
quantization
rasterization
entropy
lossy
lossless
JPEG quality 65
Flate
PDF object streams
font subsetting
WASM
binary search

unless the user explicitly opens Advanced settings.

Even inside Advanced settings, explain technical settings in plain language.

Example:

Instead of:

Image resolution: 72 PPI

use:

Image resolution
Controls how detailed images remain.

Then optionally:

72 PPI

with a tooltip:

Lower values make the file smaller but can reduce image detail.

==================================================
7. HUMAN LANGUAGE
=================

Use simple language.

GOOD:

"Choose the size you need."

"Your file stays on this device."

"Keep the best possible quality."

"Your PDF is ready."

"Something went wrong. Your original file is safe."

BAD:

"Configure compression parameters."

"Initialize optimization pipeline."

"Configure rasterization settings."

"Execute transformation."

"Optimization failed."

The interface should sound like a helpful professional product, not a developer console.

==================================================
8. DO NOT MAKE USERS THINK
==========================

Every screen should answer:

WHAT DO I DO NEXT?

There must always be one obvious primary action.

Example:

[ Compress PDF ]

Not:

[ Start ]
[ Optimize ]
[ Process ]
[ Continue ]
[ Execute ]

Use one consistent verb.

Compress PDF
Resize Image
Convert to WebP
Merge PDFs
Split PDF

==================================================
9. PRIMARY BUTTON HIERARCHY
===========================

Every tool must have exactly ONE dominant primary CTA.

Examples:

Compress PDF
Resize Image
Convert to WebP
Merge PDFs
Split PDF

Secondary actions should be visually quieter.

Never create five equally important buttons.

==================================================
10. FILE DROPZONE
=================

The dropzone must be extremely simple.

Example:

┌──────────────────────────────────────────────┐
│                                              │
│                 Upload your PDF              │
│                                              │
│              Drop it here                    │
│                                              │
│              or                              │
│                                              │
│              [ Choose PDF ]                  │
│                                              │
│        Your file stays on this device        │
│                                              │
└──────────────────────────────────────────────┘

Do not overload the dropzone with:

* supported extensions
* technical limitations
* paragraphs
* advertisements
* unnecessary buttons

Supported file types can appear quietly underneath.

==================================================
11. FILE PICKER EXPERIENCE
==========================

After selecting a file, immediately show:

Filename
File type
File size

Example:

document.pdf
PDF · 2.8 MB

[Change file]

Do not make the user restart the entire tool if they selected the wrong file.

==================================================
12. WRONG FILE TYPE
===================

Never crash.

If the user drops a JPG into Compress PDF:

Show:

"This tool is for PDF files."

"Try Compress Image instead."

[ Compress Image ]

[ Choose another file ]

Make the error actionable.

==================================================
13. FILE TOO LARGE
==================

Do not show a technical exception.

Instead:

"This file is too large for your browser to process comfortably."

Then:

"Try a smaller file or use a desktop application."

If the browser/device can actually process it, do not unnecessarily reject it.

==================================================
14. PROCESSING ERRORS
=====================

Never show:

Error: WASM memory allocation failed

Never show:

Unhandled promise rejection

Never show:

Ghostscript exit code 1

Never show:

Failed to decode stream

Translate technical errors into human language.

Example:

"We couldn't process this file."

"Your original file has not been changed."

"Try again or choose a different file."

Then provide:

[ Try again ]

[ Choose another file ]

If possible:

[ Advanced settings ]

==================================================
15. ORIGINAL FILE SAFETY
========================

The original file must NEVER be modified.

All operations create a new output.

The UI should communicate this when an error occurs:

"Your original file is safe."

This creates trust.

==================================================
16. NO DEAD ENDS
================

Every completed tool must have logical next actions.

Example:

Compression complete

[ Download PDF ]

[ Compare ]

[ Compress another ]

For image:

[ Download image ]

[ Compress another ]

For conversion:

[ Download ]

[ Convert another ]

For merge:

[ Download merged PDF ]

[ Merge another ]

Never leave users wondering what to do after processing.

==================================================
17. PROCESSING EXPERIENCE
=========================

Processing must feel smooth.

Do not simply display:

"Processing..."

Use meaningful stages.

Example:

Compressing your PDF

✓ Reading document
✓ Optimizing images
● Finding the best quality
○ Checking target size
○ Preparing download

The active step should be visually obvious.

However:

DO NOT fake progress.

Progress must correspond to real processing stages.

==================================================
18. CANCEL PROCESSING
=====================

Long-running operations should support cancellation where technically possible.

Show:

[ Cancel ]

If cancelled:

"Processing cancelled."

"Your original file is safe."

[ Try again ]

==================================================
19. NEVER BLOCK THE UI
======================

Heavy operations must run in Web Workers where possible.

The UI must remain responsive.

Do not freeze:

* scrolling
* buttons
* animations
* progress
* navigation

during compression.

==================================================
20. SMOOTH FEELING
==================

The interface should feel polished.

Use subtle animation for:

* page transitions
* card hover
* dropzone activation
* accordion opening
* file selection
* processing stages
* success state

Do NOT animate everything.

Animations should be:

fast
subtle
predictable

Approximately:

150–250ms for micro-interactions.

Avoid:

* huge zoom effects
* bouncing buttons
* excessive blur
* flashy gradients
* unnecessary parallax
* animated backgrounds

==================================================
21. DROPZONE INTERACTION
========================

When dragging a valid file over the dropzone:

The dropzone should clearly change state.

Example:

"Drop your PDF here"

The user must immediately understand that the file can be released.

If the file is invalid:

show a clear invalid state.

==================================================
22. EMPTY STATES
================

Every tool must have a beautiful empty state.

Never show an empty blank page.

Example:

Compress PDF

Make your PDF smaller while keeping great quality.

[ PDF icon ]

Drop your PDF here

or

[ Choose PDF ]

==================================================
23. SUCCESS STATES
==================

Success should be obvious.

Example:

✓

Your PDF is ready

2.8 MB → 198 KB

92.9% smaller

Target achieved
≤ 200 KB

[ Download PDF ]

Do not hide success inside a notification toast.

==================================================
24. TARGET SIZE COMPRESSION
===========================

This is FileForge's flagship interaction.

The user enters:

200 KB

The engine must guarantee:

output <= 200 KB

Never display "Target achieved" if:

output > target

No rounding tricks.

No estimated output.

Measure the final actual file.

==================================================
25. TARGET SIZE INPUT
=====================

Make it extremely easy.

Use:

Target size

[ 200 ] [ KB ▼ ]

Support:

KB
MB

Optionally provide presets:

100 KB
200 KB
500 KB
1 MB

Do not show 15 presets.

==================================================
26. AUTOMATIC QUALITY
=====================

Default message:

"We'll automatically find the best quality that fits your target."

This is the core product promise.

The user should not have to manually adjust:

quality
DPI
resolution
compression level

unless they want to.

==================================================
27. IMPOSSIBLE TARGET
=====================

If reaching the requested size requires severe degradation:

DO NOT silently destroy quality.

Explain:

"That target requires very strong compression."

Show the best reasonable result if available.

Example:

Requested
100 KB

Best readable result
182 KB

Then:

[ Download best result ]

[ Try stronger compression ]

[ Advanced settings ]

==================================================
28. QUALITY EXPLANATION
=======================

Avoid technical scores unless they are genuinely measured.

Prefer:

Excellent
Good
Reduced
Very compressed

Example:

Visual quality
Excellent

If quality is significantly affected:

Visual quality
Reduced

Explain why.

==================================================
29. COMPARE RESULT
==================

Where practical, provide:

Original
Compressed

The comparison must be simple.

Do not create a complicated editing interface.

For PDFs:

show page previews.

For images:

use a before/after slider.

==================================================
30. ADVANCED SETTINGS UX
========================

Advanced settings should use progressive disclosure.

Initial state:

⌄ Advanced settings

After opening:

Advanced settings

Image quality
Automatic

Image resolution
Automatic

Color
Automatic

Metadata
Remove unnecessary data

Fonts
Optimize when safe

Compatibility
Automatic

Each setting should have:

Label
Current value
Short explanation

Use tooltips where helpful.

==================================================
31. RESET ADVANCED SETTINGS
===========================

Every advanced panel should include:

[ Reset to recommended ]

This immediately returns all settings to safe defaults.

This is extremely important for non-technical users.

==================================================
32. REMEMBER SETTINGS CAREFULLY
===============================

Do not unexpectedly remember complex settings between unrelated tasks.

If local preference persistence is implemented:

only remember simple user preferences where appropriate.

Never make a user wonder:

"Why is this suddenly grayscale?"

==================================================
33. SAFE DEFAULTS
=================

Default settings must prioritize:

* quality
* compatibility
* predictable results
* preservation of content

Aggressive optimization must never be the default.

==================================================
34. TOOL-SPECIFIC UX
====================

COMPRESS PDF

Simple UI:

File
↓
Target size
↓
Compress

Advanced:

Image optimization
Resolution
Color
Fonts
Metadata
Compatibility

---

COMPRESS IMAGE

Simple UI:

File
↓
Target size
↓
Compress

Advanced:

Output format
Quality
Dimensions
Metadata
Transparency

---

RESIZE IMAGE

Simple UI:

File
↓
Width / Height
↓
Lock aspect ratio
↓
Resize

Advanced:

Resampling
Quality
Sharpening
Metadata
Output format

---

MERGE PDF

Simple UI:

Drop PDFs
↓
Arrange pages/files
↓
Merge PDFs

Advanced:

Page size
Bookmarks
Metadata
Output compatibility

---

SPLIT PDF

Simple UI:

Drop PDF
↓
Choose:

Extract pages
Split every N pages
Split by ranges

↓
Split PDF

Advanced:

Output naming
Bookmarks
Metadata

---

ROTATE PDF

Simple UI:

Drop PDF
↓
Select pages
↓
Choose rotation
↓
Rotate PDF

Advanced:

Apply to:
selected pages
all pages
odd pages
even pages

---

PDF → JPG

Simple UI:

Drop PDF
↓
Select pages
↓
Convert to JPG

Advanced:

Resolution
Quality
Color
Output naming

---

JPG → PDF

Simple UI:

Drop images
↓
Arrange
↓
Convert to PDF

Advanced:

Page size
Margins
Orientation
Image fitting
Compression
Metadata

==================================================
35. PREVIEW
===========

Preview must help the user understand what will happen.

Do not make preview mandatory if it significantly slows processing.

For images:

show thumbnail.

For PDFs:

show first page thumbnail or page thumbnails where appropriate.

For multi-page tools:

show page thumbnails.

==================================================
36. BATCH FILES
===============

Batch processing must remain simple.

Example:

3 files selected

file1.pdf
2.1 MB

file2.pdf
1.4 MB

file3.pdf
5.2 MB

Target:

200 KB

[ Compress 3 PDFs ]

Do not expose separate technical settings for every file by default.

Use one shared configuration.

==================================================
37. BATCH PROGRESS
==================

Show:

Compressing 2 of 3

file2.pdf

Do not show a wall of technical logs.

After completion:

3 files complete

Saved 7.4 MB

[ Download all ]

Use local ZIP generation.

==================================================
38. DOWNLOAD UX
===============

Downloads must be obvious.

Use:

[ Download PDF ]

not:

[ Export ]

not:

[ Generate ]

not:

[ Save artifact ]

The user wants their file.

==================================================
39. FILE NAMING
===============

Generate sensible names.

Example:

document.pdf

→

document-compressed.pdf

image.jpg

→

image-compressed.jpg

photo.jpg

→

photo-resized.jpg

Do not create:

output_839201_final_v2.pdf

==================================================
40. MOBILE UX
=============

The entire application must work beautifully on mobile.

Do not merely shrink desktop UI.

On mobile:

* single-column layout
* large touch targets
* simple navigation
* sticky primary action where useful
* advanced settings stacked
* no hover-dependent actions
* previews remain usable

Test:

320px
375px
390px
412px
768px
1024px
1440px
1920px

==================================================
41. ACCESSIBILITY
=================

Implement:

keyboard navigation
focus states
semantic HTML
ARIA where needed
screen reader announcements
accessible drag/drop
accessible buttons
accessible dialogs
accessible accordions
reduced motion

All important actions must work without a mouse.

==================================================
42. RESPONSIVE NAVIGATION
=========================

Desktop:

FileForge
Compress
Resize
Convert
PDF Tools
Privacy

Mobile:

FileForge
☰

Then categorized navigation.

Do not make the mobile menu a giant wall of links.

==================================================
43. HOMEPAGE
============

Homepage should remain extremely simple.

Hero:

Simple tools
for your files.

Subtitle:

Compress, resize and convert files privately —
right in your browser.

Primary dropzone:

Drop a file here

or

[ Choose a file ]

Then:

Popular tools

Compress PDF
Compress Image
Resize Image
Merge PDF

Then:

All tools

organized by category.

Then:

Why FileForge

Private by default
No uploads

Simple
No technical settings required

Precise
Get the size you need

Free
No account required

==================================================
44. DO NOT TURN HOMEPAGE INTO A DASHBOARD
=========================================

Avoid:

statistics
recent activity dashboards
analytics
project management
accounts
workspaces
teams
billing
AI assistant panels

FileForge is a utility product.

The user should be able to finish a task in seconds.

==================================================
45. PRIVACY UI
==============

Because FileForge is local-first:

Use simple factual language.

"Processed locally in your browser."

"Your files stay on this device."

Do not claim:

military-grade
bank-level
zero-knowledge
encrypted

unless technically and legally accurate.

==================================================
46. PRIVACY SHOULD NOT INTERRUPT THE WORKFLOW
=============================================

Do not show a huge privacy popup before every operation.

Use a small trust indicator.

Example:

🔒 Processed locally

Clicking it can explain:

"FileForge processes this file on your device. The file is not uploaded to our servers."

==================================================
47. NO UNNECESSARY POPUPS
=========================

Avoid:

confirmation popup before every action
newsletter popup
login popup
rating popup
upgrade popup
advertisement popup

The user came to perform a task.

Let them perform it.

==================================================
48. NO ACCOUNT REQUIREMENT
==========================

Do not require:

login
signup
email
phone
subscription

for core local processing.

==================================================
49. ERROR PREVENTION
====================

The best error is the error the user never encounters.

Before processing:

validate:

file type
file integrity
supported format
browser capability
available memory where detectable
target validity
settings compatibility

If something is wrong:

tell the user BEFORE starting expensive processing.

==================================================
50. VALIDATE INPUTS
===================

Target size:

Must be numeric.

Prevent:

negative values
zero
invalid units
impossible values

Width:

Prevent invalid values.

Height:

Prevent invalid values.

Page ranges:

Validate:

1-5
8-10
12

Reject:

abc
5-
-8
999999999999

==================================================
51. NEVER LOSE USER INPUT
=========================

If validation fails:

do not clear the form.

Keep what the user entered.

Highlight the problematic field.

Explain what needs to change.

==================================================
52. UNSUPPORTED FILE
====================

If unsupported:

"This file type isn't supported by this tool."

Then:

[ Choose another file ]

If another FileForge tool supports it:

[ Try JPG → PNG ]

Only show this when genuinely relevant.

==================================================
53. BROWSER CAPABILITY
======================

If a browser does not support a required feature:

do not crash.

Show:

"This browser can't process this file type here."

Then provide a useful explanation.

Do not expose JavaScript errors.

==================================================
54. MEMORY SAFETY
=================

Large images and PDFs can consume substantial memory.

Implement:

* Web Workers
* sequential processing where appropriate
* cancellation
* cleanup
* Blob URL cleanup
* worker termination
* temporary buffer cleanup

Do not process many enormous files simultaneously.

==================================================
55. PERFORMANCE
===============

Heavy engines must be lazy-loaded.

Do not load all WASM engines on homepage.

Homepage should remain lightweight.

Load only what the selected tool needs.

Examples:

Compress PDF
→ load PDF engine

Compress Image
→ load image codec

Merge PDF
→ load PDF manipulation engine

==================================================
56. DESIGN SYSTEM
=================

Create one consistent design system.

Use:

Inter or Geist

Lucide icons

Tailwind

shadcn/ui

Subtle motion

White / near-white surfaces

Dark primary CTA

Neutral typography

Subtle borders

Subtle shadows

Moderate corner radius

Avoid excessive:

glassmorphism
gradients
neon
3D
floating blobs
oversized cards
AI aesthetic

==================================================
57. VISUAL HIERARCHY
====================

Every screen should have:

1. Page title
2. One-line explanation
3. Main action area
4. Optional settings
5. Result

The eye should immediately know where to start.

==================================================
58. TOOL PAGE WIDTH
===================

Do not stretch simple workflows across the entire 1920px screen.

Use a comfortable max-width.

The primary task should remain visually centered.

For page-management tools where thumbnails need more width, use a wider workspace.

==================================================
59. CARD USAGE
==============

Do not put every element inside a card.

Cards should group meaningful information.

Avoid:

card inside card
inside card
inside card

The interface should feel like a product, not a dashboard.

==================================================
60. MICROCOPY
=============

Use reassuring microcopy.

Examples:

"You're almost there."

"Your original file is safe."

"Finding the best quality for your target."

"Ready to download."

Avoid:

"Processing request."

"Execution completed."

"Task successful."

==================================================
61. TOOL DESCRIPTIONS
=====================

Every tool should have a short description.

Maximum approximately 1–2 sentences.

Example:

Compress PDF

"Reduce your PDF to the size you need while keeping the best possible quality."

Do not write large paragraphs above the actual tool.

Detailed educational information can appear below the tool.

==================================================
62. DETAILED HOW-TO INFORMATION
===============================

Every tool page should have a lower informational section.

IMPORTANT:

Keep this BELOW the actual tool.

The user should never need to read it to use the tool.

Example:

How to compress a PDF

1. Choose your PDF.
2. Enter the size you need.
3. Click Compress PDF.
4. Download your optimized PDF.

Then:

How does PDF compression work?

A short plain-language explanation.

Then:

Frequently asked questions.

This gives beginners help without cluttering the workflow.

==================================================
63. HELP SHOULD BE CONTEXTUAL
=============================

Use small info icons next to confusing advanced settings.

Example:

Image resolution
ⓘ

Tooltip:

"Lower resolution usually creates smaller files, but images may lose detail."

Do not open a new page.

==================================================
64. RESULT EXPLANATION
======================

After processing, explain what happened in plain language.

Example:

Your PDF was compressed from:

2.8 MB → 198 KB

That's 92.9% smaller.

Target:

≤ 200 KB

✓ Target achieved

==================================================
65. COMPRESSION DETAILS
=======================

If useful, show:

Images optimized
Metadata reduced
PDF structure optimized

But don't expose technical implementation details.

Never show:

Ghostscript
WASM
JPEG quantization
Flate
object streams

in the normal result UI.

==================================================
66. ADVANCED RESULT DETAILS
===========================

If the user opened Advanced settings, they may optionally see:

Optimization details

But keep this secondary.

==================================================
67. CONSISTENCY
===============

All tools must use the same:

dropzone
file card
primary button
advanced settings
processing UI
success UI
error UI
download UI

Users should learn FileForge once.

Then every tool feels familiar.

==================================================
68. DESIGN FOR CONFIDENCE
=========================

The interface should constantly answer:

Is my file selected?
What will happen?
Is it processing?
Is it finished?
Where is my output?
Did it meet my target?
Is my original safe?

Never leave uncertainty.

==================================================
69. NO SURPRISE BEHAVIOR
========================

Never:

change format without telling the user
remove pages without telling the user
change dimensions without telling the user
convert color without telling the user
overwrite the original
start processing automatically without clear user intent

Except where automatic behavior is explicitly the tool's stated purpose.

==================================================
70. ADVANCED SETTINGS SAFETY
============================

Every destructive or quality-reducing advanced option must have an explanation.

Example:

Convert to grayscale

"Can reduce file size by removing color."

Flatten PDF

"Makes some editable content permanent."

Rasterize pages

"Turns page content into images and may prevent text selection."

These explanations are critical.

==================================================
71. RESET EVERYTHING
====================

Advanced settings should include:

[ Reset to recommended ]

This returns to safe defaults.

==================================================
72. TOOL ROUTING
================

Never make users hunt for tools.

If the user is on:

Compress PDF

they should not need to return home to switch to:

Compress Image.

Provide a subtle:

"Other tools"

or tool switcher.

Do not interrupt the current workflow.

==================================================
73. CROSS-TOOL NAVIGATION
=========================

After a result:

If a user compressed a PDF:

Show optional next actions:

Convert to JPG
Merge PDF
Split PDF

Only show relevant suggestions.

Do not overwhelm them.

==================================================
74. NO FEATURE CREEP
====================

Do not add features simply because competitors have them.

Every feature must answer:

Does this make FileForge more useful without making it harder?

If not:

do not add it.

==================================================
75. RELIABILITY REQUIREMENT
===========================

"NO ERRORS" means:

No uncaught exceptions in normal workflows.

No broken routes.

No blank screens.

No infinite loading.

No fake completion.

No incorrect file sizes.

No incorrect success messages.

No download buttons that produce invalid files.

No UI freezing during normal processing.

No lost input.

No accidental original-file modification.

==================================================
76. ERROR BOUNDARY
==================

Implement application-level error boundaries.

If a component fails:

show a friendly recovery screen.

Example:

"Something went wrong."

"Your file has not been changed."

[ Try again ]

[ Return to tools ]

Never leave a white blank screen.

==================================================
77. ROUTE ERROR HANDLING
========================

Every route must have:

loading state
empty state
error state
success state

No route should depend on an assumed successful operation.

==================================================
78. FILE PROCESSING ERROR HANDLING
==================================

Every processing operation must handle:

invalid input
corrupt file
unsupported file
memory issue
codec failure
worker failure
cancel
browser limitation
unexpected output

All must return user-friendly messages.

==================================================
79. OUTPUT VALIDATION
=====================

Never trust a generated file just because the engine returned bytes.

Validate:

* output exists
* output has non-zero size
* expected MIME/type
* output can be parsed when practical
* target size when applicable

For PDF:

attempt to load/validate the output.

For image:

validate the generated image.

==================================================
80. TARGET SIZE FINAL VALIDATION
================================

For target compression:

IF:

outputBytes <= targetBytes

then:

Target achieved

ELSE:

DO NOT:

show success

DO NOT:

show target achieved

DO NOT:

pretend the file is compliant

Instead retry or show:

"We couldn't reach your target with the current quality settings."

==================================================
81. CANCEL CLEANUP
==================

When the user cancels:

terminate workers where appropriate.

Release:

Blob URLs
buffers
temporary objects
WASM instances where appropriate

Return UI to a stable state.

==================================================
82. TESTING
===========

Before considering the upgrade complete, test every tool.

For every tool test:

Happy path
Wrong file
Empty input
Corrupt file
Large file
Multiple files
Cancel
Retry
Download
Mobile
Keyboard
Advanced settings
Reset settings
Browser refresh
Route navigation

==================================================
83. USER JOURNEY TEST
=====================

Pretend you are a person who has never used a PDF tool.

Open FileForge.

Ask:

"What do I click?"

If unclear:
fix it.

Select a file.

Ask:

"What happens next?"

If unclear:
fix it.

Process.

Ask:

"Is it finished?"

If unclear:
fix it.

Download.

Ask:

"Did I get the correct file?"

If unclear:
fix it.

This test must pass.

==================================================
84. FIVE-SECOND TEST
====================

For every tool:

A first-time user should understand the primary action within approximately five seconds.

They should be able to answer:

What does this tool do?

What file do I need?

What do I click?

If not:

simplify the UI.

==================================================
85. THREE-CLICK PRINCIPLE
=========================

For common tools, aim for:

1. Choose file
2. Set primary option
3. Run tool

Example:

Compress PDF:

Choose PDF
→ target size
→ Compress PDF

Do not add unnecessary intermediate screens.

==================================================
86. ADVANCED SETTINGS RULE
==========================

Advanced settings should NEVER be required for successful normal use.

If a normal user opens the tool and sees:

DPI
PPI
Quality
Codec
Compression
Color profile

before clicking Advanced:

THE IMPLEMENTATION IS WRONG.

==================================================
87. INFORMATION ARCHITECTURE
============================

Top navigation:

Compress
Resize
Convert
PDF Tools

Each opens categorized tools.

Do not put 30 tools directly into the primary header.

==================================================
88. HOMEPAGE DROP ANY FILE
==========================

Allow:

Drop file

Then identify type.

Example:

PDF detected.

"What would you like to do?"

Compress
Convert
Merge
Split
Organize

Image detected.

"What would you like to do?"

Compress
Resize
Convert

This is an optional convenience feature.

Do not make it mandatory.

==================================================
89. SEO PAGES
=============

Create dedicated routes for common intent.

Examples:

/compress/pdf
/compress/pdf-to-100kb
/compress/pdf-to-200kb
/compress/pdf-to-500kb
/compress/pdf-to-1mb

But all routes must use the same actual components and processing engines.

Do not duplicate logic.

==================================================
90. FINAL VISUAL QUALITY BAR
============================

FileForge should look closer to:

a premium modern productivity application

than:

a generic online converter website.

The design should feel intentional.

Use whitespace.

Use typography.

Use hierarchy.

Use subtle motion.

Use excellent empty states.

Use excellent error states.

Use excellent success states.

Do not compensate for weak UX with gradients or animation.

==================================================
91. FINAL PERFORMANCE BAR
=========================

Homepage:

fast initial load.

Tool:

load heavy processing engines only when required.

Processing:

never block main UI.

Memory:

clean up aggressively.

Batch:

process safely.

Downloads:

generated locally.

==================================================
92. FINAL PRIVACY BAR
=====================

No file upload requests.

No accidental telemetry containing:

file contents
file names
PDF text
image pixels
metadata

Local processing must remain local.

==================================================
93. FINAL ACCEPTANCE CRITERIA
=============================

The implementation is complete only if:

[ ] Every tool has its own dedicated section/page.
[ ] Every tool has simple default settings.
[ ] Every tool has Advanced settings.
[ ] Advanced settings are collapsed by default.
[ ] Advanced settings are contextual.
[ ] No technical jargon appears in the normal workflow.
[ ] Every tool has a clear primary CTA.
[ ] Every tool has loading state.
[ ] Every tool has processing state.
[ ] Every tool has success state.
[ ] Every tool has error state.
[ ] Every tool has recovery behavior.
[ ] Every tool has a download action.
[ ] Every tool has a next action.
[ ] Original files are never modified.
[ ] Target compression is actually validated.
[ ] No fake progress exists.
[ ] No normal workflow freezes the UI.
[ ] Heavy work uses workers where appropriate.
[ ] Large files are handled safely.
[ ] Batch processing is supported where appropriate.
[ ] ZIP downloads work locally.
[ ] Mobile works.
[ ] Keyboard navigation works.
[ ] Accessibility works.
[ ] Advanced settings can be reset.
[ ] Invalid input is handled before processing.
[ ] Corrupt files don't crash the application.
[ ] Unsupported files don't crash the application.
[ ] Failed processing doesn't lose user input.
[ ] No route produces a blank screen.
[ ] No uncaught normal-workflow errors remain.
[ ] Production build succeeds.
[ ] Typecheck succeeds.
[ ] Lint succeeds.
[ ] Tests succeed.

==================================================
94. MOST IMPORTANT RULE
=======================

If there is ever a conflict between:

MORE FEATURES

and

SIMPLER UX

choose:

SIMPLER UX.

If there is ever a conflict between:

TECHNICAL CONTROL

and

EASY DEFAULT

choose:

EASY DEFAULT.

If there is ever a conflict between:

ADDING ANOTHER SETTING

and

REMOVING CONFUSION

choose:

REMOVING CONFUSION.

FileForge should make complicated file processing feel simple.

The user should think:

"That was easy."

not:

"I had to learn how this tool works."

FINAL PRODUCT PRINCIPLE:

# SIMPLE FOR EVERYONE.

# POWERFUL FOR THOSE WHO NEED IT.

# ADVANCED SETTINGS ARE ALWAYS THERE — BUT NEVER IN THE WAY.
