import React, { useState } from 'react';
import './Blog.css';
import { useNavigate,Link } from 'react-router-dom';
import { blogPosts, getPostsByCategory, getFeaturedPost } from './blogPosts';

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = typeof window !== 'undefined' ? useNavigate() : () => {};

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEmailSignUp = () => {
    if (typeof window !== 'undefined') {
      navigate('/signup');
    }
  };

  const handleEmailSignIn = () => {
    if (typeof window !== 'undefined') {
      navigate('/signin');
    }
  };

  const handleHome = () => {
    if (typeof window !== 'undefined') {
      navigate('/');
    }
  };

  const handleArticleClick = (slug) => {
    if (typeof window !== 'undefined') {
      navigate(`/blog/${slug}`);
    }
  };

  const categories = ['All', 'Learning', 'Study Tips', 'Technology', 'Productivity'];
  const filteredPosts = getPostsByCategory(selectedCategory);
  const featuredPost = getFeaturedPost();
  // Only exclude featured post from regular grid if we're showing it in featured section
  const regularPosts = selectedCategory === 'All' 
    ? filteredPosts.filter(post => !post.featured)
    : filteredPosts;

  return (
    <div className="blog-page">
      {/* Header */}
      <header className={`blog-header ${scrolled ? "blog-header-scrolled" : ""}`}>
      <a  href="/" className="blog-header-box blog-header-left">
        <img 
          className='blog-logo-image' 
          src='/CrammiFinalUppercase.png' 
          alt="Crammi Logo" 
        />
      </a>

        <div className="blog-header-box blog-header-center">
        <a  href="/" className="blog-nav-link">Home</a>
        <a href="#featured" className="blog-nav-link">Featured</a>
          <a href="#articles" className="blog-nav-link">Articles</a>
        </div>

        <div className="blog-header-box blog-header-right">
        <a href="/signin" className="header-btn headerButton">Log In</a>          
          <button className="blog-header-btn blog-header-btn-signup" onClick={handleEmailSignUp}>
            Use Crammi, It's Free
          </button>
        </div>

        <div className="blog-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <div className={`blog-dropdown ${menuOpen ? "blog-dropdown-show" : ""}`}>
          <a onClick={handleHome} className="blog-nav-link">Home</a>
          <a href="#featured">Featured</a>
          <a href="#articles">Articles</a>
          <a onClick={handleEmailSignIn}>Log In</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">
            <span className="blog-gradient-text">Blog</span>
          </h1>
          <p className="blog-hero-subtitle">
            Insights, tips, and stories to help you learn better and achieve more
          </p>
        </div>
      </section>

      {/* Filter Categories */}
      <section className="blog-controls">
        <div className="blog-controls-container">
          <div className="blog-categories">
            {categories.map(category => (
              <button
                key={category}
                className={`blog-category-btn ${selectedCategory === category ? 'blog-category-btn-active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {selectedCategory === 'All' && featuredPost && (
        <section id="featured" className="blog-featured-section">
          <div className="blog-featured-container">
            <div className="blog-featured-badge">Featured Article</div>
             <a 
                href={`/blog/${featuredPost.slug}`}
                className="blog-featured-post"
              >
              <div className="blog-featured-image-wrapper">
                <img src={featuredPost.image} alt={featuredPost.title} className="blog-featured-image" />
                <div className="blog-featured-category-badge">{featuredPost.category}</div>
              </div>
              <div className="blog-featured-content">
                <h2 className="blog-featured-title">{featuredPost.title}</h2>
                <p className="blog-featured-excerpt">{featuredPost.excerpt}</p>
                <div className="blog-featured-meta">
                  <div className="blog-meta-author">
                    <div className="blog-author-avatar">{featuredPost.author[0]}</div>
                    <span>{featuredPost.author}</span>
                  </div>
                  <span className="blog-meta-divider">•</span>
                  <span className="blog-meta-date">{featuredPost.date}</span>
                  <span className="blog-meta-divider">•</span>
                  <span className="blog-meta-read-time">{featuredPost.readTime}</span>
                </div>
                <button className="blog-featured-read-btn">
                  Read Article
                  <span className="blog-arrow">→</span>
                </button>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section id="articles" className="blog-grid-section">
        <div className="blog-grid-container">
          {regularPosts.length > 0 ? (
            <div className="blog-grid">
              {regularPosts.map(post => (
                <a 
                key={post.id}  
                href={`/blog/${post.slug}`}
                className="blog-card"
              >
                  <div className="blog-card-image-wrapper">
                    <img src={post.image} alt={post.title} className="blog-card-image" />
                    <div className="blog-card-category">{post.category}</div>
                  </div>
                  <div className="blog-card-content">
                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <div className="blog-card-meta">
                      <div className="blog-card-meta-author">
                        <div className="blog-card-author-avatar">{post.author[0]}</div>
                        <span>{post.author}</span>
                      </div>
                      <span className="blog-card-meta-divider">•</span>
                      <span className="blog-card-meta-date">{post.date}</span>
                    </div>
                    <div className="blog-card-footer">
                      <span className="blog-card-read-time">{post.readTime}</span>
                      <button className="blog-card-read-btn">
                        Read More →
                      </button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="blog-no-results">
              <h3 className="blog-no-results-title">No articles found</h3>
              <p className="blog-no-results-text">Try adjusting your filter to find what you're looking for.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="blog-newsletter">
        <div className="blog-newsletter-container">
          <div className="blog-newsletter-content">
            <h2 className="blog-newsletter-title">Stay Updated 💡</h2>
            <p className="blog-newsletter-subtitle">
              Keep up with the latest news and updates from Crammi.
            </p>
            <div className="blog-newsletter-form">
              <button className="landingPrimary-button large" onClick={handleEmailSignUp}>
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
            <a href="/#how-it-works" className="blog-footer-link">Features</a>
            <a href="/#pricing" className="blog-footer-link">Pricing</a>
            <a href="/blog" className="blog-footer-link">Blog</a>
          </div>
          <div className="blog-footer-column">
            <h4 className="blog-footer-heading">Company</h4>
            <a href="/support" className="blog-footer-link">Contact</a>
          </div>
          <div className="blog-footer-column">
            <h4 className="blog-footer-heading">Legal</h4>
            <a href="/privacy-policy" className="blog-footer-link">Privacy</a>
            <a href="/terms-of-service" className="blog-footer-link">Terms of Service</a>
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

export default Blog;