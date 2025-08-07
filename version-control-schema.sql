-- Version Control Schema for DroneBuilder Lifecycle
-- This schema supports Git-like version control for drone builds with CRUD operations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- VERSION CONTROL TABLES
-- ========================================

-- Version control repositories (like Git repos)
CREATE TABLE version_repositories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(build_id)
);

-- Branches (like Git branches)
CREATE TABLE version_branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_protected BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

-- Commits (like Git commits)
CREATE TABLE version_commits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES version_branches(id) ON DELETE CASCADE,
    commit_hash VARCHAR(40) NOT NULL, -- SHA-1 hash
    parent_commit_id UUID REFERENCES version_commits(id),
    author_id UUID REFERENCES auth.users(id),
    committer_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    description TEXT,
    build_snapshot JSONB NOT NULL, -- Complete build state at this commit
    changes_summary JSONB, -- Summary of changes from parent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, commit_hash)
);

-- File changes (like Git diffs)
CREATE TABLE version_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    commit_id UUID REFERENCES version_commits(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL, -- 'added', 'modified', 'deleted', 'renamed'
    file_path VARCHAR(500) NOT NULL,
    old_file_path VARCHAR(500), -- For renamed files
    diff_content TEXT, -- Unified diff format
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags (like Git tags)
CREATE TABLE version_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    commit_id UUID REFERENCES version_commits(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tag_type VARCHAR(20) DEFAULT 'lightweight', -- 'lightweight', 'annotated'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

-- Merge requests (like Git pull requests)
CREATE TABLE version_merge_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    source_branch_id UUID REFERENCES version_branches(id) ON DELETE CASCADE,
    target_branch_id UUID REFERENCES version_branches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'merged', 'closed', 'draft'
    merge_commit_id UUID REFERENCES version_commits(id),
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    merged_at TIMESTAMP WITH TIME ZONE
);

-- Comments on commits and merge requests
CREATE TABLE version_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    commit_id UUID REFERENCES version_commits(id) ON DELETE CASCADE,
    merge_request_id UUID REFERENCES version_merge_requests(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES version_comments(id),
    author_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    line_number INTEGER, -- For line-specific comments
    file_path VARCHAR(500), -- For file-specific comments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (commit_id IS NOT NULL AND merge_request_id IS NULL) OR
        (commit_id IS NULL AND merge_request_id IS NOT NULL)
    )
);

-- Build snapshots (detailed build state at each commit)
CREATE TABLE build_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    commit_id UUID REFERENCES version_commits(id) ON DELETE CASCADE,
    build_data JSONB NOT NULL, -- Complete build configuration
    parts_data JSONB NOT NULL, -- All parts and their configurations
    analysis_data JSONB, -- Build analysis results
    optimization_data JSONB, -- Applied optimizations
    metadata JSONB, -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version control settings
CREATE TABLE version_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES version_repositories(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, setting_key)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Repository indexes
CREATE INDEX idx_version_repositories_build_id ON version_repositories(build_id);
CREATE INDEX idx_version_repositories_created_by ON version_repositories(created_by);

-- Branch indexes
CREATE INDEX idx_version_branches_repository_id ON version_branches(repository_id);
CREATE INDEX idx_version_branches_name ON version_branches(name);

-- Commit indexes
CREATE INDEX idx_version_commits_repository_id ON version_commits(repository_id);
CREATE INDEX idx_version_commits_branch_id ON version_commits(branch_id);
CREATE INDEX idx_version_commits_commit_hash ON version_commits(commit_hash);
CREATE INDEX idx_version_commits_parent_id ON version_commits(parent_commit_id);
CREATE INDEX idx_version_commits_author_id ON version_commits(author_id);
CREATE INDEX idx_version_commits_created_at ON version_commits(created_at);

-- Change indexes
CREATE INDEX idx_version_changes_commit_id ON version_changes(commit_id);
CREATE INDEX idx_version_changes_file_path ON version_changes(file_path);
CREATE INDEX idx_version_changes_change_type ON version_changes(change_type);

-- Tag indexes
CREATE INDEX idx_version_tags_repository_id ON version_tags(repository_id);
CREATE INDEX idx_version_tags_commit_id ON version_tags(commit_id);
CREATE INDEX idx_version_tags_name ON version_tags(name);

-- Merge request indexes
CREATE INDEX idx_version_merge_requests_repository_id ON version_merge_requests(repository_id);
CREATE INDEX idx_version_merge_requests_source_branch ON version_merge_requests(source_branch_id);
CREATE INDEX idx_version_merge_requests_target_branch ON version_merge_requests(target_branch_id);
CREATE INDEX idx_version_merge_requests_status ON version_merge_requests(status);
CREATE INDEX idx_version_merge_requests_created_by ON version_merge_requests(created_by);

-- Comment indexes
CREATE INDEX idx_version_comments_repository_id ON version_comments(repository_id);
CREATE INDEX idx_version_comments_commit_id ON version_comments(commit_id);
CREATE INDEX idx_version_comments_merge_request_id ON version_comments(merge_request_id);
CREATE INDEX idx_version_comments_author_id ON version_comments(author_id);

