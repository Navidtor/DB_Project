import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isMockMode } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (formData.username.length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد');
      return;
    }

    setLoading(true);

    // If in mock mode, simulate successful registration
    if (isMockMode) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      setSuccess(true);
      setLoading(false);
      redirectTimeoutRef.current = setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, {
      name: formData.name,
      username: formData.username,
      phone: formData.phone || undefined,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      redirectTimeoutRef.current = setTimeout(() => navigate('/login'), 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ثبت‌نام موفق!</h2>
              <p className="text-muted-foreground mb-4">
                {isMockMode ? (
                  <>
                    حساب نمایشی ایجاد شد.
                    <br />
                    برای ورود از دکمه «ورود نمایشی» استفاده کنید.
                  </>
                ) : (
                  <>
                    حساب کاربری شما با موفقیت ایجاد شد.
                    <br />
                    لطفاً ایمیل خود را برای تأیید حساب بررسی کنید.
                  </>
                )}
              </p>
              <Button asChild>
                <Link to="/login">ورود به حساب</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ثبت‌نام در همسفر میرزا</CardTitle>
          <CardDescription>
            یک حساب کاربری جدید ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMockMode && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                حالت نمایشی فعال است. ثبت‌نام شبیه‌سازی می‌شود.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام و نام خانوادگی *</Label>
              <Input
                id="name"
                name="name"
                placeholder="مثال: علی احمدی"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری *</Label>
              <Input
                id="username"
                name="username"
                placeholder="مثال: ali_ahmadi"
                value={formData.username}
                onChange={handleChange}
                required
                pattern="[a-zA-Z0-9_]+"
                title="فقط حروف انگلیسی، اعداد و آندرلاین"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">شماره تماس (اختیاری)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="09121234567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="حداقل ۶ کاراکتر"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تکرار رمز عبور *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="تکرار رمز عبور"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                <>
                  <UserPlus className="ml-2 h-4 w-4" />
                  ثبت‌نام
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟ </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
