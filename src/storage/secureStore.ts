import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

// SecureStore keys must be [A-Za-z0-9._-] only (no ":" etc.)
const KEY_PREFIX = 'pet-track.';

function k(name: string) {
  return `${KEY_PREFIX}${name}`;
}

export const secureStorage: StateStorage = {
  getItem: async (name) => {
    const value = await SecureStore.getItemAsync(k(name));
    return value ?? null;
  },
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(k(name), value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(k(name));
  },
};

