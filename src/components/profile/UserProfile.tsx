
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthoredThreadsTab from './AuthoredThreadsTab';
import CollectionsTab from './CollectionsTab';
import BookmarksTab from './BookmarksTab';
import ActivityTab from './ActivityTab';

interface UserProfileProps {
  username: string | undefined;
}

// Mock user data - in a real app, this would come from an API
const getMockUser = (username: string | undefined) => ({
  id: '123',
  username: username || 'mayaj',
  displayName: 'Maya Johnson',
  bio: 'Productivity coach and mindfulness practitioner helping people find balance in their digital lives.',
  avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=256&q=80',
  coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  joinDate: new Date('2024-01-15'),
  stats: {
    threadsCreated: 24,
    collectionCount: 7,
    reactionsReceived: 352,
    followers: 128,
    following: 43
  },
  isFollowing: false
});

const UserProfile = ({ username }: UserProfileProps) => {
  const user = getMockUser(username);
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  
  const isOwnProfile = currentUser?.id === user.id;
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };
  
  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };
  
  return (
    <div className="w-full">
      {/* Cover Image */}
      <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden">
        {user.coverImage && (
          <img 
            src={user.coverImage} 
            alt={`${user.displayName}'s cover`} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
      
      {/* Profile Header */}
      <div className="relative px-4 sm:px-6 -mt-16 mb-8">
        <div className="flex flex-col items-center">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-semibold">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(user.joinDate)}
            </p>
            
            {user.bio && (
              <p className="mt-4 max-w-lg mx-auto text-muted-foreground">
                {user.bio}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-8 mt-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{user.stats.threadsCreated}</span> Threads
            </div>
            <div>
              <span className="font-medium text-foreground">{user.stats.collectionCount}</span> Collections
            </div>
            <div>
              <span className="font-medium text-foreground">{user.stats.reactionsReceived}</span> Reactions
            </div>
            <div>
              <span className="font-medium text-foreground">{user.stats.followers}</span> Followers
            </div>
            <div>
              <span className="font-medium text-foreground">{user.stats.following}</span> Following
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            {isOwnProfile ? (
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <Button 
                variant={isFollowing ? "outline" : "default"}
                onClick={toggleFollow}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Content Tabs */}
      <Tabs defaultValue="threads" className="mt-8">
        <TabsList className="w-full justify-start border-b rounded-none gap-8 px-4">
          <TabsTrigger value="threads" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Threads</TabsTrigger>
          <TabsTrigger value="collections" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Collections</TabsTrigger>
          <TabsTrigger value="bookmarks" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Bookmarks</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="threads" className="mt-6">
          <AuthoredThreadsTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="collections" className="mt-6">
          <CollectionsTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="bookmarks" className="mt-6">
          <BookmarksTab userId={user.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <ActivityTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
