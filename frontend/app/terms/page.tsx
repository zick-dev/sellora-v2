import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata = { title: 'Terms of Service | Kormerce' };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="July 2, 2026">
      <div className="legal-content">
        <p>
          These Terms of Service ("Terms") govern your access to and use of Kormerce
          (the "Platform"), a service that allows sellers ("Merchants") to create online
          storefronts and sell products to their customers ("Buyers"). By creating a
          Kormerce account, you agree to these Terms.
        </p>

        <h2>1. Your Account</h2>
        <p>
          You must provide accurate information when creating your Kormerce account and
          keep it up to date. You are responsible for all activity that happens under your
          account, including products you list and orders you fulfill.
        </p>

        <h2>2. What You Can Sell</h2>
        <p>
          You may sell any lawful product or service through your Kormerce store, subject
          to our <a href="/acceptable-use" style={{ color: '#4F46E5' }}>Acceptable Use Policy</a>.
          Certain categories — including weapons, illegal drugs, counterfeit goods, stolen
          goods, and other prohibited items — are never permitted on Kormerce, regardless
          of local legality.
        </p>

        <h2>3. Compliance &amp; Enforcement</h2>
        <p>
          Kormerce uses automated systems to detect listings that may violate this policy.
          If your store is flagged:
        </p>
        <ul>
          <li>Your store will be temporarily suspended and hidden from Buyers — it is not deleted.</li>
          <li>You will receive an email explaining what was flagged and why.</li>
          <li>You will have a grace period (typically 7 days) to remove or correct the flagged item, or to appeal if you believe the flag was made in error.</li>
          <li>Repeated or unresolved violations may result in further action, up to and including permanent account termination, at Kormerce's discretion following review.</li>
        </ul>

        <h2>4. Pricing, Payments &amp; Fees</h2>
        <p>
          Kormerce offers a free tier and a paid Pro subscription with additional features.
          Kormerce does not process buyer payments directly — Merchants arrange payment with
          Buyers via pay-on-delivery or bank transfer, and are solely responsible for
          fulfilling paid orders.
        </p>

        <h2>5. Your Content</h2>
        <p>
          You retain ownership of the product listings, descriptions, and images you upload.
          By uploading content, you grant Kormerce a license to display it on your storefront
          and, where you enable it, to sync it to third-party catalogs (e.g. Meta Commerce
          Catalog) at your request.
        </p>

        <h2>6. Disclaimer &amp; Limitation of Liability</h2>
        <p>
          Kormerce provides the Platform "as is." We do not guarantee uninterrupted service
          and are not responsible for disputes between Merchants and Buyers, product quality,
          or delivery outcomes. To the maximum extent permitted by law, Kormerce's liability
          is limited to the fees you have paid us in the preceding 3 months.
        </p>

        <h2>7. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of Kormerce after a
          change takes effect constitutes acceptance of the updated Terms.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about these Terms can be sent through your Kormerce dashboard support
          options.
        </p>
      </div>
    </LegalPageLayout>
  );
}
