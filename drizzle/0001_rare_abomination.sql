CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"contact_name" varchar(150) NOT NULL,
	"service" varchar(60) NOT NULL,
	"city" varchar(100) DEFAULT 'Abidjan' NOT NULL,
	"whatsapp" varchar(50) NOT NULL,
	"email" varchar(160),
	"price_from" integer DEFAULT 0,
	"description" text,
	"photos" json DEFAULT '[]'::json,
	"status" varchar(30) DEFAULT 'pending',
	"admin_notes" text,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_linked_task_id_tasks_id_fk";
--> statement-breakpoint
DROP INDEX "budget_categories_couple_id_idx";--> statement-breakpoint
DROP INDEX "cagnotte_couple_id_idx";--> statement-breakpoint
DROP INDEX "calendar_couple_id_idx";--> statement-breakpoint
DROP INDEX "calendar_event_date_idx";--> statement-breakpoint
DROP INDEX "devotion_progress_couple_id_idx";--> statement-breakpoint
DROP INDEX "couple_prefs_couple_id_idx";--> statement-breakpoint
DROP INDEX "couples_slug_idx";--> statement-breakpoint
DROP INDEX "couples_access_code_idx";--> statement-breakpoint
DROP INDEX "couples_status_idx";--> statement-breakpoint
DROP INDEX "decisions_couple_id_idx";--> statement-breakpoint
DROP INDEX "expenses_couple_id_idx";--> statement-breakpoint
DROP INDEX "expenses_category_id_idx";--> statement-breakpoint
DROP INDEX "guests_couple_id_idx";--> statement-breakpoint
DROP INDEX "guests_qr_token_idx";--> statement-breakpoint
DROP INDEX "invitations_slug_idx";--> statement-breakpoint
DROP INDEX "invitations_couple_id_idx";--> statement-breakpoint
DROP INDEX "messages_couple_id_idx";--> statement-breakpoint
DROP INDEX "notifications_couple_id_idx";--> statement-breakpoint
DROP INDEX "payments_couple_id_idx";--> statement-breakpoint
DROP INDEX "payments_status_idx";--> statement-breakpoint
DROP INDEX "prayers_couple_id_idx";--> statement-breakpoint
DROP INDEX "quiz_attempts_couple_id_idx";--> statement-breakpoint
DROP INDEX "rsvps_invitation_id_idx";--> statement-breakpoint
DROP INDEX "tasks_couple_id_idx";--> statement-breakpoint
DROP INDEX "tasks_status_idx";--> statement-breakpoint
DROP INDEX "timeline_couple_id_idx";--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "verified_at" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "calendar_events" ALTER COLUMN "event_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner1_role" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner1_role" SET DEFAULT 'groom';--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner2_role" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner2_role" SET DEFAULT 'bride';--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "wedding_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "bible_verse" SET DEFAULT 'EcclÃ©siaste 4:12 - La corde Ã  trois fils ne se rompt pas facilement.';--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "status" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "status" SET DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "plan_type" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "plan_type" SET DEFAULT 'couple';--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "due_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "rsvp_status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "rsvp_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "wedding_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "dot_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "civil_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "church_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "reception_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "rsvp_deadline" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "cagnotte_description" SET DEFAULT 'Pour les proches qui souhaitent manifester leur gÃ©nÃ©rositÃ© et participer Ã  l''amÃ©nagement du foyer, vous pouvez contribuer directement par votre moyen de paiement habituel.';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "plan_type" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "plan_type" SET DEFAULT 'couple';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "prayers" ALTER COLUMN "prayer_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "due_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "due_date" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "couples" ADD COLUMN "whatsapp" varchar(50);--> statement-breakpoint
ALTER TABLE "couples" ADD COLUMN "partner2_whatsapp" varchar(50);--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."couple_status";--> statement-breakpoint
DROP TYPE "public"."partner_role";--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
DROP TYPE "public"."plan_type";--> statement-breakpoint
DROP TYPE "public"."priority";--> statement-breakpoint
DROP TYPE "public"."rsvp_status";--> statement-breakpoint
DROP TYPE "public"."task_status";