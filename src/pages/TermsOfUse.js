import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';


const TermsOfUse = () => {
    
useEffect(() => {
    window.scrollTo(0, 0);
}, []); 

  return (
    <div className="legal-page">
      <div className="legal-container">
      <div className="legal-header">
        <h1>Terms of Use</h1>
        <Link to="/" className="back-button-top">Back</Link>
      </div>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing, browsing, or using the Speech Aura platform ("Service"), you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Use. If you do not agree with these terms, you are
            prohibited from accessing or using the Service. Your continued use of Speech Aura indicates your acceptance
            of any updated or modified Terms. We recommend that you review these Terms periodically.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Speech Aura offers a variety of services including but not limited to text-to-speech conversion, voice recognition,
            audio processing, and content accessibility tools. The Service may evolve over time as we improve existing features
            and introduce new capabilities. We reserve the right to modify, suspend, or discontinue any part of the Service
            without notice at any time, and we are not liable for any such changes.
          </p>
        </section>

        <section>
          <h2>3. User Responsibilities</h2>
          <p>
            As a user, you agree to use the Service in compliance with all applicable local, state, national, and international laws.
            You shall not use the Service to upload, post, transmit, or otherwise distribute any content that is unlawful,
            abusive, harassing, defamatory, vulgar, obscene, invasive of another's privacy, or otherwise objectionable.
            You are solely responsible for safeguarding your account information and for any activities or actions that occur under your account.
          </p>
        </section>

        <section>
          <h2>4. Intellectual Property</h2>
          <p>
            All content, trademarks, service marks, logos, graphics, software, and other intellectual property used in connection
            with the Service are the sole property of Speech Aura and its licensors. You are granted a limited, non-exclusive,
            non-transferable license to access and use the Service for personal, non-commercial purposes only. Unauthorized use,
            reproduction, distribution, or modification of any materials found on the Service is strictly prohibited.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Speech Aura and its affiliates, officers, directors, employees, agents,
            and licensors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising
            from your use of or inability to use the Service, including but not limited to damages for loss of profits, goodwill, use,
            data, or other intangible losses, even if Speech Aura has been advised of the possibility of such damages.
          </p>
        </section>

        <section>
          <h2>6. Modifications</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms of Use at any time. Any changes will become effective
            immediately upon being posted on the website. Your continued use of the Service after such modifications constitutes
            your acceptance of the new Terms. It is your responsibility to check this page periodically for updates.
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

export default TermsOfUse;
