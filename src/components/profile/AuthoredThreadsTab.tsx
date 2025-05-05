
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookmarkIcon, MessageSquare, GitFork } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthoredThreadsTabProps {
  userId: string;
}

// Mock thread data
const getMockUserThreads = () => [
  {
    id: 'thread1',
    title: 'The Art of Mindful Productivity: Balancing Focus and Rest',
    preview: 'The modern workday has become a constant battle for our attention...',
    publishedAt: new Date('2025-04-23'),
    tags: ['Productivity', 'Mindfulness'],
    stats: {
      reactions: 78,
      bookmarks: 47,
      comments: 12,
      forks: 3
    }
  },
  {
    id: 'thread2',
    title: 'Why Deep Work Matters in a Distracted World',
    preview: 'In an age of constant notifications and interruptions...',
    publishedAt: new Date('2025-03-15'),
    tags: ['Deep Work', 'Focus'],
    stats: {
      reactions: 125,
      bookmarks: 83,
      comments: 24,
      forks: 6
    }
  },
  {
    id: 'thread3',
    title: 'Building Restorative Rest Practices into Your Routine',
    preview: 'Quality rest is not a reward for productivity but an essential component...',
    publishedAt: new Date('2025-02-02'),
    tags: ['Rest', 'Wellness'],
    stats: {
      reactions: 94,
      bookmarks: 62,
      comments: 18,
      forks: 4
    }
  }
];

const AuthoredThreadsTab = ({ userId }: AuthoredThreadsTabProps) => {
  const threads = getMockUserThreads();
  
  if (threads.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No threads created yet.</p>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {threads.map(thread => (
        <Link key={thread.id} to={`/thread/${thread.id}`} className="no-underline">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-playfair line-clamp-2">
                {thread.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {formatDate(thread.publishedAt)}
              </p>
              <p className="mt-2 line-clamp-3 text-sm">
                {thread.preview}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {thread.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-block bg-secondary/50 text-xs text-secondary-foreground px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{thread.stats.reactions}</span> Reactions
                </div>
                <div className="flex items-center gap-1">
                  <BookmarkIcon className="h-3.5 w-3.5" />
                  <span>{thread.stats.bookmarks}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{thread.stats.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  <span>{thread.stats.forks}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default AuthoredThreadsTab;
