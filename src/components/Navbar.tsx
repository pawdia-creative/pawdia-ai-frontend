import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/useAuth';
import { tokenStorage } from '@/lib/tokenStorage';
import { NavLink } from './NavLink';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  // Sign In click: if user has a token, verify via /auth/me; if verified go home,
  // if not verified trigger resend and navigate to verify page. If no token, go to login.
  const handleSignInClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const apiBase = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
    const token = tokenStorage.getToken();
    if (token) {
      try {
        const meResp = await fetch(`${apiBase}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (meResp.ok) {
          const meData = await meResp.json();
          const meUser = meData.user || JSON.parse(localStorage.getItem('user') || 'null');
          const isVerified = meUser && (meUser.isVerified === true || meUser.is_verified === 1);
          if (isVerified) {
            navigate('/');
            return;
            } else {
            try {
              await fetch(`${apiBase}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: meUser?.email })
              });
            } catch (err) {
              if (import.meta.env.DEV) console.warn('Resend verification failed:', err);
            }
            // Route unverified users to the centralized verification-required page.
            navigate('/verify-required');
            return;
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error checking auth/me on Sign In click:', err);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
    }
  };


  return (
    <nav className="bg-gradient-to-b from-black/40 via-black/20 to-transparent sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center ml-2 sm:ml-3 lg:ml-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-blue-200 transition-colors drop-shadow-lg"
            >
              <img 
                src="/logo.png" 
                alt="Pawdia AI Logo" 
                className="h-20 w-auto"
              />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-extrabold">
                Pawdia AI
              </span>
            </button>
          </div>

          {/* Desktop Navigation - Remove navigation items, keep only Logo and user actions */}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Admin console entry - Only shown to admins */}
                {user?.isAdmin && (
                  <NavLink
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-blue-200 hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-block mr-2">🛡️</span>
                    Admin Console
                  </NavLink>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2">
                      <span className="inline-block">👤</span>
                      <span>{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white" align="end">
                    <DropdownMenuItem asChild>
                      <NavLink to="/profile" className="flex items-center space-x-2">
                        <span className="inline-block">👤</span>
                        <span>Profile</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/profile" className="flex items-center space-x-2">
                        <span className="inline-block">⚙️</span>
                        <span>Settings</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-red-600"
                    >
                      <span className="inline-block">🔓</span>
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
                <div className="flex items-center space-x-3"> 
                <button
                  onClick={handleSignInClick}
                  className="px-6 py-2 text-base font-semibold text-white hover:text-white transition-all bg-gradient-to-r from-secondary/80 to-accent/80 rounded-lg hover:from-secondary hover:to-accent shadow-lg hover:shadow-xl backdrop-blur-md"
                >
                  Sign In
                </button>
                <NavLink
                  to="/register"
                  className="px-6 py-2 text-base font-semibold text-white hover:text-white transition-all bg-gradient-to-r from-primary/80 to-accent/80 rounded-lg hover:from-primary hover:to-accent shadow-lg hover:shadow-xl backdrop-blur-md"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
              <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <span className="h-6 w-6">✖️</span> : <span className="h-6 w-6">≡</span>}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-md border-t border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Remove navigation items */}
              
              {isAuthenticated ? (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Signed in as {user?.name}
                  </div>
                  
                  {/* Admin console entry - Only shown to admins */}
                  {user?.isAdmin && (
                    <NavLink
                      to="/admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-blue-200 hover:bg-white/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="inline-block mr-2">🛡️</span>
                      Admin Console
                    </NavLink>
                  )}
                  
                  <NavLink
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <button
                    onClick={() => { setIsMenuOpen(false); handleSignInClick(); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Sign In
                  </button>
                  <NavLink 
                    to="/register" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50" 
                    onClick={() => setIsMenuOpen(false)} 
                  > 
                    Sign Up 
                  </NavLink> 
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;