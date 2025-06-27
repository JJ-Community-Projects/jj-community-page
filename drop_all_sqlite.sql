-- SQLite script to drop all tables in the database
-- This script drops tables in reverse order of their creation to handle foreign key dependencies

-- Drop team-related tables
DROP TABLE IF EXISTS team_invites;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;

-- Drop stream-related tables
DROP TABLE IF EXISTS stream_participants;
DROP TABLE IF EXISTS stream_tags;
DROP TABLE IF EXISTS streams;

-- Drop schedule-related tables
DROP TABLE IF EXISTS editors;
DROP TABLE IF EXISTS schedules;

-- Drop durable objects table
DROP TABLE IF EXISTS durable_objects;

-- Drop auth-related tables
DROP TABLE IF EXISTS user_socials;
DROP TABLE IF EXISTS user_tags;
DROP TABLE IF EXISTS user_styles;
DROP TABLE IF EXISTS blocked_accounts;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- Vacuum the database to reclaim space
VACUUM;

-- Output confirmation
SELECT 'All tables have been dropped successfully.' AS result;
