/**
 * Ambient declarations for non-TS imports.
 *
 * Next.js handles CSS side-effect imports at build time, but `tsc --noEmit`
 * needs a module declaration for them or it reports TS2307.
 */
declare module "*.css"
declare module "*.scss"
