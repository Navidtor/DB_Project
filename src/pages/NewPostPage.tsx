import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { getCities, getPlaces } from '@/lib/api';
import { createPost } from '@/lib/api-write';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { ExperienceType, City, Place } from '@/types/database';

export default function NewPostPage() {
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const { toast } = useToast();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [citiesData, placesData] = await Promise.all([
          getCities(),
          getPlaces(),
        ]);

        if (!isMounted) return;
        setCities(citiesData);
        setPlaces(placesData);
      } catch (error) {
        console.error('Error loading location data:', error);
        if (isMounted) setLoadError('Unable to load cities and places.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
    
    if (!dbUser) {
      toast({
        title: 'خطا',
        description: 'لطفاً وارد حساب کاربری شوید.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { post, error } = await createPost({
      user_id: dbUser.user_id,
      title,
      content,
      experience_type: experienceType,
      city_id: selectedCity || undefined,
      place_id: selectedPlace || undefined,
      images,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'خطا',
        description: 'ثبت تجربه با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تجربه ثبت شد!',
        description: 'تجربه شما با موفقیت ثبت شد و پس از تأیید مدیریت منتشر خواهد شد.',
      });
      navigate(`/app/posts/${post?.post_id}`);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link to="/app/posts" className="hover:text-primary">تجربه‌ها</Link>
        <span className="mx-2">/</span>
        <span>ثبت تجربه جدید</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ثبت تجربه جدید</CardTitle>
          <CardDescription>
            تجربه سفر خود را با دیگران به اشتراک بگذارید
          </CardDescription>
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
                  setSelectedPlace(''); // Reset place when city changes
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
              <p className="text-xs text-muted-foreground">
                حداقل ۵۰ کاراکتر بنویسید. تجربیات با جزئیات بیشتر مورد توجه بیشتر قرار می‌گیرند.
              </p>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <Label>تصاویر *</Label>
              
              {/* Add Image Input */}
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

              {/* Image Preview */}
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

              <p className="text-xs text-muted-foreground">
                حداقل یک تصویر اضافه کنید. می‌توانید از تصاویر Unsplash استفاده کنید.
              </p>

              {/* Sample Images */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">نمونه آدرس تصاویر:</p>
                <div className="space-y-1 text-xs font-mono">
                  <p className="cursor-pointer hover:text-primary" onClick={() => setNewImageUrl('https://images.unsplash.com/photo-1564668662856-d4c59c83b7b3?w=800&q=80')}>
                    https://images.unsplash.com/photo-1564668662856-d4c59c83b7b3?w=800&q=80
                  </p>
                  <p className="cursor-pointer hover:text-primary" onClick={() => setNewImageUrl('https://images.unsplash.com/photo-1573061218917-5a2b70f9b0c9?w=800&q=80')}>
                    https://images.unsplash.com/photo-1573061218917-5a2b70f9b0c9?w=800&q=80
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <Button asChild variant="outline">
                <Link to="/app/posts">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  انصراف
                </Link>
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    در حال ثبت...
                  </>
                ) : (
                  'ثبت تجربه'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
