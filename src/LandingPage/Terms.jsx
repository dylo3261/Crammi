import React from 'react';

export default function TermsOfService() {
  return (
    <div className="Terms of Service">
      <iframe 
        src="/terms-of-service.html"
        style={{
          width: '100%',
          minHeight: '100vh',
          border: 'none'
        }}
        title="Terms of Service"
      />
    </div>
  );
}