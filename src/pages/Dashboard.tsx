import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, LogOut, Loader2, User, UserPlus, Check, X } from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Contact {
  id: string;
  contact_id: string;
  user_id: string;
  status: string | null;
  profile?: Profile;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'contacts' | 'requests'>('search');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch my profile
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

  // Fetch contacts and pending requests
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    // Fetch my contacts (accepted)
    const { data: myContacts } = await supabase
      .from('contacts')
      .select('*')
      .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
      .eq('status', 'accepted');
    
    if (myContacts) {
      // Fetch profiles for contacts
      const contactIds = myContacts.map(c => 
        c.user_id === user.id ? c.contact_id : c.user_id
      );
      
      if (contactIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', contactIds);
        
        const contactsWithProfiles = myContacts.map(contact => ({
          ...contact,
          profile: profiles?.find(p => 
            p.id === (contact.user_id === user.id ? contact.contact_id : contact.user_id)
          )
        }));
        
        setContacts(contactsWithProfiles);
      }
    }
    
    // Fetch pending requests (where I'm the contact_id)
    const { data: pending } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', user.id)
      .eq('status', 'pending');
    
    if (pending) {
      const requesterIds = pending.map(p => p.user_id);
      
      if (requesterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', requesterIds);
        
        const pendingWithProfiles = pending.map(req => ({
          ...req,
          profile: profiles?.find(p => p.id === req.user_id)
        }));
        
        setPendingRequests(pendingWithProfiles);
      } else {
        setPendingRequests([]);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user, fetchContacts]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2 || !user) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .neq('id', user.id)
          .limit(15);

        setSearchResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const sendContactRequest = async (contactId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        status: 'pending'
      });
    
    if (!error) {
      // Update UI optimistically
      setSearchResults(prev => prev.filter(p => p.id !== contactId));
    }
  };

  const handleContactRequest = async (requestId: string, accept: boolean) => {
    const newStatus = accept ? 'accepted' : 'rejected';
    
    await supabase
      .from('contacts')
      .update({ status: newStatus })
      .eq('id', requestId);
    
    fetchContacts();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
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
            <Avatar className="h-8 w-8">
              <AvatarImage src={myProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {myProfile?.display_name?.[0] || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pt-16 pb-20 px-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 mt-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4 mx-auto mb-1" />
            {isRTL ? 'بحث' : 'Search'}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'contacts' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4 mx-auto mb-1" />
            {isRTL ? 'جهات الاتصال' : 'Contacts'}
            {contacts.length > 0 && (
              <span className="ms-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {contacts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
              activeTab === 'requests' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-4 w-4 mx-auto mb-1" />
            {isRTL ? 'طلبات' : 'Requests'}
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -end-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isRTL ? 'ابحث عن أشخاص...' : 'Search for people...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-11"
              />
              {isSearching && (
                <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchQuery.length >= 2 ? (
              <div className="space-y-2">
                {searchResults.length === 0 && !isSearching ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {isRTL ? 'لا توجد نتائج' : 'No results found'}
                  </p>
                ) : (
                  searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.display_name?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {profile.display_name || profile.username}
                        </p>
                        {profile.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => sendContactRequest(profile.id)}
                        className="h-8"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="font-medium text-foreground mb-1">
                  {isRTL ? 'ابحث عن أشخاص' : 'Find People'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'اكتب اسم المستخدم أو الاسم للبحث' : 'Type a username or name to search'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div>
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="font-medium text-foreground mb-1">
                  {isRTL ? 'لا توجد جهات اتصال' : 'No Contacts Yet'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'ابحث عن أشخاص وأرسل لهم طلب تواصل' : 'Search for people and send connection requests'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {contact.profile?.display_name?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate text-sm">
                        {contact.profile?.display_name || contact.profile?.username}
                      </p>
                      {contact.profile?.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{contact.profile.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Check className="h-3 w-3 me-1 text-green-500" />
                      {isRTL ? 'متصل' : 'Connected'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="font-medium text-foreground mb-1">
                  {isRTL ? 'لا توجد طلبات' : 'No Pending Requests'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'ستظهر هنا طلبات التواصل الجديدة' : 'New connection requests will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.profile?.display_name?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate text-sm">
                        {request.profile?.display_name || request.profile?.username}
                      </p>
                      {request.profile?.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{request.profile.username}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleContactRequest(request.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleContactRequest(request.id, true)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Welcome message for new users */}
      {myProfile && contacts.length === 0 && pendingRequests.length === 0 && activeTab === 'search' && searchQuery.length < 2 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto">
          <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
            <p className="font-medium mb-1">
              {isRTL ? `مرحباً ${myProfile.display_name || myProfile.username}! 👋` : `Welcome ${myProfile.display_name || myProfile.username}! 👋`}
            </p>
            <p className="text-sm opacity-90">
              {isRTL ? 'ابدأ بالبحث عن أصدقائك وأضفهم لجهات اتصالك' : 'Start by searching for friends and adding them to your contacts'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
