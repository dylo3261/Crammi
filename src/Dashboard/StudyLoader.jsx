import React from 'react';

export default function StudyLoader() {
    return (
      <div style={styles.container}>
        <div style={styles.loaderWrapper}>
          <div style={styles.bookContainer}>
            <div style={styles.bookSpine}></div>
            <div style={styles.book}>
              {/* Static left pages */}
              <div style={{...styles.pageLeft, ...styles.pageLeft1}}>
                <div style={styles.pageLinesLeft}>
                  <div style={styles.lineLeft}></div>
                  <div style={styles.lineLeft}></div>
                  <div style={styles.lineLeft}></div>
                </div>
              </div>
              <div style={{...styles.pageLeft, ...styles.pageLeft2}}>
                <div style={styles.pageLinesLeft}>
                  <div style={styles.lineLeft}></div>
                  <div style={styles.lineLeft}></div>
                  <div style={styles.lineLeft}></div>
                </div>
              </div>
              
              {/* Animated pages */}
              <div style={{...styles.page, ...styles.page1}}>
                <div style={styles.pageLines}>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                </div>
              </div>
              <div style={{...styles.page, ...styles.page2}}>
                <div style={styles.pageLines}>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                </div>
              </div>
              <div style={{...styles.page, ...styles.page3}}>
                <div style={styles.pageLines}>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                </div>
              </div>
              
              {/* Static right pages */}
              <div style={{...styles.pageRight, ...styles.pageRight1}}>
                <div style={styles.pageLines}>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                </div>
              </div>
              <div style={{...styles.pageRight, ...styles.pageRight2}}>
                <div style={styles.pageLines}>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                  <div style={styles.line}></div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.text}>Cramming... Please do not exit the tab</div>
        </div>
        <style>{`
          @keyframes flip1 {
            0%, 20% { transform: rotateY(0deg); }
            30%, 70% { transform: rotateY(-180deg); }
            80%, 100% { transform: rotateY(0deg); }
          }
          
          @keyframes flip2 {
            0%, 40% { transform: rotateY(0deg); }
            50%, 90% { transform: rotateY(-180deg); }
            100% { transform: rotateY(0deg); }
          }
          
          @keyframes flip3 {
            0%, 60% { transform: rotateY(0deg); }
            70%, 100% { transform: rotateY(-180deg); }
          }
          
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2); }
            50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3); }
          }
        `}</style>
      </div>
    );
  }
  
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'transparent',
      fontFamily: 'applemedium, sans-serif',
    },
    loaderWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px',
    },
    bookContainer: {
      position: 'relative',
      animation: 'glow 2s infinite ease-in-out',
    },
    book: {
      position: 'relative',
      width: '120px',
      height: '100px',
      transformStyle: 'preserve-3d',
      perspective: '1000px',
    },
    bookSpine: {
      position: 'absolute',
      width: '8px',
      height: '100px',
      left: '56px',
      top: '0',
      background: '#ab9ff2',
      borderRadius: '2px 0 0 2px',
      boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
      zIndex: 10,
    },
    page: {
      position: 'absolute',
      width: '60px',
      height: '100px',
      left: '60px',
      transformOrigin: 'left center',
      transformStyle: 'preserve-3d',
      boxShadow: '3px 3px 12px rgba(0,0,0,0.4)',
      border: '1px solid #e0e0e0',
      borderLeft: 'none',
      borderRadius: '0 3px 3px 0',
    },
    page1: {
      background: '#ffffff',
      animation: 'flip1 4s infinite ease-in-out',
      zIndex: 3,
    },
    page2: {
      background: '#ffffff',
      animation: 'flip2 4s infinite ease-in-out',
      zIndex: 2,
    },
    page3: {
      background: '#ffffff',
      animation: 'flip3 4s infinite ease-in-out',
      zIndex: 1,
    },
    pageLeft: {
      position: 'absolute',
      width: '60px',
      height: '100px',
      right: '60px',
      transformOrigin: 'right center',
      transformStyle: 'preserve-3d',
      boxShadow: '-3px 3px 12px rgba(0,0,0,0.4)',
      border: '1px solid #e0e0e0',
      borderRight: 'none',
      borderRadius: '3px 0 0 3px',
    },
    pageLeft1: {
      background: '#ffffff',
      zIndex: 3,
    },
    pageLeft2: {
      background: '#ffffff',
      zIndex: 2,
    },
    pageLinesLeft: {
      padding: '15px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end',
    },
    lineLeft: {
      width: '100%',
      height: '2px',
      background: 'linear-gradient(to left, #999 0%, transparent 100%)',
      borderRadius: '1px',
    },
    pageRight: {
      position: 'absolute',
      width: '60px',
      height: '100px',
      left: '60px',
      transformStyle: 'preserve-3d',
      boxShadow: '3px 3px 12px rgba(0,0,0,0.4)',
      border: '1px solid #e0e0e0',
      borderLeft: 'none',
      borderRadius: '0 3px 3px 0',
    },
    pageRight1: {
      background: '#ffffff',
      zIndex: -1,
    },
    pageRight2: {
      background: '#ffffff',
      zIndex: -2,
    },
    pageLines: {
      padding: '15px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    line: {
      width: '100%',
      height: '2px',
      background: 'linear-gradient(to right, #999 0%, transparent 100%)',
      borderRadius: '1px',
    },
    text: {
      color: '#ffffff',
      fontSize: '20px',
      fontWeight: '600',
      letterSpacing: '1px',
      animation: 'fadeInOut 2s infinite ease-in-out',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
  };