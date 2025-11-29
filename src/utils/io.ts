/**
 * Disables the default right-click context menu on the entire window.
 */
export function disableRightClick(): void {
    const handler = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('contextmenu', handler);

    // Store handler to allow removal
    disableRightClick.handler = handler;
}

disableRightClick.handler = null as any;

/**
 * Re-enables the right-click context menu if it was previously disabled by `disableRightClick`.
 */
export function enableRightClick(): void {
    if (disableRightClick.handler) {
        window.removeEventListener('contextmenu', disableRightClick.handler);
    }
}

/**
 * Prevents the default action for specific mouse buttons on the `mousedown` event.
 *
 * @param {number[]} buttons - An array of mouse button codes to disable (0 for left, 1 for middle, 2 for right).
 */
export function disableMouseButtons(buttons: number[]): void {
    const handler = (event: MouseEvent) => {
        if (buttons.includes(event.button)) {
            event.preventDefault();
        }
    };

    window.addEventListener('mousedown', handler);
    window.addEventListener('contextmenu', handler); // Also handles right-click context menu

    // Store handler to allow removal later
    disableMouseButtons.handlers.push(handler);
}

disableMouseButtons.handlers = [] as ((event: MouseEvent) => void)[];

/**
 * Re-enables all mouse buttons that were previously disabled by `disableMouseButtons`.
 */
export function enableMouseButtons(): void {
    for (const handler of disableMouseButtons.handlers) {
        window.removeEventListener('mousedown', handler);
        window.removeEventListener('contextmenu', handler);
    }
    disableMouseButtons.handlers = [];
}

/**
 * Attaches a `dblclick` event listener to a specified HTML element.
 *
 * @param {HTMLElement} element - The DOM element to attach the listener to.
 * @param {(event: MouseEvent) => void} callback - The function to execute when the element is double-clicked.
 */
export function addDoubleClickListener(element: HTMLElement, callback: (event: MouseEvent) => void): void {
    element.addEventListener('dblclick', callback);
}

/**
 * Removes a `dblclick` event listener from a specified HTML element.
 *
 * @param {HTMLElement} element - The DOM element to remove the listener from.
 * @param {(event: MouseEvent) => void} callback - The callback function that was originally added.
 */
export function removeDoubleClickListener(element: HTMLElement, callback: (event: MouseEvent) => void): void {
    element.removeEventListener('dblclick', callback);
}

// Example usage:
// addDoubleClickListener(document.body, () => alert('Double clicked!'));

/**
 * Sets up a global click listener to detect when a user clicks outside of a specified element.
 *
 * @param {HTMLElement} element - The element to monitor for outside clicks.
 * @param {() => void} callback - The function to execute when a click outside the element is detected.
 */
export function clickOutside(element: HTMLElement, callback: () => void): void {
    const handler = (event: MouseEvent) => {
        if (!element.contains(event.target as Node)) {
            callback();
        }
    };

    document.addEventListener('click', handler);

    // Store handler to allow removal later
    clickOutside.handlers.push({ element, handler });
}

clickOutside.handlers = [] as { element: HTMLElement; handler: (event: MouseEvent) => void }[];

/**
 * Removes the "click outside" event listener for a specific element that was added by `clickOutside`.
 *
 * @param {HTMLElement} element - The element for which to remove the listener.
 */
export function removeClickOutside(element: HTMLElement): void {
    const index = clickOutside.handlers.findIndex(h => h.element === element);
    if (index !== -1) {
        document.removeEventListener('click', clickOutside.handlers[index].handler);
        clickOutside.handlers.splice(index, 1);
    }
}

// Example usage: Close a menu when clicking outside of it
// const menu = document.getElementById('menu');
// if (menu) {
//     clickOutside(menu, () => menu.style.display = 'none');
// }

/**
 * Disables the F12 key and common developer tool shortcuts (Ctrl+Shift+I, Ctrl+Shift+J)
 * to prevent users from easily opening the browser's developer console.
 */
export function disableF12Key(): void {
    const handler = function (event: KeyboardEvent): boolean {
        return true;
        if (
            event.keyCode === 123 || // F12
            (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74)) // Ctrl + Shift + I or Ctrl + Shift + J
        ) {
            event.preventDefault();
            return false;
        }
    };
    document.addEventListener('keydown', handler);
}

/**
 * Enables or disables the ability to navigate through focusable elements using the Tab key.
 *
 * @param {boolean} enable - If `true`, tab navigation is enabled; if `false`, it is disabled.
 */
