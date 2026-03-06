"use client";

import * as React from "react";

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className = "", ...props }: CardBodyProps) {
  return <div className={className} {...props} />;
}
