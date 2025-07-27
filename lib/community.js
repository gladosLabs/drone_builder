import { supabase } from './supabase';

export async function getDiscussions(category = null, limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('discussions')
      .select(`
        *,
        profiles!discussions_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    const discussionsWithStats = await Promise.all(
      data.map(async (discussion) => {
        const [replyCount, voteCount] = await Promise.all([
          getReplyCount(discussion.id),
          getVoteCount(discussion.id)
        ]);

        return {
          ...discussion,
          reply_count: replyCount,
          vote_count: voteCount,
          author_name: discussion.profiles?.full_name || 'Anonymous',
          author_avatar: discussion.profiles?.avatar_url
        };
      })
    );

    return discussionsWithStats;
  } catch (error) {
    console.error('Error fetching discussions:', error);
    throw error;
  }
}

export async function getDiscussion(discussionId) {
  try {
    const { data, error } = await supabase
      .from('discussions')
      .select(`
        *,
        profiles!discussions_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', discussionId)
      .single();

    if (error) throw error;

    if (data) {
      const [replyCount, voteCount] = await Promise.all([
        getReplyCount(data.id),
        getVoteCount(data.id)
      ]);

      return {
        ...data,
        reply_count: replyCount,
        vote_count: voteCount,
        author_name: data.profiles?.full_name || 'Anonymous',
        author_avatar: data.profiles?.avatar_url
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching discussion:', error);
    throw error;
  }
}

export async function createDiscussion(title, content, category = 'general', tags = []) {
  try {
    const { data, error } = await supabase.rpc('create_discussion', {
      discussion_title: title,
      discussion_content: content,
      discussion_category: category,
      discussion_tags: tags
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating discussion:', error);
    throw error;
  }
}

export async function addReply(discussionId, content, parentReplyId = null) {
  try {
    const { data, error } = await supabase.rpc('add_discussion_reply', {
      discussion_uuid: discussionId,
      reply_content: content,
      parent_reply_uuid: parentReplyId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
}

export async function voteOnContent(contentId, isReply = false, voteValue) {
  try {
    const { data, error } = await supabase.rpc('vote_on_content', {
      content_id: contentId,
      is_reply: isReply,
      vote_value: voteValue
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error voting on content:', error);
    throw error;
  }
}

export async function toggleBookmark(discussionId) {
  try {
    const { data, error } = await supabase.rpc('toggle_bookmark', {
      discussion_uuid: discussionId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

export async function getBookmarkedDiscussions() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select(`
        discussion_id,
        discussions (
          *,
          profiles!discussions_author_id_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    const bookmarkedDiscussions = await Promise.all(
      data.map(async (bookmark) => {
        const discussion = bookmark.discussions;
        const [replyCount, voteCount] = await Promise.all([
          getReplyCount(discussion.id),
          getVoteCount(discussion.id)
        ]);

        return {
          ...discussion,
          reply_count: replyCount,
          vote_count: voteCount,
          author_name: discussion.profiles?.full_name || 'Anonymous',
          author_avatar: discussion.profiles?.avatar_url
        };
      })
    );

    return bookmarkedDiscussions;
  } catch (error) {
    console.error('Error fetching bookmarked discussions:', error);
    throw error;
  }
}

export async function getCategories() {
  try {
    console.log('Fetching categories from database...');
    const { data, error } = await supabase
      .from('discussion_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    console.log('Categories fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Helper functions
async function getReplyCount(discussionId) {
  try {
    const { count, error } = await supabase
      .from('discussion_replies')
      .select('*', { count: 'exact', head: true })
      .eq('discussion_id', discussionId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting reply count:', error);
    return 0;
  }
}

async function getVoteCount(discussionId) {
  try {
    const { data, error } = await supabase
      .from('discussion_votes')
      .select('vote_type')
      .eq('discussion_id', discussionId)
      .is('reply_id', null);

    if (error) throw error;
    return data.reduce((sum, vote) => sum + vote.vote_type, 0);
  } catch (error) {
    console.error('Error getting vote count:', error);
    return 0;
  }
}

export async function getReplyVoteCount(replyId) {
  try {
    const { data, error } = await supabase
      .from('discussion_votes')
      .select('vote_type')
      .eq('reply_id', replyId);

    if (error) throw error;
    return data.reduce((sum, vote) => sum + vote.vote_type, 0);
  } catch (error) {
    console.error('Error getting reply vote count:', error);
    return 0;
  }
}

export async function incrementViews(discussionId) {
  try {
    const { error } = await supabase.rpc('increment_discussion_views', {
      discussion_uuid: discussionId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
}

export async function searchDiscussions(query, category = null) {
  try {
    let supabaseQuery = supabase
      .from('discussions')
      .select(`
        *,
        profiles!discussions_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;

    const discussionsWithStats = await Promise.all(
      data.map(async (discussion) => {
        const [replyCount, voteCount] = await Promise.all([
          getReplyCount(discussion.id),
          getVoteCount(discussion.id)
        ]);

        return {
          ...discussion,
          reply_count: replyCount,
          vote_count: voteCount,
          author_name: discussion.profiles?.full_name || 'Anonymous',
          author_avatar: discussion.profiles?.avatar_url
        };
      })
    );

    return discussionsWithStats;
  } catch (error) {
    console.error('Error searching discussions:', error);
    throw error;
  }
} 