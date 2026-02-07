"use client";

import dynamic from "next/dynamic";
import "@react-pdf-viewer/core/lib/styles/index.css";

const PdfViewer = dynamic(async () => {
    const mod = await import("@react-pdf-viewer/core");
    return function ViewerComponent({ fileUrl, pageNumber, onLoad, onPageChange }: any) {
        return (
            <mod.Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <mod.Viewer
                    fileUrl={fileUrl}
                    onDocumentLoad={onLoad}
                    initialPage={pageNumber - 1} // 0-indexed
                    onPageChange={(e: any) => onPageChange(e.currentPage + 1)}
                />
            </mod.Worker>
        );
    };
}, { ssr: false });

export default PdfViewer;
