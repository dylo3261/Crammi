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
import ScrollToTop from "./ScrollToTop.jsx";


import Exam from "./ViewBatches/Exam.jsx"
import Quiz from "./ViewBatches/Quiz.jsx"
import Flashcards from "./ViewBatches/Flashcards.jsx"
import CourseMode from "./ViewBatches/CourseMode.jsx";

import PrivacyPolicy from "./LandingPage/PrivacyPolicy.jsx";
import TermsOfService from "./LandingPage/Terms.jsx";
import Blog from "./LandingPage/blog.jsx";
import BlogArticle from "./LandingPage/BlogArticle.jsx";


function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    // Listen for auth events
    if (typeof window !== 'undefined') {

    const hubListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        checkAuth();
      } else if (payload.event === 'signedOut') {
        setIsAuthenticated(false);
      }
    });

    return () => hubListener();
  }
  }, []);

  async function checkAuth() {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

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
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route 
        path="/signin" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignIn />
        }
      />
      <Route 
        path="/signup" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />
        }
      />
       <Route 
        path="/forgot-password" 
        element={<ForgotPassword />}
      />
      <Route 
        path="/support" 
        element={<Support />}
      />
      <Route 
        path="/privacy-policy" 
        element={<PrivacyPolicy />}
      />
       <Route 
        path="/terms-of-service" 
        element={<TermsOfService/>}
      />
       <Route 
        path="/blog" 
        element={<Blog/>}
      />
      <Route 
        path="/blog/:slug" 
        element={<BlogArticle/>}
      />
      <Route 
        path='/dashboard' 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/exam/:batchID"
        element={
          isAuthenticated ? <Exam /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/course/:batchID"
        element={
          isAuthenticated ? <CourseMode /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/quiz/:batchID"
        element={
          isAuthenticated ? <Quiz /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/flashcards/:batchID"
        element={
          isAuthenticated ? <Flashcards /> : <Navigate to="/" replace />
        }
      />
      <Route 
        path='/settings' 
        element={
          isAuthenticated ? <AccountPage/> : <Navigate to="/" replace />
        }
        />
        <Route 
        path='/upgrade' 
        element={
          isLoading ? <LoadingAnimation /> : (
            isAuthenticated ? <Upgrade/> : <Navigate to="/" replace />
          )
        }
      />
       <Route path="/success/plus" element={<Success />} />
       <Route path="/success/pro" element={<Success />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop/>
      <AppContent />
    </Router>
  );
}

export default App;