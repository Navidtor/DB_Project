import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Star, 
  Calendar,
  Users,
  Mail,
  Phone,
  Edit,
  UserPlus,
  UserMinus,
  Shield,
  Award,
  Loader2,
} from 'lucide-react';
import {
  getAdmins,
  getCities,
  getModerators,
  getPlaces,
  getProfileByUserId,
  getPostsByUserId,
  getRegularUsers,
  getRequestsByUserId,
  getUserById,
} from '@/lib/api';
import { followUser, unfollowUser, isFollowing as checkIsFollowing } from '@/lib/api-write';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type {
  Admin,
  City,
  CompanionRequest,
  Moderator,
  Place,
  Post,
  Profile,
  RegularUser,
  User,
} from '@/types/database';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { dbUser } = useAuth();
  const { toast } = useToast();
  
  const currentUserId = dbUser?.user_id ?? 'user-1';
  const targetUserId = userId || currentUserId;

  const [user, setUser] = useState<User | undefined>();
  const [profile, setProfile] = useState<Profile | undefined>();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userRequests, setUserRequests] = useState<CompanionRequest[]>([]);
  const [regularUsers, setRegularUsers] = useState<RegularUser[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [
          userData,
          profileData,
          postsData,
          requestsData,
          regularData,
          moderatorData,
          adminData,
          citiesData,
          placesData,
        ] = await Promise.all([
          getUserById(targetUserId),
          getProfileByUserId(targetUserId),
          getPostsByUserId(targetUserId),
          getRequestsByUserId(targetUserId),
          getRegularUsers(),
          getModerators(),
          getAdmins(),
          getCities(),
          getPlaces(),
        ]);

        // Check follow status
        let followStatus = false;
        if (currentUserId !== targetUserId) {
          followStatus = await checkIsFollowing(currentUserId, targetUserId);
        }

        if (!isMounted) return;
        setUser(userData);
        setProfile(profileData);
        setUserPosts(postsData);
        setUserRequests(requestsData);
        setRegularUsers(regularData);
        setModerators(moderatorData);
        setAdmins(adminData);
        setCities(citiesData);
        setPlaces(placesData);
        setIsFollowing(followStatus);
      } catch (error) {
        console.error('Error loading profile data:', error);
        if (isMounted) setLoadError('Unable to load profile data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    setIsLoading(true);
    setLoadError(null);
    loadData();
    return () => {
      isMounted = false;
    };
  }, [targetUserId, currentUserId]);
  
  const citiesById = useMemo(() => new Map(cities.map((city) => [city.city_id, city])), [cities]);
  const placesById = useMemo(() => new Map(places.map((place) => [place.place_id, place])), [places]);

  // Get subtype data
  const regularUser = regularUsers.find(r => r.user_id === targetUserId);
  const moderator = moderators.find(m => m.user_id === targetUserId);
  const admin = admins.find(a => a.user_id === targetUserId);
  
  const isOwnProfile = currentUserId === targetUserId;

  const handleFollowToggle = async () => {
    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await unfollowUser(currentUserId, targetUserId);
        if (error) throw error;
        setIsFollowing(false);
        // Update follower count
        if (profile) {
          setProfile({ ...profile, followers_count: (profile.followers_count || 0) - 1 });
        }
        toast({
          title: 'لغو دنبال کردن',
          description: 'کاربر با موفقیت لغو دنبال شد.',
        });
      } else {
        const { error } = await followUser(currentUserId, targetUserId);
        if (error) throw error;
        setIsFollowing(true);
        // Update follower count
        if (profile) {
          setProfile({ ...profile, followers_count: (profile.followers_count || 0) + 1 });
        }
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
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">کاربر یافت نشد</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
    });
  };

  const coverImage =
    profile.cover_image ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80';
  const fallbackPostImage =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80';

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'regular': return { label: 'کاربر عادی', icon: Users };
      case 'moderator': return { label: 'مدیر محتوا', icon: Shield };
      case 'admin': return { label: 'مدیر سیستم', icon: Award };
      default: return { label: 'کاربر', icon: Users };
    }
  };

  const userType = getUserTypeLabel(user.user_type);
  const UserTypeIcon = userType.icon;

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}
      {/* Profile Header */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        
        <CardContent className="relative pt-0">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {user.name}
                    <Badge variant="outline" className="font-normal">
                      <UserTypeIcon className="h-3 w-3 ml-1" />
                      {userType.label}
                    </Badge>
                  </h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline">
                      <Edit className="h-4 w-4 ml-2" />
                      ویرایش پروفایل
                    </Button>
                  ) : (
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 ml-2" />
                          لغو دنبال کردن
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 ml-2" />
                          دنبال کردن
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.followers_count || 0}</p>
              <p className="text-sm text-muted-foreground">دنبال‌کننده</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.following_count || 0}</p>
              <p className="text-sm text-muted-foreground">دنبال‌شونده</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{userPosts.length}</p>
              <p className="text-sm text-muted-foreground">تجربه</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">درباره من</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile.bio || 'بیوگرافی تعریف نشده است.'}</p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات تماس</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>عضویت از {formatDate(user.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">علاقه‌مندی‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.interests ?? []).length > 0 ? (
                  profile.interests!.map((interest, i) => (
                    <Badge key={i} variant="secondary">{interest}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">علاقه‌مندی تعریف نشده است.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role-specific info */}
          {regularUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات سفر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">سطح تجربه:</p>
                  <Badge>{regularUser.experience_level}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ترجیحات سفر:</p>
                  <div className="flex flex-wrap gap-1">
                    {(regularUser.travel_preferences ?? []).map((pref, i) => (
                      <Badge key={i} variant="outline">{pref}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {moderator && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات مدیریت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">مناطق تحت نظارت:</p>
                  <div className="flex flex-wrap gap-1">
                    {(moderator.assigned_regions ?? []).map((region, i) => (
                      <Badge key={i} variant="outline">{region}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">تأییدها:</p>
                  <Badge variant="secondary">{moderator.approval_count}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {admin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات مدیر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">سطح دسترسی:</p>
                  <Badge>{admin.access_level}</Badge>
                </div>
                {admin.last_admin_action && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">آخرین اقدام:</p>
                    <span className="text-sm">{formatDate(admin.last_admin_action)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">تجربه‌ها ({userPosts.length})</TabsTrigger>
              <TabsTrigger value="requests">درخواست‌های همسفر ({userRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {userPosts.map(post => {
                const place = post.place_id ? placesById.get(post.place_id) : undefined;
                const city = post.city_id ? citiesById.get(post.city_id) : undefined;
                
                return (
                  <Card key={post.post_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Link to={`/app/posts/${post.post_id}`} className="shrink-0">
                          <img 
                            src={post.images?.[0] || fallbackPostImage} 
                            alt={post.title}
                            className="w-24 h-20 sm:w-32 sm:h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/app/posts/${post.post_id}`}>
                              <h3 className="font-bold hover:text-primary transition-colors line-clamp-1">
                                {post.title}
                              </h3>
                            </Link>
                            <Badge variant={post.experience_type === 'visited' ? 'default' : 'secondary'}>
                              {post.experience_type === 'visited' ? 'بازدید شده' : 'رویایی'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {place?.name || city?.name}
                            <span>•</span>
                            {formatDate(post.created_at)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-1 text-sm text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              {(post.avg_rating || 0).toFixed(1)}
                            </span>
                            {isOwnProfile && (
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/app/posts/${post.post_id}/edit`}>
                                  <Edit className="h-3 w-3 ml-1" />
                                  ویرایش
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {userPosts.length === 0 && (
                <Card className="py-8 text-center">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">هنوز تجربه‌ای ثبت نشده است</p>
                    {isOwnProfile && (
                      <Button asChild>
                        <Link to="/app/posts/new">ثبت اولین تجربه</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4 mt-4">
              {userRequests.map(request => {
                const city = request.destination_city_id ? citiesById.get(request.destination_city_id) : undefined;
                
                return (
                  <Card key={request.request_id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {city?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(request.travel_date)}
                          </p>
                          <p className="text-sm mt-2">{request.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(request.conditions ?? []).map((condition, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge 
                          variant={request.status === 'active' ? 'default' : 
                                   request.status === 'completed' ? 'secondary' : 'destructive'}
                        >
                          {request.status === 'active' ? 'فعال' : 
                           request.status === 'completed' ? 'تکمیل شده' : 'لغو شده'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {userRequests.length === 0 && (
                <Card className="py-8 text-center">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">هنوز درخواستی ثبت نشده است</p>
                    {isOwnProfile && (
                      <Button asChild>
                        <Link to="/app/companions">ایجاد درخواست همسفر</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
