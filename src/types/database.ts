export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "member" | "moderator" | "admin";
export type UserStatus = "pending" | "verified" | "rejected" | "suspended";
export type ContentStatus = "pending" | "approved" | "rejected" | "removed";
export type ArticleStatus = "draft" | "pending" | "published" | "rejected" | "removed";
export type CommentStatus = "visible" | "hidden" | "removed";
export type ReportStatus = "open" | "actioned" | "dismissed";
export type ParentKind = "photo" | "article";
export type ReportTarget = "photo" | "article" | "comment" | "profile";
export type OfferKind = "mentoring" | "internship";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          batch_year: number | null;
          branch: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: UserStatus;
          bio: string | null;
          current_city: string | null;
          current_role: string | null;
          consent_accepted_at: string | null;
          consent_version: string | null;
          directory_opt_in: boolean;
          directory_show_city: boolean;
          directory_show_role: boolean;
          directory_show_bio: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          uploader_id: string | null;
          storage_key: string;
          thumb_key: string;
          caption: string | null;
          alt_text: string;
          batch_year: number;
          branch: string | null;
          event_tag: string | null;
          people_tagged: string[];
          status: ContentStatus;
          moderator_id: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          licence_confirmed: boolean;
          width: number;
          height: number;
          bytes: number;
          anonymised: boolean;
          deleted_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          uploader_id?: string | null;
          storage_key: string;
          thumb_key: string;
          caption?: string | null;
          alt_text: string;
          batch_year: number;
          branch?: string | null;
          event_tag?: string | null;
          people_tagged?: string[];
          status?: ContentStatus;
          licence_confirmed: boolean;
          width: number;
          height: number;
          bytes: number;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Row"]>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          author_id: string | null;
          title: string;
          slug: string;
          body: string;
          cover_photo_id: string | null;
          batch_year: number | null;
          status: ArticleStatus;
          published_at: string | null;
          rejection_reason: string | null;
          moderator_id: string | null;
          moderated_at: string | null;
          anonymised: boolean;
          deleted_at: string | null;
        } & Timestamps;
        Insert: {
          title: string;
          slug: string;
          author_id?: string | null;
          body?: string;
          status?: ArticleStatus;
          batch_year?: number | null;
          cover_photo_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Row"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          parent_type: ParentKind;
          parent_id: string;
          author_id: string | null;
          body: string;
          status: CommentStatus;
          anonymised: boolean;
          deleted_at: string | null;
        } & Timestamps;
        Insert: {
          parent_type: ParentKind;
          parent_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          parent_type: ParentKind;
          parent_id: string;
          user_id: string;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          parent_type: ParentKind;
          parent_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reactions"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          target_type: ReportTarget;
          target_id: string;
          reporter_id: string | null;
          reason: string;
          status: ReportStatus;
          handled_by: string | null;
          notes: string | null;
        } & Timestamps;
        Insert: {
          target_type: ReportTarget;
          target_id: string;
          reporter_id: string;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      batch_groups: {
        Row: {
          batch_year: number;
          branch: string;
          whatsapp_invite_url: string | null;
          coordinator_name: string | null;
          coordinator_contact: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          batch_year: number;
          branch: string;
          whatsapp_invite_url?: string | null;
          coordinator_name?: string | null;
          coordinator_contact?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["batch_groups"]["Row"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          id: number;
          site_name: string;
          tagline: string;
          association_name: string;
          moderation_photos: boolean;
          moderation_articles: boolean;
          moderation_comments: boolean;
          contact_email: string;
          consent_version: string;
          feature_photos: boolean;
          feature_articles: boolean;
          feature_comments: boolean;
          feature_directory: boolean;
          feature_mentoring: boolean;
          feature_monthly_prompt: boolean;
          upload_limit_per_day: number;
          comment_limit_per_day: number;
          retention_days: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [];
      };
      legal_documents: {
        Row: {
          slug: string;
          title: string;
          body_markdown: string;
          version: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Database["public"]["Tables"]["legal_documents"]["Row"];
        Update: Partial<Database["public"]["Tables"]["legal_documents"]["Row"]>;
        Relationships: [];
      };
      event_tags: {
        Row: { slug: string; label: string; sort_order: number };
        Insert: Database["public"]["Tables"]["event_tags"]["Row"];
        Update: Partial<Database["public"]["Tables"]["event_tags"]["Row"]>;
        Relationships: [];
      };
      alumni_register: {
        Row: {
          id: string;
          name: string;
          batch_year: number;
          branch: string;
          email: string | null;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          name: string;
          batch_year: number;
          branch: string;
          email?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["alumni_register"]["Row"]>;
        Relationships: [];
      };
      monthly_prompts: {
        Row: {
          id: string;
          theme: string;
          body: string | null;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          theme: string;
          body?: string | null;
          starts_at: string;
          ends_at?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_prompts"]["Row"]>;
        Relationships: [];
      };
      mentoring_offers: {
        Row: {
          id: string;
          author_id: string | null;
          kind: OfferKind;
          title: string;
          body: string;
          city: string | null;
          status: ContentStatus;
          moderator_id: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          anonymised: boolean;
          deleted_at: string | null;
        } & Timestamps;
        Insert: {
          author_id?: string | null;
          kind: OfferKind;
          title: string;
          body?: string;
          city?: string | null;
          status?: ContentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["mentoring_offers"]["Row"]>;
        Relationships: [];
      };
      mentoring_interest: {
        Row: {
          offer_id: string;
          member_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          offer_id: string;
          member_id: string;
          note?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          detail: Json;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          detail?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          name: string;
          batch_year: number | null;
          branch: string | null;
          avatar_url: string | null;
          bio: string | null;
          current_city: string | null;
          current_role: string | null;
          created_at: string;
          directory_opt_in: boolean | null;
          directory_show_city: boolean | null;
          directory_show_role: boolean | null;
          directory_show_bio: boolean | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      batch_groups_public: {
        Row: {
          batch_year: number;
          branch: string;
          coordinator_name: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      delete_own_account: { Args: Record<string, never>; Returns: undefined };
      export_own_data: { Args: Record<string, never>; Returns: Json };
      admin_storage_stats: { Args: Record<string, never>; Returns: Json };
      purge_expired_content: { Args: Record<string, never>; Returns: Json };
      current_prompt: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["monthly_prompts"]["Row"][];
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      content_status: ContentStatus;
      article_status: ArticleStatus;
      comment_status: CommentStatus;
      report_status: ReportStatus;
      parent_kind: ParentKind;
      report_target: ReportTarget;
      offer_kind: OfferKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
