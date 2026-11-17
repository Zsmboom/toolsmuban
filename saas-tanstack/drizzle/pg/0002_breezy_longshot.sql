CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text,
	"payload" jsonb,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_provider_event_unique" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "webhook_processed_at_idx" ON "webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_payment_unique" ON "payments" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_provider_id_unique" ON "subscriptions" USING btree ("provider_id");