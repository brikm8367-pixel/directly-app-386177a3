import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, User, UserPlus, X, Loader2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface DirectAccess {
  id: string;
  allowed_user_id: string;
  profile?: Profile;
}

interface DirectAccessManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DirectAccessManager({
  isOpen,
  onClose,
}: DirectAccessManagerProps) {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState<DirectAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch allowed users
  useEffect(() => {
    const fetchAllowedUsers = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('direct_access')
        .select('*')
        .eq('owner_id', user.user.id);

      if (data) {
        const userIds = data.map((d) => d.allowed_user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', userIds);

          const withProfiles = data.map((d) => ({
            ...d,
            profile: profiles?.find((p) => p.id === d.allowed_user_id),
          }));
          setAllowedUsers(withProfiles);
        } else {
          setAllowedUsers([]);
        }
      }
      setIsLoading(false);
    };

    if (isOpen) {
      fetchAllowedUsers();
    }
  }, [isOpen]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data: user } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user.user?.id)
        .limit(10);

      // Filter out already allowed users
      const filtered = data?.filter(
        (p) => !allowedUsers.some((a) => a.allowed_user_id === p.id)
      );
      
      setSearchResults(filtered || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, allowedUsers]);

  const addUser = async (profile: Profile) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase.from('direct_access').insert({
      owner_id: user.user.id,
      allowed_user_id: profile.id,
    });

    if (error) {
      toast.error(isRTL ? 'فشل إضافة المستخدم' : 'Failed to add user');
      return;
    }

    setAllowedUsers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), allowed_user_id: profile.id, profile },
    ]);
    setSearchResults((prev) => prev.filter((p) => p.id !== profile.id));
    toast.success(isRTL ? 'تمت الإضافة' : 'User added');
  };

  const removeUser = async (accessId: string, userId: string) => {
    const { error } = await supabase
      .from('direct_access')
      .delete()
      .eq('id', accessId);

    if (error) {
      toast.error(isRTL ? 'فشل إزالة المستخدم' : 'Failed to remove user');
      return;
    }

    setAllowedUsers((prev) => prev.filter((a) => a.id !== accessId));
    toast.success(isRTL ? 'تمت الإزالة' : 'User removed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[hsl(var(--others))]" />
            {isRTL ? 'إدارة صندوق المباشر' : 'Manage Direct Access'}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {isRTL 
            ? 'حدد من يمكنه إرسال رسائل إلى صندوقك المباشر الخاص' 
            : 'Choose who can send messages to your Direct inbox'}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'ابحث عن أشخاص...' : 'Search for people...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
          {isSearching && (
            <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
            {searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.display_name?.[0] || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.display_name || profile.username}
                  </p>
                </div>
                <Button size="sm" onClick={() => addUser(profile)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Allowed users list */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium mb-2">
            {isRTL ? 'المسموح لهم' : 'Allowed Users'} ({allowedUsers.length})
          </h4>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : allowedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRTL 
                ? 'لم تضف أي شخص بعد' 
                : 'No users added yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {allowedUsers.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={access.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {access.profile?.display_name?.[0] || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {access.profile?.display_name || access.profile?.username}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeUser(access.id, access.allowed_user_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="shrink-0">
          {isRTL ? 'إغلاق' : 'Close'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
