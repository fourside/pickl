import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ItemData } from "./api";
import { ItemRow } from "./item-row";

const baseItem: ItemData = {
  id: "item-1",
  listId: "list-1",
  text: "Milk",
  checked: false,
  checkedAt: null,
  createdBy: "user-1",
  updatedBy: "user-1",
  position: 0,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("ItemRow", () => {
  it("renders checkbox and text", () => {
    render(
      <ItemRow
        item={baseItem}
        isParticipant
        onCheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
  });

  it("disables checkbox when not participant", () => {
    render(
      <ItemRow
        item={baseItem}
        isParticipant={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("shows delete button for participants", () => {
    render(
      <ItemRow
        item={baseItem}
        isParticipant
        onCheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Delete Milk" }),
    ).toBeInTheDocument();
  });

  it("hides delete button for non-participants", () => {
    render(
      <ItemRow
        item={baseItem}
        isParticipant={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Delete/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onCheck when checkbox is clicked", async () => {
    const onCheck = vi.fn();
    const user = userEvent.setup();

    render(
      <ItemRow
        item={baseItem}
        isParticipant
        onCheck={onCheck}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onCheck).toHaveBeenCalledWith("item-1", true);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ItemRow
        item={baseItem}
        isParticipant
        onCheck={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Milk" }));
    expect(onDelete).toHaveBeenCalledWith("item-1");
  });
});
