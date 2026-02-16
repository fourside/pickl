import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
  UserSchema,
} from "./user";

describe("UserSchema", () => {
  const validUser = {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "hash",
    name: "Test User",
    passwordChangedAt: "2025-01-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  it("parses valid user", () => {
    expect(v.parse(UserSchema, validUser)).toEqual(validUser);
  });

  it("rejects empty id", () => {
    expect(() => v.parse(UserSchema, { ...validUser, id: "" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      v.parse(UserSchema, { ...validUser, email: "invalid" }),
    ).toThrow();
  });
});

describe("LoginRequestSchema", () => {
  it("parses valid login", () => {
    const input = { email: "test@example.com", password: "password" };
    expect(v.parse(LoginRequestSchema, input)).toEqual(input);
  });

  it("rejects empty password", () => {
    expect(() =>
      v.parse(LoginRequestSchema, { email: "test@example.com", password: "" }),
    ).toThrow();
  });
});

describe("ChangePasswordRequestSchema", () => {
  it("parses valid request", () => {
    const input = { currentPassword: "old", newPassword: "newpass12" };
    expect(v.parse(ChangePasswordRequestSchema, input)).toEqual(input);
  });

  it("rejects short new password", () => {
    expect(() =>
      v.parse(ChangePasswordRequestSchema, {
        currentPassword: "old",
        newPassword: "short",
      }),
    ).toThrow();
  });
});
