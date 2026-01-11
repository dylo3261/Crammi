import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy-container">
      <iframe 
        src="/privacy-policy.html"
        style={{
          width: '100%',
          minHeight: '100vh',
          border: 'none'
        }}
        title="Privacy Policy"
      />
    </div>
  );
}