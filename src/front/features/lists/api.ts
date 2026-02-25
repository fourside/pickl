import { apiFetch } from "../../shared/api/client";

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ListItem {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isParticipant: boolean;
  autoHideDone: boolean;
  isPrivate: boolean;
  participants: Participant[];
}

export function createList(name: string): Promise<ListItem> {
  return apiFetch<ListItem>("/lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
