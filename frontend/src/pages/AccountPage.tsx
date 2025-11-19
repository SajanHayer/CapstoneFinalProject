import React from "react";

export const AccountPage: React.FC = () => {
  return (
    <section className="account-page">
      <div className="account-card">
        <h2>Account</h2>
        <ul className="account-menu">
          <li>Username</li>
          <li>Settings</li>
          <li>Accessibility</li>
          <li>Login &amp; Security</li>
          <li>Information</li>
          <li>My Listings</li>
        </ul>
      </div>
    </section>
  );
};
