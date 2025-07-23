"use client";

import { createPortal } from "react-dom";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import { AnimatePresence, motion } from "framer-motion";

function waveSkeleton(label: string, maxLength: number, gradient: string) {
  const padded = label.padEnd(maxLength, " ");
  const characters = padded.split("");
  const duration = 1200;

  return (
    <span
      className={`bg-gradient-to-r ${gradient} text-transparent bg-clip-text font-medium flex`}
    >
      {characters.map((char, i) => (
        <span
          key={i}
          className={`inline-block animate-smallwave ${
            char === " " ? "w-[0.5ch]" : ""
          }`}
          style={{
            animationDelay: `${(i * 60) % duration}ms`,
            animationDuration: `${duration}ms`,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            whiteSpace: "pre",
            opacity: char === " " ? 0 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
export default function PreviewLanguageBanner({
  languages,
}: {
  languages: any[];
}) {
  const { previewLocale } = useLanguagePreview();
  const lang = languages.find((l) => l.key === previewLocale);

  // Determine max label length across all languages
  const maxLabelLength =
    "Previewing Language: ".length +
    Math.max(...languages.map((l) => l.label.length));

  return createPortal(
    <AnimatePresence>
      {lang && (
        <motion.div
          key="preview-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed flex bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-md shadow-lg text-sm z-[9999] pointer-events-none"
        >
          <span className="group">
            {waveSkeleton(
              "Previewing Language: " + lang.label,
              maxLabelLength,
              lang.gradient
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    typeof window !== "undefined" ? document.body : (null as any)
  );
}
