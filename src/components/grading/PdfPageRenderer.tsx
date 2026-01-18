"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(async () => {
    const mod = await import("@react-pdf-viewer/core");
    return function Viewer({ fileUrl, pageNumber, onLoad }: any) {
        return (
            <mod.Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <mod.Viewer
                    fileUrl={fileUrl}
                    onDocumentLoad={onLoad}
                    initialPage={pageNumber - 1} // 0-indexed
                    defaultScale={1.0}
                />
            </mod.Worker>
        );
    };
}, { ssr: false });

export default PdfViewer;
