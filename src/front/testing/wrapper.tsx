import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";
import { AuthProvider } from "../shared/auth/auth-context";
import { ThemeProvider } from "../shared/theme/theme-context";

interface TestWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
  authenticated?: boolean;
}

export function TestWrapper({
  children,
  initialEntries = ["/"],
  authenticated = true,
}: TestWrapperProps) {
  if (authenticated) {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      }),
    );
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>
        <ThemeProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </ThemeProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
