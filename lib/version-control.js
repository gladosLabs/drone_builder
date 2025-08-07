import { supabase } from './supabase';

// Version Control CRUD Operations
export class VersionControl {
  constructor() {
    this.supabase = supabase;
  }

  // ========================================
  // REPOSITORY OPERATIONS
  // ========================================

  // Create a new repository for a build
  async createRepository(buildId, name, description = '') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('version_repositories')
        .insert({
          name,
          description,
          build_id: buildId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial commit
      await this.createInitialCommit(data.id);

      return data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  // Get repository for a build
  async getRepository(buildId) {
    try {
      const { data, error } = await this.supabase
        .from('version_repositories')
        .select(`
          *,
          version_branches (*),
          version_commits (
            id,
            commit_hash,
            message,
            created_at,
            author_id,
            profiles (full_name)
          )
        `)
        .eq('build_id', buildId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting repository:', error);
      throw error;
    }
  }

  // Update repository
  async updateRepository(repoId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('version_repositories')
        .update(updates)
        .eq('id', repoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating repository:', error);
      throw error;
    }
  }

  // Delete repository
  async deleteRepository(repoId) {
    try {
      const { error } = await this.supabase
        .from('version_repositories')
        .delete()
        .eq('id', repoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }

  // ========================================
  // BRANCH OPERATIONS
  // ========================================

  // Create new branch
  async createBranch(repoId, name, description = '') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('version_branches')
        .insert({
          repository_id: repoId,
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  // Get branches for repository
  async getBranches(repoId) {
    try {
      const { data, error } = await this.supabase
        .from('version_branches')
        .select(`
          *,
          version_commits (
            id,
            commit_hash,
            message,
            created_at
          )
        `)
        .eq('repository_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting branches:', error);
      throw error;
    }
  }

  // Switch to branch
  async switchBranch(branchId) {
    try {
      const { data, error } = await this.supabase
        .from('version_branches')
        .select(`
          *,
          version_commits (
            id,
            commit_hash,
            message,
            build_snapshot,
            created_at
          )
        `)
        .eq('id', branchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error switching branch:', error);
      throw error;
    }
  }

  // Delete branch
  async deleteBranch(branchId) {
    try {
      const { error } = await this.supabase
        .from('version_branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  // ========================================
  // COMMIT OPERATIONS
  // ========================================

  // Create initial commit
  async createInitialCommit(repoId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get default branch
      const { data: branch } = await this.supabase
        .from('version_branches')
        .select('id')
        .eq('repository_id', repoId)
        .eq('is_default', true)
        .single();

      if (!branch) throw new Error('Default branch not found');

      // Create initial commit
      const { data, error } = await this.supabase
        .rpc('create_initial_commit', {
          repo_id: repoId,
          branch_name: 'main',
          commit_message: 'Initial commit'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating initial commit:', error);
      throw error;
    }
  }

  // Create new commit
  async createCommit(repoId, branchId, message, buildSnapshot, changes = null) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get latest commit as parent
      const { data: latestCommit } = await this.supabase
        .from('version_commits')
        .select('id')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const parentCommitId = latestCommit?.id || null;

      // Create commit
      const { data, error } = await this.supabase
        .rpc('create_commit', {
          repo_id: repoId,
          branch_id: branchId,
          parent_commit_id: parentCommitId,
          author_id: user.id,
          message: message,
          build_snapshot: buildSnapshot,
          changes: changes
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating commit:', error);
      throw error;
    }
  }

  // Get commit history
  async getCommitHistory(repoId, branchName = 'main', limit = 50) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_commit_history', {
          repo_id: repoId,
          branch_name: branchName,
          limit_count: limit
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting commit history:', error);
      throw error;
    }
  }

  // Get specific commit
  async getCommit(commitId) {
    try {
      const { data, error } = await this.supabase
        .from('version_commits')
        .select(`
          *,
          build_snapshots (*),
          version_changes (*),
          profiles!version_commits_author_id_fkey (full_name),
          profiles!version_commits_committer_id_fkey (full_name)
        `)
        .eq('id', commitId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting commit:', error);
      throw error;
    }
  }

  // Revert to commit
  async revertToCommit(repoId, targetCommitId, newBranchName, revertMessage = 'Revert to previous commit') {
    try {
      const { data, error } = await this.supabase
        .rpc('revert_to_commit', {
          repo_id: repoId,
          target_commit_id: targetCommitId,
          new_branch_name: newBranchName,
          revert_message: revertMessage
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reverting to commit:', error);
      throw error;
    }
  }

  // Compare commits
  async compareCommits(commit1Id, commit2Id) {
    try {
      const { data, error } = await this.supabase
        .rpc('compare_commits', {
          commit1_id: commit1Id,
          commit2_id: commit2Id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error comparing commits:', error);
      throw error;
    }
  }

  // ========================================
  // TAG OPERATIONS
  // ========================================

  // Create tag
  async createTag(repoId, commitId, name, description = '') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('version_tags')
        .insert({
          repository_id: repoId,
          commit_id: commitId,
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Get tags for repository
  async getTags(repoId) {
    try {
      const { data, error } = await this.supabase
        .from('version_tags')
        .select(`
          *,
          version_commits (commit_hash, message, created_at),
          profiles (full_name)
        `)
        .eq('repository_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  }

  // Delete tag
  async deleteTag(tagId) {
    try {
      const { error } = await this.supabase
        .from('version_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  // ========================================
  // MERGE REQUEST OPERATIONS
  // ========================================

  // Create merge request
  async createMergeRequest(repoId, sourceBranchId, targetBranchId, title, description = '') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('version_merge_requests')
        .insert({
          repository_id: repoId,
          source_branch_id: sourceBranchId,
          target_branch_id: targetBranchId,
          title,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating merge request:', error);
      throw error;
    }
  }

  // Get merge requests for repository
  async getMergeRequests(repoId) {
    try {
      const { data, error } = await this.supabase
        .from('version_merge_requests')
        .select(`
          *,
          version_branches!version_merge_requests_source_branch_id_fkey (name),
          version_branches!version_merge_requests_target_branch_id_fkey (name),
          profiles!version_merge_requests_created_by_fkey (full_name),
          profiles!version_merge_requests_assigned_to_fkey (full_name)
        `)
        .eq('repository_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting merge requests:', error);
      throw error;
    }
  }

  // Update merge request
  async updateMergeRequest(mrId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('version_merge_requests')
        .update(updates)
        .eq('id', mrId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating merge request:', error);
      throw error;
    }
  }

  // Merge request
  async mergeRequest(mrId, mergeCommitId) {
    try {
      const { data, error } = await this.supabase
        .from('version_merge_requests')
        .update({
          status: 'merged',
          merge_commit_id: mergeCommitId,
          merged_at: new Date().toISOString()
        })
        .eq('id', mrId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error merging request:', error);
      throw error;
    }
  }

  // ========================================
  // COMMENT OPERATIONS
  // ========================================

  // Add comment
  async addComment(repoId, commitId = null, mergeRequestId = null, content, parentCommentId = null) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase
        .from('version_comments')
        .insert({
          repository_id: repoId,
          commit_id: commitId,
          merge_request_id: mergeRequestId,
          parent_comment_id: parentCommentId,
          author_id: user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments
  async getComments(repoId, commitId = null, mergeRequestId = null) {
    try {
      let query = this.supabase
        .from('version_comments')
        .select(`
          *,
          profiles (full_name),
          version_comments (*)
        `)
        .eq('repository_id', repoId);

      if (commitId) {
        query = query.eq('commit_id', commitId);
      } else if (mergeRequestId) {
        query = query.eq('merge_request_id', mergeRequestId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Update comment
  async updateComment(commentId, content) {
    try {
      const { data, error } = await this.supabase
        .from('version_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Delete comment
  async deleteComment(commentId) {
    try {
      const { error } = await this.supabase
        .from('version_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // ========================================
  // BUILD SNAPSHOT OPERATIONS
  // ========================================

  // Save build snapshot
  async saveBuildSnapshot(commitId, buildData, partsData, analysisData = null, optimizationData = null) {
    try {
      const { data, error } = await this.supabase
        .from('build_snapshots')
        .insert({
          commit_id: commitId,
          build_data: buildData,
          parts_data: partsData,
          analysis_data: analysisData,
          optimization_data: optimizationData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving build snapshot:', error);
      throw error;
    }
  }

  // Get build snapshot
  async getBuildSnapshot(commitId) {
    try {
      const { data, error } = await this.supabase
        .from('build_snapshots')
        .select('*')
        .eq('commit_id', commitId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting build snapshot:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  // Generate commit message from build changes
  generateCommitMessage(buildChanges) {
    const changes = [];
    
    if (buildChanges.partsAdded?.length > 0) {
      changes.push(`Added ${buildChanges.partsAdded.length} parts`);
    }
    if (buildChanges.partsRemoved?.length > 0) {
      changes.push(`Removed ${buildChanges.partsRemoved.length} parts`);
    }
    if (buildChanges.partsModified?.length > 0) {
      changes.push(`Modified ${buildChanges.partsModified.length} parts`);
    }
    if (buildChanges.optimizationsApplied?.length > 0) {
      changes.push(`Applied ${buildChanges.optimizationsApplied.length} optimizations`);
    }

    return changes.length > 0 ? changes.join(', ') : 'Updated build configuration';
  }

  // Calculate changes between two builds
  calculateBuildChanges(oldBuild, newBuild) {
    const changes = {
      partsAdded: [],
      partsRemoved: [],
      partsModified: [],
      optimizationsApplied: []
    };

    // Compare parts
    const oldParts = oldBuild.parts || [];
    const newParts = newBuild.parts || [];

    // Find added parts
    changes.partsAdded = newParts.filter(newPart => 
      !oldParts.find(oldPart => oldPart.id === newPart.id)
    );

    // Find removed parts
    changes.partsRemoved = oldParts.filter(oldPart => 
      !newParts.find(newPart => newPart.id === oldPart.id)
    );

    // Find modified parts
    changes.partsModified = newParts.filter(newPart => {
      const oldPart = oldParts.find(op => op.id === newPart.id);
      return oldPart && JSON.stringify(oldPart) !== JSON.stringify(newPart);
    });

    // Compare optimizations
    const oldOptimizations = oldBuild.optimizations || {};
    const newOptimizations = newBuild.optimizations || {};
    
    changes.optimizationsApplied = Object.keys(newOptimizations).filter(key => 
      key !== 'lastUpdated' && oldOptimizations[key] !== newOptimizations[key]
    );

    return changes;
  }

  // Format commit hash for display
  formatCommitHash(hash) {
    return hash ? hash.substring(0, 8) : '';
  }

  // Format date for display
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
export const versionControl = new VersionControl(); 