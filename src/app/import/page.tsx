import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportTrip } from "./ImportTrip";

export const metadata: Metadata = { title: "Open a backup · Caboodle" };

export default function Page() {
  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
      <ImportTrip />
    </Suspense>
  );
}
