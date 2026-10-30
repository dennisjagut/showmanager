"""Database migrations, applied in order when the API starts (see db.migrate).

Each migration is a list of SQL statements. Never change a migration that is already deployed: add a new one at the end.
The first two come from the former drizzle-kit setup, so databases created by it are recognized as up to date.
"""

MIGRATIONS: list[tuple[str, list[str]]] = [
    (
        "0000_init",
        [
            """CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`festival_id` integer NOT NULL,
	`season` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`applied_on` text,
	`note` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade
);""",
            """CREATE UNIQUE INDEX `applications_festival_season` ON `applications` (`festival_id`,`season`);""",
            """CREATE TABLE `festivals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`location` text,
	`state` text,
	`month` text,
	`website` text,
	`deadline` text,
	`contact` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);""",
            """CREATE TABLE `calculator_inquiry` (
	`id` integer PRIMARY KEY NOT NULL,
	`location` text,
	`one_way_km` real,
	`days` integer DEFAULT 1 NOT NULL,
	`buffer_percent` real DEFAULT 10 NOT NULL,
	`round_trip` integer DEFAULT true NOT NULL
);""",
            """CREATE TABLE `calculator_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`billing` text DEFAULT 'flat' NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`fuel_per_km` real DEFAULT 0 NOT NULL,
	`free_km` real DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`selected` integer DEFAULT false NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`duration` integer
);""",
            """CREATE TABLE `schedule_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`repeatable` integer DEFAULT false NOT NULL
);""",
            """CREATE UNIQUE INDEX `schedule_templates_name` ON `schedule_templates` (`name`);""",
            """CREATE TABLE `show_guests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_id` integer NOT NULL,
	`name` text NOT NULL,
	`plus_ones` integer DEFAULT 0 NOT NULL,
	`added_by` text,
	`note` text,
	FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade
);""",
            """CREATE TABLE `show_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_id` integer NOT NULL,
	`time` text NOT NULL,
	`item` text NOT NULL,
	FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade
);""",
            """CREATE TABLE `shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`tour` text,
	`status` text DEFAULT 'option' NOT NULL,
	`venue` text,
	`address` text,
	`contact_name` text,
	`contact_phone` text,
	`contact_email` text,
	`fee` text,
	`guest_quota` integer,
	`hotel` text,
	`travel` text,
	`tech` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);""",
        ],
    ),
    (
        "0001_seed",
        [
            """-- Starting data in the band's language. Everything can be edited in the app afterwards.

-- Schedule templates, editable under /shows/templates
INSERT INTO `schedule_templates` (`name`, `sort_order`, `repeatable`) VALUES
	('Abfahrt', 10, 0),
	('Ankunft', 20, 0),
	('Load-In', 30, 0),
	('Aufbau', 40, 0),
	('Soundcheck', 50, 0),
	('Soundcheck Support', 60, 1),
	('Catering', 70, 0),
	('Einlass', 80, 0),
	('Support', 90, 1),
	('Changeover', 100, 1),
	('Showtime', 110, 0),
	('Curfew', 120, 0),
	('Load-Out', 130, 0),
	('Hotel Check-in', 140, 0);""",
            """-- The empty shared inquiry the calculator works on
INSERT INTO `calculator_inquiry` (`id`) VALUES (1);""",
            """-- Example items with typical rates, editable under /calculator
INSERT INTO `calculator_items` (`category`, `name`, `billing`, `amount`, `fuel_per_km`, `sort_order`) VALUES
	('vehicle', 'Privat-PKW', 'flat', 0, 0.33, 10),
	('vehicle', 'Transporter (Miete)', 'per_day', 150, 0.35, 20),
	('vehicle', 'Anhänger (Miete)', 'per_day', 60, 0, 30),
	('crew', 'FOH', 'per_day', 200, 0, 10),
	('crew', 'Licht', 'per_day', 200, 0, 20),
	('other', 'Foto', 'flat', 150, 0, 10),
	('other', 'Social Media', 'flat', 100, 0, 20);""",
        ],
    ),
    (
        "0002_users",
        [
            """-- Accounts of the band members. Usernames are unique regardless of case.
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL COLLATE NOCASE,
	`password_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);""",
            """CREATE UNIQUE INDEX `users_username` ON `users` (`username`);""",
            """-- Logins. Only the SHA-256 of the token is stored, the token itself is in the browser's cookie.
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);""",
            """CREATE INDEX `sessions_user` ON `sessions` (`user_id`);""",
        ],
    ),
]
