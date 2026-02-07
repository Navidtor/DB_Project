import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  Loader2,
} from 'lucide-react';
import { getUsers, getProfiles, getPosts } from '@/lib/api';
import { followUser, unfollowUser, isFollowing } from '@/lib/api-write';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { User, Profile, Post } from '@/types/database';

interface EnrichedUser extends User {
  profile?: Profile;
  post_count: number;
  isFollowed: boolean;
}

export default function UsersPage() {
  const { dbUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentUserId = dbUser?.user_id ?? 'user-1';

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [usersData, profilesData, postsData] = await Promise.all([
          getUsers(),
          getProfiles(),
          getPosts(),
        ]);

        if (!isMounted) return;
        setUsers(usersData);
        setProfiles(profilesData);
        setPosts(postsData);

        // Check follow status for all users in parallel
        const otherUsers = usersData.filter(user => user.user_id !== currentUserId);
        const followResults = await Promise.all(
          otherUsers.map(user => isFollowing(currentUserId, user.user_id))
        );
        const statuses: Record<string, boolean> = {};
        otherUsers.forEach((user, index) => {
          statuses[user.user_id] = followResults[index];
        });
        if (isMounted) setFollowStatus(statuses);
      } catch (error) {
        console.error('Error loading users data:', error);
        if (isMounted) setLoadError('Unable to load users.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const profilesByUserId = useMemo(
    () => new Map(profiles.map((p) => [p.user_id, p])),
    [profiles]
  );

  const postCountByUserId = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      counts[post.user_id] = (counts[post.user_id] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const enrichedUsers: EnrichedUser[] = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        profile: profilesByUserId.get(user.user_id),
        post_count: postCountByUserId[user.user_id] || 0,
        isFollowed: followStatus[user.user_id] || false,
      })),
    [users, profilesByUserId, postCountByUserId, followStatus]
  );

  const filteredUsers = enrichedUsers.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleFollowToggle = async (userId: string) => {
    setLoadingFollow((prev) => ({ ...prev, [userId]: true }));

    try {
      const isCurrentlyFollowed = followStatus[userId];
      if (isCurrentlyFollowed) {
        const { error } = await unfollowUser(currentUserId, userId);
        if (error) throw error;
        setFollowStatus((prev) => ({ ...prev, [userId]: false }));
        toast({
          title: 'لغو دنبال کردن',
          description: 'کاربر با موفقیت لغو دنبال شد.',
        });
      } else {
        const { error } = await followUser(currentUserId, userId);
        if (error) throw error;
        setFollowStatus((prev) => ({ ...prev, [userId]: true }));
        toast({
          title: 'دنبال کردن',
          description: 'کاربر با موفقیت دنبال شد.',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'عملیات با خطا مواجه شد.',
        variant: 'destructive',
      });
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Badge className="bg-yellow-500">مدیر</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500">ناظر</Badge>;
      default:
        return <Badge variant="outline">کاربر عادی</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">کاربران</h1>
        <p className="text-muted-foreground">جستجو و مرور کاربران همسفر میرزا</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، نام کاربری یا ایمیل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع کاربر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کاربران</SelectItem>
                <SelectItem value="regular">کاربران عادی</SelectItem>
                <SelectItem value="moderator">ناظران</SelectItem>
                <SelectItem value="admin">مدیران</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.user_id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <Link
                  to={`/app/profile/${user.user_id}`}
                  className="flex items-center gap-4 hover:opacity-80"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user.profile_image} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {user.name}
                      {getUserTypeIcon(user.user_type)}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
                {getUserTypeBadge(user.user_type)}
              </div>

              {/* Bio */}
              {user.profile?.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {user.profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {user.profile?.followers_count || 0} دنبال کننده
                </span>
                <span>{user.post_count} پست</span>
              </div>

              {/* Interests */}
              {user.profile?.interests && user.profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {user.profile.interests.slice(0, 3).map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {user.profile.interests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.profile.interests.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/app/profile/${user.user_id}`}>مشاهده پروفایل</Link>
                </Button>
                {user.user_id !== currentUserId && (
                  <Button
                    variant={user.isFollowed ? 'secondary' : 'default'}
                    size="icon"
                    onClick={() => handleFollowToggle(user.user_id)}
                    disabled={loadingFollow[user.user_id]}
                  >
                    {loadingFollow[user.user_id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : user.isFollowed ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هیچ کاربری یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