-- Snapshot indexes
CREATE INDEX idx_build_snapshots_commit_id ON build_snapshots(commit_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all version control tables
ALTER TABLE version_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_merge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_settings ENABLE ROW LEVEL SECURITY;

-- Repository policies
CREATE POLICY "Users can view their own repositories" ON version_repositories
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view public repositories" ON version_repositories
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create repositories for their builds" ON version_repositories
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        build_id IN (SELECT id FROM builds WHERE user_id = auth.uid())
    );

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

-- Merge request policies
CREATE POLICY "Users can view merge requests in their repositories" ON version_merge_requests
    FOR SELECT USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create merge requests in their repositories" ON version_merge_requests
    FOR INSERT WITH CHECK (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update merge requests in their repositories" ON version_merge_requests
    FOR UPDATE USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

-- Comment policies
CREATE POLICY "Users can view comments in their repositories" ON version_comments
    FOR SELECT USING (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create comments in their repositories" ON version_comments
    FOR INSERT WITH CHECK (
        repository_id IN (
            SELECT id FROM version_repositories WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments" ON version_comments
    FOR UPDATE USING (author_id = auth.uid());

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

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to generate commit hash
CREATE OR REPLACE FUNCTION generate_commit_hash(
    repository_id UUID,
    parent_commit_id UUID,
    author_id UUID,
    message TEXT,
    build_snapshot JSONB
)
RETURNS VARCHAR(40) AS $$
DECLARE
    hash_input TEXT;
    commit_hash VARCHAR(40);
BEGIN
    -- Create hash input from commit data
    hash_input := repository_id::text || 
                  COALESCE(parent_commit_id::text, '') ||
                  author_id::text ||
                  message ||
                  build_snapshot::text ||
                  EXTRACT(EPOCH FROM NOW())::text;
    
    -- Generate SHA-1 hash (simplified - in production use proper crypto)
    commit_hash := encode(sha256(hash_input::bytea), 'hex');
    
    -- Return first 40 characters to simulate SHA-1
    RETURN substring(commit_hash from 1 for 40);
END;
$$ LANGUAGE plpgsql;

-- Function to create initial commit
CREATE OR REPLACE FUNCTION create_initial_commit(
    repo_id UUID,
    branch_name VARCHAR(255) DEFAULT 'main',
    commit_message TEXT DEFAULT 'Initial commit'
)
RETURNS UUID AS $$
DECLARE
    branch_id UUID;
    commit_id UUID;
    commit_hash VARCHAR(40);
BEGIN
    -- Create default branch
    INSERT INTO version_branches (repository_id, name, is_default, created_by)
    VALUES (repo_id, branch_name, true, (SELECT created_by FROM version_repositories WHERE id = repo_id))
    RETURNING id INTO branch_id;
    
    -- Generate commit hash
    commit_hash := generate_commit_hash(repo_id, NULL, 
        (SELECT created_by FROM version_repositories WHERE id = repo_id),
        commit_message, '{}'::jsonb);
    
    -- Create initial commit
    INSERT INTO version_commits (repository_id, branch_id, commit_hash, author_id, committer_id, message, build_snapshot)
    VALUES (repo_id, branch_id, commit_hash,
        (SELECT created_by FROM version_repositories WHERE id = repo_id),
        (SELECT created_by FROM version_repositories WHERE id = repo_id),
        commit_message, '{}'::jsonb)
    RETURNING id INTO commit_id;
    
    RETURN commit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create new commit
CREATE OR REPLACE FUNCTION create_commit(
    repo_id UUID,
    branch_id UUID,
    parent_commit_id UUID,
    author_id UUID,
    message TEXT,
    build_snapshot JSONB,
    changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    commit_id UUID;
    commit_hash VARCHAR(40);
BEGIN
    -- Generate commit hash
    commit_hash := generate_commit_hash(repo_id, parent_commit_id, author_id, message, build_snapshot);
    
    -- Create commit
    INSERT INTO version_commits (repository_id, branch_id, commit_hash, parent_commit_id, author_id, committer_id, message, build_snapshot, changes_summary)
    VALUES (repo_id, branch_id, commit_hash, parent_commit_id, author_id, author_id, message, build_snapshot, changes)
    RETURNING id INTO commit_id;
    
    -- Create build snapshot
    INSERT INTO build_snapshots (commit_id, build_data, parts_data, analysis_data, optimization_data)
    VALUES (commit_id, build_snapshot, build_snapshot->'parts', build_snapshot->'analysis', build_snapshot->'optimizations');
    
    RETURN commit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get commit history
CREATE OR REPLACE FUNCTION get_commit_history(
    repo_id UUID,
    branch_name VARCHAR(255) DEFAULT 'main',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    commit_id UUID,
    commit_hash VARCHAR(40),
    message TEXT,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    changes_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.id as commit_id,
        vc.commit_hash,
        vc.message,
        p.full_name as author_name,
        vc.created_at,
        COUNT(vch.id)::INTEGER as changes_count
    FROM version_commits vc
    JOIN version_branches vb ON vc.branch_id = vb.id
    JOIN profiles p ON vc.author_id = p.id
    LEFT JOIN version_changes vch ON vc.id = vch.commit_id
    WHERE vb.repository_id = repo_id AND vb.name = branch_name
    GROUP BY vc.id, vc.commit_hash, vc.message, p.full_name, vc.created_at
    ORDER BY vc.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to revert to a specific commit
CREATE OR REPLACE FUNCTION revert_to_commit(
    repo_id UUID,
    target_commit_id UUID,
    new_branch_name VARCHAR(255),
    revert_message TEXT DEFAULT 'Revert to previous commit'
)
RETURNS UUID AS $$
DECLARE
    new_branch_id UUID;
    new_commit_id UUID;
    target_snapshot JSONB;
BEGIN
    -- Get target commit snapshot
    SELECT build_snapshot INTO target_snapshot
    FROM version_commits
    WHERE id = target_commit_id AND repository_id = repo_id;
    
    IF target_snapshot IS NULL THEN
        RAISE EXCEPTION 'Target commit not found or not in repository';
    END IF;
    
    -- Create new branch
    INSERT INTO version_branches (repository_id, name, created_by)
    VALUES (repo_id, new_branch_name, (SELECT created_by FROM version_repositories WHERE id = repo_id))
    RETURNING id INTO new_branch_id;
    
    -- Create revert commit
    SELECT create_commit(
        repo_id,
        new_branch_id,
        NULL,
        (SELECT created_by FROM version_repositories WHERE id = repo_id),
        revert_message,
        target_snapshot
    ) INTO new_commit_id;
    
    RETURN new_commit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to compare two commits
CREATE OR REPLACE FUNCTION compare_commits(
    commit1_id UUID,
    commit2_id UUID
)
RETURNS TABLE (
    change_type VARCHAR(20),
    file_path VARCHAR(500),
    old_file_path VARCHAR(500),
    diff_content TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vch.change_type,
        vch.file_path,
        vch.old_file_path,
        vch.diff_content
    FROM version_changes vch
    WHERE vch.commit_id = commit2_id
    ORDER BY vch.file_path;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_version_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_version_repositories_updated_at
    BEFORE UPDATE ON version_repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_version_updated_at();

CREATE TRIGGER update_version_branches_updated_at
    BEFORE UPDATE ON version_branches
    FOR EACH ROW
    EXECUTE FUNCTION update_version_updated_at();

CREATE TRIGGER update_version_merge_requests_updated_at
    BEFORE UPDATE ON version_merge_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_version_updated_at();

CREATE TRIGGER update_version_comments_updated_at
    BEFORE UPDATE ON version_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_version_updated_at();

CREATE TRIGGER update_version_settings_updated_at
    BEFORE UPDATE ON version_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_version_updated_at();

-- Trigger to automatically create repository when build is created
CREATE OR REPLACE FUNCTION create_repository_for_build()
RETURNS TRIGGER AS $$
DECLARE
    repo_id UUID;
BEGIN
    -- Create repository for new build
    INSERT INTO version_repositories (name, description, build_id, created_by)
    VALUES (
        'Repository for ' || NEW.name,
        'Version control repository for build: ' || NEW.name,
        NEW.id,
        NEW.user_id
    )
    RETURNING id INTO repo_id;
    
    -- Create initial commit
    PERFORM create_initial_commit(repo_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_repository_trigger
    AFTER INSERT ON builds
    FOR EACH ROW
    EXECUTE FUNCTION create_repository_for_build();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample version control data (this would be created automatically by triggers)
-- The actual data will be created when users create builds and make commits

-- Comments for documentation
COMMENT ON TABLE version_repositories IS 'Version control repositories for drone builds (like Git repos)';
COMMENT ON TABLE version_branches IS 'Branches within repositories (like Git branches)';
COMMENT ON TABLE version_commits IS 'Commits with build snapshots (like Git commits)';
COMMENT ON TABLE version_changes IS 'File changes in commits (like Git diffs)';
COMMENT ON TABLE version_tags IS 'Tags for marking important commits (like Git tags)';
COMMENT ON TABLE version_merge_requests IS 'Merge requests between branches (like Git pull requests)';
COMMENT ON TABLE version_comments IS 'Comments on commits and merge requests';
COMMENT ON TABLE build_snapshots IS 'Detailed build state snapshots at each commit';
COMMENT ON TABLE version_settings IS 'Repository-specific version control settings';

COMMENT ON FUNCTION generate_commit_hash IS 'Generate SHA-1-like hash for commits';
COMMENT ON FUNCTION create_initial_commit IS 'Create initial commit for new repository';
COMMENT ON FUNCTION create_commit IS 'Create new commit with build snapshot';
COMMENT ON FUNCTION get_commit_history IS 'Get commit history for a branch';
COMMENT ON FUNCTION revert_to_commit IS 'Revert to a specific commit by creating new branch';
COMMENT ON FUNCTION compare_commits IS 'Compare changes between two commits'; 