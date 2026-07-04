import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata = { title: 'Privacy Policy | Kormerce' };

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="July 2, 2026">
      <div className="legal-content">
        <p>
          This Privacy Policy explains how Kormerce collects, uses, and protects
          information when you use our Platform, whether as a Merchant or a Buyer.
        </p>

        <h2>1. Information We Collect</h2>
        <p>From Merchants, we collect:</p>
        <ul>
          <li>Account details — name, email, password (hashed), profile photo</li>
          <li>Store details — store name, description, logo, banner, bank/payment details you provide for receiving payment</li>
          <li>Product data — listings, images, prices, descriptions</li>
          <li>Order data — orders placed on your store, customer name and phone number as provided by Buyers</li>
        </ul>
        <p>From Buyers, we collect only what's needed to place an order: name, phone number, delivery address (if provided), and — for bank transfer orders — a payment receipt image.</p>

        <h2>2. How We Use Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Operate your storefront and process orders</li>
          <li>Send transactional emails (order confirmations, password resets, compliance notices)</li>
          <li>Detect location for currency display and regional pricing</li>
          <li>Improve the Platform and its AI-powered features</li>
        </ul>

        <h2>3. AI Features</h2>
        <p>
          When you use AI tools (product description generation, catalog-from-photo, or the
          storefront chatbot), the relevant text or image is sent to a third-party AI
          provider to generate a response. We do not use this content to train third-party
          models beyond what's necessary to generate your requested output.
        </p>

        <h2>4. Third-Party Sharing</h2>
        <p>We share data with third parties only where necessary to operate the Platform:</p>
        <ul>
          <li>Payment processors (Flutterwave) for Pro subscription billing</li>
          <li>Cloud storage (Cloudinary) for hosting your images</li>
          <li>Email delivery (Resend) for transactional emails</li>
          <li>AI providers, when you use AI features</li>
          <li>Meta, if you choose to connect your product catalog to Facebook/Instagram/WhatsApp Shopping</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your account and store data for as long as your account is active. If
          you delete your account, we remove your store, products, and order history, and
          archive minimal billing records as required for tax and legal compliance.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You can access, update, or delete most of your data directly from your Kormerce
          dashboard. For anything else, contact us through your dashboard support options.
        </p>

        <h2>7. Security</h2>
        <p>
          Passwords are hashed and never stored in plain text. We use industry-standard
          practices to protect data in transit and at rest, but no system is 100% secure —
          please use a strong, unique password for your Kormerce account.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Material changes will be
          communicated via email or an in-app notice.
        </p>
      </div>
    </LegalPageLayout>
  );
}
