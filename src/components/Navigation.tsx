import React from 'react';

interface NavigationTab {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavigationProps {
  tabs?: NavigationTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

function Navigation({ tabs = [], activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="px-2 py-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
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
