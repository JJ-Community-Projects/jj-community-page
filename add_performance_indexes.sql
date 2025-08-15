-- Performance optimization indexes for getUserProfileBySlug procedure
-- Phase 2 implementation of optimization recommendations

-- Critical indexes for streams queries
-- Composite index for streams filtered by schedule, visibility, and start time
CREATE INDEX IF NOT EXISTS idx_streams_schedule_visible_start ON streams(schedule_id, visible, start_time);

-- Index for streams filtered by visibility and start time
CREATE INDEX IF NOT EXISTS idx_streams_visible_start ON streams(visible, start_time);

-- For stream participants queries
-- Index for filtering stream participants by user
CREATE INDEX IF NOT EXISTS idx_stream_participants_user_id ON stream_participants(user_id);

-- Composite index for stream participants by schedule and stream
CREATE INDEX IF NOT EXISTS idx_stream_participants_stream_schedule ON stream_participants(schedule_id, stream_id);

-- For stream tags queries
-- Index for filtering stream tags by stream
CREATE INDEX IF NOT EXISTS idx_stream_tags_stream_id ON stream_tags(stream_id);

-- For schedules queries
-- Composite index for schedules filtered by owner, visibility, and primary status
CREATE INDEX IF NOT EXISTS idx_schedules_owner_visible_primary ON schedules(owner_id, visible, primary);

-- Additional performance indexes based on query patterns

-- Index for schedules ordered by primary flag and creation date
CREATE INDEX IF NOT EXISTS idx_schedules_owner_visible_primary_created ON schedules(owner_id, visible, primary DESC, created_at DESC);

-- Index for streams ordered by start time (for pagination and ordering)
CREATE INDEX IF NOT EXISTS idx_streams_start_time ON streams(start_time);

-- Composite index for stream participants with joins
CREATE INDEX IF NOT EXISTS idx_stream_participants_stream_user ON stream_participants(stream_id, user_id);
