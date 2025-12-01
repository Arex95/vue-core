import { useTimeoutFn } from '@vueuse/core';

/**
 * Creates a debounced version of an asynchronous validator function. This is useful for scenarios
 * like form input validation where you want to delay validation until the user has stopped typing.
 *
 * @param validator - The asynchronous validator function to be debounced. It receives the value to validate and a `debounce` function.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns A new function that takes a value and returns a promise that resolves or rejects based on the debounced validation.
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
 * Creates a debounced version of an asynchronous function. The debounced function will only
 * resolve the promise of the last invocation within the `wait` period.
 *
 * @template T - The type of the asynchronous function.
 * @param {T} func - The asynchronous function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns A new debounced asynchronous function.
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
 * Creates a debounced version of an asynchronous function that executes immediately on the first call
 * and then waits for the specified delay before allowing the next execution.
 *
 * @template T - The type of the asynchronous function.
 * @param {T} func - The asynchronous function to debounce.
 * @param {number} wait - The cooldown period in milliseconds after an immediate execution.
 * @returns A new debounced asynchronous function that executes on the leading edge.
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
 * Creates a debounced function that invokes `func` on the leading edge of the `wait` timeout.
 * Subsequent calls within the `wait` period are ignored.
 *
 * @template T - The type of the function.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns A new debounced function.
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
 * Creates a debounced function that invokes `func` on the trailing edge of the `wait` timeout.
 * The function is called only after `wait` milliseconds of inactivity.
 *
 * @template T - The type of the function.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns A new debounced function.
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
 * Creates a debounced function that invokes `func` on both the leading and trailing edges of the `wait` timeout.
 * This is useful for UIs where an action should happen immediately on the first event, but also after a pause in events.
 *
 * @template T - The type of the function.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns A new debounced function.
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
 * Creates a standard debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked. (This is an alias for `debounceTrailing`).
 *
 * @template T - The type of the function.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns A new debounced function.
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
 * Creates a throttled function that only invokes `func` at most once per every `limit` milliseconds.
 * This is useful for rate-limiting events that fire frequently, such as scrolling or resizing.
 *
 * @template T - The type of the function.
 * @param {T} func - The function to throttle.
 * @param {number} limit - The throttle duration in milliseconds.
 * @returns A new throttled function.
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