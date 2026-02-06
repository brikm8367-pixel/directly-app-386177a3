import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, Loader2, User, Send, TrendingUp, Heart } from 'lucide-react';
import { InboxSection, MessageComposer, MessageViewer, DirectAccessManager, CommunicationPatterns, MessageCategory, Message } from '@/components/messaging';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { BottomNavigation } from '@/components/BottomNavigation';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab === 'search') return 'search';
    if (tab === 'patterns') return 'patterns';
    return 'inbox';
  };
  
  const [activeTab, setActiveTab] = useState<'inbox' | 'search' | 'patterns'>(getInitialTab());
  
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
      const { data: profiles } = senderIds.length > 0 
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', senderIds)
        : { data: [] };

      const withProfiles = data.map(m => ({
        ...m,
        sender_profile: profiles?.find(p => p.id === m.sender_id) || { id: m.sender_id, display_name: null, username: null, avatar_url: null }
      })) as Message[];

      setMessages({
        work: withProfiles.filter(m => m.category === 'work'),
        audience: withProfiles.filter(m => m.category === 'audience'),
        direct: withProfiles.filter(m => m.category === 'direct'),
      });
    }

    const { data: limitsData } = await supabase
      .from('message_limits')
      .select('category, max_messages')
      .eq('user_id', user.id);

    if (limitsData) {
      const newLimits = { work: 100, audience: 100, direct: 100 };
      limitsData.forEach(l => { newLimits[l.category as MessageCategory] = l.max_messages; });
      setLimits(newLimits);
    }

    setIsLoadingMessages(false);
  }, [user]);

  useEffect(() => { if (user) fetchMessages(); }, [user, fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMessages]);

  // Search
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2 || !user) { setSearchResults([]); return; }
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
      user_id: user.id, category, max_messages: limit,
    }, { onConflict: 'user_id,category' });
    setLimits(prev => ({ ...prev, [category]: limit }));
  };

  const unreadCount = messages.work.filter(m => !m.is_read).length + messages.audience.filter(m => !m.is_read).length + messages.direct.filter(m => !m.is_read).length;

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
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="max-w-lg mx-auto flex h-14 items-center justify-between px-4">
          <p className="text-sm font-medium text-muted-foreground">
            {unreadCount > 0
              ? (isRTL ? `✨ ${unreadCount} جديد` : `✨ ${unreadCount} new`)
              : (isRTL ? '🎯 منظم' : '🎯 Organized')
            }
          </p>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl touch-feedback" onClick={() => setIsDirectAccessOpen(true)}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-16 pb-20 px-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-4">
          {[
            { id: 'inbox', icon: MessageSquare, label: isRTL ? 'الرسائل' : 'Inbox' },
            { id: 'search', icon: Search, label: isRTL ? 'بحث' : 'Search' },
            { id: 'patterns', icon: TrendingUp, label: isRTL ? 'نمطك' : 'Pattern' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all touch-feedback flex items-center justify-center gap-2 ${
                activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {(['direct', 'work', 'audience'] as MessageCategory[]).map(category => (
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

        {/* Search */}
        {activeTab === 'search' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'ابحث عن أشخاص...' : 'Search for people...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-12 h-13 text-base rounded-2xl border-2 focus:border-primary"
              />
              {isSearching && <Loader2 className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />}
            </div>
            {searchQuery.length >= 2 ? (
              <div className="space-y-3">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{isRTL ? 'لا توجد نتائج' : 'No results'}</p>
                  </div>
                ) : (
                  searchResults.map((profile) => (
                    <div key={profile.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border touch-feedback">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {profile.display_name?.[0] || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{profile.display_name || profile.username}</p>
                        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                      </div>
                      <Button size="icon" onClick={() => setComposeRecipient(profile)} className="h-11 w-11 rounded-xl touch-feedback">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">{isRTL ? 'ابحث عن أشخاص' : 'Search for people'}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'أرسل رسالتك للشخص المناسب' : 'Send your message to the right person'}</p>
              </div>
            )}
          </div>
        )}

        {/* Patterns */}
        {activeTab === 'patterns' && user && <CommunicationPatterns userId={user.id} />}
      </main>

      <BottomNavigation />

      {/* Modals */}
      <MessageViewer message={selectedMessage} isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} onMessageRead={fetchMessages} />
      <MessageComposer isOpen={!!composeRecipient} onClose={() => setComposeRecipient(null)} recipient={composeRecipient} onMessageSent={fetchMessages} />
      <DirectAccessManager isOpen={isDirectAccessOpen} onClose={() => setIsDirectAccessOpen(false)} />
    </div>
  );
}
