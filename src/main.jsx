import { createRoot } from 'react-dom/client'
import './LandingPage/LandingPage.css'
import './index.css'

import LandingPage from './LandingPage/LandingPage'
//Dashboard
import './Dashboard/DashboardHeader.css'
import './Dashboard/uploadModal.css'
import './Dashboard/UploadExistingModal.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Amplify } from 'aws-amplify';

// Configure Amplify with Cognito
// main.jsx
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);
const redirectUri = isLocalhost 
  ? 'http://localhost:5173/dashboard' 
  : `${window.location.origin}/dashboard`;
  const upgradeUri = isLocalhost 
  ? 'http://localhost:5173/upgrade' 
  : `${window.location.origin}/upgrade`;

const logoutUri = isLocalhost 
  ? 'http://localhost:5173/' 
  : `${window.location.origin}/`;

if (typeof window !== 'undefined') {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: 'auth.crammi.com', 
            scopes: ['openid', 'email', 'phone', 'profile', 'aws.cognito.signin.user.admin'],
            redirectSignIn: [redirectUri, upgradeUri], 
            redirectSignOut: [logoutUri],
            responseType: 'code',
          },
        },
      },
    },
  });}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);