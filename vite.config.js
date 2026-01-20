import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { blogPosts } from './src/LandingPage/blogPosts';

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      additionalPrerenderRoutes: [
        '/Support', 
        '/PrivacyPolicy', 
        '/TermsOfService',
        '/blog',
        // Add all blog post routes dynamically
        ...blogPosts.map(post => `/blog/${post.slug}`)
      ]
    })
  ]
});