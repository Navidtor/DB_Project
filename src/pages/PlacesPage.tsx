import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Search,
  Map as MapIcon,
  ExternalLink,
  Building2,
  ImageIcon,
} from 'lucide-react';
import { getCities, getPlaces, getPosts } from '@/lib/api';
import type { City, Place, Post } from '@/types/database';

export default function PlacesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [placesData, citiesData, postsData] = await Promise.all([
          getPlaces(),
          getCities(),
          getPosts(),
        ]);

        if (!isMounted) return;
        setPlaces(placesData);
        setCities(citiesData);
        setPosts(postsData);
      } catch (error) {
        console.error('Error loading places data:', error);
        if (isMounted) setLoadError('Unable to load places.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const citiesById = useMemo(() => new Map(cities.map((city) => [city.city_id, city])), [cities]);
  const postCountsByPlace = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      if (!post.place_id) return;
      counts[post.place_id] = (counts[post.place_id] ?? 0) + 1;
    });
    return counts;
  }, [posts]);

  // Enrich places with city data and post count
  const enrichedPlaces = useMemo(() => (
    places.map(place => ({
      ...place,
      city: citiesById.get(place.city_id),
      postCount: postCountsByPlace[place.place_id] ?? 0,
    }))
  ), [places, citiesById, postCountsByPlace]);

  // Filter places
  const filteredPlaces = enrichedPlaces.filter(place => {
    const trimmedQuery = searchQuery.trim();
    const matchesSearch = !trimmedQuery ||
                          place.name.includes(trimmedQuery) || 
                          place.description?.includes(trimmedQuery) ||
                          place.city?.name?.includes(trimmedQuery);
    const matchesCity = selectedCity === 'all' || place.city_id === selectedCity;
    
    return matchesSearch && matchesCity;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading places...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">مکان‌های گردشگری</h1>
          <p className="text-muted-foreground">جاذبه‌های گردشگری ایران را کشف کنید</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در مکان‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب شهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه شهرها</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city.city_id} value={city.city_id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cities Overview */}
      <section>
        <h2 className="text-xl font-bold mb-4">شهرها</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cities.map(city => {
            const cityPlacesCount = places.filter(p => p.city_id === city.city_id).length;
            return (
              <Card 
                key={city.city_id} 
                className={`cursor-pointer hover:shadow-md transition-all ${
                  selectedCity === city.city_id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCity(selectedCity === city.city_id ? 'all' : city.city_id)}
              >
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-bold">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">{city.province}</p>
                  <Badge variant="secondary" className="mt-2">
                    {cityPlacesCount} مکان
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Places Grid */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          مکان‌ها {selectedCity !== 'all' && `در ${citiesById.get(selectedCity)?.name}`}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map(place => (
            <Card key={place.place_id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={place.images?.[0] || 'https://images.unsplash.com/photo-1564668662856-d4c59c83b7b3?w=800&q=80'} 
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  {(place.images?.length ?? 0) > 1 && (
                    <Badge variant="outline" className="bg-black/50 text-white border-0">
                      <ImageIcon className="h-3 w-3 ml-1" />
                      {place.images.length}
                    </Badge>
                  )}
                </div>
                <Badge className="absolute bottom-3 right-3">
                  {place.city?.name}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{place.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {place.city?.province}، {place.city?.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {place.description}
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(place.features ?? []).slice(0, 3).map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {(place.features?.length ?? 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{place.features.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {place.postCount} تجربه
                  </Badge>
                  <div className="flex gap-2">
                    {place.map_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={place.map_url} target="_blank" rel="noopener noreferrer">
                          <MapIcon className="h-4 w-4 ml-1" />
                          نقشه
                        </a>
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link to={`/app/posts?place=${place.place_id}`}>
                        <ExternalLink className="h-4 w-4 ml-1" />
                        تجربه‌ها
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Empty State */}
      {filteredPlaces.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هیچ مکانی یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
