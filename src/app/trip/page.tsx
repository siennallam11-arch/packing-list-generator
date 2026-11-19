import type { Metadata } from "next";
import { Suspense } from "react";
import { Trip } from "./Trip";

export const metadata: Metadata = { title: "Your trip · Caboodle" };

export default function Page() {
  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
      <Trip />
    </Suspense>
  );
}
