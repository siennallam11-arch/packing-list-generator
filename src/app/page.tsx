import { Suspense } from "react";
import { Home } from "./Home";

export default function Page() {
  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
      <Home />
    </Suspense>
  );
}
