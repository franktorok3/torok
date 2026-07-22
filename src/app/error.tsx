"use client";

import { useEffect } from "react";
import { FRIENDLY_ERROR } from "@/lib/wisdom/types";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Torok route error:", error);
  }, [error]);

  return (
    <div className="page-shell page-compact">
      <div className="error-boundary" role="alert">
        <p className="error-boundary-title">Torok lost the page for a moment.</p>
        <p className="error-boundary-body">
          Your question is still here. Please try again.
        </p>
        <p className="sr-only">{FRIENDLY_ERROR}</p>
        <button type="button" className="btn-primary btn-lamp" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
