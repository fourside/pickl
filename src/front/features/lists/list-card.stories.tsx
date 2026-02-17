import type { Story } from "@ladle/react";
import { ListCard } from "./list-card";

const baseList = {
  id: "list-1",
  name: "Groceries",
  createdBy: "user-1",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  isParticipant: true,
};

export const Joined: Story = () => (
  <ListCard list={{ ...baseList, isParticipant: true }} />
);

export const ViewOnly: Story = () => (
  <ListCard list={{ ...baseList, isParticipant: false }} />
);
