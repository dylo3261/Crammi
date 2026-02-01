import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { signInWithRedirect } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = typeof window !== 'undefined' ? useNavigate() : () => {};
  const [scrollY, setScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const dropdownRef = useRef(null);
  const hamburgerRef = useRef(null);
  const [activeInstruction, setActiveInstruction] = useState(1);

  useEffect(() => {
    // Small delay ensures smooth animation start
    const timer = setTimeout(() => {
      document.documentElement.classList.add('hydrated');
    }, 50);
    
    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('hydrated');
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) && 
        hamburgerRef.current && 
        !hamburgerRef.current.contains(event.target) &&
        menuOpen
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

  const handleGoogleSignUp = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem('oauth_source', '/signup');
      await signInWithRedirect({
        provider: 'Google'
      });
    } catch (error) {
      sessionStorage.removeItem('oauth_source');
      console.error('Google sign up error:', error);
    }
  };

  const features = [
    {
      icon: '📝',
      title: 'Handwritten Notes',
      description: 'Snap a pic of your notes and watch them transform into study materials'
    },
    {
      icon: '📄',
      title: 'PDF Upload',
      description: 'Drop any PDF and get instant quizzes, flashcards, and practice exams'
    },
    {
      icon: '🤖',
      title: 'AI-Powered',
      description: 'Smart algorithms that understand your content and create perfect study aids'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'From upload to study materials in seconds, not hours'
    },
    {
      icon: '🎯',
      title: 'Exam Ready',
      description: 'Practice tests that mirror real exam formats and difficulty'
    },
    {
      icon: '💡',
      title: 'Smart Learning',
      description: 'Adaptive flashcards that focus on what you need to review most'
    }
  ];

  const subjects = [
    'Mathematics 📐',
    'Biology 🧬',
    'Chemistry ⚗️',
    'Physics 🔬',
    'History 📚',
    'Literature 📖',
    'Computer Science 💻',
    'Economics 📊',
    'Psychology 🧠',
    'Foreign Languages 🌍'
  ];

  const specialInstructions = [
    "Give me exactly 30 questions",
    "Focus on Chapter 3",
    "Make it true or false",
    "Only use my notes",
    "Make the flashcards hard",
    "Make the difficulty easy",
    "Focus on page 67's concepts",
    "Give me exactly 50 cards",
    "Add detailed explanations"
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🌱',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for trying out Crammi',
      features: [
        '3 uploads per month',
        'Up to 5 photos per upload',
        'Max 15 flashcards per set',
        'Max 10 exam questions',
        'Max 8 quiz questions',
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      emoji: '⚡',
      price: { monthly: 3.99, annual: 39.99 },
      description: 'Great for regular students',
      features: [
        '50 uploads per month',
        'Up to 20 photos per upload',
        'Max 50 flashcards per set',
        'Max 25 exam questions',
        'Max 15 quiz questions',
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      emoji: '🚀',
      price: { monthly: 9.99, annual: 99.99 },
      description: 'For serious students who need unlimited power',
      features: [
        'Unlimited uploads',
        '*NEW* Course Mode (x5/month)',
        'Up to 50 photos per upload',
        'Max 100 flashcards per set',
        'Max 60 exam questions',
        'Max 30 quiz questions',
      ],
    
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        {/* Left Logo */}
        <div className="header-box left-box">
          <img className='landingPageLogo' src='/CrammiFinalUppercase.png' alt="Crammi Logo" />
        </div>

        {/* Center Links */}
        <div className="header-box center-box">
          <a href="#how-it-works" className="centerBoxButtons">Product</a>
          <a href="#pricing" className="centerBoxButtons">Pricing</a>
          <a href="/blog" className="centerBoxButtons">Blog</a>

        </div>

        {/* Right Buttons */}
        <div className="header-box right-box">
        <a href="/signin" className="header-btn headerButton">Log In</a>          
        <a href="/signup" className="header-btn outline">
          <span className='useCrammi'>Use Crammi, </span> It's Free
        </a>
        </div>

        {/* Hamburger */}
        <div ref={hamburgerRef} className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Dropdown */}
        <div ref={dropdownRef} className={`dropdown ${menuOpen ? "show" : ""}`}>
          <a href="#how-it-works">Product</a>
          <a href="#pricing">Pricing</a>
          <a href='/blog'>Blog</a>
          <a onClick={handleEmailSignIn}>Log In</a>

        </div>
      </header>

      {/* Hero Section */}
      <section className="section-one">
        <div className="box">
          <h1 className="sectionOneTitle">
            Say goodbye to slow learning. <span className="gradient-text">Effortless study starts here.</span>
          </h1>
          <h2 className="description">
            From handwritten notes to PDFs and prompts, Crammi makes study
            materials instantly ready as quizzes, flashcards, and exams. 🚀
          </h2>
          <div className="buttonGroup">
            <button className="landingSignUpButton" onClick={handleEmailSignUp}>
              <span className="useCrammi">Sign Up,</span> It's Free <span className="arrow">→</span>
            </button>
            <button className="googleSignUp" onClick={handleGoogleSignUp}>
              <img src={'/GoogleLogo.png'} alt="Google logo" className="google-logo-img" />
              Sign Up with Google
            </button>
          </div>
          <p className='bySigningUp'>
          By signing up, you agree to our{' '}
          <a href="/terms-of-service" className='bySigningUpSpan'>
            Terms of service
          </a>
          {' '}and{' '}
          <a href="/privacy-policy" className='bySigningUpSpan'>
            Privacy Policy.
          </a>
        </p>
      </div>
        <div className="box hero-visual-box">
          <div className="floating-card card-1">
            <div className="card-icon">📝</div>
            <div className="card-text">Upload Notes</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">⚡</div>
            <div className="card-text">AI Processing</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">🎯</div>
            <div className="card-text">Study Materials Ready!</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-header">
          <h2 className="section-title">Everything you need to ace your exams 🎓</h2>
          <p className="section-subtitle">Powerful features designed to make studying effortless</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects Section */}
      <section className="subjects">
        <h3 className="subjects-title">Any Subject, Any Time.</h3>
        <p className="subjects-subtitle">Crammi has no boundaries. Just endless learning. 🌟</p>
        <div className="scrolling-banner">
          <div className="fade-left"></div>
          <div className="scroll-track">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="subject-tags">
                {subjects.map((subject, idx) => (
                  <div key={idx} className="subject-tag">{subject}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="fade-right"></div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-it-works-header">
          <h2 className="section-title">How Crammi Works ⚙️</h2>
          <p className="section-subtitle">Three simple steps to transform your study routine</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📤</div>
            <h3 className="step-title">Upload Your Content</h3>
            <p className="step-description">Take a photo of handwritten notes, upload a PDF, or paste text</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3 className="step-title">AI Does the Work</h3>
            <p className="step-description">Our AI analyzes your content and creates perfect study materials</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">🎯</div>
            <h3 className="step-title">Start Studying</h3>
            <p className="step-description">Access quizzes, flashcards, and practice exams instantly</p>
          </div>
        </div>
      </section>

      {/* Special Instructions Section */}
      <section className="special-instructions">
        <div className="special-instructions-content">
            <div className="special-instructions-text">
            <h2 className="section-title-special">Customize with Special Instructions ✨</h2>
            <p className="section-subtitle">
                Take full control of your study materials. Special instructions allow you to provide context or specific requirements for your uploads. Specify topics to focus on, whether to use only your notes or create new content, formatting preferences like true/false, or the number of questions within your account limits.
            </p>
            <div className="instruction-examples">
                <div className="example-item">
                <span className="example-icon">🎯</span>
                <span className="example-text">Focus on specific topics</span>
                </div>
                <div className="example-item">
                <span className="example-icon">📝</span>
                <span className="example-text">Choose question formats</span>
                </div>
                <div className="example-item">
                <span className="example-icon">⚙️</span>
                <span className="example-text">Set custom preferences</span>
                </div>
            </div>
            </div>
            <div className="special-instructions-visual">
            <div className="instruction-box-container">
                <div className="instruction-carousel">
                <div className="instruction-set">
                    {/* Repeat the instructions 3 times for smooth infinite scroll */}
                    {[...Array(3)].map((_, setIndex) => (
                    <React.Fragment key={setIndex}>
                        {specialInstructions.map((instruction, index) => {
                        // Calculate which item should be active based on animation timing
                        // Middle item (index 1) of first set is active initially
                        const isActive = setIndex === 0 && index === 1;
                        return (
                            <div 
                            key={`set${setIndex}-${index}`} 
                            className={`instruction-item ${isActive ? 'active' : ''}`}
                            style={{
                                animationDelay: `${index * 1.5}s`
                            }}
                            >
                            {instruction}
                            </div>
                        );
                        })}
                    </React.Fragment>
                    ))}
                </div>
                </div>
                <div className="instruction-input-box">
                <span className="input-placeholder">Special Instructions...</span>
                </div>
            </div>
            </div>
        </div>
      </section>
      {/* Repeat the instructions 3 times for smooth infinite scroll */}

{/* Course Mode Section */}
<section className="landing-course-mode-section">
        <div className="landing-course-mode-content">
            <div className="landing-course-mode-visual">
              <div className="landing-document-stack-container">
                <div className="landing-upload-zone">
                  <div className="landing-upload-icon">📤</div>
                  <div className="landing-upload-text">Drop Your Semester</div>
                </div>
                
                <div className="landing-flying-documents">
                  {[
                    { emoji: '📄', label: 'Lecture 1', delay: 0 },
                    { emoji: '📑', label: 'Slides Ch.3', delay: 0.3 },
                    { emoji: '📕', label: 'Lecture 32', delay: 0.6 },
                    { emoji: '📝', label: 'Lecture Notes', delay: 0.9 },
                    { emoji: '📊', label: 'Data Set', delay: 1.2 },
                    { emoji: '📘', label: 'Chapter 1-25', delay: 1.5 }
                  ].map((doc, index) => (
                    <div 
                      key={index} 
                      className="landing-flying-doc"
                      style={{ animationDelay: `${doc.delay}s` }}
                    >
                      <div className="landing-doc-emoji">{doc.emoji}</div>
                      <div className="landing-doc-label">{doc.label}</div>
                    </div>
                  ))}
                </div>

                <div className="landing-ai-processor">
                  <div className="landing-processor-glow"></div>
                  <div className="landing-processor-core">
                    <div className="landing-ai-icon">🤖</div>
                    <div className="landing-processing-text">Processing...</div>
                  </div>
                  <div className="landing-progress-bar">
                    <div className="landing-progress-fill"></div>
                  </div>
                </div>

                <div className="landing-output-materials">
                  {[
                    { icon: '📚', label: 'Study Guide', color: '#ab9ff2' },
                    { icon: '📋', label: 'Quizzes', color: '#6366f1' },
                    { icon: '📝', label: 'Exams', color: '#8b5cf6' },
                    { icon: '🃏', label: 'Flashcards', color: '#a78bfa' }
                  ].map((output, index) => (
                    <div 
                      key={index} 
                      className="landing-output-card"
                      style={{ 
                        animationDelay: `${2 + index * 0.2}s`,
                        borderColor: output.color 
                      }}
                    >
                      <div className="landing-output-icon">{output.icon}</div>
                      <div className="landing-output-label">{output.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="landing-course-mode-text">
              <h2 className="section-title-special">Dump your entire semester with Course Mode 🚚 📚</h2>
              <p className="section-subtitle">
                Dump your entire semester into Crammi. Upload up to 1,500 pages of lectures, slides, and textbooks and get a complete, AI-generated study guide. Course Mode uses advanced AI to analyze your material at a course level — organizing content into units, generating summaries, quizzes, exams, and flashcards that actually follow your class from start to finish.
              </p>
              <div className="landing-course-stats">
                <div className="landing-stat-item">
                  <div className="landing-stat-number">1,500</div>
                  <div className="landing-stat-label">Pages Max</div>
                </div>
                <div className="landing-stat-item">
                  <div className="landing-stat-number">5×</div>
                  <div className="landing-stat-label">Per Month</div>
                </div>
                <div className="landing-stat-item">
                  <div className="landing-stat-number">100%</div>
                  <div className="landing-stat-label">AI-Powered</div>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="pricing-header">
          <h2 className="section-title">Choose Your Plan 💎</h2>
          <p className="section-subtitle">Flexible pricing for students at every level</p>
          
          <div className="billing-toggle">
            <button 
              className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual <span className="save-badge">Save ~17%</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <div className="plan-emoji">{plan.emoji}</div>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-price">
                <span className="price-amount">
                  ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                </span>
                <span className="price-period">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index} className="plan-feature">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2 className="cta-title">Ready to transform your study game? 🚀</h2>
          <p className="cta-description">Join thousands of students who are already studying smarter with Crammi</p>
          <div className="cta-buttons">
            <button className="landingPrimary-button large" onClick={handleEmailSignUp}>
              <span>Get Started for Free</span>
              <span className="arrow">→</span>
            </button>
          </div>
          <p className="cta-subtext">✓ Free forever plan ✓ No credit card required ✓ 2 minutes setup</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo">
            <img className='landingPageLogo' src='/CrammiFinalUppercase.png' alt="Crammi Logo" />
          </div>
          <p className="footer-tagline">Study smarter, not harder</p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-heading">Product</h4>
            <a href="#how-it-works" className="footer-link">Features</a>
            <a href="#pricing" className="footer-link">Pricing</a>
            <a href="/blog" className="footer-link">Blog</a>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <a href="/support" className="footer-link">Contact</a>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <a href="/privacy-policy" className="footer-link">Privacy</a>
            <a href="/terms-of-service" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Crammi. All rights reserved.</p>
      </div>
      </footer>
    </div>
  );
}