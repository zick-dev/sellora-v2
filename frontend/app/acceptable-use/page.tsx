import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata = { title: 'Acceptable Use Policy | Kormerce' };

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout title="Acceptable Use Policy" updated="July 2, 2026">
      <div className="legal-content">
        <p>
          Kormerce exists to help legitimate small businesses sell online. To keep the
          Platform safe and trustworthy for everyone, the following categories of products
          and conduct are never permitted on Kormerce, regardless of local legality.
        </p>

        <h2>Prohibited Items</h2>
        <ul>
          <li><strong>Weapons</strong> — firearms, ammunition, and related items</li>
          <li><strong>Illegal drugs</strong> — controlled substances not lawfully sold to the general public</li>
          <li><strong>Counterfeit goods</strong> — items that infringe on brand trademarks or copyrights</li>
          <li><strong>Stolen goods</strong> — items known or suspected to be stolen</li>
          <li><strong>Prohibited biological items</strong> — human organs or tissue, and similar items</li>
          <li><strong>Prohibited services</strong> — escort services and other services that violate applicable law</li>
        </ul>
        <p>
          This list is illustrative, not exhaustive. Kormerce reserves the right to remove
          any listing that violates the spirit of this policy even if not explicitly named above.
        </p>

        <h2>How Enforcement Works</h2>
        <p>
          Every product you list is automatically scanned when created or updated. This is
          designed to be fair and proportionate:
        </p>
        <ul>
          <li><strong>Suspension, not deletion.</strong> If a listing is flagged, your store is temporarily hidden from Buyers — nothing is permanently deleted on first detection.</li>
          <li><strong>You're notified immediately.</strong> An email explains exactly what was flagged and why.</li>
          <li><strong>You get a grace period.</strong> Typically 7 days to remove or correct the item, or to appeal if you believe the flag was made in error.</li>
          <li><strong>Escalation is a last resort.</strong> Permanent account action only follows unresolved or repeated violations, and involves human review — not a fully automated decision.</li>
        </ul>

        <h2>False Positives</h2>
        <p>
          Automated detection isn't perfect. If your store is flagged for something that
          isn't actually a violation — for example, a toy or costume item that shares
          wording with a restricted category — reply to the compliance email you receive
          or reach out through your dashboard support options, and we'll review it promptly.
        </p>

        <h2>Other Prohibited Conduct</h2>
        <ul>
          <li>Creating multiple accounts to evade a suspension</li>
          <li>Misrepresenting your identity or business</li>
          <li>Using the Platform to defraud Buyers</li>
          <li>Attempting to circumvent or interfere with Kormerce's compliance systems</li>
        </ul>

        <p>
          Questions about this policy can be directed through your Kormerce dashboard
          support options.
        </p>
      </div>
    </LegalPageLayout>
  );
}
