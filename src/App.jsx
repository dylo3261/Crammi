import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage.jsx"
import Dashboard from "./Dashboard/Dashboard.jsx"
function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <>
              <LandingPage/>
            </>
          }
        />
        <Route path='/Dashboard' element={
            <>
              <Dashboard/>
            </>
        }/>
        {/* <Route path="/about" element={<AboutPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
