import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,          // Leaflet is incompatible with strict mode double-invoke
  allowedDevOrigins: ["*.e2b.app"],
};

/*
 * Sentry build plugin (source maps / release upload) is only enabled when the
 * upload credentials are present — set in your shell or a non-committed env:
 *   SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
 * Error *reporting* (runtime SDK) is controlled separately by the DSN in
 * sentry.client/server/edge.config.ts.
 */
const sentryUploadEnabled = Boolean(
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_AUTH_TOKEN
);

export default sentryUploadEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG!,
      project: process.env.SENTRY_PROJECT!,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    })
  : nextConfig;
