import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, LogOut, Loader2, User, Send, TrendingUp, Bell, Settings, Heart } from 'lucide-react';
import { InboxSection, MessageComposer, MessageViewer, DirectAccessManager, CommunicationPatterns, MessageCategory } from '@/components/messaging';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_profile?: Profile;
  subject: string | null;
  content: string;
  is_important: boolean;
  is_read: boolean;
  created_at: string;
  category: MessageCategory;
  parent_id: string | null;
}

interface MessageLimit {
  category: MessageCategory;
  max_messages: number;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'inbox' | 'search' | 'patterns'>('inbox');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  
  // Messages state
  const [messages, setMessages] = useState<{ work: Message[]; audience: Message[]; direct: Message[] }>({
    work: [], audience: [], direct: []
  });
  const [limits, setLimits] = useState<{ work: number; audience: number; direct: number }>({
    work: 100, audience: 100, direct: 100
  });
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modals
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeRecipient, setComposeRecipient] = useState<Profile | null>(null);
  const [isDirectAccessOpen, setIsDirectAccessOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) setMyProfile(data);
    };
    if (user) fetchProfile();
  }, [user]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setIsLoadingMessages(true);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', senderIds);

      const withProfiles = data.map(m => ({
        ...m,
        sender_profile: profiles?.find(p => p.id === m.sender_id)
      })) as Message[];

      setMessages({
        work: withProfiles.filter(m => m.category === 'work'),
        audience: withProfiles.filter(m => m.category === 'audience'),
        direct: withProfiles.filter(m => m.category === 'direct'),
      });
    }

    // Fetch limits
    const { data: limitsData } = await supabase
      .from('message_limits')
      .select('category, max_messages')
      .eq('user_id', user.id);

    if (limitsData) {
      const newLimits = { work: 100, audience: 100, direct: 100 };
      limitsData.forEach(l => {
        newLimits[l.category as MessageCategory] = l.max_messages;
      });
      setLimits(newLimits);
    }

    setIsLoadingMessages(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMessages]);

  // Search
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2 || !user) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(15);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleSetLimit = async (category: MessageCategory, limit: number) => {
    if (!user) return;
    await supabase.from('message_limits').upsert({
      user_id: user.id,
      category,
      max_messages: limit,
    }, { onConflict: 'user_id,category' });
    setLimits(prev => ({ ...prev, [category]: limit }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">Directly</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDirectAccessOpen(true)}>
              <Heart className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={myProfile?.avatar_url || undefined} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pt-16 pb-20 px-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 mt-2">
          {[
            { id: 'inbox', icon: MessageSquare, label: isRTL ? 'الرسائل' : 'Inbox' },
            { id: 'search', icon: Search, label: isRTL ? 'بحث' : 'Search' },
            { id: 'patterns', icon: TrendingUp, label: isRTL ? 'النمط' : 'Patterns' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {(['work', 'audience', 'direct'] as MessageCategory[]).map(category => (
              <InboxSection
                key={category}
                category={category}
                messages={messages[category] as any}
                messageLimit={limits[category]}
                onSetLimit={(limit) => handleSetLimit(category, limit)}
                onMessageClick={setSelectedMessage}
                isLoading={isLoadingMessages}
              />
            ))}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'ابحث عن أشخاص...' : 'Search for people...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-11"
              />
              {isSearching && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
            {searchQuery.length >= 2 ? (
              <div className="space-y-2">
                {searchResults.length === 0 && !isSearching ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">{isRTL ? 'لا توجد نتائج' : 'No results'}</p>
                ) : (
                  searchResults.map((profile) => (
                    <div key={profile.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.display_name?.[0] || <User className="h-4 w-4" />}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">{profile.display_name || profile.username}</p>
                        {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                      </div>
                      <Button size="sm" onClick={() => setComposeRecipient(profile)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{isRTL ? 'ابحث عن أشخاص لإرسال رسالة' : 'Search for people to message'}</p>
              </div>
            )}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && user && <CommunicationPatterns userId={user.id} />}
      </main>

      {/* Modals */}
      <MessageViewer message={selectedMessage} isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} onMessageRead={fetchMessages} />
      <MessageComposer isOpen={!!composeRecipient} onClose={() => setComposeRecipient(null)} recipient={composeRecipient} onMessageSent={fetchMessages} />
      <DirectAccessManager isOpen={isDirectAccessOpen} onClose={() => setIsDirectAccessOpen(false)} />
    </div>
  );
}
