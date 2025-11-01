import { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header = () => {
  const { isMenuOpen, setIsMenuOpen } = useApp();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const hoverTimer = useRef(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileTimer = useRef(null);

  const navLinks = [
    { name: 'Home', to: '/' },
    { 
      name: 'Rides', 
      href: '#rides',
      dropdown: ['Find a ride', 'Offer a ride']
    },
    { name: 'Blogs', to: '/blogs' },
    { name: 'About Us', to: '/about' },
    { name: 'Contact', to: '/contact' },
  ];
  
  // Only add Admin link if user is admin
  const links = user?.role === 'admin' 
    ? [...navLinks, { name: 'Admin', to: '/admin' }]
    : navLinks;
  const [mobileDropdown, setMobileDropdown] = useState(null);

  return (
  <header className="fixed top-0 left-0 right-0 z-9998 bg-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-blue-700">MARK</span>
              <span className="text-orange-500">☀</span>
              <span className="text-blue-700">UB</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {links.map((link) => (
              <div 
                key={link.name} 
                className="relative"
                onMouseEnter={() => {
                  if (!link.dropdown) return;
                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                  setActiveDropdown(link.name);
                }}
                onMouseLeave={() => {
                  if (!link.dropdown) return;
                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                  hoverTimer.current = setTimeout(() => setActiveDropdown(null), 150);
                }}
              >
                {link.to ? (
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `font-medium transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}`
                    }
                  >
                    {link.name}
                  </NavLink>
                ) : (
                  <a
                    href={link.href}
                    className="text-gray-700 hover:text-blue-700 font-medium transition-colors"
                  >
                    {link.name}
                  </a>
                )}
                {/* Hover buffer to avoid flicker between trigger and dropdown */}
                {link.dropdown && activeDropdown === link.name && (
                  <>
                    <div className="absolute top-full left-0 h-2 w-full"></div>
                    <div
                      className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg py-2 min-w-[200px] z-40"
                      onMouseEnter={() => {
                        if (hoverTimer.current) clearTimeout(hoverTimer.current);
                        setActiveDropdown(link.name);
                      }}
                      onMouseLeave={() => {
                        if (hoverTimer.current) clearTimeout(hoverTimer.current);
                        hoverTimer.current = setTimeout(() => setActiveDropdown(null), 150);
                      }}
                    >
                    {link.dropdown.map((item) => (
                      <Link
                        key={item}
                        to={item === 'Offer a ride' ? '/offer-ride' : item === 'Find a ride' ? '/find-ride' : '#'}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {item}
                      </Link>
                    ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <div 
                className="relative"
                onMouseEnter={() => {
                  if (profileTimer.current) clearTimeout(profileTimer.current);
                  setProfileDropdown(true);
                }}
                onMouseLeave={() => {
                  if (profileTimer.current) clearTimeout(profileTimer.current);
                  profileTimer.current = setTimeout(() => setProfileDropdown(false), 150);
                }}
              >
                <button className="flex items-center space-x-3 text-gray-700 hover:text-blue-700 font-medium transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.full_name || user?.name || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {profileDropdown && (
                  <>
                    <div className="absolute top-full left-0 h-2 w-full"></div>
                    <div
                      className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg py-2 min-w-[200px] z-40"
                      onMouseEnter={() => {
                        if (profileTimer.current) clearTimeout(profileTimer.current);
                        setProfileDropdown(true);
                      }}
                      onMouseLeave={() => {
                        if (profileTimer.current) clearTimeout(profileTimer.current);
                        profileTimer.current = setTimeout(() => setProfileDropdown(false), 150);
                      }}
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || ''}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/my-rides"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        My Rides
                      </Link>
                      <button
                        onClick={() => { logout(); navigate('/'); setProfileDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-blue-700 hover:text-blue-800 font-medium">
                  Login
                </Link>
                <Link to="/signin" className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4">
              {links.map((link) => (
                link.dropdown ? (
                  <div key={link.name} className="">
                    <button
                      type="button"
                      onClick={() => setMobileDropdown(mobileDropdown === link.name ? null : link.name)}
                      className="w-full flex items-center justify-between text-gray-700 hover:text-blue-700 font-medium"
                    >
                      <span>{link.name}</span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${mobileDropdown === link.name ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileDropdown === link.name && (
                      <div className="mt-2 ml-4 border-l pl-4 space-y-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item}
                            to={item === 'Offer a ride' ? '/offer-ride' : item === 'Find a ride' ? '/find-ride' : '#'}
                            className="block py-1.5 text-gray-700 hover:text-blue-700"
                            onClick={() => { setIsMenuOpen(false); setMobileDropdown(null); }}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : link.to ? (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) => `font-medium ${isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-gray-700 hover:text-blue-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              ))}
              {isAuthenticated ? (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                      {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                  <Link 
                    to="/profile" 
                    className="block py-2 text-gray-700 hover:text-blue-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/my-rides" 
                    className="block py-2 text-gray-700 hover:text-blue-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Rides
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); navigate('/'); }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors text-left mt-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-blue-700 hover:text-blue-800 font-medium text-left" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signin" className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors text-left" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
