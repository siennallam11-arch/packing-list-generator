import type { Metadata } from "next";
import { Suspense } from "react";
import { NewTrip } from "./NewTrip";

export const metadata: Metadata = { title: "New trip · Caboodle" };

export default function Page() {
  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
      <NewTrip />
    </Suspense>
  );
}
