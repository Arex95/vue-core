/**
 * Disables the right-click context menu on the window.
 */
export function disableRightClick(): void {
    const handler = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('contextmenu', handler);

    // Store handler to allow removal
    disableRightClick.handler = handler;
}

disableRightClick.handler = null as any;

/**
 * Enables the right-click context menu on the window.
 */
export function enableRightClick(): void {
    if (disableRightClick.handler) {
        window.removeEventListener('contextmenu', disableRightClick.handler);
    }
}

/**
 * Disables specific mouse buttons.
 * @param {Array<number>} buttons Array of mouse button codes to disable (0 for left, 1 for middle, 2 for right).
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
 * Enables all previously disabled mouse buttons.
 */
export function enableMouseButtons(): void {
    for (const handler of disableMouseButtons.handlers) {
        window.removeEventListener('mousedown', handler);
        window.removeEventListener('contextmenu', handler);
    }
    disableMouseButtons.handlers = [];
}

/**
 * Adds a double-click event listener to a specific element.
 * @param {HTMLElement} element The target element.
 * @param {(event: MouseEvent) => void} callback The callback function to execute on double click.
 */
export function addDoubleClickListener(element: HTMLElement, callback: (event: MouseEvent) => void): void {
    element.addEventListener('dblclick', callback);
}

/**
 * Removes a double-click event listener from a specific element.
 * @param {HTMLElement} element The target element.
 * @param {(event: MouseEvent) => void} callback The callback function to remove.
 */
export function removeDoubleClickListener(element: HTMLElement, callback: (event: MouseEvent) => void): void {
    element.removeEventListener('dblclick', callback);
}

// Example usage:
// addDoubleClickListener(document.body, () => alert('Double clicked!'));

/**
 * Detects a click outside a specific element and triggers a callback.
 * @param {HTMLElement} element The element to detect clicks outside of.
 * @param {() => void} callback The callback function to execute when a click outside is detected.
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
 * Removes the click outside listener for a specific element.
 * @param {HTMLElement} element The element to stop detecting clicks outside of.
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
 * Disables the F12 key and certain key combinations for developer tools.
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
 * Enables or disables the tab navigation (Tab key) on the page.
 * @param {boolean} enable Whether to enable or disable tab navigation.
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
 * Disables the copy (Ctrl + C) functionality on the page.
 */
export function disableCopy(): void {
    document.addEventListener('copy', (event: ClipboardEvent) => {
        event.preventDefault();
        alert('Copying text is disabled on this page.');
    });
}

/**
 * Adds a custom keyboard shortcut to execute a given callback function.
 * @param {string} key The key to trigger the callback.
 * @param {Function} callback The function to execute on the key press.
 * @param {boolean} [ctrlKey=false] Whether Ctrl key should be pressed.
 * @param {boolean} [shiftKey=false] Whether Shift key should be pressed.
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
 * Removes a custom keyboard shortcut by key and modifiers.
 * @param {string} key The key to trigger the callback.
 * @param {boolean} [ctrlKey=false] Whether Ctrl key should be pressed.
 * @param {boolean} [shiftKey=false] Whether Shift key should be pressed.
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
 * Disables specific keys or key combinations.
 * @param {Array<string>} keys Array of key names to disable (e.g., ['F1', 'F5', 'Control+S']).
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
 * Enables keys that were previously disabled using disableSpecificKeys.
 */
export function enableSpecificKeys(): void {
    for (const handler of disableSpecificKeys.handlers) {
        document.removeEventListener('keydown', handler);
    }
    disableSpecificKeys.handlers = [];
}

/**
 * Registers multiple keyboard shortcuts with their respective callback functions.
 * @param {Array<{ key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean, callback: Function }>} shortcuts Array of shortcut objects.
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
 * Unregisters all keyboard shortcuts that were registered with registerKeyboardShortcuts.
 */
export function unregisterKeyboardShortcuts(): void {
    for (const handler of registerKeyboardShortcuts.handlers) {
        document.removeEventListener('keydown', handler);
    }
    registerKeyboardShortcuts.handlers = [];
}

/**
 * Adds a listener for a specific key to trigger a custom event.
 * @param {string} key The key to listen for (e.g., 'Enter', 'Escape').
 * @param {Function} callback The function to execute when the key is pressed.
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
 * Removes all custom key listeners added by addKeyListener.
 */
export function removeKeyListeners(): void {
    for (const handler of addKeyListener.handlers) {
        document.removeEventListener('keydown', handler);
    }
    addKeyListener.handlers = [];
}

/**
 * Detects if a specific key is held down.
 * @param {string} key The key to detect (e.g., 'Shift', 'Control', 'Alt', 'a').
 * @param {Function} onHold Callback function to execute while the key is held down.
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
 * Stops detecting if a specific key is held down.
 */
export function stopDetectingKeyHold(): void {
    for (const handler of detectKeyHold.handlers) {
        document.removeEventListener('keydown', handler);
    }
    detectKeyHold.handlers = [];
}

/**
 * Tracks currently pressed keys and provides a map of active keys.
 * @returns {Set<string>} A set of currently pressed keys.
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
 * Clears listeners for the key map tracking.
 */
createKeyMap.clearListeners = () => {};

/**
 * Sets up custom keyboard shortcuts with flexible order.
 * @param {Array<string>} keys The combination of keys for the shortcut.
 * @param {Function} callback The callback function to execute when the combination is detected.
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
 * Removes all custom keyboard shortcuts added by customShortcut.
 */
export function removeCustomShortcuts(): void {
    for (const { keyDownHandler, keyUpHandler } of customShortcut.handlers) {
        document.removeEventListener('keydown', keyDownHandler);
        document.removeEventListener('keyup', keyUpHandler);
    }
    customShortcut.handlers = [];
}

/**
 * Simulates a key press event.
 * @param {string} key The key to simulate (e.g., 'Enter', 'a').
 * @param {boolean} ctrlKey If true, include Ctrl key in the event.
 * @param {boolean} shiftKey If true, include Shift key in the event.
 * @param {boolean} altKey If true, include Alt key in the event.
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