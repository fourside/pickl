import { render, screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { TestWrapper } from "../../testing/wrapper";
import { AuthGuard } from "./auth-guard";

describe("AuthGuard", () => {
  it("redirects to /login when not authenticated", () => {
    render(
      <TestWrapper initialEntries={["/"]} authenticated={false}>
        <Routes>
          <Route path="/login" element={<p>Login Page</p>} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<p>Home</p>} />
          </Route>
        </Routes>
      </TestWrapper>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    render(
      <TestWrapper initialEntries={["/"]} authenticated>
        <Routes>
          <Route path="/login" element={<p>Login Page</p>} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<p>Home</p>} />
          </Route>
        </Routes>
      </TestWrapper>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
