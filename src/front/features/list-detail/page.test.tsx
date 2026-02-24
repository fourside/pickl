import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { testLists } from "../../testing/handlers";
import { server } from "../../testing/server";
import { TestWrapper } from "../../testing/wrapper";
import { ListDetailPage } from "./page";

function renderDetail(listId = "list-1", lists = testLists) {
  server.use(http.get("/api/lists", () => HttpResponse.json(lists)));

  return render(
    <TestWrapper initialEntries={[`/lists/${listId}`]}>
      <Routes>
        <Route path="/lists/:id" element={<ListDetailPage />} />
        <Route path="/" element={<p>Home</p>} />
      </Routes>
    </TestWrapper>,
  );
}

describe("ListDetailPage", () => {
  it("renders list name in header", async () => {
    renderDetail();

    expect(
      await screen.findByRole("heading", { name: "Groceries" }),
    ).toBeInTheDocument();
  });

  it("shows 'View only' banner and 'Join' button for non-participants", async () => {
    renderDetail("list-2");

    expect(await screen.findByText("View only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });

  it("shows input bar for participants", async () => {
    renderDetail("list-1");

    await screen.findByRole("heading", { name: "Groceries" });
    expect(screen.getByPlaceholderText("Add item...")).toBeInTheDocument();
  });

  it("hides input bar for non-participants", async () => {
    renderDetail("list-2");

    await screen.findByText("View only");
    expect(
      screen.queryByPlaceholderText("Add item..."),
    ).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    const user = userEvent.setup();
    renderDetail("list-1");

    await screen.findByText("Milk");

    const input = screen.getByPlaceholderText("Add item...");
    await user.type(input, "Eggs{Enter}");

    expect(await screen.findByText("Eggs")).toBeInTheDocument();
  });

  it("moves item to Done section when checked", async () => {
    const user = userEvent.setup();
    renderDetail("list-1");

    await screen.findByText("Milk");

    const checkbox = screen.getByRole("checkbox", { name: "Check Milk" });
    await user.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it("removes item when deleted", async () => {
    const user = userEvent.setup();
    renderDetail("list-1");

    await screen.findByText("Milk");

    await user.click(screen.getByRole("button", { name: "Delete Milk" }));

    await waitFor(() => {
      expect(screen.queryByText("Milk")).not.toBeInTheDocument();
    });
  });

  it("shows 'No items yet' when list is empty", async () => {
    server.use(http.get("/api/items/:listId", () => HttpResponse.json([])));
    renderDetail("list-1");

    expect(await screen.findByText("No items yet")).toBeInTheDocument();
  });

  it("shows settings menu trigger for participants", async () => {
    renderDetail("list-1");

    await screen.findByRole("heading", { name: "Groceries" });
    expect(
      screen.getByRole("button", { name: "List settings" }),
    ).toBeInTheDocument();
  });

  it("hides settings menu trigger for non-participants", async () => {
    renderDetail("list-2");

    await screen.findByText("View only");
    expect(
      screen.queryByRole("button", { name: "List settings" }),
    ).not.toBeInTheDocument();
  });

  it("joins a list when Join is clicked", async () => {
    const joinedLists = testLists.map((l) =>
      l.id === "list-2" ? { ...l, isParticipant: true } : l,
    );

    const user = userEvent.setup();
    renderDetail("list-2");

    await screen.findByText("View only");

    // Override handlers after initial render so the dynamic handler takes priority
    let joined = false;
    server.use(
      http.post("/api/lists/:listId/join", () => {
        joined = true;
        return HttpResponse.json({});
      }),
      http.get("/api/lists", () => {
        return HttpResponse.json(joined ? joinedLists : testLists);
      }),
    );

    await user.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(screen.queryByText("View only")).not.toBeInTheDocument();
    });
  });

  it("leaves a list via menu with confirmation", async () => {
    const leftLists = testLists.map((l) =>
      l.id === "list-1" ? { ...l, isParticipant: false } : l,
    );

    const user = userEvent.setup();
    renderDetail("list-1");

    await screen.findByRole("heading", { name: "Groceries" });

    let left = false;
    server.use(
      http.post("/api/lists/:listId/leave", () => {
        left = true;
        return HttpResponse.json({ ok: true });
      }),
      http.get("/api/lists", () => {
        return HttpResponse.json(left ? leftLists : testLists);
      }),
    );

    await user.click(screen.getByRole("button", { name: "List settings" }));
    await user.click(await screen.findByText("Leave list"));

    expect(await screen.findByText("Leave this list?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Leave" }));

    await waitFor(() => {
      expect(screen.getByText("View only")).toBeInTheDocument();
    });
  });
});
