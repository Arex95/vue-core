import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";

let storeEncryptedItem: typeof import("@utils/storage").storeEncryptedItem;
let getDecryptedItem: typeof import("@utils/storage").getDecryptedItem;
let encrypt: ReturnType<typeof vi.fn>;
let decrypt: ReturnType<typeof vi.fn>;

let localStorageMock: {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};
let sessionStorageMock: {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

describe("Storage Module", () => {
  let originalWindow: typeof window;

  beforeAll(async () => {
    let _localStorageStore: { [key: string]: string } = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => _localStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        _localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete _localStorageStore[key];
      }),
      clear: vi.fn(() => {
        _localStorageStore = {};
      }),
    };

    let _sessionStorageStore: { [key: string]: string } = {};
    sessionStorageMock = {
      getItem: vi.fn((key: string) => _sessionStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        _sessionStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete _sessionStorageStore[key];
      }),
      clear: vi.fn(() => {
        _sessionStorageStore = {};
      }),
    };

    encrypt = vi.fn((value: string, secret: string) =>
      Promise.resolve(`encrypted_${value}`)
    );
    decrypt = vi.fn((encryptedValue: string, secret: string) => {
      if (encryptedValue === "malformed_encrypted_data") {
        throw new Error("Decryption failed due to malformed data");
      }
      return Promise.resolve(encryptedValue.replace("encrypted_", ""));
    });

    vi.doMock("@utils/encryption", () => ({
      encrypt,
      decrypt,
    }));

    originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });

    const storageModule = await vi.importActual<
      typeof import("@utils/storage")
    >("@utils/storage");
    storeEncryptedItem = storageModule.storeEncryptedItem;
    getDecryptedItem = storageModule.getDecryptedItem;
  });

  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    encrypt.mockClear();
    decrypt.mockClear();

    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  it("should encrypt and store an item in localStorage when rememberMe is true", async () => {
    const key = "testKey";
    const value = "testValue";
    const secretKey = "testSecret";
    const isRememberMe = true;

    await storeEncryptedItem(key, value, secretKey, isRememberMe);

    expect(encrypt).toHaveBeenCalledWith(value, secretKey);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      key,
      `encrypted_${value}`
    );
    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.getItem(key)).toBe(`encrypted_${value}`);
  });

  it("should encrypt and store an item in sessionStorage when rememberMe is false", async () => {
    const key = "sessionKey";
    const value = "sessionValue";
    const secretKey = "sessionSecret";
    const isRememberMe = false;

    await storeEncryptedItem(key, value, secretKey, isRememberMe);

    expect(encrypt).toHaveBeenCalledWith(value, secretKey);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      key,
      `encrypted_${value}`
    );
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(sessionStorageMock.getItem(key)).toBe(`encrypted_${value}`);
  });

  it("should throw an error if window is undefined during storeEncryptedItem", async () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const key = "noWindowKey";
    const value = "noWindowValue";
    const secretKey = "noWindowSecret";
    const isRememberMe = true;

    await expect(
      storeEncryptedItem(key, value, secretKey, isRememberMe)
    ).rejects.toThrow("Cannot access storage: window is not defined.");
  });

  it("should retrieve and decrypt an item from localStorage when found and rememberMe is true", async () => {
    const key = "retrievedKey";
    const value = "originalValue";
    const secretKey = "retrievedSecret";
    const isRememberMe = true;

    localStorageMock.setItem(key, `encrypted_${value}`);

    const decrypted = await getDecryptedItem(key, secretKey, isRememberMe);

    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(decrypt).toHaveBeenCalledWith(`encrypted_${value}`, secretKey);
    expect(decrypted).toBe(value);
  });

  it("should retrieve and decrypt an item from sessionStorage when found and rememberMe is false", async () => {
    const key = "retrievedSessionKey";
    const value = "originalSessionValue";
    const secretKey = "retrievedSessionSecret";
    const isRememberMe = false;

    sessionStorageMock.setItem(key, `encrypted_${value}`);

    const decrypted = await getDecryptedItem(key, secretKey, isRememberMe);

    expect(sessionStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(decrypt).toHaveBeenCalledWith(`encrypted_${value}`, secretKey);
    expect(decrypted).toBe(value);
  });

  it("should return null if the item is not found in storage", async () => {
    const key = "nonExistentKey";
    const secretKey = "someSecret";
    const isRememberMe = true;

    const decrypted = await getDecryptedItem(key, secretKey, isRememberMe);

    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(decrypt).not.toHaveBeenCalled();
    expect(decrypted).toBeNull();
  });

  it("should return null if decryption fails", async () => {
    const key = "failingDecryptionKey";
    const secretKey = "secretForFailure";
    const isRememberMe = true;

    localStorageMock.setItem(key, "malformed_encrypted_data");

    const decrypted = await getDecryptedItem(key, secretKey, isRememberMe);

    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(decrypt).toHaveBeenCalledWith("malformed_encrypted_data", secretKey);
    expect(decrypted).toBeNull();
  });

  it("should return null if window is undefined during getDecryptedItem", async () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const key = "noWindowKey";
    const secretKey = "noWindowSecret";
    const isRememberMe = true;

    const decrypted = await getDecryptedItem(key, secretKey, isRememberMe);

    expect(localStorageMock.getItem).not.toHaveBeenCalled();
    expect(sessionStorageMock.getItem).not.toHaveBeenCalled();
    expect(decrypt).not.toHaveBeenCalled();
    expect(decrypted).toBeNull();
  });
});
