DROP VIEW `user_display_view`;--> statement-breakpoint
CREATE VIEW `user_display_view` AS select "users"."id", "users"."primaryLiveStream", "users"."role", "users"."created_at", CASE 
        WHEN "users"."primaryLiveStream" = 'twitch' AND "twitch_channels"."display_name" IS NOT NULL 
        THEN "twitch_channels"."display_name" 
        ELSE "username" 
      END as "username", CASE 
        WHEN "users"."primaryLiveStream" = 'twitch' AND "twitch_channels"."profile_image_url" IS NOT NULL 
        THEN "twitch_channels"."profile_image_url" 
        ELSE "avatar_src" 
      END as "profile_image", "twitch_channels"."login", "slug" as "tiltify_slug", "url", "user_styles"."primary_color", "user_styles"."accent_color" from "users" inner join "tiltify_metadata_view" on "users"."id" = "tiltify_metadata_view"."user_id" left join "twitch_channels" on "users"."id" = "twitch_channels"."user_id" left join "user_styles" on "users"."id" = "user_styles"."user_id";