export function toggleTabNavigation(enable: boolean): void {
    if (enable) {
        document.onkeydown = null; // Removes any previously set handler
    } else {
        document.onkeydown = (event: KeyboardEvent): boolean => {
            if (event.key === 'Tab') {
                event.preventDefault();
                return false;
            }
            return true;
        };
    }
}

/**
 * Prevents users from copying content from the page by intercepting the `copy` event.
 */
export function disableCopy(): void {
    document.addEventListener('copy', (event: ClipboardEvent) => {
        event.preventDefault();
        alert('Copying text is disabled on this page.');
    });
}

/**
 * Registers a global keyboard shortcut that triggers a callback when a specific key combination is pressed.
 *
 * @param {string} key - The main key for the shortcut (e.g., 'S', 'F1').
 * @param {() => void} callback - The function to execute when the shortcut is pressed.
 * @param {boolean} [ctrlKey=false] - If `true`, the Ctrl key must be pressed.
 * @param {boolean} [shiftKey=false] - If `true`, the Shift key must be pressed.
 */
export function addCustomKeyboardShortcut(
    key: string,
    callback: () => void,
    ctrlKey = false,
    shiftKey = false
): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (
            event.key === key &&
            event.ctrlKey === ctrlKey &&
            event.shiftKey === shiftKey
        ) {
            event.preventDefault();
            callback();
        }
    });
}

/**
 * Removes a global keyboard shortcut that was previously added.
 *
 * @param {string} key - The main key of the shortcut to remove.
 * @param {boolean} [ctrlKey=false] - The Ctrl key modifier of the shortcut.
 * @param {boolean} [shiftKey=false] - The Shift key modifier of the shortcut.
 */
export function removeCustomKeyboardShortcut(
    key: string,
    ctrlKey = false,
    shiftKey = false
): void {
    const handler = (event: KeyboardEvent) => {
        if (
            event.key === key &&
            event.ctrlKey === ctrlKey &&
            event.shiftKey === shiftKey
        ) {
            event.preventDefault();
        }
    };

    document.removeEventListener('keydown', handler);
}

/**
 * Disables a list of specified keys or key combinations.
 *
 * @param {string[]} keys - An array of key names or combinations (e.g., 'F1', 'Control+S') to disable.
 */
export function disableSpecificKeys(keys: string[]): void {
    const handler = (event: KeyboardEvent) => {
        const keyCombination = `${event.ctrlKey ? 'Control+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`;
        if (keys.includes(event.key) || keys.includes(keyCombination)) {
            event.preventDefault();
        }
    };
    document.addEventListener('keydown', handler);

    // Storing the handler to allow removal later
    disableSpecificKeys.handlers.push(handler);
}

disableSpecificKeys.handlers = [] as ((event: KeyboardEvent) => void)[];

/**
 * Re-enables all keys that were previously disabled by `disableSpecificKeys`.
 */
export function enableSpecificKeys(): void {
    for (const handler of disableSpecificKeys.handlers) {
        document.removeEventListener('keydown', handler);
    }
    disableSpecificKeys.handlers = [];
}

/**
 * Registers multiple keyboard shortcuts from an array of shortcut configurations.
 *
 * @param {Array<{ key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; callback: () => void }>} shortcuts - An array of shortcut objects.
 */
export function registerKeyboardShortcuts(shortcuts: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; callback: () => void }[]): void {
    const handler = (event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
            if (
                event.key === shortcut.key &&
                (shortcut.ctrlKey ? event.ctrlKey : true) &&
                (shortcut.shiftKey ? event.shiftKey : true) &&
                (shortcut.altKey ? event.altKey : true)
            ) {
                event.preventDefault();
                shortcut.callback();
            }
        }
    };
    document.addEventListener('keydown', handler);

    // Storing the handler to allow removal later
    registerKeyboardShortcuts.handlers.push(handler);
}

registerKeyboardShortcuts.handlers = [] as ((event: KeyboardEvent) => void)[];

/**
 * Removes all keyboard shortcuts that were registered using `registerKeyboardShortcuts`.
 */
export function unregisterKeyboardShortcuts(): void {
    for (const handler of registerKeyboardShortcuts.handlers) {
        document.removeEventListener('keydown', handler);
    }
    registerKeyboardShortcuts.handlers = [];
}

