import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPostBySlug } from './blogPosts';
import './BlogArticle.css';

const BlogArticle = ({ slug: slugProp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Get slug from props (SSR) or from URL params (client-side)
  const { slug: slugParam } = useParams();
  const slug = slugProp || slugParam;
  
  const post = getPostBySlug(slug);

  const handleNavigation = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  if (!post) {
    return (
      <div className="blog-page">
        <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
          <h1>Article Not Found</h1>
          <button onClick={() => handleNavigation('/blog')} className="blog-featured-read-btn">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="blog-page">
      {/* Header */}
      <header className={`blog-header ${scrolled ? "blog-header-scrolled" : ""}`}>
        <div className="blog-header-box blog-header-left">
          <img 
            className='blog-logo-image' 
            src='/CrammiFinalUppercase.png' 
            alt="Crammi Logo" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavigation('/')}
          />
        </div>

        <div className="blog-header-box blog-header-center">
          <a onClick={() => handleNavigation('/')} className="blog-nav-link">Home</a>
          <a onClick={() => handleNavigation('/blog')} className="blog-nav-link">Blog</a>
        </div>

        <div className="blog-header-box blog-header-right">
          <button onClick={() => handleNavigation('/signin')} className="blog-header-btn blog-header-btn-login">Log In</button>
          <button className="blog-header-btn blog-header-btn-signup" onClick={() => handleNavigation('/signup')}>
            Use Crammi, It's Free
          </button>
        </div>

        <div className="blog-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <div className={`blog-dropdown ${menuOpen ? "blog-dropdown-show" : ""}`}>
          <a onClick={() => handleNavigation('/')} className="blog-nav-link">Home</a>
          <a onClick={() => handleNavigation('/blog')} className="blog-nav-link">Blog</a>
          <a onClick={() => handleNavigation('/signin')}>Log In</a>
        </div>
      </header>

      {/* Article Header */}
      <article className="blog-article">
        <div className="blog-article-header">
          <div className="blog-article-breadcrumb">
            <a onClick={() => handleNavigation('/blog')} className="blog-breadcrumb-link">Blog</a>
            <span className="blog-breadcrumb-separator">›</span>
            <span className="blog-breadcrumb-current">{post.category}</span>
          </div>
          
          <h1 className="blog-article-title">{post.title}</h1>
          
          <div className="blog-article-meta">
            <div className="blog-meta-author">
              <div className="blog-author-avatar">{post.author[0]}</div>
              <span>{post.author}</span>
            </div>
            <span className="blog-meta-divider">•</span>
            <span className="blog-meta-date">{post.date}</span>
            <span className="blog-meta-divider">•</span>
            <span className="blog-meta-read-time">{post.readTime}</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="blog-article-image-wrapper">
          <img src={post.image} alt={post.title} className="blog-article-image" />
        </div>

        {/* Article Content */}
        <div className="blog-article-content">
          <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
        </div>

        {/* Share Section */}
        <div className="blog-article-footer">
          <button onClick={() => handleNavigation('/blog')} className="blog-back-btn">
            ← Back to Blog
          </button>
        </div>
      </article>

      {/* Newsletter CTA */}
      <section className="blog-newsletter">
        <div className="blog-newsletter-container">
          <div className="blog-newsletter-content">
            <h2 className="blog-newsletter-title">Try Crammi yourself 🧠</h2>
            <p className="blog-newsletter-subtitle">
            Anecdotes might not be enough. Get your hands dirty.
            </p>
            <div className="blog-newsletter-form">
              <button className="landingPrimary-button large" onClick={() => handleNavigation('/signup')}>
                <span>Get Started for Free</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="blog-footer">
        <div className="blog-footer-content">
          <div className="blog-footer-brand">
            <div className="blog-footer-logo">
              <img className='blog-logo-image' src='/CrammiFinalUppercase.png' alt="Crammi Logo"/>
            </div>
            <p className="blog-footer-tagline">Study smarter, not harder</p>
          </div>
          <div className="blog-footer-links">
            <div className="blog-footer-column">
            <h4 className="blog-footer-heading">Product</h4>
              <a onClick={() => handleNavigation('/#how-it-works')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Features</a>
              <a onClick={() => handleNavigation('/#pricing')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Pricing</a>
              <a onClick={() => handleNavigation('/blog')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Blog</a>

            </div>
            <div className="blog-footer-column">
              <h4 className="blog-footer-heading">Company</h4>
              <a onClick={() => handleNavigation('/support')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Contact</a>
            </div>
            <div className="blog-footer-column">
              <h4 className="blog-footer-heading">Legal</h4>
              <a onClick={() => handleNavigation('/privacy-policy')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Privacy</a>
              <a onClick={() => handleNavigation('/terms-of-service')} className="blog-footer-link" style={{ cursor: 'pointer' }}>Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="blog-footer-bottom">
          <p>© 2026 Crammi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper function to format markdown-like content to HTML
function formatContent(content) {
  if (!content) return '';
  
  const lines = content.split('\n');
  const result = [];
  let inList = false;
  let listType = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      return;
    }
    
    if (trimmed.startsWith('### ')) {
      if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      result.push(`<h3>${trimmed.substring(4)}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      result.push(`<h2>${trimmed.substring(3)}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      result.push(`<h1>${trimmed.substring(2)}</h1>`);
    }
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push('</ul>');
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const text = trimmed.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      result.push(`<li>${text}</li>`);
    }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push('</ol>');
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const text = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      result.push(`<li>${text}</li>`);
    }
    else {
      if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      const processedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      result.push(`<p>${processedLine}</p>`);
    }
  });

  if (inList) {
    result.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  return result.join('');
}

export default BlogArticle;