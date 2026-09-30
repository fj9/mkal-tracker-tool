/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly VITE_PUBLIC_BUILD?: string;
}
declare module "*.md?raw" {
  const content: string;
  export default content;
}
