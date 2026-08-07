import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Tuka",
  description: "How Tuka collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-zinc-500 italic">Last Updated: December 2025</p>

      <p className="mt-6 text-sm leading-relaxed text-zinc-700">
        At Tuka, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and
        protect your personal information when you use the Tuka mobile application.
      </p>

      <Section title="1. Information We Collect">
        <Subsection title="Account Information">
          When you create an account, we collect:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email address</li>
            <li>Name (first and last)</li>
            <li>Username</li>
            <li>Profile picture (optional)</li>
            <li>Authentication credentials (encrypted)</li>
          </ul>
        </Subsection>
        <Subsection title="Location Data">
          With your permission, we collect:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Precise location (latitude/longitude) when you use location-based features</li>
            <li>Location data is only collected while you are actively using the app</li>
            <li>Location data is used to show nearby recommendations and drops</li>
          </ul>
        </Subsection>
        <Subsection title="Contacts (Optional)">
          With your explicit permission, we access your device contacts to help you find friends already using
          Tuka. Important:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your contact list is NEVER uploaded to our servers</li>
            <li>We check each contact individually against our database</li>
            <li>Only matching user IDs are returned to you</li>
            <li>You can revoke this permission at any time in device settings</li>
          </ul>
        </Subsection>
        <Subsection title="User-Generated Content">
          We collect content you create on Tuka:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Drops (recommendations) including name, description, location, tags, and ratings</li>
            <li>Comments on other users&apos; drops</li>
            <li>Photos you upload for drops</li>
            <li>Collections you create</li>
            <li>Likes and interactions with other content</li>
          </ul>
        </Subsection>
        <Subsection title="Automatically Collected Information">
          We automatically collect:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Device information (model, operating system version)</li>
            <li>App usage data (features used, session duration)</li>
            <li>Crash reports and error logs</li>
            <li>IP address</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Provide and maintain the Tuka service</li>
          <li>Create and manage your account</li>
          <li>Show you personalized recommendations based on your location and preferences</li>
          <li>Connect you with friends who are also using Tuka</li>
          <li>Enable you to create, share, and discover drops</li>
          <li>Improve and optimize our app&apos;s performance</li>
          <li>Send you service-related notifications (e.g., friend requests, comments on your drops)</li>
          <li>Respond to your support requests</li>
          <li>Detect and prevent fraud, abuse, and security issues</li>
        </ul>
      </Section>

      <Section title="3. How We Share Your Information">
        We do NOT sell your personal information. We share your information only in these limited circumstances:
        <br />
        <br />
        <strong>With Other Users:</strong> Your profile information, drops, comments, and collections are visible to
        other Tuka users based on your privacy settings. Your exact location is never shared&mdash;only the
        locations of your drops.
        <br />
        <br />
        <strong>With Service Providers:</strong> We use trusted third-party services to help us operate Tuka:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Clerk (Authentication and user management)</li>
          <li>Cloudinary (Image hosting and optimization)</li>
          <li>Google Places API (Location geocoding and place information)</li>
          <li>MongoDB Atlas (Database hosting)</li>
          <li>Expo Push Notifications (Push notification delivery)</li>
        </ul>
        <br />
        These providers are contractually obligated to protect your data and use it only for the services they
        provide to us.
        <br />
        <br />
        <strong>For Legal Reasons:</strong> We may disclose your information if required by law, court order, or
        government request, or to protect our rights, property, or safety.
      </Section>

      <Section title="4. Data Storage and Security">
        <strong>Where We Store Your Data:</strong> Your data is stored on secure cloud servers provided by MongoDB
        Atlas and Cloudinary, located in the United States.
        <br />
        <br />
        <strong>How We Protect Your Data:</strong>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>All data transmission is encrypted using HTTPS/TLS</li>
          <li>Passwords are encrypted and never stored in plain text</li>
          <li>Database access is restricted and monitored</li>
          <li>Regular security audits and updates</li>
        </ul>
        <br />
        While we implement industry-standard security measures, no method of transmission over the internet or
        electronic storage is 100% secure. We cannot guarantee absolute security of your data.
      </Section>

      <Section title="5. Data Retention">
        We retain your information for as long as your account is active or as needed to provide you services. You
        can request deletion of your account and associated data at any time through the app settings.
        <br />
        <br />
        When you delete your account:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Your profile, drops, comments, and personal information are permanently deleted</li>
          <li>Some anonymized usage data may be retained for analytics</li>
          <li>Deletion is irreversible and cannot be undone</li>
        </ul>
      </Section>

      <Section title="6. Your Rights and Choices">
        You have the following rights regarding your personal information:
        <br />
        <br />
        <strong>Access:</strong> You can access your personal information at any time through the app.
        <br />
        <br />
        <strong>Update:</strong> You can edit your profile information, including name, username, and profile
        picture.
        <br />
        <br />
        <strong>Delete:</strong> You can delete your account and all associated data through Settings &rarr; Privacy
        and Permissions &rarr; Delete Account.
        <br />
        <br />
        <strong>Control Permissions:</strong> You can manage device permissions (location, contacts, camera, photos)
        through your device settings.
        <br />
        <br />
        <strong>Privacy Preferences:</strong> You can control who can follow you, send friend requests, and see your
        activity status through Settings &rarr; Privacy and Permissions.
        <br />
        <br />
        <strong>Data Portability:</strong> Contact us at support@thecirclesearch.com to request a copy of your data
        in a portable format.
      </Section>

      <Section title="7. Children's Privacy">
        Tuka is intended for users aged 10 and older. If you are under 18, you must have permission from a parent or
        legal guardian to use Tuka.
        <br />
        <br />
        We do not knowingly collect personal information from children under 10. If we become aware that a child
        under 10 has provided us with personal information, we will take steps to delete that information.
        <br />
        <br />
        Parents: If you believe your child under 10 has created an account, please contact us at
        support@thecirclesearch.com to request deletion.
      </Section>

      <Section title="8. SMS / Text Messaging">
        If you provide your mobile phone number (for example, to receive a concierge text about a place you liked,
        or to continue a chat conversation by text), you consent to receive text messages from Tuka related to
        that request.
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>We do not sell, rent, or share your mobile number with third parties for their own marketing
            purposes.</strong> Your number is used only to send you the messages you requested.
          </li>
          <li>Message frequency varies based on your activity and requests — we do not send recurring marketing texts.</li>
          <li>Message and data rates may apply, depending on your carrier and plan.</li>
          <li>Reply <strong>STOP</strong> at any time to opt out of further messages. Reply <strong>START</strong> to opt back in. Reply <strong>HELP</strong> for help.</li>
          <li>Carrier delivery is not guaranteed; carriers are not liable for delayed or undelivered messages.</li>
        </ul>
      </Section>

      <Section title="9. Cookies and Tracking">
        Tuka is a mobile app and does not use cookies. We do collect device identifiers and usage data to provide
        and improve our services. We do not use your data for cross-app tracking or targeted advertising.
      </Section>

      <Section title="10. Third-Party Links">
        Tuka may contain links to third-party websites or services (such as Google Maps for location information).
        We are not responsible for the privacy practices of these third parties. We encourage you to read their
        privacy policies.
      </Section>

      <Section title="11. International Users">
        Tuka is operated in the United States. If you access Tuka from outside the United States, your information
        will be transferred to, stored, and processed in the United States. By using Tuka, you consent to this
        transfer.
      </Section>

      <Section title="12. Changes to This Privacy Policy">
        We may update this Privacy Policy from time to time. When we make material changes, we will notify you
        through the app or by email. Your continued use of Tuka after such notification constitutes acceptance of
        the updated Privacy Policy.
        <br />
        <br />
        We encourage you to review this Privacy Policy periodically to stay informed about how we protect your
        information.
      </Section>

      <Section title="13. Contact Us">
        If you have any questions about this Privacy Policy or our data practices, please contact us:
        <br />
        <br />
        Triple W Collective
        <br />
        Email: support@thecirclesearch.com
        <br />
        Website: https://www.thecirclesearch.com
        <br />
        <br />
        For privacy-specific inquiries or to exercise your data rights, email: privacy@thecirclesearch.com
      </Section>

      <div className="mt-10 border-t border-zinc-200 pt-6 text-center">
        <p className="text-sm text-zinc-500">
          By using Tuka, you acknowledge that you have read and understood this Privacy Policy.
        </p>
        <p className="mt-4 text-xs text-zinc-400">© 2025 Triple W Collective. All rights reserved.</p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-[#1D2D44]">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-[#1D2D44]">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-zinc-700">{children}</div>
    </div>
  );
}
