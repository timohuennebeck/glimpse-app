/**
 * Hand-written to mirror `supabase/migrations`. Once you point the app at a real
 * project, regenerate instead of editing:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/shared/lib/database.interfaces.ts
 *
 * WHY THESE ARE `type` AND NOT `interface`
 * The project rule is interfaces wherever possible. It is not possible here:
 * supabase-js constrains every Row/Insert/Update and the whole schema to
 * `Record<string, unknown>`, and TypeScript only gives an *implicit* index
 * signature to type aliases, never to interfaces. Declared as interfaces, the
 * client silently degrades every query result to `never`. Generated Supabase
 * types are aliases for the same reason.
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';
export type TradeStatus = 'pending' | 'unlocked' | 'expired';
export type CameraFacing = 'front' | 'back';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_path: string | null;
  tagline: string | null;
  locale: string;
  heard_about: string | null;
  onboarding_done_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};

export type Moment = {
  id: string;
  author_id: string;
  original_path: string;
  blurred_path: string | null;
  caption: string | null;
  facing: CameraFacing;
  width: number | null;
  height: number | null;
  captured_at: string;
  created_at: string;
};

export type Trade = {
  id: string;
  initiator_id: string;
  responder_id: string;
  initiator_moment_id: string;
  responder_moment_id: string | null;
  status: TradeStatus;
  auto_unlock_at: string | null;
  unlocked_at: string | null;
  seen_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  moment_id: string | null;
  trade_id: string | null;
  created_at: string;
  read_at: string | null;
};

/** `public.v_inbox` — what the feed and the widget read. */
export type InboxRow = {
  trade_id: string;
  from_id: string;
  from_name: string;
  from_username: string | null;
  from_avatar_path: string | null;
  moment_id: string;
  caption: string | null;
  captured_at: string;
  status: TradeStatus;
  seen_at: string | null;
  auto_unlock_at: string | null;
  unlocked_at: string | null;
  is_open: boolean;
  created_at: string;
};

/** `public.v_pairs` — completed trades rendered as photo pairs. */
export type PairRow = {
  trade_id: string;
  user_a: string;
  user_b: string;
  initiator_moment_id: string;
  responder_moment_id: string;
  unlocked_at: string | null;
  pair_date: string;
  created_at: string;
};

/** `public.v_threads` — chat list rows. */
export type ThreadRow = {
  partner_id: string;
  last_message_id: string;
  last_body: string | null;
  last_moment_id: string | null;
  last_sender_id: string;
  last_at: string;
  unread_count: number;
};

export type ReferralCode = {
  code: string;
  owner_id: string | null;
  kind: 'personal' | 'partner';
  max_redemptions: number | null;
  redemptions: number;
  expires_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Pick<Friendship, 'requester_id' | 'addressee_id'> & Partial<Friendship>;
        Update: Partial<Friendship>;
        Relationships: [];
      };
      moments: {
        Row: Moment;
        Insert: Pick<Moment, 'author_id' | 'original_path'> & Partial<Moment>;
        Update: Partial<Moment>;
        Relationships: [];
      };
      trades: {
        Row: Trade;
        Insert: never;
        Update: Partial<Pick<Trade, 'seen_at'>>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Pick<Message, 'sender_id' | 'recipient_id'> & Partial<Message>;
        Update: Partial<Pick<Message, 'read_at'>>;
        Relationships: [];
      };
      referral_codes: {
        Row: ReferralCode;
        Insert: Partial<ReferralCode> & { code: string };
        Update: Partial<ReferralCode>;
        Relationships: [];
      };
      referral_redemptions: {
        Row: { id: string; code: string; redeemer_id: string; created_at: string };
        Insert: { code: string; redeemer_id: string };
        Update: never;
        Relationships: [];
      };
      device_tokens: {
        Row: { id: string; user_id: string; token: string; platform: 'ios' | 'android'; created_at: string };
        Insert: { user_id: string; token: string; platform: 'ios' | 'android' };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      v_inbox: { Row: InboxRow; Relationships: [] };
      v_pairs: { Row: PairRow; Relationships: [] };
      v_threads: { Row: ThreadRow; Relationships: [] };
      v_my_friends: {
        Row: { friend_id: string; friendship_id: string; created_at: string; responded_at: string | null };
        Relationships: [];
      };
    };
    Functions: {
      send_moment: {
        Args: { p_moment_id: string; p_recipient_ids: string[] };
        Returns: Trade[];
      };
      respond_to_trade: {
        Args: { p_trade_id: string; p_moment_id: string };
        Returns: Trade;
      };
      visible_moment_paths: {
        Args: { p_moment_ids: string[] };
        Returns: { moment_id: string; path: string | null }[];
      };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
    };
  };
};
