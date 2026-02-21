import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export interface Database {
  users: {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    password_changed_at: string;
    avatar_key: string | null;
    created_at: string;
    updated_at: string;
  };
  lists: {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  };
  list_participants: {
    list_id: string;
    user_id: string;
    joined_at: string;
  };
  items: {
    id: string;
    list_id: string;
    text: string;
    checked: number;
    checked_at: string | null;
    created_by: string;
    updated_by: string;
    position: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  push_subscriptions: {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    created_at: string;
  };
}

export function createDb(d1: D1Database): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  });
}
