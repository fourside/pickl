import * as v from "valibot";

export type Item = {
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
  deletedAt: string | null;
};

export const ItemSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  listId: v.pipe(v.string(), v.nonEmpty()),
  text: v.pipe(v.string(), v.nonEmpty()),
  checked: v.boolean(),
  checkedAt: v.nullable(v.string()),
  createdBy: v.pipe(v.string(), v.nonEmpty()),
  updatedBy: v.pipe(v.string(), v.nonEmpty()),
  position: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
  deletedAt: v.nullable(v.string()),
}) satisfies v.GenericSchema<Item>;

export const CreateItemRequestSchema = v.object({
  text: v.pipe(v.string(), v.nonEmpty()),
});
export type CreateItemRequest = v.InferOutput<typeof CreateItemRequestSchema>;

export const UpdateItemRequestSchema = v.object({
  text: v.optional(v.pipe(v.string(), v.nonEmpty())),
  checked: v.optional(v.boolean()),
});
export type UpdateItemRequest = v.InferOutput<typeof UpdateItemRequestSchema>;

export const ReorderItemsRequestSchema = v.object({
  itemIds: v.pipe(v.array(v.string()), v.nonEmpty()),
});
export type ReorderItemsRequest = v.InferOutput<
  typeof ReorderItemsRequestSchema
>;