/**
 * Adds a global `keydown` listener for a specific key.
 *
 * @param {string} key - The key to listen for (e.g., 'Enter', 'Escape').
 * @param {() => void} callback - The function to execute when the key is pressed.
 */
export function addKeyListener(key: string, callback: () => void): void {
    const handler = (event: KeyboardEvent) => {
        if (event.key === key) {
            event.preventDefault();
            callback();
        }
    };
    document.addEventListener('keydown', handler);

    // Storing the handler to allow removal later
    addKeyListener.handlers.push(handler);
}

addKeyListener.handlers = [] as ((event: KeyboardEvent) => void)[];

/**
 * Removes all key listeners that were added using `addKeyListener`.
 */
export function removeKeyListeners(): void {
    for (const handler of addKeyListener.handlers) {
        document.removeEventListener('keydown', handler);
    }
    addKeyListener.handlers = [];
}

/**
 * Executes a callback function repeatedly while a specific key is held down.
 *
 * @param {string} key - The key to monitor.
 * @param {() => void} onHold - The callback function to execute on each `keydown` event for the specified key.
 */
export function detectKeyHold(key: string, onHold: () => void): void {
    const keyDownHandler = (event: KeyboardEvent) => {
        if (event.key === key) {
            onHold();
        }
    };
    document.addEventListener('keydown', keyDownHandler);

    // Storing the handler to allow removal later
    detectKeyHold.handlers.push(keyDownHandler);
}

detectKeyHold.handlers = [] as ((event: KeyboardEvent) => void)[];

/**
 * Removes all key hold listeners that were added by `detectKeyHold`.
 */
export function stopDetectingKeyHold(): void {
    for (const handler of detectKeyHold.handlers) {
        document.removeEventListener('keydown', handler);
    }
    detectKeyHold.handlers = [];
}

/**
 * Creates and maintains a `Set` of currently pressed keys.
 *
 * @returns {Set<string>} A `Set` that dynamically updates with the keys being pressed.
 */
export function createKeyMap(): Set<string> {
    const pressedKeys = new Set<string>();

    const keyDownHandler = (event: KeyboardEvent) => {
        pressedKeys.add(event.key);
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        pressedKeys.delete(event.key);
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    // Function to remove listeners
    createKeyMap.clearListeners = () => {
        document.removeEventListener('keydown', keyDownHandler);
        document.removeEventListener('keyup', keyUpHandler);
    };

    return pressedKeys;
}

/**
 * Clears the `keydown` and `keyup` event listeners created by `createKeyMap`.
 */
createKeyMap.clearListeners = () => {};

/**
 * Sets up a keyboard shortcut that triggers a callback when a specific combination of keys is held down, regardless of order.
 *
 * @param {string[]} keys - An array of keys that constitute the shortcut.
 * @param {() => void} callback - The function to execute when the key combination is active.
 */
export function customShortcut(keys: string[], callback: () => void): void {
    const pressedKeys = new Set<string>();

    const keyDownHandler = (event: KeyboardEvent) => {
        pressedKeys.add(event.key);
        if (keys.every(key => pressedKeys.has(key))) {
            callback();
        }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        pressedKeys.delete(event.key);
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    // Store the handlers for later removal
    customShortcut.handlers.push({ keyDownHandler, keyUpHandler });
}

customShortcut.handlers = [] as { keyDownHandler: (event: KeyboardEvent) => void; keyUpHandler: (event: KeyboardEvent) => void }[];

/**
 * Removes all keyboard shortcut listeners that were added by `customShortcut`.
 */
export function removeCustomShortcuts(): void {
    for (const { keyDownHandler, keyUpHandler } of customShortcut.handlers) {
        document.removeEventListener('keydown', keyDownHandler);
        document.removeEventListener('keyup', keyUpHandler);
    }
    customShortcut.handlers = [];
}

/**
 * Programmatically dispatches a `keydown` event to simulate a key press.
 *
 * @param {string} key - The key to simulate (e.g., 'Enter', 'a').
 * @param {boolean} [ctrlKey=false] - Whether to simulate the Ctrl key being pressed.
 * @param {boolean} [shiftKey=false] - Whether to simulate the Shift key being pressed.
 * @param {boolean} [altKey=false] - Whether to simulate the Alt key being pressed.
 */
export function simulateKeyPress(key: string, ctrlKey = false, shiftKey = false, altKey = false): void {
    const event = new KeyboardEvent('keydown', {
        key,
        ctrlKey,
        shiftKey,
        altKey,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
}