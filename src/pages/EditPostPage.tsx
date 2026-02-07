import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ImagePlus,
  X,
  MapPin,
  Sparkles,
  Eye,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getCities, getPlaces, getPostById } from '@/lib/api';
import { updatePost, deletePost } from '@/lib/api-write';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { ExperienceType, City, Place, Post } from '@/types/database';

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const { toast } = useToast();
  
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [experienceType, setExperienceType] = useState<ExperienceType>('visited');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!postId) {
          setLoadError('Post ID is required');
          return;
        }

        const [postData, citiesData, placesData] = await Promise.all([
          getPostById(postId),
          getCities(),
          getPlaces(),
        ]);

        if (!isMounted) return;

        if (!postData) {
          setLoadError('Post not found');
          return;
        }

        // Check if current user is the owner
        if (postData.user_id !== dbUser?.user_id) {
          setLoadError('You can only edit your own posts');
          return;
        }

        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content);
        setExperienceType(postData.experience_type);
        setSelectedCity(postData.city_id || '');
        setSelectedPlace(postData.place_id || '');
        setImages(postData.images || []);
        setCities(citiesData);
        setPlaces(placesData);
      } catch (error) {
        console.error('Error loading post data:', error);
        if (isMounted) setLoadError('Unable to load post.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [postId, dbUser?.user_id]);

  // Filter places by selected city
  const filteredPlaces = selectedCity 
    ? places.filter(p => p.city_id === selectedCity)
    : [];

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    setIsSaving(true);

    const { error } = await updatePost(postId, {
      title,
      content,
      experience_type: experienceType,
      city_id: selectedCity || undefined,
      place_id: selectedPlace || undefined,
      images,
    });

    setIsSaving(false);

    if (error) {
      toast({
        title: 'خطا',
        description: 'ویرایش تجربه با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'موفقیت',
        description: 'تجربه با موفقیت ویرایش شد.',
      });
      navigate(`/app/posts/${postId}`);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;

    setIsDeleting(true);

    const { error } = await deletePost(postId);

    setIsDeleting(false);

    if (error) {
      toast({
        title: 'خطا',
        description: 'حذف تجربه با خطا مواجه شد.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'موفقیت',
        description: 'تجربه با موفقیت حذف شد.',
      });
      navigate('/app/posts');
    }
  };

  const isFormValid = title && content && selectedCity && images.length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{loadError}</p>
        <Button asChild>
          <Link to="/app/posts">بازگشت به لیست تجربه‌ها</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link to="/app/posts" className="hover:text-primary">تجربه‌ها</Link>
        <span className="mx-2">/</span>
        <Link to={`/app/posts/${postId}`} className="hover:text-primary">{post?.title}</Link>
        <span className="mx-2">/</span>
        <span>ویرایش</span>
      </nav>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">ویرایش تجربه</CardTitle>
              <CardDescription>
                تجربه خود را ویرایش کنید
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عملیات قابل بازگشت نیست. تجربه شما به طور دائم حذف خواهد شد.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        در حال حذف...
                      </>
                    ) : (
                      'حذف'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Experience Type */}
            <div className="space-y-3">
              <Label>نوع تجربه</Label>
              <RadioGroup 
                value={experienceType} 
                onValueChange={(v) => setExperienceType(v as ExperienceType)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem 
                    value="visited" 
                    id="visited"
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor="visited"
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <Eye className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">بازدید شده</p>
                      <p className="text-xs text-muted-foreground">این مکان را دیده‌ام</p>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem 
                    value="imagined" 
                    id="imagined"
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor="imagined"
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">رویایی</p>
                      <p className="text-xs text-muted-foreground">آرزو دارم ببینم</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان تجربه *</Label>
              <Input
                id="title"
                placeholder="مثال: یک روز فوق‌العاده در اصفهان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>شهر *</Label>
                <Select value={selectedCity} onValueChange={(v) => {
                  setSelectedCity(v);
                  setSelectedPlace('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.city_id} value={city.city_id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {city.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مکان (اختیاری)</Label>
                <Select 
                  value={selectedPlace} 
                  onValueChange={setSelectedPlace}
                  disabled={!selectedCity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCity ? "انتخاب مکان" : "ابتدا شهر را انتخاب کنید"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlaces.map(place => (
                      <SelectItem key={place.place_id} value={place.place_id}>
                        {place.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">شرح تجربه *</Label>
              <Textarea
                id="content"
                placeholder="تجربه خود را با جزئیات بنویسید..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
              />
            </div>

            {/* Images */}
            <div className="space-y-3">
              <Label>تصاویر *</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="آدرس URL تصویر را وارد کنید"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addImage} disabled={!newImageUrl}>
                  <ImagePlus className="h-4 w-4 ml-2" />
                  افزودن
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`تصویر ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <Button asChild variant="outline">
                <Link to={`/app/posts/${postId}`}>
                  <ArrowRight className="h-4 w-4 ml-2" />
                  انصراف
                </Link>
              </Button>
              <Button type="submit" disabled={!isFormValid || isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
