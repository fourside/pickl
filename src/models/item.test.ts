import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  CreateItemRequestSchema,
  ItemSchema,
  ReorderItemsRequestSchema,
  UpdateItemRequestSchema,
} from "./item";

describe("ItemSchema", () => {
  const validItem = {
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
    deletedAt: null,
  };

  it("parses valid item", () => {
    expect(v.parse(ItemSchema, validItem)).toEqual(validItem);
  });

  it("parses checked item with checkedAt", () => {
    const checked = {
      ...validItem,
      checked: true,
      checkedAt: "2025-01-01T12:00:00Z",
    };
    expect(v.parse(ItemSchema, checked)).toEqual(checked);
  });

  it("rejects empty text", () => {
    expect(() => v.parse(ItemSchema, { ...validItem, text: "" })).toThrow();
  });
});

describe("CreateItemRequestSchema", () => {
  it("parses valid request", () => {
    expect(v.parse(CreateItemRequestSchema, { text: "Eggs" })).toEqual({
      text: "Eggs",
    });
  });

  it("rejects empty text", () => {
    expect(() => v.parse(CreateItemRequestSchema, { text: "" })).toThrow();
  });
});

describe("UpdateItemRequestSchema", () => {
  it("parses text update", () => {
    expect(v.parse(UpdateItemRequestSchema, { text: "Bread" })).toEqual({
      text: "Bread",
    });
  });

  it("parses checked update", () => {
    expect(v.parse(UpdateItemRequestSchema, { checked: true })).toEqual({
      checked: true,
    });
  });

  it("parses empty object", () => {
    expect(v.parse(UpdateItemRequestSchema, {})).toEqual({});
  });
});

describe("ReorderItemsRequestSchema", () => {
  it("parses valid reorder", () => {
    const input = { itemIds: ["item-2", "item-1", "item-3"] };
    expect(v.parse(ReorderItemsRequestSchema, input)).toEqual(input);
  });

  it("rejects empty array", () => {
    expect(() => v.parse(ReorderItemsRequestSchema, { itemIds: [] })).toThrow();
  });
});
