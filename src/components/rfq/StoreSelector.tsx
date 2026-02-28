import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Store {
  id: string;
  store_name: string;
  platform: string;
}

interface StoreSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  userId?: string;
  placeholder?: string;
}

export function StoreSelector({ value, onValueChange, userId, placeholder = '选择店铺' }: StoreSelectorProps) {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      let query = supabase.from('stores').select('id, store_name, platform').eq('is_active', true);
      if (userId) query = query.eq('user_id', userId);
      const { data } = await query.order('store_name');
      if (data) setStores(data);
    };
    fetchStores();
  }, [userId]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stores.map(s => (
          <SelectItem key={s.id} value={s.id}>
            {s.store_name}{s.platform ? ` (${s.platform})` : ''}
          </SelectItem>
        ))}
        {stores.length === 0 && (
          <SelectItem value="__none" disabled>暂无店铺</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
