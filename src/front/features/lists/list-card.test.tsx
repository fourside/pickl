import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
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
});
