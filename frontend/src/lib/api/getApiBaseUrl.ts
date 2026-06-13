export function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const isServer = typeof window === "undefined";

  // Server-side inside Docker network
  if (isServer && (process.env.API_BASE_URL || process.env.DOCKER_API_URL)) {
    return process.env.API_BASE_URL || process.env.DOCKER_API_URL;
  }

  // Browser or server-side without Docker
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
}
