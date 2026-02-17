import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "../../testing/server";
import { TestWrapper } from "../../testing/wrapper";
import { LoginPage } from "./page";

function renderLogin(authenticated = false) {
  return render(
    <TestWrapper initialEntries={["/login"]} authenticated={authenticated}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Home</p>} />
      </Routes>
    </TestWrapper>,
  );
}

describe("LoginPage", () => {
  it("renders login form with email, password, and submit button", () => {
    renderLogin(false);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("redirects to / when already authenticated", () => {
    renderLogin(true);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("logs in successfully with valid credentials", async () => {
    const user = userEvent.setup();
    renderLogin(false);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("shows error message on login failure", async () => {
    const user = userEvent.setup();
    renderLogin(false);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("disables button and shows '...' while submitting", async () => {
    server.use(
      http.post("/api/auth/login", async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({
          token: "t",
          user: { id: "1", name: "U", email: "u@e.com" },
        });
      }),
    );

    const user = userEvent.setup();
    renderLogin(false);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("...");
  });
});
