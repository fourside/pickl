import * as v from "valibot";

type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  passwordChangedAt: string;
  createdAt: string;
  updatedAt: string;
};

export const UserSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  email: v.pipe(v.string(), v.email()),
  passwordHash: v.pipe(v.string(), v.nonEmpty()),
  name: v.pipe(v.string(), v.nonEmpty()),
  passwordChangedAt: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
}) satisfies v.GenericSchema<User>;

export const LoginRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.nonEmpty()),
});

export const ChangePasswordRequestSchema = v.object({
  currentPassword: v.pipe(v.string(), v.nonEmpty()),
  newPassword: v.pipe(v.string(), v.minLength(8)),
});
