import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils'; 
import LandingPage from "./LandingPage/LandingPage.jsx"
import Dashboard from "./Dashboard/Dashboard.jsx"
import SignIn from "./Auth/SignIn.jsx"
import SignUp from "./Auth/SignUp.jsx"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <Router>
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
    </Router>
  );
}

export default App;