ALTER TABLE "assessment_sections" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD COLUMN "time_bank_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "available_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "max_score" integer DEFAULT 0 NOT NULL;