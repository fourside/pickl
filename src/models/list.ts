import * as v from "valibot";

type List = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const ListSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  name: v.pipe(v.string(), v.nonEmpty()),
  createdBy: v.pipe(v.string(), v.nonEmpty()),
  createdAt: v.string(),
  updatedAt: v.string(),
}) satisfies v.GenericSchema<List>;

export const CreateListRequestSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
});

export const UpdateListRequestSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.nonEmpty())),
  autoHideDone: v.optional(v.boolean()),
});
