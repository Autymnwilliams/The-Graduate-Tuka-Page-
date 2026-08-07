import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Tuka",
  description: "Terms and Conditions governing your use of Tuka.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Terms and Conditions</h1>
      <p className="mt-1 text-sm text-zinc-500 italic">Last Updated: December 2025</p>

      <p className="mt-6 text-sm leading-relaxed text-zinc-700">
        Welcome to Tuka. These Terms and Conditions govern your use of the Tuka mobile application and services. By
        accessing or using Tuka, you agree to be bound by these Terms. If you do not agree to these Terms, please do
        not use our Service.
      </p>

      <Section title="1. Acceptance of Terms">
        By creating an account, accessing, or using Tuka, you acknowledge that you have read, understood, and agree
        to be bound by these Terms and all applicable laws and regulations. These Terms constitute a legally binding
        agreement between you and Triple W Collective (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
      </Section>

      <Section title="2. Description of Service">
        Tuka is a social discovery platform that enables users to share and discover location-based recommendations
        (&quot;Drops&quot;). Users can create, share, and organize recommendations for places, activities, and
        experiences within their social networks.
      </Section>

      <Section title="3. Eligibility">
        You must be at least 10 years of age to use Tuka. By using the Service, you represent and warrant that you
        meet this age requirement. If you are under 18, you must have permission from a parent or legal guardian to
        use Tuka.
      </Section>

      <Section title="4. Account Registration and Security">
        To access certain features of Tuka, you must create an account. You agree to provide accurate, current, and
        complete information during registration and to update such information to keep it accurate. You are
        responsible for maintaining the confidentiality of your account credentials and for all activities that
        occur under your account. You must immediately notify us of any unauthorized use of your account.
      </Section>

      <Section title="5. User-Generated Content">
        Tuka allows you to post, upload, and share content, including recommendations, reviews, photos, and comments
        (&quot;User Content&quot;). You retain ownership of your User Content, but by posting it on Tuka, you grant
        us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, distribute, and display your
        User Content in connection with operating and providing the Service.
        <br />
        <br />
        You represent and warrant that you own or have the necessary rights to all User Content you post and that
        your User Content does not violate any third-party rights or applicable laws. You are solely responsible for
        your User Content and the consequences of posting it.
      </Section>

      <Section title="6. Intellectual Property Rights">
        The Tuka Service, including its design, features, functionality, and all content not provided by users, is
        owned by Triple W Collective and is protected by copyright, trademark, and other intellectual property laws.
        You may not copy, modify, distribute, sell, or lease any part of our Service without our express written
        permission.
      </Section>

      <Section title="7. Privacy and Data Protection">
        Your privacy is important to us. Our collection and use of personal information is governed by our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        . By using Tuka, you consent to our collection, use, and disclosure of your information as described in the
        Privacy Policy. We implement appropriate security measures to protect your personal information, but we
        cannot guarantee absolute security.
      </Section>

      <Section title="8. Prohibited Conduct and Zero Tolerance Policy">
        Tuka has a ZERO TOLERANCE POLICY for objectionable content and abusive users. We are committed to
        maintaining a safe, respectful community for all users.
        <br />
        <br />
        You agree not to engage in any of the following prohibited activities:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Posting objectionable content including but not limited to: graphic violence, sexual content, hate speech, harassment, bullying, or threats</li>
          <li>Violating any applicable laws or regulations</li>
          <li>Posting false, misleading, or fraudulent content</li>
          <li>Harassing, threatening, or bullying other users</li>
          <li>Posting content that is hateful, discriminatory, or promotes violence</li>
          <li>Posting sexually explicit, pornographic, or inappropriate content</li>
          <li>Infringing on the intellectual property rights of others</li>
          <li>Attempting to gain unauthorized access to the Service or other users&apos; accounts</li>
          <li>Using automated systems or bots to access the Service</li>
          <li>Interfering with or disrupting the Service or servers</li>
          <li>Impersonating any person or entity</li>
          <li>Collecting or storing personal information about other users without their consent</li>
        </ul>
        <br />
        <strong>ENFORCEMENT:</strong> Violation of these prohibited conduct rules will result in immediate action,
        which may include content removal, account suspension, or permanent ban from the Service. We reserve the
        right to report illegal activity to law enforcement authorities.
      </Section>

      <Section title="9. Third-Party Services">
        Tuka may contain links to or integrate with third-party services, websites, or applications. We are not
        responsible for the content, privacy policies, or practices of any third-party services. Your use of
        third-party services is at your own risk and subject to their terms and conditions.
      </Section>

      <Section title="10. Disclaimers and Limitation of Liability">
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
        EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        <br />
        <br />
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRIPLE W COLLECTIVE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
        INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE
        SERVICE.
      </Section>

      <Section title="11. Indemnification">
        You agree to indemnify, defend, and hold harmless Triple W Collective and its officers, directors,
        employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable
        attorneys&apos; fees, arising out of or in any way connected with your access to or use of the Service, your
        User Content, or your violation of these Terms.
      </Section>

      <Section title="12. Modification of Service and Terms">
        We reserve the right to modify, suspend, or discontinue the Service at any time without notice. We may also
        modify these Terms from time to time. If we make material changes, we will notify you through the Service or
        by other means. Your continued use of the Service after such modifications constitutes your acceptance of
        the updated Terms.
      </Section>

      <Section title="13. Term and Termination">
        These Terms remain in effect while you use the Service. We may suspend or terminate your access to the
        Service at any time, with or without cause or notice, including if we believe you have violated these
        Terms. You may terminate your account at any time by contacting us. Upon termination, your right to use the
        Service will immediately cease.
      </Section>

      <Section title="14. Dispute Resolution">
        These Terms shall be governed by and construed in accordance with the laws of the State of Illinois, without
        regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service
        shall be resolved through binding arbitration in accordance with the rules of the American Arbitration
        Association, except that either party may seek injunctive relief in court. You waive any right to a jury
        trial or to participate in a class action.
      </Section>

      <Section title="15. General Provisions">
        These Terms constitute the entire agreement between you and Triple W Collective regarding the Service. If
        any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain
        in full force and effect. Our failure to enforce any right or provision of these Terms will not be
        considered a waiver of those rights.
      </Section>

      <Section title="16. Feedback and Suggestions">
        We welcome your feedback and suggestions about Tuka. By providing feedback, you grant us the right to use it
        without any obligation to you. Any feedback you provide may be used to improve the Service or develop new
        features.
      </Section>

      <Section title="17. Contact Information">
        If you have any questions about these Terms or the Service, please contact us at:
        <br />
        <br />
        Triple W Collective
        <br />
        Email: support@thecirclesearch.com
        <br />
        Website: https://www.thecirclesearch.com
      </Section>

      <div className="mt-10 border-t border-zinc-200 pt-6 text-center">
        <p className="text-sm text-zinc-500">
          By using Tuka, you agree to these Terms and Conditions and acknowledge that you have read our{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
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
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{children}</p>
    </section>
  );
}
