/// <reference types="vitest/globals" />
/// <reference lib="dom" />

import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }

  // vitest/jsdom expose window via globalThis
  interface Global {
    matchMedia?: Window["matchMedia"];
  }
}

// // add jest-dom matchers to Vitest's expect
expect.extend(matchers);

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof window !== "undefined" && !window.matchMedia) {
  throw new Error("matchMedia polyfill failed to initialize");
}

// Initialize localStorage for tests
if (typeof window !== "undefined") {
  let store: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
}
