"use client";

import * as React from "react";

export interface FormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  validationErrors?: Record<string, string>;
  validationBehavior?: "native" | "aria";
}

export function Form({
  className = "",
  validationErrors: _validationErrors,
  validationBehavior: _validationBehavior,
  ...props
}: FormProps) {
  return <form className={className} {...props} />;
}
