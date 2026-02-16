import type { GlobalProvider } from "@ladle/react";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";
import { AuthProvider } from "../src/shared/auth/auth-context";

let mswReady = false;

async function startMsw() {
  if (mswReady) return;
  const [{ setupWorker }, { handlers }] = await Promise.all([
    import("msw/browser"),
    import("../src/testing/handlers"),
  ]);
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
  mswReady = true;
}

export const Provider: GlobalProvider = ({ children }) => {
  const [ready, setReady] = useState(mswReady);

  useEffect(() => {
    startMsw().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  // Set auth token so pages that require auth will work
  localStorage.setItem("token", "fake-token");
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    }),
  );

  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </SWRConfig>
  );
};
