import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Users,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Heart
} from 'lucide-react';
import {
  getCompanionRequests,
  getCities,
  getPlaces,
  getPosts,
  getUsers,
} from '@/lib/api';
import type { City, CompanionRequest, Place, Post, User } from '@/types/database';

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [companionRequests, setCompanionRequests] = useState<CompanionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [postsData, usersData, placesData, citiesData, requestsData] = await Promise.all([
          getPosts(),
          getUsers(),
          getPlaces(),
          getCities(),
          getCompanionRequests(),
        ]);

        if (!isMounted) return;
        setPosts(postsData);
        setUsers(usersData);
        setPlaces(placesData);
        setCities(citiesData);
        setCompanionRequests(requestsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (isMounted) setLoadError('Unable to load dashboard data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getUserById = (userId: string) => users.find((user) => user.user_id === userId);
  const getPlaceById = (placeId: string) => places.find((place) => place.place_id === placeId);
  const getCityById = (cityId: string) => cities.find((city) => city.city_id === cityId);
  const fallbackPostImage =
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';
  const isPlaceholderCityImage = (image?: string) =>
    !!image?.trim() && !image.includes('placehold.co');
  const featuredCities = cities.filter((city) => isPlaceholderCityImage(city.image));

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  // Get recent posts (last 3)
  const recentPosts = posts.slice(0, 3).map(post => ({
    ...post,
    user: getUserById(post.user_id),
    place: post.place_id ? getPlaceById(post.place_id) : undefined,
    city: post.city_id ? getCityById(post.city_id) : undefined,
  }));

  // Get active companion requests
  const activeRequests = companionRequests
    .filter(r => r.status === 'active')
    .slice(0, 3)
    .map(request => ({
      ...request,
      user: getUserById(request.user_id),
      city: request.destination_city_id ? getCityById(request.destination_city_id) : undefined,
    }));

  // Stats
  const stats = [
    { label: 'تجربه‌های ثبت شده', value: posts.length, icon: FileText, color: 'text-green-600' },
    { label: 'مکان‌های گردشگری', value: places.length, icon: MapPin, color: 'text-orange-600' },
    { label: 'کاربران فعال', value: users.length, icon: Users, color: 'text-blue-600' },
    { label: 'شهرها', value: cities.length, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}
      {/* Hero Section */}
      <section className="relative rounded-xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/70 to-black/40" />
        <div className="relative z-10 py-16 px-8 text-white">
          <h1 className="text-4xl font-bold mb-4">به همسفر میرزا خوش آمدید</h1>
          <p className="text-lg text-white/90 max-w-xl mb-6">
            تجربیات سفر خود را به اشتراک بگذارید، مکان‌های جدید کشف کنید و همسفر پیدا کنید.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button asChild size="lg">
              <Link to="/app/posts/new">ثبت تجربه جدید</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/30 hover:bg-white/20">
              <Link to="/app/companions">پیدا کردن همسفر</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Recent Posts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">تجربه‌های اخیر</h2>
          <Button asChild variant="ghost">
            <Link to="/app/posts" className="flex items-center gap-2">
              مشاهده همه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {recentPosts.map(post => (
            <Card key={post.post_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={post.images?.[0] || fallbackPostImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <Badge
                  variant={post.experience_type === 'visited' ? 'default' : 'secondary'}
                  className="absolute top-3 right-3"
                >
                  {post.experience_type === 'visited' ? 'بازدید شده' : 'رویایی'}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.place?.name || post.city?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.user?.profile_image} />
                      <AvatarFallback>{post.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{post.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{post.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Active Companion Requests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">درخواست‌های همسفر فعال</h2>
          <Button asChild variant="ghost">
            <Link to="/app/companions" className="flex items-center gap-2">
              مشاهده همه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {activeRequests.map(request => (
            <Card key={request.request_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={request.user?.profile_image} />
                    <AvatarFallback>{request.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{request.user?.name}</CardTitle>
                    <CardDescription>@{request.user?.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{request.city?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(request.travel_date).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(request.conditions ?? []).slice(0, 2).map((condition, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-2">
                    <Link to={`/app/companions/${request.request_id}`}>
                      <Heart className="h-4 w-4 ml-2" />
                      درخواست همراهی
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Cities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">شهرهای محبوب</h2>
          <Button asChild variant="ghost">
            <Link to="/app/places" className="flex items-center gap-2">
              مشاهده همه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {featuredCities.map(city => (
            <Link
              key={city.city_id}
              to={`/app/places?city=${city.city_id}`}
              className="group relative rounded-xl overflow-hidden aspect-square"
            >
              <img
                src={city.image}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                <h3 className="font-bold text-lg">{city.name}</h3>
                <p className="text-sm text-white/80">{city.province}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
