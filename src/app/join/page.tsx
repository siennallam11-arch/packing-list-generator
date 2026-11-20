import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinTrip } from "./JoinTrip";

export const metadata: Metadata = { title: "Join a trip · Caboodle" };

export default function Page() {
  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
      <JoinTrip />
    </Suspense>
  );
}
