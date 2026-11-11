"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Worker } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { scrollModePlugin } from "@react-pdf-viewer/scroll-mode";
import { AlertCircle, Download, ExternalLink, FileText, Loader2, ZoomIn, ZoomOut } from "lucide-react";

const PDFViewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  { ssr: false },
);

interface DocumentPreviewProps {
  fileUrl: string;
  fileName?: string;
}

type DocumentKind = "pdf" | "docx" | "other" | "detecting";

const kindFromValue = (value?: string | null): DocumentKind | null => {
  if (!value) return null;
  const cleanValue = decodeURIComponent(value.split("?")[0]).toLowerCase();
  if (cleanValue.endsWith(".pdf")) return "pdf";
  if (cleanValue.endsWith(".docx")) return "docx";
  return null;
};

const kindFromContentType = (contentType: string | null): DocumentKind => {
  const type = (contentType || "").toLowerCase();
  if (type.includes("application/pdf")) return "pdf";
  if (type.includes("wordprocessingml.document")) return "docx";
  return "other";
};

const PreviewHeader = ({ fileUrl, displayName }: { fileUrl: string; displayName: string }) => (
  <div className="flex flex-col gap-3 border-b bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-2">
      <FileText className="shrink-0 text-blue-500" size={16} />
      <span className="max-w-full truncate text-sm font-semibold text-foreground sm:max-w-[320px]">{displayName}</span>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium transition hover:bg-accent">
        <ExternalLink size={13} /> Open
      </a>
      <a href={fileUrl} download className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white transition hover:bg-blue-700">
        <Download size={13} /> Download
      </a>
    </div>
  </div>
);

const DocxPreview = ({ fileUrl }: { fileUrl: string }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const body = bodyRef.current;
    const style = styleRef.current;
    if (!body || !style) return;

    body.replaceChildren();
    style.replaceChildren();
    setLoading(true);
    setError(null);

    const renderDocument = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Unable to download this document (${response.status})`);
        const documentBlob = await response.blob();
        const { renderAsync } = await import("docx-preview");
        if (cancelled) return;

        await renderAsync(documentBlob, body, style, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderComments: false,
          renderAltChunks: false,
          useBase64URL: true,
        });
      } catch (renderError) {
        console.error("[DOCX_PREVIEW]", renderError);
        if (!cancelled) setError("This Word file could not be previewed. You can still open or download it.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void renderDocument();
    return () => {
      cancelled = true;
      body.replaceChildren();
      style.replaceChildren();
    };
  }, [fileUrl]);

  return (
    <div className="relative max-h-[75vh] min-h-[240px] overflow-auto bg-slate-100 p-2 dark:bg-slate-950 sm:p-4">
      <div ref={styleRef} />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Rendering Word document…</div>
        </div>
      )}
      {error ? (
        <div className="flex min-h-[220px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
          <div><AlertCircle className="mx-auto mb-3 h-7 w-7 text-amber-500" /><p>{error}</p></div>
        </div>
      ) : (
        <div ref={bodyRef} className="mx-auto w-max min-w-full [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0 sm:[&_.docx-wrapper]:p-2 [&_section.docx]:mx-auto [&_section.docx]:shadow-md" />
      )}
    </div>
  );
};

const PdfPreview = ({ fileUrl }: { fileUrl: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages } = pageNavigationPluginInstance;
  const scrollModePluginInstance = scrollModePlugin();

  return (
    <div className="bg-muted/40">
      <div className="flex items-center justify-end border-b bg-card px-4 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
          <button type="button" aria-label="Zoom out" onClick={() => { setIsLoading(true); setScale((value) => Math.max(value - 0.1, 0.5)); }} className="text-muted-foreground transition hover:text-blue-500"><ZoomOut size={15} /></button>
          <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => { setIsLoading(true); setScale((value) => Math.min(value + 0.1, 2.5)); }} className="text-muted-foreground transition hover:text-blue-500"><ZoomIn size={15} /></button>
        </div>
      </div>
      {isLoading && <p className="py-4 text-center text-sm text-muted-foreground">Loading PDF preview…</p>}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="w-full overflow-auto" style={{ height: "70vh" }}>
          <PDFViewer key={scale} fileUrl={fileUrl} onDocumentLoad={() => setIsLoading(false)} defaultScale={scale} plugins={[pageNavigationPluginInstance, scrollModePluginInstance]} />
        </div>
        {!isLoading && (
          <div className="flex items-center justify-center gap-3 border-t bg-card py-3">
            <GoToPreviousPage>{({ isDisabled, onClick }) => <button type="button" onClick={onClick} disabled={isDisabled} aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-bold text-foreground transition hover:bg-accent disabled:opacity-40">‹</button>}</GoToPreviousPage>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">Page <CurrentPageInput /> / <NumberOfPages /></span>
            <GoToNextPage>{({ isDisabled, onClick }) => <button type="button" onClick={onClick} disabled={isDisabled} aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-bold text-foreground transition hover:bg-accent disabled:opacity-40">›</button>}</GoToNextPage>
          </div>
        )}
      </Worker>
    </div>
  );
};

const DocumentPreview = ({ fileUrl, fileName }: DocumentPreviewProps) => {
  const initialKind = useMemo(() => kindFromValue(fileName) || kindFromValue(fileUrl) || "detecting", [fileName, fileUrl]);
  const [kind, setKind] = useState<DocumentKind>(initialKind);
  const displayName = fileName || fileUrl.split("/").pop()?.split("?")[0] || "Document";

  useEffect(() => {
    const knownKind = kindFromValue(fileName) || kindFromValue(fileUrl);
    if (knownKind) {
      setKind(knownKind);
      return;
    }

    let cancelled = false;
    setKind("detecting");
    fetch(fileUrl, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setKind(response.ok ? kindFromContentType(response.headers.get("content-type")) : "other");
      })
      .catch(() => { if (!cancelled) setKind("other"); });
    return () => { cancelled = true; };
  }, [fileName, fileUrl]);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-md">
      <PreviewHeader fileUrl={fileUrl} displayName={displayName} />
      {kind === "pdf" && <PdfPreview fileUrl={fileUrl} />}
      {kind === "docx" && <DocxPreview fileUrl={fileUrl} />}
      {kind === "detecting" && <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing preview…</div>}
      {kind === "other" && <div className="flex min-h-[220px] items-center justify-center p-6 text-center text-sm text-muted-foreground"><div><FileText className="mx-auto mb-3 h-8 w-8" /><p>Inline preview is not available for this file type.</p><p className="mt-1">Use Open or Download above.</p></div></div>}
    </div>
  );
};

export default DocumentPreview;
