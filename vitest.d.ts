import 'vitest';

declare module 'vitest' {
  interface Assertion<R = unknown> {
    toBeVisible(): Promise<void>;
    toBeHidden(): Promise<void>;
    toBeEnabled(): Promise<void>;
    toBeDisabled(): Promise<void>;
    toBeChecked(): Promise<void>;
    toHaveText(expected: string | RegExp): Promise<void>;
    toHaveAttribute(name: string, value?: string): Promise<void>;
    toHaveURL(expected: string | RegExp): Promise<void>;
    toHaveTitle(expected: string | RegExp): Promise<void>;
    toHaveCount(expected: number): Promise<void>;
  }
}
