import { existsSync } from "node:fs";

// Load .env into process.env for integration tests (Node >= 20.12).
// Tests self-skip when the relevant keys are absent.
if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // ignore — tests will skip when env vars are missing
  }
}
