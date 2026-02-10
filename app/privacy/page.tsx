"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold mb-2">TINERARY</h1>
          <h2 className="text-2xl font-semibold mb-4">PRIVACY POLICY</h2>
          <p className="text-muted-foreground mb-8">Effective Date: February 9, 2026</p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Introduction</h3>
            <p className="mb-4">
              Tinerary LLC (&ldquo;Tinerary,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our collaborative travel planning application, website, and related services (collectively, the &ldquo;Service&rdquo;), which are available to users worldwide.
            </p>
            <p className="mb-4">
              Tinerary LLC is a company organized under the laws of the State of Texas, United States. For the purposes of data protection laws, Tinerary LLC is the data controller (or equivalent designation in your jurisdiction) responsible for your personal information.
            </p>
            <p>
              By using the Service, you acknowledge the practices described in this Privacy Policy. Where required by applicable law, we will obtain your explicit consent before collecting or processing your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. Information We Collect</h3>

            <h4 className="text-lg font-medium mb-3">2.1 Information You Provide Directly</h4>
            <p className="mb-4">We collect information that you voluntarily provide when you use the Service:</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Data Category</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Account Information</td>
                    <td className="border border-gray-200 px-4 py-2">Name, email address, phone number, password, display name, avatar/profile photo</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Profile Information</td>
                    <td className="border border-gray-200 px-4 py-2">Bio, location, travel style preferences, budget preferences, preferred destinations and activities</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Trip & Itinerary Data</td>
                    <td className="border border-gray-200 px-4 py-2">Trip names, destinations, dates, activities, notes, packing lists, collaborator invitations</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Financial Information</td>
                    <td className="border border-gray-200 px-4 py-2">Expense entries, budget allocations, expense categories. Payment card details are processed by Stripe; we do not store your full card number.</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">User-Generated Content</td>
                    <td className="border border-gray-200 px-4 py-2">Photos, reviews, comments, ratings, and any other content you upload</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Communications</td>
                    <td className="border border-gray-200 px-4 py-2">Messages sent to other users, support inquiries, and feedback</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mb-3">2.2 Information Collected Automatically</h4>
            <p className="mb-4">When you access or use the Service, we automatically collect certain information:</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Data Category</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Device Information</td>
                    <td className="border border-gray-200 px-4 py-2">Device type, operating system, browser type, unique device identifiers, IP address</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Usage Data</td>
                    <td className="border border-gray-200 px-4 py-2">Pages visited, features used, itineraries viewed, search queries, interaction patterns</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Location Data</td>
                    <td className="border border-gray-200 px-4 py-2">With your explicit consent, we collect precise GPS location data. You can disable this in your device settings.</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Cookies & Tracking</td>
                    <td className="border border-gray-200 px-4 py-2">Cookies, web beacons, and similar technologies. See Section 8 for details.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mb-3">2.3 Information from Third Parties</h4>
            <p>We may receive information from authentication providers, payment processors (Stripe), analytics providers, and partner businesses.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. Legal Bases for Processing</h3>
            <p className="mb-4">We process your personal information on the following legal grounds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contractual Necessity:</strong> Processing necessary to perform our contract with you (account creation, trip planning, booking processing)</li>
              <li><strong>Consent:</strong> Processing based on your explicit consent (location tracking, marketing emails, personalized recommendations)</li>
              <li><strong>Legitimate Interests:</strong> Service improvement, analytics, fraud prevention, security monitoring</li>
              <li><strong>Legal Obligation:</strong> Tax records, financial reporting, law enforcement requests</li>
            </ul>
            <p className="mt-4">Where we rely on consent, you have the right to withdraw your consent at any time.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. How We Use Your Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide the Service:</strong> Create and manage your account, enable trip planning, facilitate collaboration, process bookings</li>
              <li><strong>Personalization:</strong> Customize discovery feed recommendations, AI-powered travel suggestions</li>
              <li><strong>Communications:</strong> Send push notifications about trip updates, booking confirmations, collaboration invites</li>
              <li><strong>Analytics & Improvement:</strong> Analyze usage patterns, monitor performance, improve features</li>
              <li><strong>Safety & Security:</strong> Detect and prevent fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              <li><strong>Marketing:</strong> With your consent, send promotional content about new features and travel deals</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. How We Share Your Information</h3>
            <p className="mb-4"><strong>We do not sell your personal information.</strong></p>

            <h4 className="text-lg font-medium mb-3">5.1 With Other Users</h4>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Your public profile information is visible to other users</li>
              <li>Itineraries you mark as public are visible in the discovery feed</li>
              <li>Collaborators on shared itineraries can view and edit shared trip content</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">5.2 With Service Providers</h4>
            <p className="mb-2">We share information with trusted third-party service providers:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Supabase (USA):</strong> Database hosting, authentication, real-time services</li>
              <li><strong>Stripe (USA):</strong> Payment processing for bookings and subscriptions</li>
              <li><strong>Google Analytics (USA):</strong> Website and app usage analytics</li>
            </ul>

            <h4 className="text-lg font-medium mb-3">5.3 For Legal Reasons</h4>
            <p>We may disclose your information if required by law or to protect our rights, prevent wrongdoing, or ensure user safety.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. International Data Transfers</h3>
            <p className="mb-4">
              Tinerary is based in the United States. Your personal information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.
            </p>
            <p>
              When we transfer personal information outside your jurisdiction, we implement appropriate safeguards including Standard Contractual Clauses (SCCs) and Data Processing Agreements.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. Data Retention</h3>
            <p className="mb-4">We retain your personal information only for as long as necessary:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> Until account deletion + 30 days</li>
              <li><strong>Usage data:</strong> 24 months, then anonymized or deleted</li>
              <li><strong>Transaction records:</strong> Up to 7 years (legal obligation)</li>
              <li><strong>Support communications:</strong> 3 years after resolution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">8. Cookies and Tracking Technologies</h3>
            <p className="mb-4">We use cookies and similar tracking technologies to operate and improve the Service:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Strictly Necessary:</strong> Essential for the Service to function (no consent required)</li>
              <li><strong>Functional:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics:</strong> Measure usage patterns and performance</li>
              <li><strong>Marketing:</strong> Deliver relevant promotional content</li>
            </ul>
            <p>You can control cookies through your browser settings or our cookie consent banner.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">9. Your Rights and Choices</h3>
            <p className="mb-4">Regardless of your location, all Tinerary users have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update your account and profile information at any time through Settings</li>
              <li><strong>Deletion:</strong> Request deletion of your account via Settings &gt; Account &gt; Delete Account</li>
              <li><strong>Opt-Out of Marketing:</strong> Unsubscribe from marketing emails using the link in any email</li>
              <li><strong>Location Tracking:</strong> Disable GPS location services in your device settings</li>
              <li><strong>Personalization Controls:</strong> Toggle personalized recommendations in Settings &gt; Privacy</li>
            </ul>
            <p className="mt-4">To exercise any of your rights, contact us at <a href="mailto:legal@tinerary.app" className="text-primary hover:underline">legal@tinerary.app</a>.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">10. Jurisdiction-Specific Rights</h3>

            <h4 className="text-lg font-medium mb-3">European Economic Area, United Kingdom, and Switzerland (GDPR)</h4>
            <p className="mb-4">Additional rights include: restriction of processing, data portability, right to object, rights related to automated decision-making, and the right to lodge a complaint with your local supervisory authority.</p>

            <h4 className="text-lg font-medium mb-3">California (CCPA/CPRA)</h4>
            <p className="mb-4">California residents have the right to know, delete, correct, and opt out of sale/sharing. We do not sell or share your personal information.</p>

            <h4 className="text-lg font-medium mb-3">Brazil (LGPD)</h4>
            <p className="mb-4">Brazilian users have rights to confirmation of processing, access, correction, anonymization, portability, deletion, and revocation of consent.</p>

            <h4 className="text-lg font-medium mb-3">Other Jurisdictions</h4>
            <p>We honor your rights under applicable data protection laws in your jurisdiction.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">11. Data Security</h3>
            <p className="mb-4">We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Row Level Security (RLS) policies</li>
              <li>Secure authentication with email and phone verification</li>
              <li>Regular security assessments and vulnerability monitoring</li>
              <li>Access controls limiting employee access to personal information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">12. Children&apos;s Privacy</h3>
            <p className="mb-4">
              The minimum age to use the Service is 13 years old (or higher in certain jurisdictions). Users aged 13-17 are considered &ldquo;minor accounts&rdquo; with limited features:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Cannot make purchases or process payments without parental consent</li>
              <li>Cannot enable location tracking without parental consent</li>
              <li>Can join shared itineraries and use planning features</li>
            </ul>
            <p className="mb-4">
              We comply with COPPA (United States), GDPR requirements for children&apos;s data (EU/UK), and applicable local child protection laws.
            </p>
            <p>
              If we discover that we have collected personal information from a child below the applicable minimum age without proper consent, we will delete that information promptly. Contact us at <a href="mailto:legal@tinerary.app" className="text-primary hover:underline">legal@tinerary.app</a> if you believe a child has provided us with personal information inappropriately.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">13. Third-Party Links and Services</h3>
            <p>
              The Service may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties. Please read their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">14. Changes to This Privacy Policy</h3>
            <p className="mb-4">We may update this Privacy Policy from time to time. When we make material changes, we will:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Post the revised Privacy Policy with an updated Effective Date</li>
              <li>Provide at least 30 days&apos; advance notice via email or in-app notification</li>
              <li>Obtain your consent where required by applicable law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">15. Contact Us</h3>
            <p className="mb-4">If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p className="mb-4">
              <strong>Tinerary LLC</strong><br />
              Email: <a href="mailto:legal@tinerary.app" className="text-primary hover:underline">legal@tinerary.app</a>
            </p>
            <p>For data protection inquiries, please include &ldquo;Privacy Request&rdquo; in the subject line.</p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">&copy; 2026 Tinerary LLC. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
