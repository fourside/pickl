import { apiFetch } from "../../shared/api/client";

export interface ListItem {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isParticipant: boolean;
}

export function createList(name: string): Promise<ListItem> {
  return apiFetch<ListItem>("/lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
