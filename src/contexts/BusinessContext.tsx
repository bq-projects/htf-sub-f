import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Business, Subscription, Agent } from '@/types/database';

interface BusinessContextType {
  businesses: Business[];
  currentBusiness: Business | null;
  subscription: Subscription | null;
  agent: Agent | null;
  loading: boolean;
  setCurrentBusiness: (business: Business | null) => void;
  refreshBusinesses: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshAgent: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBusinesses = async () => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });
    const list = (data ?? []) as Business[];
    setBusinesses(list);
    if (list.length > 0 && !currentBusiness) {
      setCurrentBusiness(list[0]);
    }
    setLoading(false);
  };

  const refreshSubscription = async () => {
    if (!currentBusiness) {
      setSubscription(null);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('business_id', currentBusiness.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data as Subscription | null);
  };

  const refreshAgent = async () => {
    if (!currentBusiness) {
      setAgent(null);
      return;
    }
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('business_id', currentBusiness.id)
      .maybeSingle();
    setAgent(data as Agent | null);
  };

  useEffect(() => {
    if (user) {
      refreshBusinesses();
    } else {
      setBusinesses([]);
      setCurrentBusiness(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshSubscription();
    refreshAgent();
  }, [currentBusiness]);

  return (
    <BusinessContext.Provider value={{
      businesses,
      currentBusiness,
      subscription,
      agent,
      loading,
      setCurrentBusiness,
      refreshBusinesses,
      refreshSubscription,
      refreshAgent,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
