import * as v from "valibot";

export type List = {
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
export type CreateListRequest = v.InferOutput<typeof CreateListRequestSchema>;

export type ListParticipant = {
  listId: string;
  userId: string;
  joinedAt: string;
};
