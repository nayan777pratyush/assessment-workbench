CREATE TYPE "public"."assessment_session_status" AS ENUM('created', 'in_progress', 'completed', 'abandoned', 'invalidated');--> statement-breakpoint
CREATE TABLE "assessment_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"title" text NOT NULL,
	"type" "assessment_type" NOT NULL,
	"sort_order" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"question_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"status" "assessment_session_status" DEFAULT 'created' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "session_id" integer;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "section_id" integer;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_sections" ADD CONSTRAINT "assessment_sections_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_sections_assessment_order_idx" ON "assessment_sections" USING btree ("assessment_id","sort_order");--> statement-breakpoint
CREATE INDEX "assessment_sections_assessment_type_idx" ON "assessment_sections" USING btree ("assessment_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_sessions_assignment_unique" ON "assessment_sessions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "assessment_sessions_candidate_idx" ON "assessment_sessions" USING btree ("candidate_id");--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_session_id_assessment_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."assessment_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_section_id_assessment_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."assessment_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_attempts_session_section_unique" ON "assessment_attempts" USING btree ("session_id","section_id");