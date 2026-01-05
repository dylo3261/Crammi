import { createRoot } from 'react-dom/client'
import './LandingPage/Header.css'
import './index.css'
import './LandingPage/sectionOne.css'
import './LandingPage/sectionTwo.css'
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
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: `${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com`,
          scopes: ['openid', 'email', 'phone','profile','aws.cognito.signin.user.admin'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_URI],
          redirectSignOut: [import.meta.env.VITE_LOGOUT_URI],
          responseType: 'code',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);