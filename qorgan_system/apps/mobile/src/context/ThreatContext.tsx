import React, { createContext, useContext, useMemo, useState } from 'react';
import { Threat } from '../types';

type ThreatContextType = {
  threat: Threat | null;
  setThreat: (t: Threat | null) => void;
};

const ThreatContext = createContext<ThreatContextType | null>(null);

export const ThreatProvider = ({ children }: { children: React.ReactNode }) => {
  const [threat, setThreat] = useState<Threat | null>(null);
  const value = useMemo(() => ({ threat, setThreat }), [threat]);
  return <ThreatContext.Provider value={value}>{children}</ThreatContext.Provider>;
};

export const useThreat = () => {
  const ctx = useContext(ThreatContext);
  if (!ctx) throw new Error('useThreat must be used within ThreatProvider');
  return ctx;
};
