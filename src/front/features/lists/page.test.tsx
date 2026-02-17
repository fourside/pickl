import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "../../testing/server";
import { TestWrapper } from "../../testing/wrapper";
import { ListsPage } from "./page";

function renderLists() {
  return render(
    <TestWrapper initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ListsPage />} />
        <Route path="/settings" element={<p>Settings Page</p>} />
      </Routes>
    </TestWrapper>,
  );
}

describe("ListsPage", () => {
  it("renders list items", async () => {
    renderLists();

    expect(await screen.findByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();
  });

  it("shows 'No lists yet' when empty", async () => {
    server.use(http.get("/api/lists", () => HttpResponse.json([])));
    renderLists();

    expect(await screen.findByText("No lists yet")).toBeInTheDocument();
  });

  it("shows Settings link", async () => {
    renderLists();

    expect(
      await screen.findByRole("link", { name: "Settings" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("creates a new list via input bar", async () => {
    const user = userEvent.setup();
    renderLists();

    await screen.findByText("Groceries");

    const input = screen.getByPlaceholderText("New list...");
    await user.type(input, "Shopping{Enter}");

    expect(await screen.findByText("Shopping")).toBeInTheDocument();
  });
});
