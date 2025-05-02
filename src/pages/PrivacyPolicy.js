import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    
useEffect(() => {
    window.scrollTo(0, 0);
}, []); 

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
        <h1>Privacy Policy</h1>
          <Link to="/" className="back-button-top">Back</Link>
        </div>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you create an account, use our services, or
            communicate with us. This includes personal identifiers such as your name, email address, and user-generated
            content such as text input and audio recordings. Additionally, we automatically collect technical data like
            device type, IP address, browser type, and interaction logs to enhance your user experience and maintain
            the security and reliability of the Service.
          </p>
        </section>

        <section>
          <h2>2. How We Use Information</h2>
          <p>
            We use the information we collect to operate, maintain, and improve the Speech Aura platform, to provide
            customer support, to develop new services and features, to understand and analyze user behavior and trends,
            and to enhance the safety and security of our users and our services. We may also use your information
            to communicate updates, offer promotions, or provide administrative notices relevant to your account.
          </p>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. However, we may share your
            information with trusted third-party service providers who assist us in operating our website, conducting
            our business, or serving our users, so long as those parties agree to keep this information confidential.
            We may also disclose your information if required to do so by law or in response to valid legal processes.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We implement a variety of industry-standard security measures to maintain the safety of your personal information,
            including encryption, firewalls, and secure server hosting. However, while we strive to protect your information,
            we cannot guarantee its absolute security. You acknowledge that providing personal information is at your own risk,
            and we encourage you to take necessary precautions when online.
          </p>
        </section>

        <section>
          <h2>5. Your Choices</h2>
          <p>
            You have the right to access, update, correct, or delete your personal information at any time through your
            account settings or by contacting our support team. You may also opt out of receiving marketing communications
            by following the unsubscribe instructions included in such emails. Please note that certain service-related
            communications are necessary for your account and you may not opt out of receiving them.
          </p>
        </section>

        <section>
          <h2>6. Changes to This Policy</h2>
          <p>
            We may revise this Privacy Policy from time to time at our sole discretion. When we make material changes,
            we will notify you by email or through prominent notice on our website. Your continued use of Speech Aura
            after the updated policy becomes effective will signify your acceptance of the changes. We encourage you
            to periodically review this policy to stay informed about how we are protecting your information.
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/" className="back-link">Back to Speech Aura</Link>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
