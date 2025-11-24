import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './LandingPage/Header.css'
import './index.css'
import './LandingPage/sectionOne.css'
import './LandingPage/sectionTwo.css'
//Dashboard
import './Dashboard/DashboardHeader.css'
import './Dashboard/uploadModal.css'
import './Dashboard/uploadModal.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_HvrwtG8yS",
  client_id: "2k09t25870e667u1ge3990bhva",
  redirect_uri: "http://localhost:5173/Dashboard",
  response_type: "code",
  scope: "email openid phone",
  metadata: {
    issuer: "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_HvrwtG8yS",
    authorization_endpoint: "https://us-west-2hvrwtg8ys.auth.us-west-2.amazoncognito.com/oauth2/authorize",
    token_endpoint: "https://us-west-2hvrwtg8ys.auth.us-west-2.amazoncognito.com/oauth2/token",
    userinfo_endpoint: "https://us-west-2hvrwtg8ys.auth.us-west-2.amazoncognito.com/oauth2/userInfo",
    end_session_endpoint: "https://us-west-2hvrwtg8ys.auth.us-west-2.amazoncognito.com/logout",
  },
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

