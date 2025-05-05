
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, BookmarkIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookmarkService } from '@/lib/services/bookmark.service';
import { useToast } from '@/hooks/use-toast';

interface BookmarksTabProps {
  userId: string;
  isOwnProfile: boolean;
}

interface BookmarkedThread {
  id: string;
  title: string;
  cover_image: string | null;
  segments: Array<{ content: string }>;
  tags: string[];
  created_at: string;
}

const BookmarksTab = ({ userId, isOwnProfile }: BookmarksTabProps) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isOwnProfile) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { threads } = await bookmarkService.getBookmarkedThreads({ limit: 20 });
        setBookmarks(threads);
      } catch (err) {
        console.error('Error loading bookmarks:', err);
        setError('Failed to load bookmarks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadBookmarks();
  }, [isOwnProfile]);
  
  if (!isOwnProfile) {
    return (
      <div className="text-center py-16">
        <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">Bookmarks are private to each user.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-16">
        <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16">
        <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">No bookmarks yet.</p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };
  
  const removeBookmark = async (threadId: string) => {
    try {
      await bookmarkService.removeBookmark(threadId);
      setBookmarks(prevBookmarks => prevBookmarks.filter(bm => bm.id !== threadId));
      toast({
        title: "Bookmark removed",
        description: "Thread has been removed from your bookmarks",
      });
    } catch (err) {
      console.error('Error removing bookmark:', err);
      toast({
        title: "Error",
        description: "Failed to remove bookmark. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {bookmarks.map(thread => (
        <Card key={thread.id} className="relative group">
          <button
            onClick={(e) => {
              e.preventDefault();
              removeBookmark(thread.id);
            }}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove bookmark"
          >
            <BookmarkIcon className="h-5 w-5 fill-threadspire-gold text-threadspire-gold hover:fill-transparent hover:text-muted-foreground transition-colors" />
          </button>
          
          <Link to={`/thread/${thread.id}`} className="no-underline">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Author</span>
                <span className="text-xs text-muted-foreground">• {formatDate(thread.created_at)}</span>
              </div>
              
              <CardTitle className="text-lg font-playfair line-clamp-2">
                {thread.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {thread.segments[0]?.content.substring(0, 150) || "No content"}
              </p>
              
              {thread.tags && thread.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex flex-wrap gap-1">
                    {thread.tags.slice(0, 3).map((tag: string) => (
                      <span 
                        key={tag}
                        className="text-xs bg-secondary/30 py-0.5 px-2 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {thread.tags.length > 3 && (
                      <span className="text-xs bg-secondary/30 py-0.5 px-2 rounded-full">
                        +{thread.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default BookmarksTab;
