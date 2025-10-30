import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
}

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterRole?: 'admin' | 'user';
}

export function UserSelector({ value, onChange, placeholder = "Select user...", filterRole }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url');

      if (profilesError) throw profilesError;

      if (filterRole) {
        // Filter by role
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', filterRole);

        if (rolesError) throw rolesError;

        const roleUserIds = new Set(userRoles?.map(r => r.user_id) || []);
        setUsers(profiles?.filter(p => roleUserIds.has(p.id)) || []);
      } else {
        setUsers(profiles || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === value);
  const displayName = selectedUser?.full_name || selectedUser?.username || "Select user...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback className="text-xs">
                  {(selectedUser.full_name || selectedUser.username || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{displayName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading users..." : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => {
                const name = user.full_name || user.username || 'Unknown User';
                const initials = name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <CommandItem
                    key={user.id}
                    value={`${user.full_name || ''} ${user.username || ''} ${user.id}`}
                    onSelect={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{name}</span>
                      {user.username && user.full_name && (
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
