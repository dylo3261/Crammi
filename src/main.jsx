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

import {WebStorageStateStore } from "oidc-client-ts";

console.log('Environment variables:', {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  domain: import.meta.env.VITE_COGNITO_DOMAIN,
  region: import.meta.env.VITE_COGNITO_REGION,
});
const cognitoAuthConfig = {
  authority: `https://cognito-idp.${import.meta.env.VITE_COGNITO_REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_REDIRECT_URI,
  response_type: "code",
  scope: "openid email phone",
  post_logout_redirect_uri: import.meta.env.VITE_LOGOUT_URI,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  metadata: {
    issuer: `https://cognito-idp.${import.meta.env.VITE_COGNITO_REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`,
    authorization_endpoint: `https://${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com/oauth2/authorize`,
    token_endpoint: `https://${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com/oauth2/token`,
    userinfo_endpoint: `https://${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com/oauth2/userInfo`,
    end_session_endpoint: `https://${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com/logout`,
  },
}
console.log('Authorization URL:', cognitoAuthConfig.metadata.authorization_endpoint);
console.log('Client ID:', cognitoAuthConfig.client_id);
console.log('Redirect URI:', cognitoAuthConfig.redirect_uri);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

