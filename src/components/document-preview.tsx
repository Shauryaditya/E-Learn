"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Worker } from "@react-pdf-viewer/core";
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
  const [scale, setScale] = useState(1.3); // Default scale

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 768) {
        setScale(0.7); // Reduce size on smaller screens
      } else {
        setScale(1.3); // Normal size on larger screens
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="w-full border border-gray-200 shadow-md rounded-lg">
      {isLoading && <p className="text-gray-600 text-center py-2">Loading preview...</p>}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="w-full flex justify-center">
          <div className="w-[90%] max-w-[800px]">
            <PDFViewer 
              fileUrl={fileUrl} 
              onDocumentLoad={() => setIsLoading(false)} 
              defaultScale={scale} 
            />
          </div>
        </div>
      </Worker>
    </div>
  );
};

export default DocumentPreview;
