import type { Database } from '@/shared/lib/database.interfaces';
/**
 * The names the app uses for database rows. Tables come straight from the
 * generated schema; the three views are typed by hand because Postgres reports
 * every view column as nullable, which is not what these views return.
 *
 * WHY `type` AND NOT `interface`: supabase-js constrains rows to
 * `Record<string, unknown>`, and only type aliases get an implicit index
 * signature. Declared as interfaces, query results degrade to `never`.
 */
type PublicSchema = Database['public'];

export type { Database };
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Profile = Tables<'profiles'>;
export type Friendship = Tables<'friendships'>;
export type Moment = Tables<'moments'>;
export type Trade = Tables<'trades'>;
export type Message = Tables<'messages'>;
export type Invite = Tables<'invites'>;
export type FriendshipStatus = Enums<'friendship_status'>;
export type TradeStatus = Enums<'trade_status'>;

/** `public.v_inbox` — every trade where I am the responder, lock resolved. */
export type InboxRow = {
  trade_id: string;
  from_id: string;
  from_name: string;
  from_username: string | null;
  from_avatar_storage_path: string | null;
  moment_id: string;
  caption: string | null;
  moment_created_at: string;
  status: TradeStatus;
  seen_at: string | null;
  auto_unlock_at: string | null;
  unlocked_at: string | null;
  is_open: boolean;
  created_at: string;
};

/** `public.v_pairs` — completed trades as photo pairs. */
export type PairRow = {
  trade_id: string;
  user_a: string;
  user_b: string;
  initiator_moment_id: string;
  responder_moment_id: string;
  unlocked_at: string | null;
  pair_at: string;
  created_at: string;
};

/** `public.v_threads` — last message per conversation. */
export type ThreadRow = {
  partner_id: string;
  last_message_id: string;
  last_content: string | null;
  last_moment_id: string | null;
  last_sender_id: string;
  last_at: string;
  unread_count: number;
};
