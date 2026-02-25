import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { testLists } from "../../testing/handlers";
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

  it("shows delete button only for lists created by current user", async () => {
    renderLists();

    await screen.findByText("Groceries");

    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete list",
    });
    // list-1 is createdBy user-1 (current user), list-2 is createdBy user-2
    expect(deleteButtons).toHaveLength(1);
  });

  it("shows confirmation dialog on delete click", async () => {
    const user = userEvent.setup();
    renderLists();

    await screen.findByText("Groceries");

    await user.click(screen.getByRole("button", { name: "Delete list" }));

    expect(await screen.findByText("Delete this list?")).toBeInTheDocument();
  });

  it("removes list after confirming deletion", async () => {
    let deleted = false;
    server.use(
      http.delete("/api/lists/:listId", () => {
        deleted = true;
        return HttpResponse.json({ ok: true });
      }),
      http.get("/api/lists", () => {
        if (deleted) {
          return HttpResponse.json(testLists.filter((l) => l.id !== "list-1"));
        }
        return HttpResponse.json(testLists);
      }),
    );

    const user = userEvent.setup();
    renderLists();

    await screen.findByText("Groceries");

    await user.click(screen.getByRole("button", { name: "Delete list" }));
    await screen.findByText("Delete this list?");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    });
  });

  it("keeps list after cancelling deletion", async () => {
    const user = userEvent.setup();
    renderLists();

    await screen.findByText("Groceries");

    await user.click(screen.getByRole("button", { name: "Delete list" }));
    await screen.findByText("Delete this list?");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });
});
