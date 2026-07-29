"use client";

// Batch export scope: Print only (browser print-to-PDF via the native dialog remains available
// for a PDF, same as any print). Programmatic per-card PDF/PNG export (IdCardPrintControls) is a
// single-card feature — rasterizing and assembling a multi-page PDF across a whole batch is a
// meaningfully bigger feature this sprint's "Export: PDF, PNG" requirement didn't explicitly ask
// for at the batch level (it's listed once, under single "Export", not "Batch Export"), so it
// isn't built here — flagged in this sprint's final report as a scoping decision, not an oversight.
export function BatchPrintControls() {
  return (
    <div className="id-card-screen-only">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Print All
      </button>
    </div>
  );
}
