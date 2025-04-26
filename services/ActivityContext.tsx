import React, { createContext, useContext, useState } from 'react';

interface ActivityContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const ActivityContext = createContext<ActivityContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const useActivityContext = () => useContext(ActivityContext);

export const ActivityProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <ActivityContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </ActivityContext.Provider>
  );
}; 