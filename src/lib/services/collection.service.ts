import { supabase } from '../supabase'
import { ThreadWithSegments } from './thread.service'

export interface Collection {
  id: string
  user_id: string
  name: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface CollectionWithThreads extends Collection {
  threads: ThreadWithSegments[]
}

export const collectionService = {
  // Create a new collection
  async createCollection(name: string, isPrivate: boolean = true) {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name,
        is_private: isPrivate,
      })
      .select()
      .single()
    if (error) throw error
    return data as Collection
  },

  // Get a collection by ID
  async getCollection(id: string): Promise<CollectionWithThreads> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        threads:collection_threads(
          thread:threads(
            *,
            segments:thread_segments(*),
            tags:thread_tags(tag:tags(name))
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      ...data,
      threads: data.threads.map((t: any) => ({
        ...t.thread,
        tags: t.thread.tags.map((tag: any) => tag.tag.name),
      })),
    }
  },

  // Get user's collections
  async getUserCollections() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Collection[]
  },

  // Update a collection
  async updateCollection(
    id: string,
    updates: {
      name?: string
      is_private?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Collection
  },

  // Delete a collection
  async deleteCollection(id: string) {
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) throw error
  },

  // Add a thread to a collection
  async addThreadToCollection(collectionId: string, threadId: string) {
    const { error } = await supabase.from('collection_threads').insert({
      collection_id: collectionId,
      thread_id: threadId,
    })
    if (error) throw error
  },

  // Remove a thread from a collection
  async removeThreadFromCollection(collectionId: string, threadId: string) {
    const { error } = await supabase
      .from('collection_threads')
      .delete()
      .eq('collection_id', collectionId)
      .eq('thread_id', threadId)
    if (error) throw error
  },

  // Subscribe to collection changes
  subscribeToCollections(callback: (collection: Collection) => void) {
    const channel = supabase.channel('collections')
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collections',
      },
      async (payload) => {
        if (payload.new) {
          callback(payload.new as Collection)
        }
      }
    )

    channel.subscribe()
    return channel
  },
} 