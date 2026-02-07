import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  MapPin, 
  Users, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Menu,
  Mountain,
  UserSearch,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { path: '/app', label: 'خانه', icon: Home },
  { path: '/app/posts', label: 'تجربه‌ها', icon: FileText },
  { path: '/app/places', label: 'مکان‌ها', icon: MapPin },
  { path: '/app/companions', label: 'همسفر', icon: Users },
  { path: '/app/users', label: 'کاربران', icon: UserSearch },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dbUser, signOut, isMockMode } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login');
    }
  };

  const currentUserId = dbUser?.user_id ?? 'user-1';
  const currentUserName = dbUser?.name ?? '...';
  const currentUserUsername = dbUser?.username ?? '...';
  const currentUserImage = dbUser?.profile_image;
  const currentUserInitial = dbUser?.name?.charAt(0) ?? '?';

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'flex flex-col gap-2' : 'hidden md:flex gap-1'}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
          (item.path !== '/app' && location.pathname.startsWith(item.path));
        
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              size={mobile ? 'default' : 'sm'}
              className={`gap-2 ${mobile ? 'w-full justify-start' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/app" className="flex items-center gap-2 font-bold text-xl">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">همسفر میرزا</span>
          {isMockMode && (
            <Badge variant="outline" className="text-xs ml-2 hidden sm:inline-flex">
              حالت نمایشی
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation */}
        <NavLinks />

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUserImage} alt={currentUserName} />
                  <AvatarFallback>{currentUserInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUserName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{currentUserUsername}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/app/profile/${currentUserId}`} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  پروفایل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  تنظیمات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
