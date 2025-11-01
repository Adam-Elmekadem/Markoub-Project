import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Users, Car, MessageSquareText, Gauge, FileText } from 'lucide-react';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: Gauge },
    { path: '/admin/blogs', label: 'Blogs', icon: FileText },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/rides', label: 'Rides', icon: Car },
    { path: '/admin/comments', label: 'Comments', icon: MessageSquareText },
  ];

  const currentIndex = navItems.findIndex((n) => n.path === pathname || (n.path !== '/admin' && pathname.startsWith(n.path)));

  return (
  <div className="min-h-screen bg-gray-50 pt-20 pb-24 overflow-x-hidden">
      {/* Mobile top nav for quick prev/next between admin pages */}
      <div className="fixed bottom-4 left-0 right-0 z-50 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        {/* full-bleed wrapper so the scroll area can use the entire viewport width on mobile */}
        <div className="px-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            <div className="flex gap-3 overflow-x-auto no-scrollbar touch-scroll py-2 px-1 w-full">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === currentIndex;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
                      active
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 hidden md:block">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Admin Panel</h2>
              <nav className="space-y-2">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Gauge className="w-5 h-5" />
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/blogs"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <FileText className="w-5 h-5" />
                  Blogs
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Users className="w-5 h-5" />
                  Users
                </NavLink>
                <NavLink
                  to="/admin/rides"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Car className="w-5 h-5" />
                  Rides
                </NavLink>
                <NavLink
                  to="/admin/comments"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <MessageSquareText className="w-5 h-5" />
                  Comments
                </NavLink>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
