import { renderToString } from 'react-dom/server';
import LandingPage from './LandingPage/LandingPage';
import Support from './LandingPage/Support';
import PrivacyPolicy from './LandingPage/PrivacyPolicy';
import TermsOfService from './LandingPage/Terms';
import Blog from './LandingPage/blog';
import BlogArticle from './LandingPage/BlogArticle';
import { getPostBySlug, blogPosts } from './LandingPage/blogPosts';

export async function prerender(data) {
  let Component;
  let componentProps = {};
  let title = 'Crammi | Free AI Study Tool to Instantly Turn Notes into Flashcards, Exams, and Quizzes';
  
  // Check if URL is a blog article (e.g., /blog/article-slug)
  const blogArticleMatch = data.url.match(/^\/blog\/([a-z0-9-]+)$/);
  
  if (blogArticleMatch) {
    // It's a blog article - get the slug from the URL
    const slug = blogArticleMatch[1];
    const post = getPostBySlug(slug);
    
    if (post) {
      // Article exists - render it with proper title and PASS SLUG AS PROP
      Component = BlogArticle;
      componentProps = { slug };  // THIS IS THE KEY LINE
      title = `${post.title} - Crammi Blog`;
    } else {
      // Article not found - fallback to blog index
      Component = Blog;
      title = 'Blog - Crammi | Study Tips & Learning Insights';
    }
  } else {
    // Regular routes (your existing switch)
    switch(data.url) {
      case '/':
        Component = LandingPage;
        break;
      case '/support':
        Component = Support;
        title = 'Support - Crammi';
        break;
      case '/privacy-policy':
        Component = PrivacyPolicy;
        title = 'Privacy Policy - Crammi';
        break;
      case '/terms-of-service':
        Component = TermsOfService;
        title = 'Terms of Service - Crammi';
        break;
      case '/blog':
        Component = Blog;
        title = 'Blog - Crammi | Study Tips & Learning Insights';
        break;
      default:
        Component = LandingPage;
    }
  }

  // PASS THE PROPS HERE
  const html = renderToString(<Component {...componentProps} />);

  return { 
    html,
    head: {
      lang: 'en',
      title: title
    }
  };
}