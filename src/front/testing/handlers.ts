import { HttpResponse, http } from "msw";
import type { ItemData } from "../features/list-detail/api";
import type { ListItem } from "../features/lists/api";

const now = new Date().toISOString();

const testUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatarUrl: null,
};

export const testLists: ListItem[] = [
  {
    id: "list-1",
    name: "Groceries",
    createdBy: "user-1",
    createdAt: now,
    updatedAt: now,
    isParticipant: true,
    autoHideDone: true,
    isPrivate: false,
    participants: [{ id: "user-1", name: "Test User", avatarUrl: null }],
  },
  {
    id: "list-2",
    name: "Todo",
    createdBy: "user-2",
    createdAt: now,
    updatedAt: now,
    isParticipant: false,
    autoHideDone: true,
    isPrivate: false,
    participants: [{ id: "user-2", name: "Other User", avatarUrl: null }],
  },
];

const testItems: ItemData[] = [
  {
    id: "item-1",
    listId: "list-1",
    text: "Milk",
    checked: false,
    checkedAt: null,
    createdBy: "user-1",
    updatedBy: "user-1",
    position: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "item-2",
    listId: "list-1",
    text: "Bread",
    checked: true,
    checkedAt: now,
    createdBy: "user-1",
    updatedBy: "user-1",
    position: 1,
    createdAt: now,
    updatedAt: now,
  },
];

let nextId = 100;

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({ token: "fake-token", user: testUser });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  http.put("/api/auth/password", async ({ request }) => {
    const body = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };
    if (body.currentPassword === "wrong") {
      return HttpResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }
    return HttpResponse.json({ token: "new-fake-token" });
  }),

  http.get("/api/lists", () => {
    return HttpResponse.json(testLists);
  }),

  http.post("/api/lists", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const newList: ListItem = {
      id: `list-${++nextId}`,
      name: body.name,
      createdBy: "user-1",
      createdAt: now,
      updatedAt: now,
      isParticipant: true,
      autoHideDone: true,
      isPrivate: false,
      participants: [{ id: "user-1", name: "Test User", avatarUrl: null }],
    };
    return HttpResponse.json(newList);
  }),

  http.get("/api/items/:listId", () => {
    return HttpResponse.json(testItems);
  }),

  http.post("/api/items/:listId", async ({ request }) => {
    const body = (await request.json()) as { text: string };
    const newItem: ItemData = {
      id: `item-${++nextId}`,
      listId: "list-1",
      text: body.text,
      checked: false,
      checkedAt: null,
      createdBy: "user-1",
      updatedBy: "user-1",
      position: testItems.length,
      createdAt: now,
      updatedAt: now,
    };
    return HttpResponse.json(newItem);
  }),

  http.patch("/api/items/:listId/:itemId", async ({ request, params }) => {
    const body = (await request.json()) as {
      text?: string;
      checked?: boolean;
    };
    const item = testItems.find((i) => i.id === params.itemId);
    if (!item) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = { ...item, ...body, updatedAt: now };
    if (body.checked !== undefined) {
      updated.checkedAt = body.checked ? now : null;
    }
    return HttpResponse.json(updated);
  }),

  http.delete("/api/items/:listId/:itemId", () => {
    return HttpResponse.json({});
  }),

  http.delete("/api/items/:listId/checked", () => {
    return HttpResponse.json({});
  }),

  http.put("/api/items/:listId/reorder", () => {
    return HttpResponse.json({});
  }),

  http.patch("/api/lists/:listId", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("/api/lists/:listId", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/lists/:listId/join", () => {
    return HttpResponse.json({});
  }),

  http.post("/api/lists/:listId/leave", () => {
    return HttpResponse.json({ ok: true });
  }),
];
