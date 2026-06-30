import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { DailyProvider } from "@daily-co/daily-react";
import { LanguageProvider } from "./context/LanguageContext"; 

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(() => console.log('✅ Service Worker registered successfully'))
      .catch((error) => console.log('❌ Service Worker registration failed:', error));
  });
}

if (import.meta.env.PROD) {
    console.log = function() {};
    window.alert = function() {};
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <DailyProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </DailyProvider>
    </AuthProvider>
  </BrowserRouter>
);