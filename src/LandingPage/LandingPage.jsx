import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import SectionOne from './sectionOne.jsx'
import Header from './Header.jsx'
import SectionTwo from './sectionTwo.jsx'

export default function LandingPage(){
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for auth to finish loading, then check if authenticated
        if (!auth.isLoading && auth.isAuthenticated) {
            navigate("/Dashboard", { replace: true });
        }
    }, [auth.isLoading, auth.isAuthenticated, navigate]);

 

    // If authenticated, show nothing while redirecting
    if (auth.isAuthenticated) {
        return null;
    }

    // Show landing page only if NOT authenticated
    return(
        <>
        <Header/>
        <SectionOne/>
        <SectionTwo/>
        </>
    )
}