import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Heart, 
  Package, 
  Database,
  ArrowRight
} from 'lucide-react';

type DashboardCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  color: string;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  description, 
  icon, 
  linkTo,
  color 
}) => {
  return (
    <Link 
      to={linkTo}
      className={`block p-6 rounded-xl border ${color} hover:shadow-lg transition-all duration-200 h-full`}
    >
      <div className="flex items-start mb-4">
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
        View {title} <ArrowRight className="ml-1 h-4 w-4" />
      </div>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const dashboardItems = [
    {
      title: 'Clinics',
      description: 'Manage clinic information, view analytics, and track study management',
      icon: <Building2 className="h-6 w-6 text-blue-400" />,
      linkTo: '/clinic',
      color: 'border-blue-500/20'
    },
    {
      title: 'Holter Lab',
      description: 'View and analyze Holter studies, access ECG data, and review patient recordings',
      icon: <Heart className="h-6 w-6 text-red-400" />,
      linkTo: '/holter',
      color: 'border-red-500/20'
    },
    {
      title: 'Pod Inventory',
      description: 'Track pod devices, monitor battery levels, and manage assignments',
      icon: <Package className="h-6 w-6 text-amber-400" />,
      linkTo: '/pod',
      color: 'border-amber-500/20'
    },
    {
      title: 'Data Lab',
      description: 'Explore and export study data, apply filters, and perform advanced analysis',
      icon: <Database className="h-6 w-6 text-emerald-400" />,
      linkTo: '/datalab',
      color: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to ECG Lab</h1>
        <p className="text-gray-400">
          Select a module below to get started with your workflow
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 