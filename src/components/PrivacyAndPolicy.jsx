import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const PrivacyPolicy = () => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem("themeMode");
    return savedTheme || "light";
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const savedTheme = localStorage.getItem("themeMode");
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
      return;
    }

    const settingsRef = doc(db, "users", currentUser.uid, "settings", "data");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme && data.theme.mode) {
          localStorage.setItem("themeMode", data.theme.mode);
          setThemeMode(data.theme.mode);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getMutedTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-500";
  const getAccentColor = () =>
    themeMode === "light" ? "text-blue-600" : "text-blue-400";

  const getAccentHover = () =>
    themeMode === "light" ? "hover:text-blue-700" : "hover:text-blue-300";
  const getSelectionColor = () =>
    themeMode === "light" ? "selection:bg-blue-500" : "selection:bg-blue-600";

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} font-sans antialiased ${getSelectionColor()} selection:text-white transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <header
          className={`border-b ${getBorderColor()} pb-8 mb-12 transition-colors duration-300`}>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Privacy{" "}
            <span className={`${getAccentColor()} transition-colors duration-300`}>
              Policy
            </span>
          </h1>
          <p className={`text-sm ${getMutedTextColor()} font-mono`}>
            Effective Date: June 29, 2026
          </p>
        </header>

        <main className="space-y-12 text-base md:text-lg leading-relaxed">
          <section
            className={`${getCardBg()} border ${getBorderColor()} p-6 rounded-2xl shadow-xl transition-colors duration-300`}>
            <p className={`${getTextColor()} transition-colors duration-300`}>
              Welcome to{" "}
              <span className={`font-semibold ${getTextColor()}`}>
                Clanopia
              </span>{" "}
              ("we," "our," or "us"). We are committed to protecting your
              personal information and your right to privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website and use our platform,
              including creating teams, workspaces, communities, and utilizing
              our chat features.
            </p>
            <p
              className={`mt-4 ${getSecondaryTextColor()} text-sm italic transition-colors duration-300`}>
              Please read this privacy policy carefully. If you do not agree
              with the terms of this privacy policy, please do not access the
              site.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                1.
              </span>{" "}
              Information We Collect
            </h2>
            <p className={getSecondaryTextColor()}>
              We collect personal information that you voluntarily provide to us
              when you register on the platform, express an interest in
              obtaining information about us or our products, or when you
              participate in activities on the platform.
            </p>
            <ul
              className={`list-disc list-inside space-y-2 pl-4 ${getSecondaryTextColor()}`}>
              <li>
                <strong className={getTextColor()}>Account Information:</strong>{" "}
                Name, email address, profile picture, and authentication data
                (such as Google Auth credentials via Firebase).
              </li>
              <li>
                <strong className={getTextColor()}>
                  User-Generated Content:
                </strong>{" "}
                Messages, text, files, documents shared in chat channels,
                workspaces, or communities created by you and your team.
              </li>
              <li>
                <strong className={getTextColor()}>Technical Data:</strong> IP
                addresses, browser type, device information, and usage logs.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                2.
              </span>{" "}
              How We Use Your Information
            </h2>
            <p className={getSecondaryTextColor()}>
              We use personal information collected via our platform for a
              variety of business purposes, including:
            </p>
            <ul
              className={`list-disc list-inside space-y-2 pl-4 ${getSecondaryTextColor()}`}>
              <li>
                To facilitate account creation and logon process via Firebase
                Authentication.
              </li>
              <li>
                To enable user-to-user communications, team collaborations, and
                community interactions.
              </li>
              <li>To manage user accounts and provide support.</li>
              <li>
                To analyze trends and monitor the performance of the platform.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                3.
              </span>{" "}
              Sharing and Disclosure of Your Information
            </h2>
            <p className={getSecondaryTextColor()}>
              We do not sell, rent, or trade your personal data with third
              parties. We only share information with your consent or with
              third-party service providers who perform services for us,
              including:
            </p>
            <ul
              className={`list-disc list-inside space-y-2 pl-4 ${getSecondaryTextColor()}`}>
              <li>
                <strong className={getTextColor()}>
                  Google Firebase / Google Cloud Platform:
                </strong>{" "}
                For secure database storage, authentication, and file hosting.
              </li>
              <li>
                <strong className={getTextColor()}>Analytics Providers:</strong>{" "}
                To understand platform usage and improve user experience.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                4.
              </span>{" "}
              Data Security & Scalability
            </h2>
            <p className={getSecondaryTextColor()}>
              We use advanced administrative, technical, and physical security
              measures provided by our infrastructure partners (Google
              Cloud/Firebase) to help protect your personal information. While
              we take reasonable steps to secure the personal information you
              provide to us, please be aware that no security measures are
              perfect or impenetrable.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                5.
              </span>{" "}
              Your Privacy Rights
            </h2>
            <p className={getSecondaryTextColor()}>
              Depending on your location, you may have the right to request
              access to the personal information we collect from you, change
              that information, or delete it. To request to review, update, or
              delete your personal information, please contact us at{" "}
              <a
                href="mailto:support@clanopia.com"
                className={`${getAccentColor()} ${getAccentHover()} font-medium transition-colors duration-300 hover:underline`}>
                support@clanopia.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className={`text-2xl font-bold ${getTextColor()} flex items-center gap-3 transition-colors duration-300`}>
              <span className={`${getAccentColor()} font-mono transition-colors duration-300`}>
                6.
              </span>{" "}
              Updates to This Policy
            </h2>
            <p className={getSecondaryTextColor()}>
              We may update this privacy policy from time to time. The updated
              version will be indicated by an updated "Effective Date" and the
              updated version will be effective as soon as it is accessible.
            </p>
          </section>
        </main>

        <footer
          className={`mt-16 pt-8 border-t ${getBorderColor()} text-center text-sm space-y-2 transition-colors duration-300`}>
          <p className={getMutedTextColor()}>
            If you have questions or comments about this policy, you may email
            us at:
          </p>
          <p
            className={`font-mono ${getSecondaryTextColor()} transition-colors duration-300`}>
            support@clanopia.com
          </p>
          <p className={`pt-4 ${getMutedTextColor()}`}>
            © {new Date().getFullYear()} Clanopia. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;