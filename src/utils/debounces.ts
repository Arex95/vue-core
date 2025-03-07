/**
 * Creates a debounced asynchronous validator function.
 *
 * @param validator - The async validator function to debounce.
 * @param delay - The debounce delay in milliseconds.
 * @returns A debounced version of the validator function.
 */
export function debounceAsyncValidator(
    validator: (value: any, debounce: () => Promise<void>) => Promise<void>,
    delay: number
): (value: any) => Promise<void> {
  let currentTimer: NodeJS.Timeout | null = null;
  let currentPromiseReject: ((reason?: any) => void) | null = null;

  /**
   * Creates a debounce delay.
   *
   * @returns A promise that resolves after the debounce delay.
   */
  function debounce(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      currentTimer = setTimeout(() => {
        currentTimer = null;
        currentPromiseReject = null;
        resolve();
      }, delay);
      currentPromiseReject = reject;
    });
  }

  return function (value: any): Promise<void> {
    if (currentTimer) {
      currentPromiseReject?.(new Error('replaced'));
      clearTimeout(currentTimer);
      currentTimer = null;
    }

    return validator.call(this, value, debounce);
  };
}

/**
 * Creates a debounced version of an asynchronous function.
 * @param {Function} func The asynchronous function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        func.apply(this, args).then(resolve).catch(reject);
      }, wait);
    });
  } as T;
}

/**
 * Creates a debounced asynchronous function that executes immediately on the first call.
 * @param {Function} func The asynchronous function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function with immediate execution on the first call.
 */
export function debounceAsyncWithImmediate<T extends (...args: any[]) => Promise<any>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let callNow = true;

  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const context = this;

    if (callNow) {
      callNow = false;
      return func.apply(context, args).finally(() => {
        timeout = setTimeout(() => {
          callNow = true;
        }, wait);
      });
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }

      return new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          func.apply(context, args).then(resolve).catch(reject);
        }, wait);
      });
    }
  } as T;
}

/**
 * Creates a debounced version of a function that executes on the leading edge.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceLeading<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    if (!timeout) {
      func.apply(context, args);
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
    }, wait);
  } as T;
}

/**
 * Creates a debounced version of a function that executes on the trailing edge.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceTrailing<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  } as T;
}

/**
 * Creates a debounced version of a function that executes on both leading and trailing edges.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceLeadingTrailing<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  let lastCall = 0;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    const now = Date.now();

    if (timeout) {
      clearTimeout(timeout);
    }

    if (now - lastCall >= wait) {
      func.apply(context, args);
      lastCall = now;
    } else {
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait - (now - lastCall));
    }
  } as T;
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: number | undefined;

  return function(this: any, ...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  } as T;
}

/**
 * Creates a throttled version of a function.
 * @param {Function} func The function to throttle.
 * @param {number} limit The number of milliseconds to wait between function calls.
 * @returns {Function} The throttled function.
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let lastCall = 0;

  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  } as T;
}