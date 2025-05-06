import React, { useState, useEffect } from 'react';
import { User, BookmarkIcon, Share, MessageSquare, GitFork } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ThreadSegment from './ThreadSegment';
import ReactionBar from './ReactionBar';
import RelatedThreads from '../discovery/RelatedThreads';
import { threadService } from '@/lib/services/thread.service';
import { bookmarkService } from '@/lib/services/bookmark.service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabase';
import { followService } from '@/lib/services/follow.service';

interface ThreadReaderProps {
  threadId?: string;
}

const ThreadReader = ({ threadId: propThreadId }: ThreadReaderProps) => {
  const { threadId: paramThreadId } = useParams<{ threadId: string }>();
  const threadId = propThreadId || paramThreadId;
  const [thread, setThread] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forkLoading, setForkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  // Handle scroll events to update reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load thread data, analytics, and author profile
  useEffect(() => {
    if (!threadId) return;

    const loadThread = async () => {
      try {
        setLoading(true);
        const threadData = await threadService.getThreadById(threadId);
        setThread(threadData);
        console.log('Thread Data:', threadData);
        
        // Fetch author profile
        if (threadData.user_id) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', threadData.user_id)
              .single();
            
            console.log('Profile Data:', profileData);
            console.log('Profile Error:', profileError);
            
            setAuthorProfile(profileData);
          } catch (profileError) {
            console.error('Error loading author profile:', profileError);
          }
        }
        
        // Check if thread is bookmarked (if user is authenticated)
        if (isAuthenticated) {
          const bookmarked = await bookmarkService.isBookmarked(threadId);
          setIsBookmarked(bookmarked);
        }
        
        // Get analytics data
        try {
          const analyticsData = await threadService.getThreadAnalytics(threadId);
          setAnalytics(analyticsData);
        } catch (analyticsError) {
          console.error('Error loading analytics:', analyticsError);
        }
      } catch (error) {
        console.error('Error loading thread:', error);
        setError('Failed to load thread. It may have been deleted or you don\'t have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    loadThread();

    // Subscribe to real-time updates
    const subscription = threadService.subscribeToThread(threadId, (updatedThread) => {
      setThread(updatedThread);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId, isAuthenticated]);

  useEffect(() => {
    if (currentUser?.id && thread?.user_id) {
      followService.isFollowing(currentUser.id, thread.user_id).then(setIsFollowing);
    }
  }, [currentUser?.id, thread?.user_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-playfair font-semibold mb-4">Thread Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "This thread doesn't exist or has been removed."}</p>
        <Button onClick={() => navigate('/explore')}>Explore Threads</Button>
      </div>
    );
  }

  // Format the date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(thread.created_at));

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark threads",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(thread.id);
      } else {
        await bookmarkService.addBookmark(thread.id);
      }
      
      setIsBookmarked(!isBookmarked);
      
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: isBookmarked ? "This thread has been removed from your bookmarks." : "This thread has been added to your bookmarks.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };
  
  const handleForkThread = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to remix threads",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setForkLoading(true);
      const forkedThread = await threadService.forkThread(thread.id);
      
      toast({
        title: "Thread remixed",
        description: "You can now edit and publish your own version.",
        duration: 3000,
      });
      
      // Navigate to remix editor with original thread id
      navigate(`/create?remixFrom=${thread.id}`);
      
    } catch (error) {
      console.error('Error forking thread:', error);
      toast({
        title: "Error",
        description: "Failed to remix thread. Please try again.",
        variant: "destructive"
      });
    } finally {
      setForkLoading(false);
    }
  };
  
  const handleShareThread = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "The thread link has been copied to your clipboard.",
      duration: 3000,
    });
  };

  const handleEditThread = () => {
    navigate(`/create?thread=${thread.id}`);
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) return;
    try {
      await threadService.deleteThread(thread.id);
      toast({
        title: 'Thread deleted',
        description: 'Your thread has been deleted.',
      });
      navigate('/library');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete thread.',
        variant: 'destructive',
      });
    }
  };

  const handleFollow = async () => {
    if (currentUser?.id && thread?.user_id) {
      await followService.follow(currentUser.id, thread.user_id);
      setIsFollowing(true);
    }
  };

  const handleUnfollow = async () => {
    if (currentUser?.id && thread?.user_id) {
      await followService.unfollow(currentUser.id, thread.user_id);
      setIsFollowing(false);
    }
  };

  // Get author name and bio
  const authorName = thread?.author?.name || authorProfile?.name || 'Unknown Creator';
  const authorBio = authorProfile?.bio || thread?.author?.bio || 'No bio available';
  const authorAvatar = thread?.author?.avatar || authorProfile?.avatar_url || '/placeholder-avatar.jpg';

  // Sort segments by order_index before rendering
  const sortedSegments = thread.segments ? [...thread.segments].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) : [];

  return (
    <article className="relative">
      {/* Show Edit/Delete if user is author */}
      {currentUser && thread.user_id === currentUser.id && (
        <div className="flex gap-2 absolute right-0 top-0 z-10">
          <Button size="sm" variant="outline" onClick={handleEditThread}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteThread}>Delete</Button>
        </div>
      )}

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 z-50 w-full h-1 bg-border">
        <div 
          className="h-full bg-threadspire-gold transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Cover Image */}
      {thread.cover_image && (
        <div className="w-full h-64 md:h-80 lg:h-96 relative mb-8 rounded-lg overflow-hidden">
          <img 
            src={thread.cover_image} 
            alt={thread.title}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Thread Header */}
      <header className="mb-8">
        {/* Reading Stats */}
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mb-4">
          <span>{thread.segments.length} min read</span>
          
          {analytics && (
            <>
              <span>•</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    <span>{analytics.view_count} views</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{analytics.unique_viewers} unique viewers</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          
          {thread.fork_count > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                <span>{thread.fork_count} remixes</span>
              </span>
            </>
          )}
        </div>

        {/* Attribution to original thread if this is a fork */}
        {thread.original_thread_id && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
            <p className="flex items-center gap-2">
              <GitFork className="h-4 w-4 text-muted-foreground" />
              <span>
                This is a remix of another thread. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm" 
                  onClick={() => navigate(`/thread/${thread.original_thread_id}`)}
                >
                  View original
                </Button>
              </span>
            </p>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold mb-4">
          {thread.title}
        </h1>

        {/* Author and Date */}
        <div className="flex items-center gap-3 mb-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" asChild>
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground font-medium">{authorName}</span>
                </div>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{authorName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {authorBio}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm">View Profile</Button>
                    {currentUser?.id !== thread?.user_id && (
                      isFollowing ? (
                        <Button variant="outline" size="sm" onClick={handleUnfollow}>Following</Button>
                      ) : (
                        <Button size="sm" onClick={handleFollow}>Follow</Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="text-muted-foreground">·</span>
          <time className="text-muted-foreground" dateTime={thread.created_at}>
            {formattedDate}
          </time>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {thread.tags.map((tag: string) => (
            <span 
              key={tag} 
              className="inline-block bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Thread Segments */}
      <div className="space-y-12">
        {sortedSegments.map((segment: any, index: number) => (
          <ThreadSegment 
            key={segment.id} 
            segment={{ id: segment.id, content: segment.content, type: 'text' }} 
            isLast={index === thread.segments.length - 1}
          />
        ))}
      </div>

      {/* Author Card (Bottom) */}
      <div className="mt-16 p-8 border border-border rounded-lg bg-card">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold mb-2">Written by {authorName}</h3>
            <p className="text-muted-foreground mb-4">
              {authorBio}
            </p>
            {currentUser?.id !== thread?.user_id && (
              isFollowing ? (
                <Button variant="outline" onClick={handleUnfollow}>Following {authorName}</Button>
              ) : (
                <Button onClick={handleFollow}>Follow {authorName}</Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Engagement Bar */}
      <div className="sticky bottom-4 mt-10 w-fit mx-auto px-6 py-3 rounded-full shadow-lg bg-background border border-border flex items-center gap-4">
        <ReactionBar threadId={thread.id} />
        
        <div className="h-8 w-px bg-border"></div>
        
        <button
          className="flex items-center gap-1"
          onClick={toggleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          <BookmarkIcon className={`h-5 w-5 ${isBookmarked ? 'fill-threadspire-gold text-threadspire-gold' : 'text-foreground'}`} />
          <span className="text-sm">Bookmark</span>
        </button>
        
        <button 
          className="flex items-center gap-1"
          onClick={handleShareThread}
        >
          <Share className="h-5 w-5" />
          <span className="text-sm">Share</span>
        </button>
        
        <button 
          className="flex items-center gap-1"
          onClick={handleForkThread}
          disabled={forkLoading}
        >
          {forkLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GitFork className="h-5 w-5" />
          )}
          <span className="text-sm">Remix</span>
        </button>
        
        <button className="flex items-center gap-1">
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm">Comment</span>
        </button>
      </div>

      {/* Related Threads */}
      <section className="mt-16">
        <h2 className="text-2xl font-playfair font-semibold mb-6">Related Threads</h2>
        <RelatedThreads threadId={thread.id} tags={thread.tags} />
      </section>
    </article>
  );
};

export default ThreadReader;
