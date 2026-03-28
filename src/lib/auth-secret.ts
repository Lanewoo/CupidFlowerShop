export function getAuthSecretKey(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ?? "dev-cupid-secret-change-in-production-min-32-chars";
  return new TextEncoder().encode(raw);
}
