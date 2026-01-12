import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils'; 
import LandingPage from "./LandingPage/LandingPage.jsx"
import Dashboard from "./Dashboard/Dashboard.jsx"
import SignIn from "./Auth/SignIn.jsx"
import SignUp from "./Auth/Signup.jsx"
import ForgotPassword from "./Auth/forgotPassword.jsx";
import LoadingAnimation from "./Dashboard/LoadingScreen.jsx";
import AccountPage from "./Dashboard/AccountPage.jsx";
import Upgrade from "./Dashboard/Upgrade.jsx";
import Success from "./Dashboard/Success.jsx";
import Support from "./LandingPage/Support.jsx";

import Exam from "./ViewBatches/Exam.jsx"
import Quiz from "./ViewBatches/Quiz.jsx"
import Flashcards from "./ViewBatches/Flashcards.jsx"
import PrivacyPolicy from "./LandingPage/PrivacyPolicy.jsx";
import TermsOfService from "./LandingPage/Terms.jsx";

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
        checkAuth();
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
      // Clear OAuth flags when successfully authenticated
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
    } catch (error) {
      setIsAuthenticated(false);
      
      // Check if we're returning from an OAuth attempt
      const oauthSource = sessionStorage.getItem('oauth_source');
      
      if (oauthSource && location.pathname !== oauthSource) {
        // Set flag to indicate OAuth redirect completed
        sessionStorage.setItem('oauth_completed', 'true');
        // Redirect back to where OAuth was initiated
        navigate(oauthSource, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingAnimation /> // Replace the old loading div with this

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
        path="/ForgotPassword" 
        element={<ForgotPassword />}
      />
      <Route 
        path="/Support" 
        element={<Support />}
      />
      <Route 
        path="/PrivacyPolicy" 
        element={<PrivacyPolicy />}
      />
       <Route 
        path="/TermsOfService" 
        element={<TermsOfService/>}
      />
      <Route 
        path='/Dashboard' 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/Exam/:batchID"
        element={
          isAuthenticated ? <Exam /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/Quiz/:batchID"
        element={
          isAuthenticated ? <Quiz /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/Flashcards/:batchID"
        element={
          isAuthenticated ? <Flashcards /> : <Navigate to="/" replace />
        }
      />
      <Route 
        path='/Settings' 
        element={
          isAuthenticated ? <AccountPage/> : <Navigate to="/" replace />
        }
        />
       <Route 
        path='/Upgrade' 
        element={
          isAuthenticated ? <Upgrade/> : <Navigate to="/" replace />
        }
        />
       <Route path="/Success/plus" element={<Success />} />
       <Route path="/Success/pro" element={<Success />} />
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