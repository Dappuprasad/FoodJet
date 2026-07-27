/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the API, including the version prefix.
   * Empty in development so the Vite proxy handles it: "/api/v1".
   * In production, the absolute API origin: "https://foodjet-api.onrender.com/api/v1".
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
