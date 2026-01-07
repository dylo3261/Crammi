import React from 'react';

export default function LoadingAnimation() {
  return (
    <div style={styles.container}>
      <div style={styles.logoWrapper}>
        <img 
          src="/crammiLogo.png" 
          alt="Crammi Logo"
          style={styles.logo}
        />
      </div>
      
      <div style={styles.text}>
        <span style={styles.brandName}>Loading</span><span style={styles.dots}>...</span>
      </div>
      
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'white',
    position: 'relative',
    flexDirection: 'column'
  },
  logoWrapper: {
    position: 'relative'
  },
  logo: {
    width: '60px',
    height: '60px',
    animation: 'spin 1s linear infinite',
    background: 'transparent'
  },
  text: {
    position: 'absolute',
    marginTop: '192px',
    color: '#ab9ff2',
    fontSize: '18px',
    fontWeight: '500',
    letterSpacing: '0.025em'
  },
  brandName: {
    fontWeight: 'bold',
    color: '#ab9ff2'
  },
  dots: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
};