// src/prerender.jsx
import { renderToString } from 'react-dom/server';
import LandingPage from './LandingPage/LandingPage';
import Support from './LandingPage/Support';
import PrivacyPolicy from './LandingPage/PrivacyPolicy';
import TermsOfService from './LandingPage/Terms';
import Blog from './LandingPage/blog';
import BlogArticle from './LandingPage/BlogArticle';
import { getPostBySlug } from './LandingPage/blogPosts';

export async function prerender(data) {
  let Component;
  let componentProps = {};
  let title = 'Crammi | Free AI Study Tool to Instantly Turn Notes into Flashcards, Exams, and Quizzes';
  let description = 'Upload PDFs, handwritten notes, or snap a photo — Crammi automatically creates flashcards, quizzes and practice exams from your study materials. Study smarter, not harder.';
  let url = `https://crammi.com${data.url}`;
  let keywords = 'notes to flashcards, AI study app, automatic quiz generator, PDF to flashcards, study tools, flashcard maker, quiz maker, exam prep, handwritten notes scanner, practice exams';
  
  // Check if URL is a blog article
  const blogArticleMatch = data.url.match(/^\/blog\/([a-z0-9-]+)$/);
  
  if (blogArticleMatch) {
    const slug = blogArticleMatch[1];
    const post = getPostBySlug(slug);
    
    if (post) {
      Component = BlogArticle;
      componentProps = { slug };
      title = `${post.title} | Crammi Blog`;
      description = post.metaDescription || post.excerpt;
      keywords = post.keywords ? post.keywords.join(', ') : keywords;
    } else {
      Component = Blog;
      title = 'Blog - Crammi | Study Tips & Learning Insights';
      description = 'Discover effective study techniques, productivity tips, and insights about AI-powered learning tools to help you succeed in college.';
    }
  } else {
    switch(data.url) {
      case '/':
        Component = LandingPage;
        break;
      case '/support':
        Component = Support;
        title = 'Support - Crammi';
        description = 'Get help with Crammi. Contact our support team for assistance with your AI study tool questions.';
        break;
      case '/privacy-policy':
        Component = PrivacyPolicy;
        title = 'Privacy Policy - Crammi';
        description = 'Learn how Crammi protects your privacy and handles your data.';
        break;
      case '/terms-of-service':
        Component = TermsOfService;
        title = 'Terms of Service - Crammi';
        description = 'Read the terms of service for using Crammi, the AI-powered study tool.';
        break;
      case '/blog':
        Component = Blog;
        title = 'Blog - Crammi | Study Tips & Learning Insights';
        description = 'Discover effective study techniques, productivity tips, and insights about AI-powered learning tools to help you succeed in college.';
        break;
      default:
        Component = LandingPage;
    }
  }

  const html = renderToString(<Component {...componentProps} />);

  return { 
    html,
    head: {
      lang: 'en',
      title: title,
      elements: new Set([
        // Standard meta tags
        { type: 'meta', props: { name: 'description', content: description } },
        { type: 'meta', props: { name: 'keywords', content: keywords } },
        { type: 'meta', props: { name: 'author', content: 'Crammi' } },
        { type: 'meta', props: { name: 'robots', content: 'index, follow' } },
        { type: 'meta', props: { name: 'language', content: 'English' } },
        
        // Open Graph
        { type: 'meta', props: { property: 'og:type', content: 'website' } },
        { type: 'meta', props: { property: 'og:url', content: url } },
        { type: 'meta', props: { property: 'og:title', content: title } },
        { type: 'meta', props: { property: 'og:description', content: description } },
        { type: 'meta', props: { property: 'og:image', content: 'https://crammi.com/cropped_circle_image.png' } },
        { type: 'meta', props: { property: 'og:site_name', content: 'Crammi' } },
        
        // Twitter
        { type: 'meta', props: { property: 'twitter:card', content: 'summary_large_image' } },
        { type: 'meta', props: { property: 'twitter:url', content: url } },
        { type: 'meta', props: { property: 'twitter:title', content: title } },
        { type: 'meta', props: { property: 'twitter:description', content: description } },
        { type: 'meta', props: { property: 'twitter:image', content: 'https://crammi.com/cropped_circle_image.png' } },
        
        // Canonical URL
        { type: 'link', props: { rel: 'canonical', href: url } },
      ]),
    },
  };
}