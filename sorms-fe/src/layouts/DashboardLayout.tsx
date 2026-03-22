import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, DoorOpen, LogIn, FileText, Bell, BarChart3,
  UserCog, ChevronDown, ChevronRight, LogOut, Menu, Settings, User,
  Building2, ShieldCheck, X,
} from 'lucide-react';

interface NavItem {
  label: string;
  path?: string;
  icon: ReactNode;
  roles?: string[];
  children?: { label: string; path: string; roles?: string[] }[];
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Residents',
    icon: <Users size={20} />,
    roles: ['Admin', 'Staff'],
    children: [
      { label: 'Resident list', path: '/residents' },
      { label: 'Create resident', path: '/residents/create' },
    ],
  },
  {
    label: 'My profile',
    path: '/my-profile',
    icon: <User size={20} />,
    roles: ['Resident'],
  },
  {
    label: 'My invoices',
    path: '/resident/invoices',
    icon: <FileText size={20} />,
    roles: ['Resident'],
  },
  {
    label: 'Rooms',
    icon: <DoorOpen size={20} />,
    children: [
      { label: 'All rooms', path: '/rooms', roles: ['Admin', 'Staff'] },
      { label: 'Available rooms', path: '/rooms/available', roles: ['Admin', 'Staff', 'Resident'] },
      { label: 'Create room', path: '/rooms/create', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Check-in and out',
    icon: <LogIn size={20} />,
    children: [
      { label: 'Request check-in', path: '/checkin/request', roles: ['Resident'] },
      { label: 'My status', path: '/checkin/my-status', roles: ['Resident'] },
      { label: 'My history', path: '/checkin/my-history', roles: ['Resident'] },
      { label: 'Pending check-ins', path: '/checkin/pending', roles: ['Admin', 'Staff'] },
      { label: 'Pending check-outs', path: '/checkout/pending', roles: ['Admin', 'Staff'] },
      { label: 'All records', path: '/checkin/records', roles: ['Admin', 'Staff'] },
      { label: 'Room inspection', path: '/checkout/inspection', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Reservations',
    icon: <DoorOpen size={20} />,
    children: [
      { label: 'My reservations', path: '/reservations/my', roles: ['Resident'] },
      { label: 'All reservations', path: '/reservations', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Ratings',
    icon: <BarChart3 size={20} />,
    children: [
      { label: 'My ratings', path: '/ratings/my', roles: ['Resident'] },
      { label: 'All ratings', path: '/ratings', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Service requests',
    icon: <FileText size={20} />,
    children: [
      { label: 'Create request', path: '/service-requests/create', roles: ['Resident'] },
      { label: 'My requests', path: '/service-requests/my', roles: ['Resident'] },
      { label: 'All requests', path: '/service-requests', roles: ['Admin', 'Staff'] },
      { label: 'Pending requests', path: '/service-requests/pending', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Notifications',
    icon: <Bell size={20} />,
    children: [
      { label: 'My notifications', path: '/notifications/my', roles: ['Resident'] },
      { label: 'Staff notifications', path: '/notifications/staff', roles: ['Staff'] },
      { label: 'Broadcast', path: '/notifications/broadcast', roles: ['Admin'] },
      { label: 'Send individual', path: '/notifications/send', roles: ['Admin', 'Staff'] },
      { label: 'Sent history', path: '/notifications/history', roles: ['Admin', 'Staff'] },
    ],
  },
  {
    label: 'Reports',
    icon: <BarChart3 size={20} />,
    roles: ['Admin', 'Staff'],
    children: [
      { label: 'All reports', path: '/reports' },
      { label: 'Create report', path: '/reports/create', roles: ['Staff'] },
      { label: 'Pending reports', path: '/reports/pending', roles: ['Admin'] },
      { label: 'Occupancy', path: '/reports/occupancy' },
      { label: 'Service usage', path: '/reports/service-usage' },
      { label: 'Revenue', path: '/reports/revenue' },
    ],
  },
  {
    label: 'Staff',
    icon: <UserCog size={20} />,
    children: [
      { label: 'Staff list', path: '/staff', roles: ['Admin'] },
      { label: 'Create staff', path: '/staff/create', roles: ['Admin'] },
      { label: 'My profile', path: '/staff/me', roles: ['Staff'] },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const activeGroups = navItems
      .filter((item) => item.children?.some((child) => location.pathname.startsWith(child.path)))
      .map((item) => item.label);

    setExpandedItems((prev) => Array.from(new Set([...prev, ...activeGroups])));
  }, [location.pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filterByRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return user?.userRole ? roles.includes(user.userRole) : false;
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  };

  const showLabels = isMobile || sidebarOpen;
  const activeSection = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  const roleLabel = user?.userRole === 'Admin'
    ? 'Operations admin'
    : user?.userRole === 'Staff'
      ? 'Service coordinator'
      : 'Resident account';
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const renderSidebar = () => (
    <div className="dashboard-sidebar-inner">
      <div style={{ padding: '1.35rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="gradient-primary" style={{
            width: 48,
            height: 48,
            borderRadius: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 20px 34px -22px rgba(15, 118, 110, 0.7)',
          }}>
            <Building2 size={22} />
          </div>
          {showLabels && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>SORMS StayFlow</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Hospitality operations cockpit</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '1rem 1rem 0.35rem' }}>
        {showLabels && <span className="section-eyebrow">Navigation</span>}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.85rem 1rem' }}>
        {navItems.filter((item) => filterByRole(item.roles)).map((item) => {
          const visibleChildren = item.children?.filter((c) => filterByRole(c.roles));

          if (item.path) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
              </NavLink>
            );
          }

          if (visibleChildren && visibleChildren.length > 0) {
            const isExpanded = expandedItems.includes(item.label);
            const isChildActive = visibleChildren.some((c) => location.pathname.startsWith(c.path));

            return (
              <div key={item.label} style={{ marginBottom: '0.25rem' }}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`sidebar-link ${isChildActive ? 'active' : ''}`}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {item.icon}
                  {showLabels && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </>
                  )}
                </button>
                {showLabels && isExpanded && (
                  <div style={{ paddingLeft: '2.25rem' }}>
                    {visibleChildren.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      <div style={{ margin: '0 1rem 1rem', padding: '1rem', borderRadius: '1.4rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.36)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="gradient-secondary" style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          {showLabels && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{roleLabel}</div>
            </div>
          )}
        </div>
        {showLabels && (
          <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <ShieldCheck size={16} />
              <span>Operational access enabled</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout" style={{ color: 'var(--text-primary)' }}>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 16, 24, 0.5)',
            zIndex: 40,
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        className="dashboard-sidebar"
        style={{
          width: isMobile ? 'min(88vw, 320px)' : sidebarOpen ? 'var(--sidebar-width)' : '108px',
          transform: isMobile ? `translateX(${mobileOpen ? '0' : '-110%'})` : 'translateX(0)',
        }}
      >
        {renderSidebar()}
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleMenuToggle}>
              {isMobile && mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeSection}</div>
              <div className="topbar-meta" style={{ marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>Home</NavLink>
                {breadcrumbs.map((breadcrumb) => (
                  <span key={breadcrumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>/</span>
                    <NavLink to={breadcrumb.path} style={{ textDecoration: 'none' }}>{breadcrumb.label}</NavLink>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="btn btn-ghost btn-sm" style={{ cursor: 'default' }}>
              <ShieldCheck size={16} />
              <span>{currentDate}</span>
            </div>
            <div className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>
              <span>{roleLabel}</span>
            </div>
            <NavLink to="/settings/change-password" className="btn btn-ghost btn-sm">
              <Settings size={18} />
            </NavLink>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="content-shell">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
