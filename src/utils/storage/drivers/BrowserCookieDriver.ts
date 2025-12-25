import { StorageDriver, StorageContext, StorageOptions } from "@/types/Storage";

/**
 * Builds a cookie string from key, value, and options.
 */
function buildCookieString(
  key: string,
  value: string,
  options?: StorageOptions
): string {
  let cookie = `${key}=${encodeURIComponent(value)}`;

  if (options?.expires) {
    const date = new Date();
    date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
    cookie += `; expires=${date.toUTCString()}`;
  } else if (options?.maxAge !== undefined) {
    cookie += `; max-age=${options.maxAge}`;
  }

  cookie += `; path=${options?.path || '/'}`;

  if (options?.domain) {
    cookie += `; domain=${options.domain}`;
  }

  if (options?.secure !== false) {
    const isSecure =
      options?.secure ??
      (typeof window !== 'undefined' && window.location.protocol === 'https:');
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
    cookie += '; HttpOnly';
  }

  return cookie;
}

/**
 * Browser Cookie Driver - handles cookies in both client and SSR contexts.
 * In SSR, reads from context.cookies and writes to context.responseHeaders.
 * In client, uses document.cookie directly.
 */
export const BrowserCookieDriver: StorageDriver = {
  get: (key: string, context?: StorageContext): string | null => {
    if (typeof document === 'undefined') {
      // SSR: leer de contexto
      if (context?.cookies) {
        return context.cookies[key] || null;
      }
      return null;
    }
    // Cliente: leer de document.cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  set: (
    key: string,
    value: string,
    options?: StorageOptions,
    context?: StorageContext
  ): void => {
    const cookieString = buildCookieString(key, value, options);

    if (typeof document === 'undefined') {
      // SSR: escribir en response headers
      if (context?.responseHeaders) {
        // Helper para escribir cookies usando el método del framework
        if (context.responseHeaders instanceof Headers) {
          context.responseHeaders.append('Set-Cookie', cookieString);
        } else if (context._writeCookie) {
          // Si el framework proporciona un helper específico
          context._writeCookie(key, value, options);
        } else {
          // Fallback: agregar a responseHeaders como objeto
          const existing = context.responseHeaders['Set-Cookie'];
          const cookies = Array.isArray(existing)
            ? existing
            : existing
            ? [existing]
            : [];
          cookies.push(cookieString);
          context.responseHeaders['Set-Cookie'] = cookies;
        }
      }
      return;
    }
    // Cliente: escribir en document.cookie
    document.cookie = cookieString;
  },

  remove: (
    key: string,
    options?: StorageOptions,
    context?: StorageContext
  ): void => {
    // Remover es igual a set con expires en el pasado
    const removeOptions: StorageOptions = {
      ...options,
      expires: -1, // Esto se convertirá en fecha pasada
    };
    BrowserCookieDriver.set(key, '', removeOptions, context);
  },
};

