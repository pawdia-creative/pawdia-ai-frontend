import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last Updated: December 2025</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Privacy Policy for Pawdia AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">1. Introduction</h2>
              <p className="mb-2">
                Pawdia AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI pet portrait generation service.
              </p>
              <p>
                By using our service, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Usage Data:</strong> IP address, browser type, access times, page views</li>
                <li><strong>Payment Information:</strong> Processed through PayPal (we do not store payment card details)</li>
                <li><strong>Generated Content:</strong> Pet photos you upload and AI portraits we generate</li>
                <li><strong>Technical Data:</strong> Device information, error logs, performance metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">3. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and improve AI pet portrait generation services</li>
                <li>Process subscriptions and payments</li>
                <li>Send service-related notifications and updates</li>
                <li>Ensure service security and prevent fraud</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Conduct analytics and research to enhance service quality</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Information Sharing and Disclosure</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our service (e.g., PayPal, cloud storage providers)</li>
                <li><strong>Legal Requirements:</strong> To comply with legal processes, court orders, or government requests</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">5. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>SSL encryption for data transmission</li>
                <li>bcrypt encryption for password storage</li>
                <li>Regular security audits and assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee privacy and security training</li>
                <li>Secure data backup and recovery procedures</li>
              </ul>
              <p className="mt-2">While we strive to protect your information, no security measures are completely secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Your Privacy Rights (CCPA/CPRA Compliance)</h2>
              <p>Under California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents have the following rights:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Right to Know:</strong> Request information about personal information collected, used, and shared</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale or sharing of personal information</li>
                <li><strong>Right to Limit Use:</strong> Limit use of sensitive personal information</li>
                <li><strong>Right to Non-Discrimination:</strong> Not receive discriminatory treatment for exercising privacy rights</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at: support@pawdia-ai.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Data Retention</h2>
              <p>We retain personal information only for as long as necessary:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Account Information: While your account is active</li>
                <li>Generated Content: According to your settings</li>
                <li>Payment Records: 7 years as required by law</li>
                <li>Analytics Data: 2 years for service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">8. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Remember your login status</li>
                <li>Analyze website usage</li>
                <li>Personalize your experience</li>
                <li>Improve service performance</li>
              </ul>
              <p className="mt-2">You can manage cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">9. Children's Privacy (COPPA Compliance)</h2>
              <p>Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will promptly delete it.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">10. International Data Transfers</h2>
              <p>Your information may be transferred to and processed in countries other than your country of residence. We ensure such transfers comply with applicable data protection laws through appropriate safeguards.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">11. Third-Party Services</h2>
              <p>Our service may contain links to third-party websites or use third-party services. This Privacy Policy applies only to information collected by us. We encourage you to review the privacy policies of any third-party services you use.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">12. Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on our website or through other communication methods.</p>
              <p className="mt-2"><strong>Last Updated: December 2025</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">13. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy or your personal information, please contact us:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email: support@pawdia-ai.com</li>
                <li>Customer Service Hours: Monday-Friday 9:00 AM - 6:00 PM PST</li>
                <li>Response Time: We will respond within 2 business days</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link to="/terms">
            <Button variant="outline" className="mr-4">
              View Terms of Service
            </Button>
          </Link>
          <Link to="/">
            <Button>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;