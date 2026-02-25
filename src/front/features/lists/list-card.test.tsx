import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ListItem } from "./api";
import { ListCard } from "./list-card";

const baseList: ListItem = {
  id: "list-1",
  name: "Groceries",
  createdBy: "user-1",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  isParticipant: true,
  participants: [{ id: "user-1", name: "Test User", avatarUrl: null }],
};

describe("ListCard", () => {
  it("renders list name as a link", () => {
    render(
      <MemoryRouter>
        <ListCard list={baseList} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /Groceries/ });
    expect(link).toHaveAttribute("href", "/lists/list-1");
  });

  it("shows 'Joined' badge when participant", () => {
    render(
      <MemoryRouter>
        <ListCard list={{ ...baseList, isParticipant: true }} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("shows 'View' badge when not participant", () => {
    render(
      <MemoryRouter>
        <ListCard list={{ ...baseList, isParticipant: false }} />
      </MemoryRouter>,
    );

    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("shows trash icon when user is creator", () => {
    render(
      <MemoryRouter>
        <ListCard
          list={baseList}
          currentUserId="user-1"
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Delete list" }),
    ).toBeInTheDocument();
  });

  it("hides trash icon when user is not creator", () => {
    render(
      <MemoryRouter>
        <ListCard
          list={baseList}
          currentUserId="user-2"
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: "Delete list" }),
    ).not.toBeInTheDocument();
  });

  it("calls onDeleteClick with list id when trash icon clicked", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();

    render(
      <MemoryRouter>
        <ListCard
          list={baseList}
          currentUserId="user-1"
          onDeleteClick={onDeleteClick}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Delete list" }));
    expect(onDeleteClick).toHaveBeenCalledWith("list-1");
  });
});
