import React from 'react';
import { Link, useLocation, useMatches } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

type BreadcrumbMapping = {
  [key: string]: {
    label: string;
    parent?: string;
  };
};

const routeLabels: BreadcrumbMapping = {
  '/': { label: 'Home' },
  '/clinic': { label: 'Clinics', parent: '/' },
  '/clinic/analytics': { label: 'Analytics', parent: '/clinic' },
  '/holter': { label: 'Holter Lab', parent: '/' },
  '/pod': { label: 'Pod Inventory', parent: '/' },
  '/datalab': { label: 'Data Lab', parent: '/' },
};

/**
 * A breadcrumb component that shows the navigation path based on the current route
 */
const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Parse path segments and build breadcrumb items
  const segments = React.useMemo(() => {
    const parts: { label: string; path: string }[] = [];
    
    // Add home
    parts.push({ label: 'Home', path: '/' });
    
    // Special handling for dynamic routes
    if (path.includes(':')) {
      // Handle dynamic segments
      const pathSegments = path.split('/').filter(Boolean);
      
      let currentPath = '';
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Check if this is a dynamic segment like :clinicId
        if (segment.startsWith(':')) {
          // Try to find an actual value from the URL
          const actualValue = location.pathname.split('/')[index + 1];
          parts.push({
            label: actualValue || segment.slice(1),
            path: currentPath.replace(segment, actualValue || segment),
          });
        } else {
          const label = routeLabels[currentPath]?.label || segment;
          parts.push({ label, path: currentPath });
        }
      });
    } else {
      // Handle static routes
      const pathParts = path.split('/').filter(Boolean);
      let currentPath = '';
      
      pathParts.forEach(part => {
        currentPath += `/${part}`;
        const label = routeLabels[currentPath]?.label || part;
        parts.push({ label, path: currentPath });
      });
    }
    
    // Remove duplicate Home if we're on home page
    if (parts.length > 1 && parts[0].path === '/') {
      parts.shift();
    }
    
    return parts;
  }, [path, location.pathname]);
  
  // If we're at the root path, don't show breadcrumbs
  if (path === '/') {
    return null;
  }
  
  return (
    <div className="flex items-center text-sm text-gray-400 mb-4">
      {segments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-2 text-gray-500" />
          )}
          {index === segments.length - 1 ? (
            <span className="text-white">{segment.label}</span>
          ) : (
            <Link 
              to={segment.path} 
              className="hover:text-white transition-colors"
            >
              {index === 0 ? (
                <Home className="h-4 w-4" />
              ) : (
                segment.label
              )}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs; 