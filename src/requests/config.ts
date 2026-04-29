export const BASE_URL =
  process.env.NEXT_PUBLIC_MODE === "PROD"
    ? "/api/v1"
    : process.env.NEXT_PUBLIC_API === "prod"
      ? "/api/v1"
      : "/api/v1";

export const API_DOCS_URL = BASE_URL;
