declare module "vite-plugin-prerender" {
  export function Prerenderer(options?: Record<string, unknown>): import("vite").Plugin;
}

