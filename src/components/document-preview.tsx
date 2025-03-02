"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SpecialZoomLevel, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

// Dynamically import the Viewer component to prevent server-side rendering issues
const PDFViewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  { ssr: false }
);

interface DocumentPreviewProps {
  fileUrl: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ fileUrl }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full border border-gray-200 shadow-md rounded-lg">
      {isLoading && <p className="text-gray-600">Loading preview...</p>}
      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
      <div style={{ width: "90%", margin: "auto" }}>
        <PDFViewer fileUrl={fileUrl} 
        onDocumentLoad={() => setIsLoading(false)}
        defaultScale={1.3} // Adjusts to fit width
        />
        </div>
      </Worker>
    </div>
  );
};

export default DocumentPreview;
