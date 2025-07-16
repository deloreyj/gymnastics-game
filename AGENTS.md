# Gymnastics Game - Agent Guidelines

## Build/Lint/Test Commands
- **Development**: `npm run dev` - Starts Wrangler dev server
- **Deploy**: `npm run deploy` - Deploys to Cloudflare Workers with minification
- **Type Generation**: `npm run cf-typegen` - Generates CloudflareBindings types
- **Install**: `npm install` - Install dependencies
- **No test/lint commands defined** - Add as needed

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, target ESNext
- **Module System**: ESNext modules with Bundler resolution
- **Framework**: Hono framework for Cloudflare Workers
- **JSX**: Use `hono/jsx` for JSX support
- **Imports**: Use named imports from "hono" package
- **Type Safety**: Always pass `CloudflareBindings` as generics to Hono: `new Hono<{ Bindings: CloudflareBindings }>()`
- **File Structure**: Source code in `src/`, static assets in `public/`
- **Entry Point**: `src/index.ts` exports default Hono app
- **Naming**: Use camelCase for variables/functions, PascalCase for types/interfaces
- **Error Handling**: Use Hono's built-in error handling with try-catch blocks
- **Cloudflare Config**: Settings in `wrangler.jsonc`, compatibility date: 2025-07-15