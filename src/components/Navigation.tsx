import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Users, Heart, Box, Activity, Home } from 'lucide-react';

// Navigation configuration with structured routes
const navConfig = [
  { 
    id: 'home', 
    path: '/', 
    name: 'Home', 
    icon: Home,
    isActive: (path: string) => path === '/',
  },
  { 
    id: 'clinic', 
    path: '/clinic', 
    name: 'Clinics', 
    icon: Users,
    isActive: (path: string) => path.startsWith('/clinic') && path !== '/clinic/analytics',
  },
  { 
    id: 'clinic-analytics', 
    path: '/clinic/analytics', 
    name: 'Analytics', 
    icon: BarChart3,
    isActive: (path: string) => path === '/clinic/analytics',
  },
  { 
    id: 'holter', 
    path: '/holter', 
    name: 'Holter Lab', 
    icon: Heart,
    isActive: (path: string) => path.startsWith('/holter'),
  },
  { 
    id: 'pod', 
    path: '/pod', 
    name: 'Pod Inventory', 
    icon: Box,
    isActive: (path: string) => path.startsWith('/pod'),
  },
  { 
    id: 'data', 
    path: '/datalab', 
    name: 'Data Lab', 
    icon: Activity,
    isActive: (path: string) => path.startsWith('/datalab'),
  },
];

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  return (
    <nav className="px-2 py-4 flex flex-col min-w-[200px]">
      <div className="mb-6 px-4">
        <h1 className="text-lg font-bold text-white">ECG Lab</h1>
        <p className="text-xs text-gray-400">Cardiology Monitoring</p>
      </div>
      
      {navConfig.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg
            transition-all duration-200 group
            ${
              item.isActive(currentPath)
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }
          `}
        >
          <item.icon
            className={`
              h-5 w-5 transition-colors duration-200
              ${
                item.isActive(currentPath)
                  ? 'text-blue-400'
                  : 'text-gray-400 group-hover:text-gray-300'
              }
            `}
          />
          <span className="text-sm font-medium">{item.name}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;
