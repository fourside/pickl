import type { Story } from "@ladle/react";
import { useState } from "react";
import { ItemRow } from "./item-row";
import { SwipeableItemRow } from "./swipeable-item-row";

const baseItem = {
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

export const Unchecked: Story = () => (
  <ItemRow
    item={baseItem}
    isParticipant
    onCheck={(id, checked) => console.log("check:", id, checked)}
    onDelete={(id) => console.log("delete:", id)}
  />
);

export const Checked: Story = () => (
  <ItemRow
    item={{ ...baseItem, checked: true, checkedAt: "2025-01-01T00:00:00Z" }}
    isParticipant
    onCheck={(id, checked) => console.log("check:", id, checked)}
    onDelete={(id) => console.log("delete:", id)}
  />
);

export const NonParticipant: Story = () => (
  <ItemRow
    item={baseItem}
    isParticipant={false}
    onCheck={(id, checked) => console.log("check:", id, checked)}
    onDelete={(id) => console.log("delete:", id)}
  />
);

function SwipeableStory({ revealed }: { revealed: boolean }) {
  const [revealedId, setRevealedId] = useState<string | null>(
    revealed ? baseItem.id : null,
  );
  return (
    <SwipeableItemRow
      item={baseItem}
      isParticipant
      isRevealed={revealedId === baseItem.id}
      onCheck={(id, checked) => console.log("check:", id, checked)}
      onDelete={(id) => console.log("delete:", id)}
      onReveal={setRevealedId}
    />
  );
}

export const SwipeableHidden: Story = () => <SwipeableStory revealed={false} />;

export const SwipeableRevealed: Story = () => <SwipeableStory revealed />;
