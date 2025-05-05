import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, Edit, X, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthoredThreadsTab from './AuthoredThreadsTab';
import BookmarksTab from './BookmarksTab';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileProps {
  username: string | undefined;
}

const UserProfile = ({ username }: UserProfileProps) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<{ threadsCreated: number; followers: number; following: number; bookmarks: number }>({ threadsCreated: 0, followers: 0, following: 0, bookmarks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      let query = supabase.from('profiles').select('*');
      if (username) {
        query = query.eq('username', username);
      } else if (currentUser?.id) {
        query = query.eq('id', currentUser.id);
      }
      const { data, error } = await query.single();
      if (error) {
        setError('Profile not found');
        setProfile(null);
      } else {
        setProfile(data);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
        // Fetch stats
        const userId = data.id;
        const { count: threadsCount } = await (supabase.from('threads').select('*', { count: 'exact', head: true }).eq('user_id', userId) as any);
        const { count: followersCount } = await (supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId) as any);
        const { count: followingCount } = await (supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId) as any);
        const { count: bookmarksCount } = await (supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId) as any);
        setStats({
          threadsCreated: threadsCount || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
          bookmarks: bookmarksCount || 0
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username, currentUser, editMode]);

  const isOwnProfile = currentUser?.id && profile?.id && currentUser.id === profile.id;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const handleEdit = () => {
    setEditName(profile.name || '');
    setEditBio(profile.bio || '');
    setEditMode(true);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    // Update profiles table
    const { error: profileError } = await supabase.from('profiles').update({ name: editName, bio: editBio }).eq('id', profile.id);
    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({ data: { name: editName } });
    setSaving(false);
    if (profileError || authError) {
      setSaveError(profileError?.message || authError?.message);
    } else {
      setEditMode(false);
      // Optionally, refresh the page or user context
      // If you have a custom useAuth hook/context, call its refresh method here
      // Example: if (refreshUser) refreshUser();
      window.location.reload();
    }
  };

  if (loading) return <div className="py-12 text-center">Loading profile...</div>;
  if (error || !profile) return <div className="py-12 text-center text-destructive">{error || 'Profile not found'}</div>;

  return (
    <div className="w-full">
      {/* Cover Image (optional, if you have it in your schema) */}
      {/* <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden">
        {profile.cover_image && (
          <img 
            src={profile.cover_image} 
            alt={`${profile.full_name || profile.username}'s cover`} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div> */}
      {/* Profile Header */}
      <div className="relative px-4 sm:px-6 -mt-16 mb-8">
        <div className="flex flex-col items-center">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(profile.created_at)}
            </p>
            {profile.bio && (
              <p className="mt-4 max-w-lg mx-auto text-muted-foreground">
                {profile.bio}
              </p>
            )}
          </div>
          {/* Stats */}
          <div className="flex items-center gap-8 mt-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{stats.threadsCreated}</span> Threads
            </div>
            <div>
              <span className="font-medium text-foreground">{stats.followers}</span> Followers
            </div>
            <div>
              <span className="font-medium text-foreground">{stats.following}</span> Following
            </div>
            <div>
              <span className="font-medium text-foreground">{stats.bookmarks}</span> Bookmarks
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            {isOwnProfile ? (
              <Button variant="outline" className="flex items-center gap-2" onClick={handleEdit}>
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <Button variant="default">Follow</Button>
            )}
          </div>
        </div>
      </div>
      {/* Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2" onClick={() => setEditMode(false)}><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea className="w-full border rounded px-3 py-2" value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} />
            </div>
            {saveError && <div className="text-destructive mb-2">{saveError}</div>}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
              <Button variant="default" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Content Tabs */}
      <Tabs defaultValue="threads" className="mt-8">
        <TabsList className="w-full justify-start border-b rounded-none gap-8 px-4">
          <TabsTrigger value="threads" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Threads</TabsTrigger>
          <TabsTrigger value="bookmarks" className="data-[state=active]:border-b-2 data-[state=active]:border-threadspire-gold rounded-none">Bookmarks</TabsTrigger>
        </TabsList>
        <TabsContent value="threads" className="mt-6">
          <AuthoredThreadsTab userId={profile.id} />
        </TabsContent>
        <TabsContent value="bookmarks" className="mt-6">
          <BookmarksTab userId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
