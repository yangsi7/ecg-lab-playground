import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { supabase } from '@/types/supabase';
import { toast } from 'sonner';

interface SavedFilterItem {
  id: string;
  name: string;
  filter_expression: string;
  created_at: string;
}

interface SavedFiltersProps {
  currentExpression: string;
  onSelectFilter: (expression: string) => void;
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({ 
  currentExpression, 
  onSelectFilter 
}) => {
  const [filters, setFilters] = useState<SavedFilterItem[]>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_filters');
      
      if (error) {
        console.error('Error loading saved filters:', error);
        toast.error('Failed to load saved filters.');
      } else {
        setFilters(data || []);
      }
    } catch (err) {
      console.error('Error loading filters:', err);
      toast.error('Failed to load saved filters.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFilter = async () => {
    if (!newFilterName.trim()) {
      toast.error('Please enter a name for your filter.');
      return;
    }

    if (!currentExpression.trim()) {
      toast.error('Current filter expression is empty.');
      return;
    }

    if (!userId) {
      toast.error('User authentication required.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('saved_filters')
        .insert({
          name: newFilterName,
          filter_expression: currentExpression,
          user_id: userId
        });

      if (error) {
        console.error('Error saving filter:', error);
        toast.error('Failed to save filter.');
      } else {
        toast.success('Filter saved successfully.');
        setNewFilterName('');
        loadFilters();
      }
    } catch (err) {
      console.error('Error saving filter:', err);
      toast.error('Failed to save filter.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFilter = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting filter:', error);
        toast.error('Failed to delete filter.');
      } else {
        toast.success('Filter deleted successfully.');
        loadFilters();
      }
    } catch (err) {
      console.error('Error deleting filter:', err);
      toast.error('Failed to delete filter.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
      <h3 className="text-sm font-medium mb-2">Saved Filters</h3>
      
      {/* Filter List */}
      <div className="mb-3 max-h-40 overflow-y-auto">
        {filters.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No saved filters</p>
        ) : (
          <ul className="space-y-1">
            {filters.map((filter) => (
              <li 
                key={filter.id} 
                className="flex items-center justify-between p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <button
                  onClick={() => onSelectFilter(filter.filter_expression)}
                  className="text-sm text-left flex-grow truncate hover:text-blue-500"
                  title={filter.filter_expression}
                >
                  {filter.name}
                </button>
                <button
                  onClick={() => deleteFilter(filter.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete filter"
                  disabled={isLoading}
                >
                  <TrashIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Save New Filter */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={newFilterName}
          onChange={(e) => setNewFilterName(e.target.value)}
          placeholder="Name your filter"
          className="flex-grow p-1 text-sm border rounded"
          disabled={isLoading}
        />
        <button
          onClick={saveFilter}
          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading || !newFilterName.trim() || !currentExpression.trim() || !userId}
          title="Save current filter"
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </div>
  );
}; 