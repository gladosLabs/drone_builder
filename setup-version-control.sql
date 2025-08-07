-- Setup Version Control for DroneBuilder
-- Run this script in your Supabase SQL editor

-- First, run the version control schema
\i version-control-schema.sql

-- Then, add the optimizations column to the builds table if it doesn't exist
ALTER TABLE builds ADD COLUMN IF NOT EXISTS optimizations JSONB DEFAULT '{}';

-- Create a trigger to automatically create repositories for new builds
CREATE OR REPLACE FUNCTION create_repository_for_new_build()
RETURNS TRIGGER AS $$
DECLARE
    repo_id UUID;
BEGIN
    -- Create repository for new build
    INSERT INTO version_repositories (name, description, build_id, created_by)
    VALUES (
        'Repository for ' || NEW.name,
        'Version control for ' || NEW.name,
        NEW.id,
        NEW.user_id
    )
    RETURNING id INTO repo_id;
    
    -- Create initial commit
    PERFORM create_initial_commit(repo_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new builds
DROP TRIGGER IF EXISTS create_repository_trigger ON builds;
CREATE TRIGGER create_repository_trigger
    AFTER INSERT ON builds
    FOR EACH ROW
    EXECUTE FUNCTION create_repository_for_new_build();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS on version control tables
ALTER TABLE version_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_merge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own repositories" ON version_repositories
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create repositories" ON version_repositories
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own repositories" ON version_repositories
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own repositories" ON version_repositories
    FOR DELETE USING (created_by = auth.uid());

-- Branch policies
CREATE POLICY "Users can view branches in their repositories" ON version_branches
    FOR SELECT USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create branches in their repositories" ON version_branches
    FOR INSERT WITH CHECK (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update branches in their repositories" ON version_branches
    FOR UPDATE USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

-- Commit policies
CREATE POLICY "Users can view commits in their repositories" ON version_commits
    FOR SELECT USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create commits in their repositories" ON version_commits
    FOR INSERT WITH CHECK (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

-- Change policies
CREATE POLICY "Users can view changes in their repositories" ON version_changes
    FOR SELECT USING (
        commit_id IN (
            SELECT vc.id FROM version_commits vc
            JOIN version_repositories vr ON vc.repository_id = vr.id
            WHERE vr.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create changes in their repositories" ON version_changes
    FOR INSERT WITH CHECK (
        commit_id IN (
            SELECT vc.id FROM version_commits vc
            JOIN version_repositories vr ON vc.repository_id = vr.id
            WHERE vr.created_by = auth.uid()
        )
    );

-- Tag policies
CREATE POLICY "Users can view tags in their repositories" ON version_tags
    FOR SELECT USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create tags in their repositories" ON version_tags
    FOR INSERT WITH CHECK (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

-- Snapshot policies
CREATE POLICY "Users can view snapshots in their repositories" ON build_snapshots
    FOR SELECT USING (
        commit_id IN (
            SELECT vc.id FROM version_commits vc
            JOIN version_repositories vr ON vc.repository_id = vr.id
            WHERE vr.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create snapshots in their repositories" ON build_snapshots
    FOR INSERT WITH CHECK (
        commit_id IN (
            SELECT vc.id FROM version_commits vc
            JOIN version_repositories vr ON vc.repository_id = vr.id
            WHERE vr.created_by = auth.uid()
        )
    );

-- Success message
SELECT 'Version control setup completed successfully!' as status; 