/**
 * GENERATED from the Supabase project by the MCP tool `generate_typescript_types`.
 * Do not edit. Regenerate after every migration. App code imports row names from
 * `@/shared/lib/database.types`, never from this file.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'device_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          id: string;
          recipient_id: string;
          requester_id: string;
          responded_at: string | null;
          status: Database['public']['Enums']['friendship_status'];
        };
        Insert: {
          created_at?: string;
          id?: string;
          recipient_id: string;
          requester_id: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friendship_status'];
        };
        Update: {
          created_at?: string;
          id?: string;
          recipient_id?: string;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friendship_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invites: {
        Row: {
          claimed_at: string | null;
          claimer_id: string | null;
          created_at: string;
          expires_at: string;
          inviter_id: string;
          moment_id: string | null;
          token: string;
        };
        Insert: {
          claimed_at?: string | null;
          claimer_id?: string | null;
          created_at?: string;
          expires_at?: string;
          inviter_id: string;
          moment_id?: string | null;
          token?: string;
        };
        Update: {
          claimed_at?: string | null;
          claimer_id?: string | null;
          created_at?: string;
          expires_at?: string;
          inviter_id?: string;
          moment_id?: string | null;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_claimer_id_fkey';
            columns: ['claimer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_inviter_id_fkey';
            columns: ['inviter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          moment_id: string | null;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
          trade_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          moment_id?: string | null;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
          trade_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          moment_id?: string | null;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
          trade_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_trade_id_fkey';
            columns: ['trade_id'];
            isOneToOne: false;
            referencedRelation: 'trades';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_trade_id_fkey';
            columns: ['trade_id'];
            isOneToOne: false;
            referencedRelation: 'v_inbox';
            referencedColumns: ['trade_id'];
          },
          {
            foreignKeyName: 'messages_trade_id_fkey';
            columns: ['trade_id'];
            isOneToOne: false;
            referencedRelation: 'v_pairs';
            referencedColumns: ['trade_id'];
          },
        ];
      };
      moments: {
        Row: {
          author_id: string;
          blurred_storage_path: string | null;
          caption: string | null;
          created_at: string;
          height: number | null;
          id: string;
          original_storage_path: string;
          width: number | null;
        };
        Insert: {
          author_id: string;
          blurred_storage_path?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          original_storage_path: string;
          width?: number | null;
        };
        Update: {
          author_id?: string;
          blurred_storage_path?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          original_storage_path?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'moments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_storage_path: string | null;
          created_at: string;
          first_name: string;
          heard_about: string | null;
          id: string;
          is_plus: boolean;
          locale: string;
          onboarding_done_at: string | null;
          tagline: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_storage_path?: string | null;
          created_at?: string;
          first_name?: string;
          heard_about?: string | null;
          id: string;
          is_plus?: boolean;
          locale?: string;
          onboarding_done_at?: string | null;
          tagline?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_storage_path?: string | null;
          created_at?: string;
          first_name?: string;
          heard_about?: string | null;
          id?: string;
          is_plus?: boolean;
          locale?: string;
          onboarding_done_at?: string | null;
          tagline?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          moment_id: string | null;
          reason: string;
          reporter_id: string;
          subject_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          moment_id?: string | null;
          reason: string;
          reporter_id: string;
          subject_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          moment_id?: string | null;
          reason?: string;
          reporter_id?: string;
          subject_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_subject_user_id_fkey';
            columns: ['subject_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trades: {
        Row: {
          auto_unlock_at: string | null;
          created_at: string;
          id: string;
          initiator_id: string;
          initiator_moment_id: string;
          responder_id: string;
          responder_moment_id: string | null;
          seen_at: string | null;
          status: Database['public']['Enums']['trade_status'];
          unlocked_at: string | null;
        };
        Insert: {
          auto_unlock_at?: string | null;
          created_at?: string;
          id?: string;
          initiator_id: string;
          initiator_moment_id: string;
          responder_id: string;
          responder_moment_id?: string | null;
          seen_at?: string | null;
          status?: Database['public']['Enums']['trade_status'];
          unlocked_at?: string | null;
        };
        Update: {
          auto_unlock_at?: string | null;
          created_at?: string;
          id?: string;
          initiator_id?: string;
          initiator_moment_id?: string;
          responder_id?: string;
          responder_moment_id?: string | null;
          seen_at?: string | null;
          status?: Database['public']['Enums']['trade_status'];
          unlocked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trades_initiator_id_fkey';
            columns: ['initiator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trades_initiator_moment_id_fkey';
            columns: ['initiator_moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trades_responder_id_fkey';
            columns: ['responder_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trades_responder_moment_id_fkey';
            columns: ['responder_moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      v_inbox: {
        Row: {
          auto_unlock_at: string | null;
          caption: string | null;
          created_at: string | null;
          from_avatar_storage_path: string | null;
          from_id: string | null;
          from_name: string | null;
          from_username: string | null;
          is_open: boolean | null;
          moment_created_at: string | null;
          moment_id: string | null;
          seen_at: string | null;
          status: Database['public']['Enums']['trade_status'] | null;
          trade_id: string | null;
          unlocked_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trades_initiator_id_fkey';
            columns: ['from_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trades_initiator_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
        ];
      };
      v_my_friends: {
        Row: {
          created_at: string | null;
          friend_id: string | null;
          friendship_id: string | null;
          responded_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          friend_id?: never;
          friendship_id?: string | null;
          responded_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          friend_id?: never;
          friendship_id?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      v_pairs: {
        Row: {
          created_at: string | null;
          initiator_moment_id: string | null;
          pair_at: string | null;
          responder_moment_id: string | null;
          trade_id: string | null;
          unlocked_at: string | null;
          user_a: string | null;
          user_b: string | null;
        };
        Insert: {
          created_at?: string | null;
          initiator_moment_id?: string | null;
          pair_at?: never;
          responder_moment_id?: string | null;
          trade_id?: string | null;
          unlocked_at?: string | null;
          user_a?: never;
          user_b?: never;
        };
        Update: {
          created_at?: string | null;
          initiator_moment_id?: string | null;
          pair_at?: never;
          responder_moment_id?: string | null;
          trade_id?: string | null;
          unlocked_at?: string | null;
          user_a?: never;
          user_b?: never;
        };
        Relationships: [
          {
            foreignKeyName: 'trades_initiator_moment_id_fkey';
            columns: ['initiator_moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trades_responder_moment_id_fkey';
            columns: ['responder_moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
        ];
      };
      v_threads: {
        Row: {
          last_at: string | null;
          last_content: string | null;
          last_message_id: string | null;
          last_moment_id: string | null;
          last_sender_id: string | null;
          partner_id: string | null;
          unread_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_moment_id_fkey';
            columns: ['last_moment_id'];
            isOneToOne: false;
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['last_sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      can_see_moment: { Args: { p_moment_id: string }; Returns: boolean };
      can_see_original: { Args: { p_moment_id: string }; Returns: boolean };
      claim_invite: {
        Args: { p_token: string };
        Returns: {
          inviter_id: string;
          moment_id: string;
          trade_id: string;
        }[];
      };
      config_int: {
        Args: { p_default: number; p_key: string };
        Returns: number;
      };
      generate_username: { Args: { p_first_name: string }; Returns: string };
      invite_object_readable: { Args: { p_name: string }; Returns: boolean };
      invite_preview: {
        Args: { p_token: string };
        Returns: {
          blurred_storage_path: string;
          created_at: string;
          inviter_avatar_storage_path: string;
          inviter_first_name: string;
          moment_id: string;
        }[];
      };
      is_blocked: { Args: { a: string; b: string }; Returns: boolean };
      moment_shared_between: {
        Args: { a: string; b: string; p_moment_id: string };
        Returns: boolean;
      };
      mutual_friends_count: { Args: { p_user_id: string }; Returns: number };
      mutual_friends_counts: {
        Args: { p_user_ids: string[] };
        Returns: {
          mutual: number;
          user_id: string;
        }[];
      };
      register_device_token: {
        Args: { p_platform: string; p_token: string };
        Returns: undefined;
      };
      respond_to_trade: {
        Args: { p_moment_id: string; p_trade_id: string };
        Returns: {
          auto_unlock_at: string | null;
          created_at: string;
          id: string;
          initiator_id: string;
          initiator_moment_id: string;
          responder_id: string;
          responder_moment_id: string | null;
          seen_at: string | null;
          status: Database['public']['Enums']['trade_status'];
          unlocked_at: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'trades';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      send_moment: {
        Args: { p_moment_id: string; p_recipient_ids: string[] };
        Returns: {
          auto_unlock_at: string | null;
          created_at: string;
          id: string;
          initiator_id: string;
          initiator_moment_id: string;
          responder_id: string;
          responder_moment_id: string | null;
          seen_at: string | null;
          status: Database['public']['Enums']['trade_status'];
          unlocked_at: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'trades';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      storage_object_deletable: { Args: { p_name: string }; Returns: boolean };
      storage_object_readable: { Args: { p_name: string }; Returns: boolean };
      trade_is_open: {
        Args: { t: Database['public']['Tables']['trades']['Row'] };
        Returns: boolean;
      };
      visible_moment_paths: {
        Args: { p_moment_ids: string[] };
        Returns: {
          moment_id: string;
          path: string;
        }[];
      };
    };
    Enums: {
      friendship_status: 'pending' | 'accepted';
      trade_status: 'pending' | 'unlocked' | 'expired';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      friendship_status: ['pending', 'accepted'],
      trade_status: ['pending', 'unlocked', 'expired'],
    },
  },
} as const;
