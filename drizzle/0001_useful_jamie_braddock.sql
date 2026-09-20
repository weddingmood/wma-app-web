CREATE TYPE "public"."couple_status" AS ENUM('trial', 'pending_payment', 'verification', 'active', 'expired', 'suspended', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."partner_role" AS ENUM('groom', 'bride', 'partner');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected', 'need_new_proof');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('couple', 'individual');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'completed', 'delayed');--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "verified_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "calendar_events" ALTER COLUMN "event_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner1_role" SET DEFAULT 'groom'::"public"."partner_role";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner1_role" SET DATA TYPE "public"."partner_role" USING "partner1_role"::"public"."partner_role";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner2_role" SET DEFAULT 'bride'::"public"."partner_role";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "partner2_role" SET DATA TYPE "public"."partner_role" USING "partner2_role"::"public"."partner_role";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "wedding_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "status" SET DEFAULT 'trial'::"public"."couple_status";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "status" SET DATA TYPE "public"."couple_status" USING "status"::"public"."couple_status";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "plan_type" SET DEFAULT 'couple'::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "couples" ALTER COLUMN "plan_type" SET DATA TYPE "public"."plan_type" USING "plan_type"::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "rsvp_status" SET DEFAULT 'pending'::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "rsvp_status" SET DATA TYPE "public"."rsvp_status" USING "rsvp_status"::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "wedding_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "dot_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "civil_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "church_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "reception_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "rsvp_deadline" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "plan_type" SET DEFAULT 'couple'::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "plan_type" SET DATA TYPE "public"."plan_type" USING "plan_type"::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_status" USING "status"::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "prayers" ALTER COLUMN "prayer_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium'::"public"."priority";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "due_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_categories_couple_id_idx" ON "budget_categories" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "cagnotte_couple_id_idx" ON "cagnotte_contributions" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "calendar_couple_id_idx" ON "calendar_events" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "calendar_event_date_idx" ON "calendar_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "devotion_progress_couple_id_idx" ON "couple_devotion_progress" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "couple_prefs_couple_id_idx" ON "couple_preferences" USING btree ("couple_id");--> statement-breakpoint
CREATE UNIQUE INDEX "couples_slug_idx" ON "couples" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "couples_access_code_idx" ON "couples" USING btree ("access_code");--> statement-breakpoint
CREATE INDEX "couples_status_idx" ON "couples" USING btree ("status");--> statement-breakpoint
CREATE INDEX "decisions_couple_id_idx" ON "decisions" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "expenses_couple_id_idx" ON "expenses" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "guests_couple_id_idx" ON "guests" USING btree ("couple_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_qr_token_idx" ON "guests" USING btree ("qr_code_token");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_slug_idx" ON "invitations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "invitations_couple_id_idx" ON "invitations" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "messages_couple_id_idx" ON "messages" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "notifications_couple_id_idx" ON "notifications" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "payments_couple_id_idx" ON "payments" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prayers_couple_id_idx" ON "prayers" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_couple_id_idx" ON "quiz_attempts" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "rsvps_invitation_id_idx" ON "rsvps" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "tasks_couple_id_idx" ON "tasks" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timeline_couple_id_idx" ON "timeline_events" USING btree ("couple_id");