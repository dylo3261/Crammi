import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils'; 
import LandingPage from "./LandingPage/LandingPage.jsx"
import Dashboard from "./Dashboard/Dashboard.jsx"
import SignIn from "./Auth/SignIn.jsx"
import SignUp from "./Auth/SignUp.jsx"

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        checkAuth(); // Re-check auth instead of just setting to true
      } else if (payload.event === 'signedOut') {
        setIsAuthenticated(false);
      }
    });

    return () => hubListener();
  }, []);

  async function checkAuth() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      
      // Check if we're returning from an OAuth attempt
      const oauthSource = sessionStorage.getItem('oauth_source');
      
      if (oauthSource && location.pathname !== oauthSource) {
        // Redirect back to where OAuth was initiated
        navigate(oauthSource, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Check if returning from failed OAuth before rendering routes
  if (!isAuthenticated) {
    const oauthSource = sessionStorage.getItem('oauth_source');
    if (oauthSource && location.pathname !== oauthSource && location.pathname !== '/signin' && location.pathname !== '/signup') {
      return <Navigate to={oauthSource} replace />;
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/Dashboard" replace /> : <LandingPage />
        }
      />
      <Route 
        path="/signin" 
        element={
          isAuthenticated ? <Navigate to="/Dashboard" replace /> : <SignIn />
        }
      />
      <Route 
        path="/signup" 
        element={
          isAuthenticated ? <Navigate to="/Dashboard" replace /> : <SignUp />
        }
      />
      <Route 
        path='/Dashboard' 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;