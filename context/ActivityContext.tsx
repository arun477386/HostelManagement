import React, { createContext, useContext, useState } from 'react';

export type Activity = { type: string; text: string; time: string };

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev.slice(0, 9)]); // keep max 10
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  );
};

export function useActivityContext() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivityContext must be used within ActivityProvider');
  return ctx;
} 