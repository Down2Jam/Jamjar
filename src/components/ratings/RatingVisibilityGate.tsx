"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button, Vstack } from "bioloom-ui";

interface RatingVisibilityGateProps {
  hiddenByPreference: boolean;
  children: ReactNode;
  hiddenText?: string;
  showLabel?: string;
  hideLabel?: string;
  buttonSize?: "xs" | "sm" | "md" | "lg";
  inline?: boolean;
}

export default function RatingVisibilityGate({
  hiddenByPreference,
  children,
  showLabel = "Show ratings",
  hideLabel = "Hide ratings",
  buttonSize = "sm",
  inline = false,
}: RatingVisibilityGateProps) {
  const [revealed, setRevealed] = useState(!hiddenByPreference);

  useEffect(() => {
    setRevealed(!hiddenByPreference);
  }, [hiddenByPreference]);

  if (!hiddenByPreference) {
    return <>{children}</>;
  }

  return (
    <Vstack
      align="stretch"
      className={inline ? "shrink-0" : "w-full"}
      style={inline ? { flexDirection: "row", alignItems: "center", gap: 8 } : { gap: 8 }}
    >
      <Vstack align="start">
        <Button
          size={buttonSize}
          style={{ height: 26, minHeight: 26, padding: "4px 8px" }}
          onClick={() => setRevealed((value) => !value)}
        >
          {revealed ? hideLabel : showLabel}
        </Button>
      </Vstack>
      {revealed ? children : null}
    </Vstack>
  );
}
