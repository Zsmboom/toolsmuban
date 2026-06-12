CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `country_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`user_count` integer DEFAULT 0 NOT NULL,
	`tool_usage_count` integer DEFAULT 0 NOT NULL,
	`last_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `country_stats_country_unique` ON `country_stats` (`country`);--> statement-breakpoint
CREATE INDEX `country_stats_country_idx` ON `country_stats` (`country`);--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`tool_usage_log_id` text,
	`subscription_id` text,
	`description` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tool_usage_log_id`) REFERENCES `tool_usage_logs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `credit_tx_user_id_idx` ON `credit_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `credit_tx_type_idx` ON `credit_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `credit_tx_source_idx` ON `credit_transactions` (`source`);--> statement-breakpoint
CREATE INDEX `credit_tx_created_at_idx` ON `credit_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `credit_tx_tool_log_idx` ON `credit_transactions` (`tool_usage_log_id`);--> statement-breakpoint
CREATE TABLE `credits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`total_earned` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	`monthly_quota` integer DEFAULT 0 NOT NULL,
	`monthly_used` integer DEFAULT 0 NOT NULL,
	`quota_reset_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credits_user_id_unique` ON `credits` (`user_id`);--> statement-breakpoint
CREATE INDEX `credit_user_id_idx` ON `credits` (`user_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text,
	`description` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `payment_user_id_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payment_provider_idx` ON `payments` (`provider`);--> statement-breakpoint
CREATE INDEX `payment_created_at_idx` ON `payments` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`provider` text,
	`provider_id` text,
	`price_id` text,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false,
	`canceled_at` integer,
	`trial_start` integer,
	`trial_end` integer,
	`source` text,
	`referrer` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscription_user_id_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `subscription_provider_idx` ON `subscriptions` (`provider`);--> statement-breakpoint
CREATE INDEX `subscription_source_idx` ON `subscriptions` (`source`);--> statement-breakpoint
CREATE INDEX `subscription_utm_source_idx` ON `subscriptions` (`utm_source`);--> statement-breakpoint
CREATE TABLE `tool_usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tool_name` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text,
	`duration` integer,
	`ip_address` text,
	`country` text,
	`credits_used` integer DEFAULT 0 NOT NULL,
	`credit_transaction_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `log_user_id_idx` ON `tool_usage_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `log_tool_name_idx` ON `tool_usage_logs` (`tool_name`);--> statement-breakpoint
CREATE INDEX `log_created_at_idx` ON `tool_usage_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `log_country_idx` ON `tool_usage_logs` (`country`);--> statement-breakpoint
CREATE INDEX `log_credit_tx_idx` ON `tool_usage_logs` (`credit_transaction_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`name` text,
	`image` text,
	`country` text,
	`role` text DEFAULT 'user' NOT NULL,
	`referrer` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_term` text,
	`utm_content` text,
	`signup_ip` text,
	`signup_country` text,
	`last_login_ip` text,
	`last_login_country` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `country_idx` ON `users` (`country`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `utm_source_idx` ON `users` (`utm_source`);--> statement-breakpoint
CREATE INDEX `signup_country_idx` ON `users` (`signup_country`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `token_idx` ON `verification_tokens` (`token`);