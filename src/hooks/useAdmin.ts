import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setIsSupervisor(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes('admin'));
      setIsSupervisor(roles.includes('admin') || roles.includes('supervisor'));
    } catch (error) {
      console.error('Error checking roles:', error);
      setIsAdmin(false);
      setIsSupervisor(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, isSupervisor, loading };
}
