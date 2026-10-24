import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  signUpUser,
  signInUser,
  signOutUser,
  getActiveSessionUser,
  saveCompleteStudentProfile,
  fetchCompleteStudentProfile,
  uploadResumeToStorage,
  removeResumeFromStorage,
  uploadProfilePhoto as uploadPhotoService,
  removeProfilePhoto as removePhotoService,
  CompleteStudentData,
} from '@/services/supabaseService';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  profileData: CompleteStudentData | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  role: 'student' | 'admin';
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (data: CompleteStudentData) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<{ url: string }>;
  removeProfilePhoto: () => Promise<void>;
  uploadResume: (file: File) => Promise<{ url: string; fileName: string; fileSize: string }>;
  removeResume: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileData, setProfileData] = useState<CompleteStudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role strictly derived from authenticated session
  const role: 'student' | 'admin' = user?.role || 'student';
  const isAdmin = role === 'admin';

  // Normalize raw user record to AuthUser
  const normalizeUser = (rawUser: any): AuthUser | null => {
    if (!rawUser) return null;
    const determinedRole: 'student' | 'admin' =
      rawUser.role === 'admin' ||
      rawUser.user_metadata?.role === 'admin'
        ? 'admin'
        : 'student';

    return {
      id: rawUser.id,
      email: rawUser.email || '',
      fullName:
        rawUser.user_metadata?.full_name ||
        rawUser.user_metadata?.name ||
        rawUser.fullName ||
        rawUser.email?.split('@')[0] ||
        (determinedRole === 'admin' ? 'Administrator' : 'PathSync Student'),
      avatarUrl:
        rawUser.avatarUrl ||
        rawUser.user_metadata?.avatar_url ||
        rawUser.avatar_url ||
        '',
      role: determinedRole,
    };
  };

  // Load student profile for authenticated user
  const loadProfile = async (userId: string, authUserOverride?: AuthUser | null) => {
    try {
      let data = await fetchCompleteStudentProfile(userId);
      const fallbackUser = authUserOverride || user;
      if (!data && fallbackUser) {
        data = {
          profile: {
            id: fallbackUser.id,
            full_name: fallbackUser.fullName,
            email: fallbackUser.email,
            headline: 'PathSync AI Student',
            role: fallbackUser.role,
          },
          education: {},
          skills: { programming: [], frameworks: [], tools: [], technical: [] },
          interests: { areas_of_interest: [], opportunity_categories: [] },
          careerGoals: {},
          resume: {},
        };
      }
      if (data) {
        setProfileData(data);
        // Sync user fullName and avatar with profile record
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            fullName: data.profile?.full_name || prev.fullName,
            avatarUrl: data.profile?.avatar_url || prev.avatarUrl,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  // Initialize session on mount (Strict: if no valid session, user is logged out)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted && session?.user) {
            const authUser = normalizeUser(session.user);
            setUser(authUser);
            if (authUser) {
              await loadProfile(authUser.id, authUser);
            }
          } else if (mounted) {
            setUser(null);
            setProfileData(null);
          }
        } else {
          // Check local session
          const localUser = await getActiveSessionUser();
          if (mounted && localUser) {
            const authUser = normalizeUser(localUser);
            setUser(authUser);
            if (authUser) {
              await loadProfile(authUser.id, authUser);
            }
          } else if (mounted) {
            setUser(null);
            setProfileData(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setUser(null);
          setProfileData(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Supabase auth state change subscription
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const authUser = normalizeUser(session.user);
            setUser(authUser);
            if (authUser) {
              await loadProfile(authUser.id, authUser);
            }
          } else {
            setUser(null);
            setProfileData(null);
          }
        }
      );
      subscription = authListener.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInUser(email, password);
      const authUser = normalizeUser(result.user);
      setUser(authUser);
      if (authUser) {
        await loadProfile(authUser.id, authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const result = await signUpUser(email, password, fullName);
      const authUser = normalizeUser(result.user);
      setUser(authUser);
      if (authUser) {
        await loadProfile(authUser.id, authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (data: CompleteStudentData) => {
    if (!user) throw new Error('Cannot save profile: No active authenticated student session.');
    await saveCompleteStudentProfile(user.id, data);
    setProfileData(data);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            fullName: data.profile?.full_name || prev.fullName,
            avatarUrl: data.profile?.avatar_url || prev.avatarUrl,
          }
        : null
    );
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) throw new Error('Cannot upload profile photo: No active authenticated session.');
    const result = await uploadPhotoService(user.id, file);
    setUser((prev) => (prev ? { ...prev, avatarUrl: result.url } : null));
    setProfileData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          avatar_url: result.url,
        },
      };
    });
    return result;
  };

  const removeProfilePhoto = async () => {
    if (!user) throw new Error('Cannot remove photo: No active authenticated session.');
    await removePhotoService(user.id);
    setUser((prev) => (prev ? { ...prev, avatarUrl: '' } : null));
    setProfileData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          avatar_url: '',
        },
      };
    });
  };

  const uploadResume = async (file: File) => {
    if (!user) throw new Error('Cannot upload resume: No active student session.');
    const res = await uploadResumeToStorage(user.id, file);
    // Update active profile state so recommendations & UI reflect it immediately
    setProfileData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        resume: {
          user_id: user.id,
          file_name: res.fileName,
          file_size: res.fileSize,
          file_url: res.url,
          uploaded_at: new Date().toISOString(),
        },
      };
    });
    return res;
  };

  const removeResume = async () => {
    if (!user) throw new Error('Cannot remove resume: No active student session.');
    await removeResumeFromStorage(user.id);
    setProfileData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        resume: {},
      };
    });
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = useMemo(
    () => ({
      user,
      profileData,
      isLoading,
      isSupabaseConnected: isSupabaseConfigured,
      role,
      isAdmin,
      login,
      register,
      logout,
      saveProfile,
      uploadProfilePhoto,
      removeProfilePhoto,
      uploadResume,
      removeResume,
      refreshProfile,
    }),
    [user, profileData, isLoading, role, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
