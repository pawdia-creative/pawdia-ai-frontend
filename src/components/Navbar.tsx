import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from './NavLink';
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navItems = [
    // Remove Home and Create Art navigation items, keep only Logo and user actions
  ];

  return (
    <nav className="bg-gradient-to-b from-black/40 via-black/20 to-transparent sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center ml-2 sm:ml-3 lg:ml-4">
            <Link 
              to="/" 
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
            </Link>
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
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4 inline mr-2" />
                    Admin Console
                  </NavLink>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white" align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3"> 
   <Link 
     to="/login" 
     className="px-6 py-2 text-base font-semibold text-white hover:text-white transition-all bg-gradient-to-r from-secondary/80 to-accent/80 rounded-lg hover:from-secondary hover:to-accent shadow-lg hover:shadow-xl backdrop-blur-md" 
   > 
     Sign In 
   </Link> 
   <Link 
     to="/register" 
     className="px-6 py-2 text-base font-semibold text-white hover:text-white transition-all bg-gradient-to-r from-primary/80 to-accent/80 rounded-lg hover:from-primary hover:to-accent shadow-lg hover:shadow-xl backdrop-blur-md" 
   > 
     Sign Up 
   </Link> 
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
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 inline mr-2" />
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
                  <NavLink 
                    to="/login" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50" 
                    onClick={() => setIsMenuOpen(false)} 
                  > 
                    Sign In 
                  </NavLink> 
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