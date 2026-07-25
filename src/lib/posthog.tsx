// PostHog analytics — no-op safely when VITE_POSTHOG_KEY is not configured.
// The user is expected to add VITE_POSTHOG_KEY (and optionally
// VITE_POSTHOG_HOST) as a workspace build secret; without it we still render.
import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { useRouter } from "@tanstack/react-router";

let inited = false;

function initPosthog() {
  if (inited || typeof window === "undefined") return;
  const key = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_POSTHOG_KEY;
  const host =
    (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_POSTHOG_HOST ||
    "https://us.i.posthog.com";
  if (!key) return;
  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // we send manually on route change
    persistence: "localStorage",
  });
  inited = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!inited) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!inited) return;
  try {
    posthog.identify(userId, props);
  } catch {
    /* ignore */
  }
}

export function reset() {
  if (!inited) return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}

export function PosthogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    initPosthog();
  }, []);
  useEffect(() => {
    const unsub = router.subscribe("onResolved", (evt) => {
      track("$pageview", { path: evt.toLocation.pathname });
    });
    return () => unsub();
  }, [router]);
  return <>{children}</>;
}
