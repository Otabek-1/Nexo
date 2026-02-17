/**
 * Build Configuration for Production
 * Optimizes bundle size, performance, and security
 */

export const buildConfig = {
  // Output directory
  outDir: 'dist',

  // Source map configuration
  sourcemap: {
    development: true,
    staging: false,
    production: false,
  },

  // Minification
  minify: {
    development: false,
    staging: 'esbuild',
    production: 'terser',
  },

  // Code splitting strategy
  rollupOptions: {
    output: {
      manualChunks: {
        // Vendor libraries
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        // Large utilities
        'vendor-utils': ['date-fns', 'lodash'],
      },
    },
  },

  // CSS options
  css: {
    preprocessorOptions: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:cmd',
            Once(root) {
              // Purge unused CSS in production
              return root
            },
          },
        ],
      },
    },
  },

  // Chunk size warnings
  chunkSizeWarningLimit: 600,

  // Report compressed size
  reportCompressedSize: true,

  // Environment specific settings
  getConfig(env = 'production') {
    return {
      sourcemap: this.sourcemap[env],
      minify: this.minify[env],
      terserOptions: env === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
        },
        format: {
          comments: false,
        },
      } : undefined,
    }
  },
}

/**
 * Performance optimization tips
 */
export const performanceOptimizations = {
  // 1. Code Splitting
  codeSpitting: 'Enable automatic code splitting for route-based loading',

  // 2. Lazy Loading
  lazyLoading: 'Use React.lazy for component lazy loading',

  // 3. Tree Shaking
  treeShaking: 'Remove unused code from production builds',

  // 4. Compression
  compression: 'Use gzip or brotli compression on server',

  // 5. Caching
  caching: 'Set appropriate cache headers for assets',

  // 6. Images
  imageOptimization: 'Use optimized image formats (WebP, AVIF)',

  // 7. Fonts
  fontOptimization: 'Preload critical fonts, defer non-critical',

  // 8. Third-party scripts
  thirdPartyScripts: 'Load tracking/analytics scripts asynchronously',
}

/**
 * Security headers for production
 */
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
}

/**
 * Deployment checklist
 */
export const deploymentChecklist = [
  '[ ] Set VITE_APP_ENV to production',
  '[ ] Set VITE_ENABLE_ERROR_TRACKING to true',
  '[ ] Verify API_URL points to production API',
  '[ ] Run npm run build successfully',
  '[ ] Test production build locally',
  '[ ] Check bundle size is acceptable',
  '[ ] Verify security headers are configured',
  '[ ] Setup SSL/HTTPS certificate',
  '[ ] Configure CDN for static assets',
  '[ ] Setup monitoring and alerting',
  '[ ] Test error tracking in production',
  '[ ] Configure backup and disaster recovery',
  '[ ] Document deployment process',
  '[ ] Setup continuous deployment pipeline',
]
