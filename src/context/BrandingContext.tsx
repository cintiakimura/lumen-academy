import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const DEFAULT_PRIMARY = '#4A90E2';
const DEFAULT_HOVER = '#3a7bc8';

function darkenHex(hex: string, pct: number): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) * (1 - pct)));
  const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) * (1 - pct)));
  const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) * (1 - pct)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface BrandingState {
  primaryColor: string;
  logoUrl: string | null;
  setPrimaryColor: (v: string) => void;
  setLogoUrl: (v: string | null) => void;
}

const BrandingContext = createContext<BrandingState | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user, role, loading } = useSession();
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user?.id || role !== 'org') {
      document.documentElement.style.setProperty('--accent', DEFAULT_PRIMARY);
      document.documentElement.style.setProperty('--accent-hover', DEFAULT_HOVER);
      return;
    }
    supabase
      .from('users')
      .select('primary_color, logo_url')
      .eq('id', user.id)
      .maybeSingle()
      .then((result: { data: { primary_color?: string | null; logo_url?: string | null } | null }) => {
        const p = result.data?.primary_color?.trim() || DEFAULT_PRIMARY;
        const l = result.data?.logo_url?.trim() || null;
        setPrimaryColorState(p);
        setLogoUrlState(l);
        document.documentElement.style.setProperty('--accent', p);
        document.documentElement.style.setProperty('--accent-hover', darkenHex(p.startsWith('#') ? p : `#${p}`, 0.1));
      });
  }, [user?.id, role, loading]);

  const setPrimaryColor = (v: string) => {
    const val = v.trim() || DEFAULT_PRIMARY;
    setPrimaryColorState(val);
    document.documentElement.style.setProperty('--accent', val);
    document.documentElement.style.setProperty('--accent-hover', darkenHex(val.startsWith('#') ? val : `#${val}`, 0.1));
  };

  const setLogoUrl = (v: string | null) => {
    setLogoUrlState(v);
  };

  return (
    <BrandingContext.Provider
      value={{
        primaryColor,
        logoUrl,
        setPrimaryColor,
        setLogoUrl,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingState {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      primaryColor: DEFAULT_PRIMARY,
      logoUrl: null,
      setPrimaryColor: () => {},
      setLogoUrl: () => {},
    };
  }
  return ctx;
}
