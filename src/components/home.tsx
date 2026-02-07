import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mountain, 
  MapPin, 
  Users, 
  FileText, 
  Star,
  ArrowLeft,
  Database,
  Code2,
  Layers
} from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted" dir="rtl">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">همسفر میرزا</span>
          </div>
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link to="/eer-diagram">EER Diagram</Link>
            </Button>
            <Button asChild>
              <Link to="/app">ورود به برنامه</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4">فاز ۳ - پیاده‌سازی عملی</Badge>
          <h1 className="text-5xl font-bold mb-6">
            همسفر میرزا
            <span className="text-primary block mt-2">Hamsafar Mirza</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            پلتفرم اشتراک تجربیات سفر و یافتن همسفر
            <br />
            Travel Experience Sharing & Companion Finding Platform
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/app">
                ورود به برنامه
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/eer-diagram">
                مشاهده EER Diagram
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>تجربه‌های سفر</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                اشتراک‌گذاری تجربیات سفر با تصاویر، امتیازدهی و نظرات
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>مکان‌های گردشگری</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                کشف جاذبه‌های گردشگری شهرهای مختلف ایران
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>یافتن همسفر</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                پیدا کردن همسفر مناسب برای سفرهای آینده
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Star className="h-10 w-10 text-yellow-600 mb-2" />
              <CardTitle>امتیازدهی</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                رتبه‌بندی تجربه‌ها و کمک به دیگران
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Project Info */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">درباره پروژه</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>فاز ۱ - EER Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  طراحی مفهومی پایگاه داده با موجودیت‌ها، روابط و تخصص‌سازی
                </CardDescription>
                <Button asChild variant="outline" size="sm">
                  <Link to="/eer-diagram">مشاهده دیاگرام</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <Layers className="h-8 w-8 text-primary mb-2" />
                <CardTitle>فاز ۲ - طراحی منطقی</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  تبدیل به جداول رابطه‌ای، نرمال‌سازی تا 3NF
                </CardDescription>
                <Badge variant="secondary">مستندات موجود</Badge>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <Code2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>فاز ۳ - پیاده‌سازی</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  فرانت‌اند React + TypeScript با Tailwind CSS
                </CardDescription>
                <Button asChild size="sm">
                  <Link to="/app">ورود به برنامه</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">تکنولوژی‌های استفاده شده</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="text-base py-2 px-4">React 18</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">TypeScript</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">Tailwind CSS</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">Shadcn/UI</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">React Router</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">React Flow</Badge>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-muted-foreground">
        <p>پروژه درس پایگاه داده - فاز ۳: پیاده‌سازی عملی</p>
        <p className="mt-2">همسفر میرزا - Hamsafar Mirza</p>
      </footer>
    </div>
  );
}

export default Home;
