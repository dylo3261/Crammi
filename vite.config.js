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
        '/support',          
        '/privacy-policy',    
        '/terms-of-service',  
        '/blog',
        ...blogPosts.map(post => `/blog/${post.slug}`)
      ]
      
    })
  ]
});