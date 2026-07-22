"use client";

import { TorokExperience } from "@/components/TorokExperience";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function HomePage() {
  return (
    <ErrorBoundary>
      <TorokExperience />
    </ErrorBoundary>
  );
}
