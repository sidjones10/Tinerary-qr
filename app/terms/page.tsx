"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold mb-2">TINERARY</h1>
          <h2 className="text-2xl font-semibold mb-4">TERMS OF SERVICE</h2>
          <p className="text-muted-foreground mb-8">Effective Date: February 9, 2026</p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Agreement to Terms</h3>
            <p className="mb-4">
              By accessing or using the Tinerary application, website, and related services (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). The Service is operated by Tinerary LLC, a Texas limited liability company (&ldquo;Tinerary,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p>
              The Service is available to users worldwide, subject to applicable local laws and regulations. Certain features or services may not be available in all jurisdictions.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. Eligibility and Age Requirements</h3>
            <p className="mb-4">To create an account and use the Service, you must meet the minimum age requirement applicable to your jurisdiction:</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Jurisdiction</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Minimum Age</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">United States</td>
                    <td className="border border-gray-200 px-4 py-2">13 years old</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">European Economic Area (EEA) / United Kingdom</td>
                    <td className="border border-gray-200 px-4 py-2">16 years old (or lower if your country permits, but no less than 13)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">South Korea</td>
                    <td className="border border-gray-200 px-4 py-2">14 years old</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Brazil</td>
                    <td className="border border-gray-200 px-4 py-2">18 years old (or with parental consent from age 13)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">All other jurisdictions</td>
                    <td className="border border-gray-200 px-4 py-2">13 years old, or the minimum age required by applicable local law, whichever is higher</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-amber-800 mb-2">Age-Tiered Account System</h4>
              <p className="text-amber-700 mb-2">Tinerary uses a tiered account system based on age:</p>
              <ul className="list-disc pl-6 space-y-1 text-amber-700">
                <li><strong>Users aged 13-17 (Minor Accounts):</strong> Can join shared itineraries and use planning features. Cannot make purchases, process payments, or enable location tracking without parental consent.</li>
                <li><strong>Users aged 18+ (Standard Accounts):</strong> Full access to all features including bookings, payments, and expense management.</li>
              </ul>
            </div>

            <p>
              If you are under the age of 18 (or the age of majority in your jurisdiction), you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf. We do not knowingly collect personal information from children below the applicable minimum age without verifiable parental consent.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. Description of Service</h3>
            <p className="mb-4">Tinerary is a collaborative travel planning and local discovery platform that provides users with the following features:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>AI-powered travel recommendations and itinerary suggestions</li>
              <li>Collaborative trip planning tools for groups</li>
              <li>Discovery feed showcasing local experiences and itineraries</li>
              <li>Booking facilitation for activities, accommodations, and experiences</li>
              <li>Expense tracking and budget management for trips</li>
              <li>Photo sharing and trip documentation</li>
              <li>Packing list management</li>
              <li>Push notifications for trip updates and recommendations</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time. Where required by applicable law, we will provide reasonable advance notice of material changes.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. User Accounts</h3>

            <h4 className="text-lg font-medium mb-3">4.1 Registration</h4>
            <p className="mb-4">
              To access certain features of the Service, you must create an account. You may register using your email address or phone number. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.
            </p>

            <h4 className="text-lg font-medium mb-3">4.2 Account Security</h4>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to immediately notify us at <a href="mailto:legal@tinerary.app" className="text-primary hover:underline">legal@tinerary.app</a> if you suspect any unauthorized access to or use of your account.
            </p>

            <h4 className="text-lg font-medium mb-3">4.3 Account Termination</h4>
            <p>
              We reserve the right to suspend or terminate your account for violation of these Terms, fraudulent activity, or conduct harmful to other users or the Service. You may delete your account at any time through Settings &gt; Account &gt; Delete Account.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. User Content</h3>

            <h4 className="text-lg font-medium mb-3">5.1 Your Content</h4>
            <p className="mb-4">
              You retain ownership of all content you create, upload, or share through the Service, including itineraries, photos, reviews, comments, and profile information (&ldquo;User Content&rdquo;). By posting User Content, you grant Tinerary a non-exclusive, worldwide, royalty-free, transferable, sublicensable license to use, reproduce, modify, distribute, display, and create derivative works of your User Content solely in connection with operating, improving, and promoting the Service.
            </p>

            <h4 className="text-lg font-medium mb-3">5.2 Content Standards</h4>
            <p className="mb-4">You agree not to post User Content that:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Is unlawful, defamatory, obscene, pornographic, harassing, threatening, or discriminatory</li>
              <li>Infringes any intellectual property or proprietary rights of any third party</li>
              <li>Contains viruses, malware, or any harmful code</li>
              <li>Is misleading, fraudulent, or constitutes spam</li>
              <li>Impersonates another person or entity</li>
              <li>Violates any applicable local, state, national, or international law</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">5.3 Content Removal</h4>
            <p>
              We reserve the right to remove or disable access to any User Content that violates these Terms or is otherwise objectionable. Users in the EU/EEA have additional rights to contest content removal decisions under the Digital Services Act (DSA).
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. Collaborative Features</h3>
            <p className="mb-4">Tinerary allows users to collaborate on trip planning. When you invite collaborators or accept invitations, you acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Collaborators with editing permissions may modify shared itinerary content</li>
              <li>You are responsible for managing access permissions for your itineraries</li>
              <li>Tinerary is not responsible for actions taken by collaborators on shared content</li>
              <li>Removing a collaborator does not automatically delete their prior contributions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. Booking and Transactions</h3>

            <h4 className="text-lg font-medium mb-3">7.1 Third-Party Bookings</h4>
            <p className="mb-4">
              Tinerary may facilitate bookings for accommodations, activities, and experiences provided by third-party businesses (&ldquo;Partners&rdquo;). When you make a booking through the Service, you are entering into a direct transaction with the applicable Partner. Tinerary acts as an intermediary and is not a party to these transactions.
            </p>

            <h4 className="text-lg font-medium mb-3">7.2 Payment Processing</h4>
            <p className="mb-4">
              Payments are processed through Stripe. By making a purchase, you agree to Stripe&apos;s terms of service and privacy policy. Tinerary does not store your full credit card or payment information on our servers.
            </p>

            <h4 className="text-lg font-medium mb-3">7.3 Transaction Fees</h4>
            <p className="mb-4">
              Tinerary may charge transaction commissions ranging from 5% to 15% on bookings facilitated through the Service. These fees will be clearly disclosed before you complete any transaction.
            </p>

            <h4 className="text-lg font-medium mb-3">7.4 Refunds and Cancellations</h4>
            <p>
              Refund and cancellation policies are determined by the applicable Partner for each booking. Users in the European Economic Area and United Kingdom may have statutory rights of withdrawal for certain digital purchases.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">8. Subscription Plans</h3>
            <p className="mb-4">
              Tinerary offers both free and paid subscription tiers. Business subscriptions range from $49 to $399 per month (USD) and provide enhanced features including promoted listings, analytics dashboards, and priority placement.
            </p>
            <p>
              Subscription fees are billed in advance on a monthly basis. You may cancel at any time, and cancellation will take effect at the end of the current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">9. Intellectual Property</h3>
            <p>
              The Service, including its design, features, content, algorithms, code, trademarks, and logos, is owned by Tinerary LLC and protected by copyright, trademark, patent, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">10. AI-Powered Features</h3>
            <p className="mb-4">Tinerary uses artificial intelligence for personalized recommendations and travel suggestions. You acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI-generated recommendations are suggestions only and may not always be accurate</li>
              <li>You are responsible for verifying information before making travel decisions</li>
              <li>AI recommendations may be influenced by Partner promotions (which will be labeled)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">11. Privacy</h3>
            <p>
              Your privacy is important to us. Our collection and use of personal information is governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">12. Prohibited Conduct</h3>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or other user accounts</li>
              <li>Use any automated means (bots, scrapers) to access or collect data from the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Create multiple accounts for deceptive or fraudulent purposes</li>
              <li>Use the Service to send unsolicited promotional content or spam</li>
              <li>Reverse engineer, decompile, or disassemble any aspect of the Service</li>
              <li>Export or re-export the Service in violation of export control laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">13. Disclaimers</h3>
            <p className="mb-4 uppercase text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-sm">
              NOTHING IN THESE TERMS SHALL EXCLUDE OR LIMIT ANY WARRANTY, LIABILITY, OR RIGHT THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW, INCLUDING CONSUMER PROTECTION LAWS IN YOUR JURISDICTION.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">14. Limitation of Liability</h3>
            <p className="mb-4 uppercase text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TINERARY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-sm">
              TINERARY&apos;S TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU HAVE PAID TO TINERARY IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100 USD).
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">15. Indemnification</h3>
            <p>
              To the maximum extent permitted by applicable law, you agree to indemnify and hold harmless Tinerary from and against any claims, liabilities, damages, losses, costs, and expenses arising out of your access to or use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">16. Dispute Resolution</h3>

            <h4 className="text-lg font-medium mb-3">16.1 For Users in the United States</h4>
            <p className="mb-4">
              These Terms shall be governed by the laws of the State of Texas. Any dispute shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in San Antonio, Texas.
            </p>

            <h4 className="text-lg font-medium mb-3">16.2 For Users in the EU/UK/Switzerland</h4>
            <p className="mb-4">
              If you are a consumer residing in these regions, these Terms are governed by the laws of your country of residence. You may bring proceedings in the courts of your country of residence. The arbitration clause does not apply to you.
            </p>

            <h4 className="text-lg font-medium mb-3">16.3 For Users in Brazil</h4>
            <p className="mb-4">
              Brazilian consumers may resolve disputes before PROCON or the courts of their domicile. The arbitration clause does not apply.
            </p>

            <h4 className="text-lg font-medium mb-3">16.4 For Users in Australia</h4>
            <p>
              Nothing in these Terms excludes, restricts, or modifies any consumer guarantee under the Australian Consumer Law that cannot be excluded by agreement.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">17. International Use</h3>
            <p>
              The Service is operated from the United States. If you access the Service from outside the United States, you do so on your own initiative and are responsible for compliance with local laws.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">18. Changes to Terms</h3>
            <p className="mb-4">
              We may update these Terms from time to time. When we make material changes, we will notify you by posting the revised Terms and providing at least 30 days&apos; advance notice via email or in-app notification.
            </p>
            <p>
              Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree with the changes, you must stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">19. General Provisions</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Tinerary.</li>
              <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect.</li>
              <li><strong>Waiver:</strong> Failure to enforce any provision shall not constitute a waiver.</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our consent. Tinerary may assign these Terms without restriction.</li>
              <li><strong>Force Majeure:</strong> Tinerary shall not be liable for delays or failures beyond its reasonable control.</li>
              <li><strong>Language:</strong> These Terms are drafted in English. If translated, the English version prevails.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">20. Contact Us</h3>
            <p className="mb-4">If you have any questions about these Terms, please contact us at:</p>
            <p>
              <strong>Tinerary LLC</strong><br />
              Email: <a href="mailto:legal@tinerary.app" className="text-primary hover:underline">legal@tinerary.app</a>
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">&copy; 2026 Tinerary LLC. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
