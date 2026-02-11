// Azure App Service entry point
// This file bootstraps the TypeScript server using tsx
import('tsx/esm').then(() => {
  import('./server/index.ts');
});
