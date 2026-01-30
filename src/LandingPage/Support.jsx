import React, { useState } from 'react';
import './Support.css';

const Support = ({ onBack }) => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
        emoji: "💭",
        question: "What are 'Special Instructions'?",
        answer: "Special instructions allow you to provide context or specific requirements for your batch. For example, you can specify topics to focus on, whether to use only your notes or create new content, formatting preferences like true/false, or the number of questions (within account limits).",
        tags: ["instructions", "special", "context"]
      },
      {
        emoji: "💭",
        question: "What is Course Mode?",
        answer: "Course Mode is Crammi's most unique feature. It ties everything Crammi has to offer into one bundle. Download all your class's lecture notes and feed it into Crammi. Our advanced AI technology will organize your entire course into a comprehensive study guide that you can refer back to over and over again. Course mode lets you go unit by unit with flashcards and quizzes, along with a cumalative final exam that covers all topics.",
        tags: ["instructions", "special", "context", "course","course mode", "upload"]
      },
    {
      emoji: "📤",
      question: "How do I upload files?",
      answer: "Click the 'Upload New' button in the dashboard header. You can drag and drop files or click to browse. We support PDFs and images. If you want to upload an old batch, click the 'Upload Existing' button and select which old batch you want to reprocess.",
      tags: ["upload", "files", "new"]
    },
    {
      emoji: "📄",
      question: "What file types are supported?",
      answer: "We support PDF files, images (JPG, PNG), and text documents. Your account tier limits the overall sum of all the photos in the upload batch. Free users have 5MB, Plus users have 20MB, and Pro users have 50MB.",
      tags: ["files", "types", "pdf", "image"]
    },
    {
      emoji: "📦",
      question: "How do I create a new batch?",
      answer: "Navigate to the relevant section (Exams, Quizzes, or Flashcards) and click 'Upload New'. Upload your files, add any special instructions, and your batch will be created automatically.",
      tags: ["batch", "create", "new"]
    },
    {
      emoji: "✏️",
      question: "Can I edit an upload after creating it?",
      answer: "Yes! Click on any batch card to open it, then use the menu (three dots) to rename or delete the upload.",
      tags: ["edit", "batch", "rename"]
    },
    {
      emoji: "🗑️",
      question: "How do I delete an upload?",
      answer: "Click the three-dot menu on any batch card and select 'Delete'. You'll be asked to confirm before the batch is permanently removed.",
      tags: ["delete", "remove", "batch"]
    },
    {
      emoji: "⚙️",
      question: "What happens to processing uploads?",
      answer: "Uploads in 'processing' state are being generated. This usually takes a few minutes depending on the file size. You'll see a shimmer animation while processing.",
      tags: ["processing", "waiting", "status"]
    },
    {
      emoji: "⭐",
      question: "How do I upgrade my account?",
      answer: "Click the 'Upgrade Plan' button in the sidebar or user menu. You'll be directed to our billing page where you can choose a plan that fits your needs.",
      tags: ["upgrade", "plan", "billing"]
    },
    {
        emoji: "⭐",
        question: "What are the tier levels?",
        answer: "We have three tiers: Free, Plus, and Pro. With each tier, you will have a limit on the number of photos you can upload, the number of questions/flashcards you can generate, as well as the number of uploads you are allocated per week/month.",
        tags: ["upgrade", "plan", "billing"]
      },
    {
      emoji: "📑",
      question: "Can I select specific pages from a PDF?",
      answer: "Yes! When uploading a PDF, you'll see a page selection screen where you can choose which pages to include in your batch.",
      tags: ["pdf", "pages", "select"]
    },
    {
      emoji: "🔢",
      question: "How many files can I upload at once?",
      answer: "You can upload multiple files in a single batch. The exact limit depends on your account tier. Free accounts can upload up to 5 files per batch.",
      tags: ["limit", "files", "upload"]
    },
    {
        emoji: "❌",
        question: "MAX.TOKENS Error",
        answer: "This error has to do with our backend servers having trouble generating your content. Try again with fewer photos/different special instructions. Please submit an email to our support team if the issue keeps persisting.",
        tags: ["error", "max tokens", "backend"]
    },
    {
        emoji: "❌",
        question: "RECITATION Error",
        answer: "Due to legal guardrails, our servers may not process any information if it is suspected to be copyrighted material. If you are having issues with this error, please email us.",
        tags: ["error", "recitation", "copyright"]
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="support-container">
      <button className="back-button" onClick={handleBack}>
        <span className="back-arrow">←</span>
      </button>

      <div className="support-hero">
        <div className="hero-icon-wrapper">
          <span className="hero-icon">🎯</span>
        </div>
        <h1 className="support-title">How can we help you?</h1>
        <p className="support-subtitle">Search our knowledge base or browse common questions</p>
        
        <div className="search-bar-support">
          <input 
            type="text"
            placeholder="Search for help..."
            className="search-input-support"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="quick-links">
        <div className="quick-link-card" onClick={() => setSearchQuery('upload')}>
          <div className="quick-link-icon">📤</div>
          <h3>Getting Started</h3>
          <p>Learn the basics</p>
        </div>
        <div className="quick-link-card" onClick={() => setSearchQuery('batch')}>
          <div className="quick-link-icon">📦</div>
          <h3>Managing Uploads</h3>
          <p>Create and organize</p>
        </div>
        <div className="quick-link-card" onClick={() => setSearchQuery('upgrade')}>
          <div className="quick-link-icon">⭐</div>
          <h3>Account & Billing</h3>
          <p>Plans and payments</p>
        </div>
      </div>

      <div className="faq-section">
        <h2 className="section-label">
          {searchQuery ? `Found ${filteredFAQs.length} result${filteredFAQs.length !== 1 ? 's' : ''}` : 'Frequently Asked Questions'}
        </h2>
        
        {filteredFAQs.length > 0 ? (
          <div className="faq-list">
            {filteredFAQs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFAQ === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="faq-question-content">
                    <span className="faq-emoji">{faq.emoji}</span>
                    <span className="faq-question-text">{faq.question}</span>
                  </div>
                  <span className="faq-toggle-icon">
                    {openFAQ === index ? '−' : '+'}
                  </span>
                </button>
                
                {openFAQ === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results-support">
            <span className="no-results-emoji">🔍</span>
            <p>No results found for "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="clear-search-btn">
              Clear search
            </button>
          </div>
        )}
      </div>

      <div className="contact-section">
        <div className="contact-card">
          <div className="contact-icon-large">💬</div>
          <h3 className="contact-title">Still need help?</h3>
          <p className="contact-description">
            Can't find what you're looking for? Our support team typically responds within 48 hours.
          </p>
          <p className="contact-email-display">dtylongg@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default Support;