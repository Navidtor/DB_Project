import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>همسفر میرزا - پلتفرم اشتراک تجربیات سفر و یافتن همسفر</p>
        <p className="mt-1">© ۱۴۰۳ - تمامی حقوق محفوظ است</p>
      </footer>
    </div>
  );
}
