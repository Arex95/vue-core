import { useTimeoutFn } from '@vueuse/core';

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
  let currentPromiseReject: ((reason?: any) => void) | null = null;

  /**
   * Creates a debounce delay.
   *
   * @returns A promise that resolves after the debounce delay.
   */
  function debounce(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { start, stop } = useTimeoutFn(() => {
        currentPromiseReject = null;
        resolve();
      }, delay);

      if (currentPromiseReject) {
        currentPromiseReject(new Error('replaced'));
      }

      currentPromiseReject = reject;
      start();
    });
  }

  return function (this: any, value: any): Promise<void> {
    if (currentPromiseReject) {
      currentPromiseReject(new Error('replaced'));
      currentPromiseReject = null;
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
  let timeoutReject: ((reason?: any) => void) | null = null;

  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutReject) {
      timeoutReject(new Error('replaced'));
      timeoutReject = null;
    }

    return new Promise((resolve, reject) => {
      const { start } = useTimeoutFn(() => {
        func.apply(this, args).then(resolve).catch(reject);
      }, wait);

      timeoutReject = reject;
      start();
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
  let timeoutReject: ((reason?: any) => void) | null = null;
  let callNow = true;

  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const context = this;

    if (callNow) {
      callNow = false;
      return func.apply(context, args).finally(() => {
        const { start } = useTimeoutFn(() => {
          callNow = true;
        }, wait);
        start();
      });
    } else {
      if (timeoutReject) {
        timeoutReject(new Error('replaced'));
        timeoutReject = null;
      }

      return new Promise((resolve, reject) => {
        const { start } = useTimeoutFn(() => {
          func.apply(context, args).then(resolve).catch(reject);
        }, wait);

        timeoutReject = reject;
        start();
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
  let timeoutReject: ((reason?: any) => void) | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    if (!timeoutReject) {
      func.apply(context, args);
    }

    if (timeoutReject) {
      timeoutReject(new Error('replaced'));
      timeoutReject = null;
    }

    const { start } = useTimeoutFn(() => {
      timeoutReject = null;
    }, wait);

    timeoutReject = () => {};
    start();
  } as T;
}

/**
 * Creates a debounced version of a function that executes on the trailing edge.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceTrailing<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeoutReject: ((reason?: any) => void) | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    if (timeoutReject) {
      timeoutReject(new Error('replaced'));
      timeoutReject = null;
    }

    const { start } = useTimeoutFn(() => {
      func.apply(context, args);
    }, wait);

    timeoutReject = () => {};
    start();
  } as T;
}

/**
 * Creates a debounced version of a function that executes on both leading and trailing edges.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before invoking the function.
 * @returns {Function} The debounced function.
 */
export function debounceLeadingTrailing<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeoutReject: ((reason?: any) => void) | null = null;
  let lastCall = 0;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    const now = Date.now();

    if (timeoutReject) {
      timeoutReject(new Error('replaced'));
      timeoutReject = null;
    }

    if (now - lastCall >= wait) {
      func.apply(context, args);
      lastCall = now;
    } else {
      const { start } = useTimeoutFn(() => {
        func.apply(context, args);
      }, wait - (now - lastCall));

      timeoutReject = () => {};
      start();
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
  let timeoutReject: ((reason?: any) => void) | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    if (timeoutReject) {
      timeoutReject(new Error('replaced'));
      timeoutReject = null;
    }

    const { start } = useTimeoutFn(() => {
      func.apply(this, args);
    }, wait);

    timeoutReject = () => {};
    start();
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