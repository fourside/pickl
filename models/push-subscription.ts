import * as v from "valibot";

export type PushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
};

export const PushSubscriptionSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  userId: v.pipe(v.string(), v.nonEmpty()),
  endpoint: v.pipe(v.string(), v.url()),
  p256dh: v.pipe(v.string(), v.nonEmpty()),
  auth: v.pipe(v.string(), v.nonEmpty()),
  createdAt: v.string(),
}) satisfies v.GenericSchema<PushSubscription>;

export const SubscribeRequestSchema = v.object({
  endpoint: v.pipe(v.string(), v.url()),
  keys: v.object({
    p256dh: v.pipe(v.string(), v.nonEmpty()),
    auth: v.pipe(v.string(), v.nonEmpty()),
  }),
});
export type SubscribeRequest = v.InferOutput<typeof SubscribeRequestSchema>;
