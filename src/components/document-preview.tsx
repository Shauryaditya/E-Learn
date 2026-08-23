"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Worker } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { scrollModePlugin } from "@react-pdf-viewer/scroll-mode";
import { FileText, Download, ZoomIn, ZoomOut } from "lucide-react";

const PDFViewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  { ssr: false }
);

interface DocumentPreviewProps {
  fileUrl: string;
  fileName?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ fileUrl, fileName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.0);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages } =
    pageNavigationPluginInstance;

const scrollModePluginInstance = scrollModePlugin();

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 2.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  const displayName = fileName || fileUrl.split("/").pop() || "Document";

  return (
    <div className="w-full rounded-xl overflow-hidden border shadow-md bg-card">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        {/* Left: icon + name */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="text-blue-500 shrink-0" size={16} />
          <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
            {displayName}
          </span>
        </div>

        {/* Right: zoom + download */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
            <button
              onClick={zoomOut}
              className="text-muted-foreground hover:text-blue-500 transition"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="text-muted-foreground hover:text-blue-500 transition"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Download button */}
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Download size={13} />
            Download
          </a>
        </div>
      </div>

      {/* ── PDF Viewer ── */}
      <div className="bg-muted/40">
        {isLoading && (
          <p className="text-muted-foreground text-center text-sm py-4">Loading preview...</p>
        )}

        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div
            style={{ height: "70vh", overflow: "auto" }}
            className="w-full"
          >
            <PDFViewer
              fileUrl={fileUrl}
              onDocumentLoad={() => setIsLoading(false)}
              defaultScale={scale}
              plugins={[pageNavigationPluginInstance, scrollModePluginInstance]}
            />
          </div>

          {/* ── Page Navigation ── */}
          {!isLoading && (
            <div className="flex items-center justify-center gap-3 py-3 border-t bg-card">
              <GoToPreviousPage>
                {({ isDisabled, onClick }) => (
                  <button
                    onClick={onClick}
                    disabled={isDisabled}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-accent disabled:opacity-40 transition text-foreground font-bold"
                  >
                    ‹
                  </button>
                )}
              </GoToPreviousPage>

              <span className="text-xs text-muted-foreground flex items-center gap-1">
                Page <CurrentPageInput /> / <NumberOfPages />
              </span>

              <GoToNextPage>
                {({ isDisabled, onClick }) => (
                  <button
                    onClick={onClick}
                    disabled={isDisabled}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-accent disabled:opacity-40 transition text-foreground font-bold"
                  >
                    ›
                  </button>
                )}
              </GoToNextPage>
            </div>
          )}
        </Worker>
      </div>
    </div>
  );
};

export default DocumentPreview;
