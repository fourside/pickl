import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ItemData } from "./api";
import { SwipeableItemRow } from "./swipeable-item-row";

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

describe("SwipeableItemRow", () => {
  it("renders item text and checkbox", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
  });

  it("renders swipe delete action for participants", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Delete Milk" }),
    ).toBeInTheDocument();
  });

  it("does not render swipe delete action for non-participants", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant={false}
        isRevealed={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Delete/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onDelete and onReveal(null) when delete action is clicked", async () => {
    const onDelete = vi.fn();
    const onReveal = vi.fn();
    const user = userEvent.setup();

    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed
        onCheck={vi.fn()}
        onDelete={onDelete}
        onReveal={onReveal}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Milk" }));
    expect(onReveal).toHaveBeenCalledWith(null);
    expect(onDelete).toHaveBeenCalledWith("item-1");
  });

  it("sets tabIndex=-1 when not revealed", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Delete Milk" })).toHaveAttribute(
      "tabIndex",
      "-1",
    );
  });

  it("sets tabIndex=0 when revealed", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Delete Milk" })).toHaveAttribute(
      "tabIndex",
      "0",
    );
  });

  it("does not show inline delete button from ItemRow", () => {
    render(
      <SwipeableItemRow
        item={baseItem}
        isParticipant
        isRevealed={false}
        onCheck={vi.fn()}
        onDelete={vi.fn()}
        onReveal={vi.fn()}
      />,
    );

    // Only one delete button should exist (the swipe action), not the inline one
    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete Milk",
    });
    expect(deleteButtons).toHaveLength(1);
  });
});
