import React, { useEffect, useRef } from "react";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";
import { decodeHtml } from "@/utils/decodeHtml";

const MathText = ({ text, className = "" }) => {
  const containerRef = useRef(null);
  const decodedText = decodeHtml(text);

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  }, [decodedText]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: decodedText }}
    />
  );
};

export default MathText;
