import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isMockMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/app');
    }
  };

  // Demo login for mock mode
  const handleDemoLogin = async () => {
    setLoading(true);
    await signIn('ali@example.com', 'demo123');
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ورود به همسفر میرزا</CardTitle>
          <CardDescription>
            وارد حساب کاربری خود شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMockMode && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                حالت نمایشی فعال است. برای ورود از دکمه «ورود نمایشی» استفاده کنید.
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
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isMockMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isMockMode}
              />
            </div>

            {!isMockMode && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>
                    <LogIn className="ml-2 h-4 w-4" />
                    ورود
                  </>
                )}
              </Button>
            )}

            {isMockMode && (
              <Button
                type="button"
                className="w-full"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>
                    <LogIn className="ml-2 h-4 w-4" />
                    ورود نمایشی
                  </>
                )}
              </Button>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">حساب کاربری ندارید؟ </span>
            <Link to="/register" className="text-primary hover:underline font-medium">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
