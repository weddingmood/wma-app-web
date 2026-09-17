CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(30) DEFAULT 'superadmin',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(60) NOT NULL,
	"source" varchar(150),
	"organism" varchar(150),
	"source_url" text,
	"verified_at" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"couple_id" integer,
	"action" varchar(100) NOT NULL,
	"details" text,
	"ip_address" varchar(60),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"allocated_amount" integer DEFAULT 0,
	"icon_key" varchar(50) DEFAULT 'wallet',
	"color_key" varchar(50) DEFAULT 'gold',
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "cagnotte_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"donor_name" varchar(150) NOT NULL,
	"donor_phone" varchar(50),
	"amount" integer NOT NULL,
	"message" text,
	"payment_reference" varchar(100),
	"is_verified" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_date" varchar(50) NOT NULL,
	"start_time" varchar(20),
	"end_time" varchar(20),
	"location" varchar(200),
	"category" varchar(60) DEFAULT 'rendez_vous',
	"reminder_minutes" integer DEFAULT 60,
	"linked_task_id" integer,
	"created_by" varchar(20) DEFAULT 'both',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"caller_id" varchar(20) NOT NULL,
	"call_type" varchar(20) NOT NULL,
	"status" varchar(30) DEFAULT 'completed',
	"duration_seconds" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "couple_books_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"current_chapter" integer DEFAULT 1,
	"progress_percent" integer DEFAULT 0,
	"notes" text,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_commandments" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"text" text NOT NULL,
	"importance_why" text,
	"commitment_text" text,
	"partner1_confirmed" boolean DEFAULT false,
	"partner2_confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_devotion_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"devotion_id" integer NOT NULL,
	"partner1_completed" boolean DEFAULT false,
	"partner2_completed" boolean DEFAULT false,
	"notes" text,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "couple_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"theme_id" integer DEFAULT 1,
	"font_family" varchar(60) DEFAULT 'cormorant',
	"display_mode" varchar(30) DEFAULT 'standard',
	"density" varchar(20) DEFAULT 'normal',
	"font_size" varchar(10) DEFAULT 'md',
	"cover_photo_url" text,
	"countdown_style" varchar(30) DEFAULT 'romantic',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couples" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"partner1_name" varchar(120) NOT NULL,
	"partner2_name" varchar(120) NOT NULL,
	"partner1_email" varchar(160) NOT NULL,
	"partner2_email" varchar(160),
	"partner1_role" varchar(20) DEFAULT 'groom',
	"partner2_role" varchar(20) DEFAULT 'bride',
	"partner1_photo" text,
	"partner2_photo" text,
	"wedding_date" varchar(50),
	"city" varchar(100) DEFAULT 'Abidjan',
	"venue" varchar(200),
	"total_budget" integer DEFAULT 5000000,
	"estimated_guests" integer DEFAULT 250,
	"ceremony_types" json DEFAULT '["dot","civil","benediction","reception"]'::json,
	"church" varchar(150),
	"pastor_name" varchar(150),
	"ethnicity" varchar(100),
	"traditions" text,
	"bible_verse" text DEFAULT 'Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.',
	"status" varchar(40) DEFAULT 'trial',
	"trial_ends_at" timestamp,
	"password_hash" text NOT NULL,
	"shared_passcode" varchar(10),
	"access_code" varchar(20),
	"plan_type" varchar(30) DEFAULT 'couple',
	"plan_amount" integer DEFAULT 3000,
	"partner1_access_active" boolean DEFAULT true,
	"partner2_access_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couples_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(60) NOT NULL,
	"moment_ideal" varchar(100),
	"required_documents" json,
	"steps" json,
	"practical_tips" json,
	"legal_sources" json,
	"order_index" integer DEFAULT 0,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "day_j_blessings" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"sender_name" varchar(150) NOT NULL,
	"sender_relation" varchar(100),
	"blessing_text" text NOT NULL,
	"photo_url" text,
	"is_approved_for_screen" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "day_j_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"time_slot" varchar(30) NOT NULL,
	"activity_title" varchar(200) NOT NULL,
	"location" varchar(200),
	"person_in_charge" varchar(150),
	"contact_phone" varchar(50),
	"notes" text,
	"is_completed" boolean DEFAULT false,
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" integer DEFAULT 0,
	"proposal_details" text,
	"status" varchar(30) DEFAULT 'pending',
	"partner1_decision" varchar(20) DEFAULT 'approved',
	"partner2_decision" varchar(20) DEFAULT 'pending',
	"partner1_comment" text,
	"partner2_comment" text,
	"attachment_url" text,
	"decided_at" timestamp,
	"created_by" varchar(20) DEFAULT 'partner1',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"theme_number" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"scripture_ref" varchar(120) NOT NULL,
	"scripture_text" text NOT NULL,
	"teaching" text NOT NULL,
	"reflection" text NOT NULL,
	"couple_question" text NOT NULL,
	"prayer_model" text NOT NULL,
	"pastor_audio_url" text,
	"pastor_name" varchar(120),
	"timeline_phase" varchar(20) DEFAULT 'J-90',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devotions_theme_number_unique" UNIQUE("theme_number")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"category_id" integer,
	"title" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"advance_paid" integer DEFAULT 0,
	"remaining_amount" integer DEFAULT 0,
	"due_date" varchar(50),
	"payment_status" varchar(30) DEFAULT 'unpaid',
	"recipient" varchar(150),
	"invoice_url" text,
	"requires_dual_validation" boolean DEFAULT false,
	"validation_status" varchar(30) DEFAULT 'approved_by_both',
	"partner1_approved" boolean DEFAULT true,
	"partner2_approved" boolean DEFAULT false,
	"created_by" varchar(20) DEFAULT 'partner1',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"game_type" varchar(40) NOT NULL,
	"mode" varchar(40) NOT NULL,
	"player1_name" varchar(120),
	"player2_name" varchar(120),
	"score1" integer DEFAULT 0,
	"score2" integer DEFAULT 0,
	"winner" varchar(40),
	"duration_seconds" integer DEFAULT 0,
	"details" json,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"game_type" varchar(40) NOT NULL,
	"game_state" json NOT NULL,
	"mode" varchar(40) DEFAULT 'couple',
	"ai_level" varchar(30),
	"turn" varchar(20) DEFAULT 'partner1',
	"score1" integer DEFAULT 0,
	"score2" integer DEFAULT 0,
	"status" varchar(30) DEFAULT 'ongoing',
	"winner" varchar(30),
	"room_code" varchar(20),
	"last_move_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"group_name" varchar(60) DEFAULT 'famille',
	"phone" varchar(50),
	"email" varchar(160),
	"plus_ones_allowed" integer DEFAULT 0,
	"plus_ones_confirmed" integer DEFAULT 0,
	"rsvp_status" varchar(30) DEFAULT 'pending',
	"dietary_needs" text,
	"table_number" varchar(30),
	"notes" text,
	"qr_code_token" varchar(100),
	"is_checked_in" boolean DEFAULT false,
	"checked_in_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"hero_title" varchar(255) NOT NULL,
	"love_story" text,
	"testimony" text,
	"wedding_date" varchar(50),
	"wedding_time" varchar(60),
	"dot_date" varchar(50),
	"civil_date" varchar(50),
	"church_date" varchar(50),
	"reception_date" varchar(50),
	"venue_name" varchar(200),
	"venue_address" text,
	"venue_map_url" text,
	"hero_image_url" text,
	"has_photo" boolean DEFAULT true,
	"photo_layout" varchar(40) DEFAULT 'arched',
	"photo_zoom" integer DEFAULT 100,
	"photo_position" varchar(40) DEFAULT 'center',
	"sub_title" varchar(255) DEFAULT 'Nous nous marions',
	"card_template" varchar(50) DEFAULT 'terracotta_royal',
	"sans_photo_style" varchar(50) DEFAULT 'monogram',
	"ceremonies_selected" json DEFAULT '["dot","civil","church","reception"]'::json,
	"ceremonies_details" json,
	"intro_text" text,
	"additional_info" text,
	"final_message" text,
	"gallery_photos" json,
	"pastor_word" text,
	"blessing_message" text,
	"custom_verse" text,
	"publication_status" varchar(40) DEFAULT 'published',
	"is_published" boolean DEFAULT true,
	"rsvp_deadline" varchar(50),
	"custom_primary_color" varchar(30),
	"custom_secondary_color" varchar(30),
	"custom_accent_color" varchar(30),
	"custom_text_color" varchar(30),
	"custom_font_family" varchar(60),
	"custom_font_size" varchar(20),
	"custom_text_align" varchar(20) DEFAULT 'center',
	"photo_position_x" integer DEFAULT 50,
	"photo_position_y" integer DEFAULT 50,
	"show_countdown" boolean DEFAULT true,
	"show_story" boolean DEFAULT true,
	"show_programme" boolean DEFAULT true,
	"show_locations" boolean DEFAULT true,
	"show_verse" boolean DEFAULT true,
	"show_rsvp" boolean DEFAULT true,
	"show_cagnotte" boolean DEFAULT true,
	"show_qr_code" boolean DEFAULT true,
	"cagnotte_enabled" boolean DEFAULT true,
	"cagnotte_title" varchar(200) DEFAULT 'Cagnotte Foyer & Premier Loyer',
	"cagnotte_description" text DEFAULT 'Pour les proches qui souhaitent manifester leur générosité et participer à l''aménagement du foyer, vous pouvez contribuer directement par votre moyen de paiement habituel.',
	"cagnotte_payment_method" varchar(50) DEFAULT 'wave',
	"cagnotte_payment_url" text,
	"cagnotte_button_text" varchar(100) DEFAULT 'Contribuer au foyer',
	"cagnotte_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "library_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(150) NOT NULL,
	"pastor" varchar(150),
	"cover_url" text,
	"file_url" text,
	"category" varchar(60) NOT NULL,
	"description" text NOT NULL,
	"bible_verse" text,
	"access_level" varchar(30) DEFAULT 'all',
	"read_time_min" integer DEFAULT 25,
	"chapters" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"sender_id" varchar(20) NOT NULL,
	"text" text NOT NULL,
	"attachment_url" text,
	"attachment_type" varchar(30),
	"is_read" boolean DEFAULT false,
	"sent_offline" boolean DEFAULT false,
	"local_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"recipient" varchar(20) DEFAULT 'both',
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(40) DEFAULT 'system',
	"link_url" varchar(255),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"amount" integer DEFAULT 3000 NOT NULL,
	"plan_type" varchar(30) DEFAULT 'couple',
	"payer_email" varchar(160),
	"payer_partner" varchar(20) DEFAULT 'partner1',
	"payment_date" varchar(50) NOT NULL,
	"reference_number" varchar(120) NOT NULL,
	"proof_image_url" text,
	"status" varchar(40) DEFAULT 'pending',
	"admin_notes" text,
	"rejection_reason" text,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"prayer_text" text NOT NULL,
	"category" varchar(60) DEFAULT 'couple',
	"prayer_date" varchar(50) NOT NULL,
	"is_answered" boolean DEFAULT false,
	"testimony" text,
	"status" varchar(30) DEFAULT 'active',
	"partner1_prayed" boolean DEFAULT true,
	"partner2_prayed" boolean DEFAULT false,
	"created_by" varchar(20) DEFAULT 'partner1',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"quiz_question_id" integer NOT NULL,
	"partner_key" varchar(20) NOT NULL,
	"chosen_option" integer NOT NULL,
	"is_correct" boolean DEFAULT false,
	"discussion_notes" text,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"correct_option_index" integer DEFAULT 0,
	"explanation" text,
	"bible_ref" varchar(120),
	"ivorian_context" text,
	"day_number" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"invitation_id" integer NOT NULL,
	"guest_id" integer,
	"guest_name" varchar(150) NOT NULL,
	"email" varchar(160),
	"phone" varchar(50),
	"attending" boolean NOT NULL,
	"attendance_status" varchar(30) DEFAULT 'confirmed',
	"plus_ones_count" integer DEFAULT 0,
	"message_for_couple" text,
	"prayer_wishes" text,
	"advice_wishes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(60) DEFAULT 'general',
	"assignee" varchar(20) DEFAULT 'both',
	"due_date" varchar(50),
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'todo',
	"budget_estimated" integer DEFAULT 0,
	"budget_actual" integer DEFAULT 0,
	"comments" text,
	"attachment_url" text,
	"created_by" varchar(20) DEFAULT 'both',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"phase" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(60),
	"due_date" varchar(50),
	"is_completed" boolean DEFAULT false,
	"assigned_to" varchar(20) DEFAULT 'both',
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cagnotte_contributions" ADD CONSTRAINT "cagnotte_contributions_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_books_progress" ADD CONSTRAINT "couple_books_progress_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_books_progress" ADD CONSTRAINT "couple_books_progress_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."library_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_commandments" ADD CONSTRAINT "couple_commandments_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_devotion_progress" ADD CONSTRAINT "couple_devotion_progress_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_devotion_progress" ADD CONSTRAINT "couple_devotion_progress_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "public"."devotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_preferences" ADD CONSTRAINT "couple_preferences_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_j_blessings" ADD CONSTRAINT "day_j_blessings_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_j_items" ADD CONSTRAINT "day_j_items_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_history" ADD CONSTRAINT "game_history_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_question_id_quiz_questions_id_fk" FOREIGN KEY ("quiz_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;