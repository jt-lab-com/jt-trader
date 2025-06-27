declare global {
  declare const __SITE_API_HOST__: string;
  declare const __DEV__: boolean;
  declare const __YANDEX_METRIKA_ID__: string;
  declare const __AUTH_LINK__: string;

  interface Window {
    ym: (...args: any[]) => void;
  }
}

export {};
