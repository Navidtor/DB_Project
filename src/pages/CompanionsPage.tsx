import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Search,
  Plus,
  Calendar,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import {
  getCities,
  getCompanionMatches,
  getCompanionRequests,
  getPlaces,
  getUsers,
} from '@/lib/api';
import {
  createCompanionRequest,
  createCompanionMatch,
  updateCompanionRequestStatus,
  updateCompanionMatchStatus,
} from '@/lib/api-write';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { City, CompanionMatch, CompanionRequest, Place, User } from '@/types/database';

export default function CompanionsPage() {
  const { dbUser } = useAuth();
  const { toast } = useToast();
  const currentUserId = dbUser?.user_id ?? 'user-1';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [matchMessages, setMatchMessages] = useState<Record<string, string>>({});
  const [companionRequests, setCompanionRequests] = useState<CompanionRequest[]>([]);
  const [companionMatches, setCompanionMatches] = useState<CompanionMatch[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // New request form state
  const [newRequestCity, setNewRequestCity] = useState('');
  const [newRequestDate, setNewRequestDate] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [newRequestConditions, setNewRequestConditions] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const usersById = useMemo(() => new Map(users.map((user) => [user.user_id, user])), [users]);
  const placesById = useMemo(() => new Map(places.map((place) => [place.place_id, place])), [places]);
  const citiesById = useMemo(() => new Map(cities.map((city) => [city.city_id, city])), [cities]);
  const matchesByRequestId = useMemo(() => {
    const grouped: Record<string, CompanionMatch[]> = {};
    companionMatches.forEach((match) => {
      if (!grouped[match.request_id]) grouped[match.request_id] = [];
      grouped[match.request_id].push(match);
    });
    return grouped;
  }, [companionMatches]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [requestsData, matchesData, citiesData, placesData, usersData] = await Promise.all([
          getCompanionRequests(),
          getCompanionMatches(),
          getCities(),
          getPlaces(),
          getUsers(),
        ]);

        if (!isMounted) return;
        setCompanionRequests(requestsData);
        setCompanionMatches(matchesData);
        setCities(citiesData);
        setPlaces(placesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading companions data:', error);
        if (isMounted) setLoadError('Unable to load companion requests.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Enrich requests with related data
  const enrichedRequests = useMemo(() => (
    companionRequests.map(request => ({
      ...request,
      user: usersById.get(request.user_id),
      place: request.destination_place_id ? placesById.get(request.destination_place_id) : undefined,
      city: request.destination_city_id ? citiesById.get(request.destination_city_id) : undefined,
      matches: (matchesByRequestId[request.request_id] ?? []).map(match => ({
        ...match,
        companion_user: usersById.get(match.companion_user_id),
      })),
    }))
  ), [companionRequests, usersById, placesById, citiesById, matchesByRequestId]);

  // Filter requests
  const filteredRequests = enrichedRequests.filter(request => {
    const trimmedQuery = searchQuery.trim();
    const matchesSearch = !trimmedQuery ||
                          request.description?.includes(trimmedQuery) ||
                          request.user?.name?.includes(trimmedQuery) ||
                          request.city?.name?.includes(trimmedQuery);
    const matchesCity = selectedCity === 'all' || request.destination_city_id === selectedCity;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  // My requests (where current user is the requester)
  const myRequests = enrichedRequests.filter(r => r.user_id === currentUserId);

  // My matches (where current user sent a match request)
  const myMatches = companionMatches
    .filter(m => m.companion_user_id === currentUserId)
    .map(match => {
      const request = enrichedRequests.find(r => r.request_id === match.request_id);
      return { ...match, request };
    });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><Clock className="h-3 w-3 ml-1" />فعال</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 ml-1" />تکمیل شده</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />لغو شده</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 ml-1" />در انتظار</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />پذیرفته شده</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />رد شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestCity || !newRequestDate || !newRequestDescription) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای ضروری را پر کنید.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingRequest(true);

    const conditions = newRequestConditions
      .split('،')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const { request, error } = await createCompanionRequest({
      user_id: currentUserId,
      destination_city_id: newRequestCity,
      travel_date: newRequestDate,
      description: newRequestDescription,
      conditions,
    });

    setIsSubmittingRequest(false);

    if (error) {
      toast({
        title: 'خطا',
        description: 'ایجاد درخواست با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else if (request) {
      setCompanionRequests([request, ...companionRequests]);
      setNewRequestCity('');
      setNewRequestDate('');
      setNewRequestDescription('');
      setNewRequestConditions('');
      setIsDialogOpen(false);
      toast({
        title: 'موفقیت',
        description: 'درخواست همسفر با موفقیت ایجاد شد.',
      });
    }
  };

  const handleSendMatchRequest = async (requestId: string) => {
    const message = matchMessages[requestId]?.trim();
    if (!message) {
      toast({
        title: 'خطا',
        description: 'لطفاً پیامی بنویسید.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingMatch(prev => ({ ...prev, [requestId]: true }));

    const { match, error } = await createCompanionMatch({
      request_id: requestId,
      companion_user_id: currentUserId,
      message,
    });

    setIsSubmittingMatch(prev => ({ ...prev, [requestId]: false }));

    if (error) {
      toast({
        title: 'خطا',
        description: 'ارسال درخواست همراهی با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else if (match) {
      setCompanionMatches([...companionMatches, match]);
      setMatchMessages(prev => ({ ...prev, [requestId]: '' }));
      toast({
        title: 'موفقیت',
        description: 'درخواست همراهی شما ارسال شد.',
      });
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    const { error } = await updateCompanionMatchStatus(matchId, 'accepted');

    if (error) {
      toast({
        title: 'خطا',
        description: 'پذیرش درخواست با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else {
      setCompanionMatches(companionMatches.map(m =>
        m.match_id === matchId ? { ...m, status: 'accepted' } : m
      ));
      toast({
        title: 'موفقیت',
        description: 'درخواست همراهی پذیرفته شد.',
      });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    const { error } = await updateCompanionMatchStatus(matchId, 'rejected');

    if (error) {
      toast({
        title: 'خطا',
        description: 'رد درخواست با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else {
      setCompanionMatches(companionMatches.map(m =>
        m.match_id === matchId ? { ...m, status: 'rejected' } : m
      ));
      toast({
        title: 'موفقیت',
        description: 'درخواست همراهی رد شد.',
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const { error } = await updateCompanionRequestStatus(requestId, 'cancelled');

    if (error) {
      toast({
        title: 'خطا',
        description: 'لغو درخواست با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else {
      setCompanionRequests(companionRequests.map(r =>
        r.request_id === requestId ? { ...r, status: 'cancelled' } : r
      ));
      toast({
        title: 'موفقیت',
        description: 'درخواست لغو شد.',
      });
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
      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">همسفر</h1>
          <p className="text-muted-foreground">همسفر برای سفرهای خود پیدا کنید</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              ایجاد درخواست همسفر
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>درخواست جدید همسفر</DialogTitle>
              <DialogDescription>
                مشخصات سفر خود را وارد کنید تا همسفر مناسب پیدا کنید
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>مقصد (شهر) *</Label>
                <Select value={newRequestCity} onValueChange={setNewRequestCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="شهر مقصد را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.city_id} value={city.city_id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>تاریخ سفر *</Label>
                <Input 
                  type="date" 
                  value={newRequestDate}
                  onChange={(e) => setNewRequestDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>توضیحات *</Label>
                <Textarea 
                  placeholder="درباره برنامه سفر و انتظارات خود بنویسید..."
                  rows={4}
                  value={newRequestDescription}
                  onChange={(e) => setNewRequestDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>شرایط (با ویرگول جدا کنید)</Label>
                <Input 
                  placeholder="مثال: غیرسیگاری، سحرخیز، علاقه‌مند به عکاسی"
                  value={newRequestConditions}
                  onChange={(e) => setNewRequestConditions(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">انصراف</Button>
              </DialogClose>
              <Button 
                onClick={handleCreateRequest}
                disabled={isSubmittingRequest || !newRequestCity || !newRequestDate || !newRequestDescription}
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    در حال ثبت...
                  </>
                ) : (
                  'ثبت درخواست'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">جستجوی همسفر</TabsTrigger>
          <TabsTrigger value="my-requests">درخواست‌های من ({myRequests.length})</TabsTrigger>
          <TabsTrigger value="my-matches">همراهی‌های من ({myMatches.length})</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="شهر مقصد" />
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map(request => (
              <Card key={request.request_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/app/profile/${request.user_id}`} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.user?.profile_image} />
                        <AvatarFallback>{request.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{request.user?.name}</CardTitle>
                        <CardDescription>@{request.user?.username}</CardDescription>
                      </div>
                    </Link>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.place?.name || request.city?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(request.travel_date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {request.description}
                    </p>
                    
                    {/* Conditions */}
                    <div className="flex flex-wrap gap-1">
                      {(request.conditions ?? []).map((condition, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>

                    {/* Matches count */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {request.matches.length} درخواست همراهی
                      </span>
                    </div>

                    {/* Action Button */}
                    {request.status === 'active' && request.user_id !== currentUserId && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Heart className="h-4 w-4 ml-2" />
                            درخواست همراهی
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>درخواست همراهی</DialogTitle>
                            <DialogDescription>
                              پیامی برای {request.user?.name} بنویسید
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea 
                              placeholder="معرفی خود و دلیل علاقه به این سفر..."
                              rows={4}
                              value={matchMessages[request.request_id] ?? ''}
                              onChange={(e) =>
                                setMatchMessages((prev) => ({
                                  ...prev,
                                  [request.request_id]: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">انصراف</Button>
                            </DialogClose>
                            <Button 
                              onClick={() => handleSendMatchRequest(request.request_id)}
                              disabled={isSubmittingMatch[request.request_id] || !matchMessages[request.request_id]?.trim()}
                            >
                              {isSubmittingMatch[request.request_id] ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                  در حال ارسال...
                                </>
                              ) : (
                                'ارسال درخواست'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <Card className="py-12 text-center">
              <CardContent>
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">هیچ درخواستی یافت نشد</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-4">
          {myRequests.map(request => (
            <Card key={request.request_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {request.place?.name || request.city?.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(request.travel_date)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleCancelRequest(request.request_id)}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        لغو
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                
                {/* Matches */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    درخواست‌های همراهی ({request.matches.length})
                  </h4>
                  <div className="space-y-3">
                    {request.matches.map(match => (
                      <div key={match.match_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Link to={`/app/profile/${match.companion_user_id}`}>
                            <Avatar>
                              <AvatarImage src={match.companion_user?.profile_image} />
                              <AvatarFallback>{match.companion_user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div>
                            <Link to={`/app/profile/${match.companion_user_id}`} className="font-medium hover:text-primary">
                              {match.companion_user?.name}
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-1">{match.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(match.status)}
                          {match.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600"
                                onClick={() => handleAcceptMatch(match.match_id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive"
                                onClick={() => handleRejectMatch(match.match_id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {request.matches.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        هنوز کسی درخواست همراهی نداده است
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {myRequests.length === 0 && (
            <Card className="py-12 text-center">
              <CardContent>
                <p className="text-muted-foreground mb-4">شما هنوز درخواستی ثبت نکرده‌اید</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  ایجاد درخواست همسفر
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Matches Tab */}
        <TabsContent value="my-matches" className="space-y-4">
          {myMatches.map(match => (
            <Card key={match.match_id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link to={`/app/profile/${match.request?.user_id}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.request?.user?.profile_image} />
                        <AvatarFallback>{match.request?.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link to={`/app/profile/${match.request?.user_id}`} className="font-medium hover:text-primary">
                        {match.request?.user?.name}
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {match.request?.city?.name}
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        {match.request?.travel_date ? formatDate(match.request.travel_date) : '-'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">پیام شما:</p>
                  <p className="text-sm">{match.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {myMatches.length === 0 && (
            <Card className="py-12 text-center">
              <CardContent>
                <p className="text-muted-foreground">شما هنوز درخواست همراهی نداده‌اید</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
