import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

class DOMPointMock {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  matrixTransform() {
    return this;
  }
}

Object.defineProperty(window, 'DOMPoint', {
  writable: true,
  configurable: true,
  value: DOMPointMock,
});

Object.defineProperty(globalThis, 'DOMPoint', {
  writable: true,
  configurable: true,
  value: DOMPointMock,
});

Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
  writable: true,
  configurable: true,
  value() {
    return {
      inverse() {
        return {};
      },
    };
  },
});

Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  writable: true,
  configurable: true,
  value() {
    return {
      x: 0,
      y: 0,
      width: 1280,
      height: 760,
      top: 0,
      right: 1280,
      bottom: 760,
      left: 0,
      toJSON() {
        return {};
      },
    };
  },
});
