import { useEffect, useState } from "react";

export default function AudioPreview({ url, file }: { url: string; file?: File }) {
  const [localUrl, setLocalUrl] = useState<string>();

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Uploaded audio is not publicly available until the game is published.
  // Keep the stored URL for saving, but preview new uploads from their File.
  return (
    <audio
      controls
      preload="metadata"
      src={file ? localUrl : url}
      className="w-full"
    />
  );
}
