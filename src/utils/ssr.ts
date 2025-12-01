export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';

export function getStorage(): Storage | null {
  if (isServer) {
    return null;
  }
  return window.localStorage;
}

export function getSessionStorage(): Storage | null {
  if (isServer) {
    return null;
  }
  return window.sessionStorage;
}

export interface CookieOptions {
  expires?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  httpOnly?: boolean;
}

export function getCookieStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string, options?: CookieOptions): void;
  removeItem: (key: string, options?: { path?: string; domain?: string }): void;
} {
  return {
    getItem: (key: string): string | null => {
      if (isServer) return null;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === key) {
          return decodeURIComponent(value);
        }
      }
      return null;
    },
    setItem: (key: string, value: string, options?: CookieOptions): void {
      if (isServer) return;
      let cookie = `${key}=${encodeURIComponent(value)}`;
      
      if (options?.expires) {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
        cookie += `; expires=${date.toUTCString()}`;
      }
      
      cookie += `; path=${options?.path || '/'}`;
      
      if (options?.domain) {
        cookie += `; domain=${options.domain}`;
      }
      
      if (options?.secure !== false) {
        const isSecure = options?.secure ?? (typeof window !== 'undefined' && window.location.protocol === 'https:');
        if (isSecure) {
          cookie += '; Secure';
        }
      }
      
      if (options?.sameSite) {
        cookie += `; SameSite=${options.sameSite}`;
      } else {
        cookie += '; SameSite=Lax';
      }
      
      if (options?.httpOnly) {
        console.warn('HttpOnly cookies cannot be set from JavaScript. Use server-side code to set HttpOnly cookies.');
      }
      
      document.cookie = cookie;
    },
    removeItem: (key: string, options?: { path?: string; domain?: string }): void {
      if (isServer) return;
      const path = options?.path || '/';
      const domain = options?.domain ? `; domain=${options.domain}` : '';
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain}`;
    },
  };
}

export function getPreferredStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string): void;
  removeItem: (key: string): void;
} {
  if (isServer) {
    return getCookieStorage();
  }
  const storage = getStorage();
  if (storage) {
    return storage;
  }
  return getCookieStorage();
}
