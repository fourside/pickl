import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { TestWrapper } from "../../testing/wrapper";
import { SettingsPage } from "./page";

function renderSettings() {
  return render(
    <TestWrapper initialEntries={["/settings"]}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<p>Login Page</p>} />
        <Route path="/" element={<p>Home</p>} />
      </Routes>
    </TestWrapper>,
  );
}

describe("SettingsPage", () => {
  it("shows user name and email", () => {
    renderSettings();

    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it("shows success message and clears form on password change", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(
      screen.getByLabelText("New Password (8+ chars)"),
      "newpassword",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toHaveValue("");
    expect(screen.getByLabelText("New Password (8+ chars)")).toHaveValue("");
  });

  it("shows error message on password change failure", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText("Current Password"), "wrong");
    await user.type(
      screen.getByLabelText("New Password (8+ chars)"),
      "newpassword",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    expect(
      await screen.findByText("Current password is incorrect"),
    ).toBeInTheDocument();
  });

  it("navigates to /login on logout", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
