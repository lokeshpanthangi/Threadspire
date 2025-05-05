
import { supabase } from "@/integrations/supabase/client";

export const draftService = {
  async createDraft(title: string, content: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('drafts')
      .insert([{ user_id: user.id, title, content }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateDraft(id: string, title: string, content: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('drafts')
      .update({ title, content })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getDraftsByUser(userId: string) {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async deleteDraft(id: string) {
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  async publishDraft(draftId: string) {
    // 1. Get the draft
    const { data: draft, error: getError } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .single();
    if (getError) throw getError;

    // Parse content if it's a string
    let contentArray = Array.isArray(draft.content) ? draft.content : [];
    if (typeof draft.content === 'string') {
      try {
        contentArray = JSON.parse(draft.content);
      } catch (e) {
        console.error('Error parsing draft content:', e);
        contentArray = [{ content: draft.content }];
      }
    } else if (draft.content && typeof draft.content === 'object') {
      // Handle case where content is already an object
      contentArray = Array.isArray(draft.content) ? draft.content : [draft.content];
    }

    // 2. Insert into threads table (no content field)
    const threadInsert = {
      user_id: draft.user_id,
      title: draft.title,
      is_published: true,
      snippet: Array.isArray(contentArray) && contentArray.length > 0 && contentArray[0]?.content
        ? String(contentArray[0].content).substring(0, 150)
        : null,
      // Add cover_image, tags, etc. if your schema requires them
    };

    const { data: thread, error: insertError } = await supabase
      .from('threads')
      .insert([threadInsert])
      .select()
      .single();
    if (insertError) {
      console.error('Insert error:', insertError, threadInsert);
      throw insertError;
    }

    // 3. Insert segments into thread_segments table
    if (Array.isArray(contentArray)) {
      for (let i = 0; i < contentArray.length; i++) {
        const segment = contentArray[i];
        const segmentContent = segment && typeof segment.content === 'string' ? segment.content : 
                               typeof segment === 'string' ? segment : JSON.stringify(segment);
                               
        const { error: segError } = await supabase
          .from('thread_segments')
          .insert({
            thread_id: thread.id,
            content: segmentContent,
            order_index: i,
          });
        if (segError) {
          console.error('Segment insert error:', segError, segment);
          throw segError;
        }
      }
    }

    // 4. Delete the draft
    await this.deleteDraft(draftId);

    return thread;
  },
  async getDraftById(id: string) {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  // Add more methods as needed (getDraft, deleteDraft, etc.)
};
