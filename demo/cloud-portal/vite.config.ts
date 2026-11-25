import { sentryConfig } from './app/utils/config/sentry.config';
import { reactRouter } from '@react-router/dev/vite';
import { sentryReactRouter } from '@sentry/react-router';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Workaround for issue with running react router in a production build
//
// See: https://github.com/remix-run/react-router/issues/12568#issuecomment-2629986004

export default defineConfig((config) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const aliases: { [key: string]: string } = {
    '@': resolve(__dirname, './app'),
  };

  return {
    resolve: {
      alias: aliases,
    },
    server: {
      port: 3000,
    },
    optimizeDeps: {
      include: [
        // Top-imported datum-ui subpaths (counts from PR #1205 audit)
        '@datum-cloud/datum-ui/popover', // 9 consumer files
        '@datum-cloud/datum-ui/chart', // 6
        '@datum-cloud/datum-ui/command', // 5
        '@datum-cloud/datum-ui/separator', // 4
        '@datum-cloud/datum-ui/avatar', // 4
        '@datum-cloud/datum-ui/table', // 3
        '@datum-cloud/datum-ui/select', // 3
        '@datum-cloud/datum-ui/button', // heavy use across migrated files
        '@datum-cloud/datum-ui/badge', // heavy use
        '@datum-cloud/datum-ui/utils', // cn helper, 81 consumer files
      ],
    },
    ssr: {
      optimizeDeps: {
        include: ['react-dom/server.node'],
      },
    },
    plugins: [
      tailwindcss(),
      reactRouterHonoServer(),
      process.env.CYPRESS ? react() : reactRouter(),
      tsconfigPaths(),
      sentryReactRouter(
        {
          org: sentryConfig.org,
          project: sentryConfig.project,
          authToken: sentryConfig.authToken,
          release: { name: sentryConfig.release },
        },
        config
      ),
    ],
    build: {
      chunkSizeWarningLimit: 1000, // Increase size limit to 1000kb
      target: 'esnext', // Compiles to modern JavaScript features for latest browsers
      sourcemap: sentryConfig.isSourcemapEnabled ? 'hidden' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Splits heavy vendor packages into stable chunks so feature
            // changes don't invalidate the entire JS payload for repeat visits.
            'vendor-react': ['react', 'react-dom', 'react-router'],
            'vendor-datum-ui': ['@datum-cloud/datum-ui'],
            'vendor-recharts': ['recharts'],
            'vendor-icons': ['lucide-react'],
            'vendor-streamdown': ['streamdown'], // pulls mermaid, elk, shiki — ~5MB
          },
        },
      },
    },
  };
});
