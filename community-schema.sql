-- Community Discussions Schema for DroneBuilder
-- This schema supports the community features including discussions, replies, and user interactions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Discussions table
CREATE TABLE discussions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion votes table (for upvoting/downvoting)
CREATE TABLE discussion_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discussion_id, user_id),
    UNIQUE(reply_id, user_id),
    CHECK (
        (discussion_id IS NOT NULL AND reply_id IS NULL) OR 
        (discussion_id IS NULL AND reply_id IS NOT NULL)
    )
);

-- User bookmarks table
CREATE TABLE user_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, discussion_id)
);

-- Discussion categories table (for better organization)
CREATE TABLE discussion_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#84dcc6', -- Coolors theme color
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO discussion_categories (name, description, color, icon) VALUES
('general', 'General drone discussions and questions', '#84dcc6', '💬'),
('racing', 'Racing drone builds, tips, and competitions', '#8b95c9', '🏁'),
('cinematic', 'Cinematic flying, camera setups, and video production', '#acd7ec', '🎬'),
('long-range', 'Long range builds, antennas, and extended flight', '#d6edff', '🛰️'),
('beginner', 'Beginner questions, tutorials, and learning resources', '#84dcc6', '🎓'),
('technical', 'Technical support, troubleshooting, and advanced topics', '#8b95c9', '🔧'),
('builds', 'Build logs, project showcases, and DIY guides', '#acd7ec', '🔨'),
('reviews', 'Product reviews, recommendations, and comparisons', '#d6edff', '⭐');

-- Create indexes for better performance
CREATE INDEX idx_discussions_author_id ON discussions(author_id);
CREATE INDEX idx_discussions_category ON discussions(category);
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_discussions_views ON discussions(views DESC);
CREATE INDEX idx_discussions_tags ON discussions USING GIN(tags);

CREATE INDEX idx_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_replies_author_id ON discussion_replies(author_id);
CREATE INDEX idx_replies_parent_id ON discussion_replies(parent_reply_id);
CREATE INDEX idx_replies_created_at ON discussion_replies(created_at DESC);

CREATE INDEX idx_votes_discussion_id ON discussion_votes(discussion_id);
CREATE INDEX idx_votes_reply_id ON discussion_votes(reply_id);
CREATE INDEX idx_votes_user_id ON discussion_votes(user_id);

CREATE INDEX idx_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_bookmarks_discussion_id ON user_bookmarks(discussion_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Discussions policies
CREATE POLICY "Discussions are viewable by everyone" ON discussions
    FOR SELECT USING (true);

CREATE POLICY "Users can create discussions" ON discussions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own discussions" ON discussions
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own discussions" ON discussions
    FOR DELETE USING (auth.uid() = author_id);

-- Replies policies
CREATE POLICY "Replies are viewable by everyone" ON discussion_replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create replies" ON discussion_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON discussion_replies
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own replies" ON discussion_replies
    FOR DELETE USING (auth.uid() = author_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON discussion_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON discussion_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON discussion_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON discussion_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" ON user_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for common operations

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_discussion_views(discussion_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE discussions 
    SET views = views + 1 
    WHERE id = discussion_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get discussion with reply count
CREATE OR REPLACE FUNCTION get_discussion_with_stats(discussion_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    category VARCHAR(50),
    tags TEXT[],
    author_id UUID,
    views INTEGER,
    reply_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        d.category,
        d.tags,
        d.author_id,
        d.views,
        COUNT(r.id) as reply_count,
        d.created_at,
        d.updated_at
    FROM discussions d
    LEFT JOIN discussion_replies r ON d.id = r.discussion_id
    WHERE d.id = discussion_uuid
    GROUP BY d.id, d.title, d.content, d.category, d.tags, d.author_id, d.views, d.created_at, d.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get vote count for a discussion
CREATE OR REPLACE FUNCTION get_discussion_vote_count(discussion_uuid UUID)
RETURNS TABLE (
    upvotes BIGINT,
    downvotes BIGINT,
    total_votes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN v.vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN v.vote_type = -1 THEN 1 END) as downvotes,
        COUNT(*) as total_votes
    FROM discussion_votes v
    WHERE v.discussion_id = discussion_uuid;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON discussion_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO discussions (title, content, category, tags, author_id) VALUES
(
    'Best motors for 5-inch racing drone?',
    'I''m building my first 5-inch racing drone and need recommendations for motors. Looking for something that provides good thrust while maintaining efficiency. Budget is around $200 for the set.',
    'racing',
    ARRAY['motors', 'racing', '5-inch', 'beginner'],
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Help with PID tuning for smooth cinematic shots',
    'I''ve been struggling with getting smooth footage from my cinematic drone. The movements are too jerky. Any tips on PID tuning for cinematic flying?',
    'cinematic',
    ARRAY['pid', 'cinematic', 'tuning', 'smooth'],
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Long range build recommendations',
    'Planning a long range build for mapping and exploration. Need advice on frame, motors, and especially the antenna setup for maximum range.',
    'long-range',
    ARRAY['long-range', 'build', 'recommendations', 'mapping'],
    (SELECT id FROM auth.users LIMIT 1)
);

-- Comments for documentation
COMMENT ON TABLE discussions IS 'Main discussions table for community posts';
COMMENT ON TABLE discussion_replies IS 'Replies to discussions, supports nested replies';
COMMENT ON TABLE discussion_votes IS 'Upvote/downvote system for discussions and replies';
COMMENT ON TABLE user_bookmarks IS 'User bookmarks for saving favorite discussions';
COMMENT ON TABLE discussion_categories IS 'Categories for organizing discussions'; 