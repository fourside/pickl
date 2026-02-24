import { apiFetch } from "../../shared/api/client";

export interface ItemData {
  id: string;
  listId: string;
  text: string;
  checked: boolean;
  checkedAt: string | null;
  createdBy: string;
  updatedBy: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export function createItem(listId: string, text: string): Promise<ItemData> {
  return apiFetch<ItemData>(`/items/${listId}`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function updateItem(
  listId: string,
  itemId: string,
  data: { text?: string; checked?: boolean },
): Promise<ItemData> {
  return apiFetch<ItemData>(`/items/${listId}/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteItem(listId: string, itemId: string): Promise<void> {
  return apiFetch(`/items/${listId}/${itemId}`, { method: "DELETE" });
}

export function reorderItems(listId: string, itemIds: string[]): Promise<void> {
  return apiFetch(`/items/${listId}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ itemIds }),
  });
}

export function joinList(listId: string): Promise<void> {
  return apiFetch(`/lists/${listId}/join`, { method: "POST" });
}

export function leaveList(listId: string): Promise<void> {
  return apiFetch(`/lists/${listId}/leave`, { method: "POST" });
}

export function updateListName(listId: string, name: string): Promise<void> {
  return apiFetch(`/lists/${listId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function updateListAutoHide(
  listId: string,
  autoHideDone: boolean,
): Promise<void> {
  return apiFetch(`/lists/${listId}`, {
    method: "PATCH",
    body: JSON.stringify({ autoHideDone }),
  });
}
