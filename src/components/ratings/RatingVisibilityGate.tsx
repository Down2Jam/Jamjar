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
}

export default function RatingVisibilityGate({
  hiddenByPreference,
  children,
  showLabel = "Show ratings",
  hideLabel = "Hide ratings",
  buttonSize = "sm",
}: RatingVisibilityGateProps) {
  const [revealed, setRevealed] = useState(!hiddenByPreference);

  useEffect(() => {
    setRevealed(!hiddenByPreference);
  }, [hiddenByPreference]);

  if (!hiddenByPreference) {
    return <>{children}</>;
  }

  return (
    <Vstack align="stretch" className="w-full">
      <Vstack align="start">
        <Button size={buttonSize} onClick={() => setRevealed((value) => !value)}>
          {revealed ? hideLabel : showLabel}
        </Button>
      </Vstack>
      {revealed ? children : null}
    </Vstack>
  );
}
