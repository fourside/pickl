import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { CreateListRequestSchema, ListSchema } from "./list";

describe("ListSchema", () => {
  const validList = {
    id: "list-1",
    name: "Groceries",
    createdBy: "user-1",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  it("parses valid list", () => {
    expect(v.parse(ListSchema, validList)).toEqual(validList);
  });

  it("rejects empty name", () => {
    expect(() => v.parse(ListSchema, { ...validList, name: "" })).toThrow();
  });
});

describe("CreateListRequestSchema", () => {
  it("parses valid request", () => {
    expect(v.parse(CreateListRequestSchema, { name: "Shopping" })).toEqual({
      name: "Shopping",
    });
  });

  it("rejects empty name", () => {
    expect(() => v.parse(CreateListRequestSchema, { name: "" })).toThrow();
  });
});
