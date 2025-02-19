import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Users, Heart, Box } from 'lucide-react';

const tabs = [
  { id: '/clinic', name: 'Clinics', icon: Users },
  { id: '/holter', name: 'Holter Lab', icon: Heart },
  { id: '/pod', name: 'Pod Inventory', icon: Box },
  { id: '/', name: 'Data Lab', icon: BarChart3 },
];

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabs.find(tab => location.pathname === tab.id)?.id ?? '/';

  return (
    <nav className="px-2 py-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.id)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg
            transition-all duration-200 group
            ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }
          `}
        >
          <tab.icon
            className={`
              h-5 w-5 transition-colors duration-200
              ${
                activeTab === tab.id
                  ? 'text-blue-400'
                  : 'text-gray-400 group-hover:text-gray-300'
              }
            `}
          />
          <span className="text-sm font-medium">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;
