import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">Last Updated: December 2025</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Terms of Service for Pawdia AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">1. Agreement Acceptance</h2>
              <p>By accessing or using Pawdia AI's pet portrait generation service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Service Description</h2>
              <p>Pawdia AI provides AI-powered pet portrait generation services, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>AI-driven artistic processing of pet photos</li>
                <li>Multiple artistic style options</li>
                <li>Various resolution and quality output options</li>
                <li>Subscription-based and pay-per-use models</li>
                <li>Digital download of generated portraits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">3. Account Registration</h2>
              <p>To use our service, you must register for an account:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You must provide accurate, complete, and current registration information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must be at least 13 years old to use this service</li>
                <li>You may not create multiple accounts to circumvent usage limitations</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Subscription and Payment Terms</h2>
              <p><strong>Free Subscription:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Limited number of pet portrait generations per month</li>
                <li>512×512 pixel output resolution</li>
                <li>Standard generation quality</li>
                <li>72 DPI output</li>
                <li>Watermarked downloads</li>
              </ul>
              
              <p className="mt-4"><strong>Paid Subscription:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Unlimited portrait generations</li>
                <li>Up to 2048×2048 pixel resolution</li>
                <li>High and ultra-high quality options</li>
                <li>Up to 600 DPI output suitable for printing</li>
                <li>Watermark-free downloads</li>
                <li>Priority customer support</li>
              </ul>
              
              <p className="mt-4"><strong>Payment Terms:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Subscriptions automatically renew and can be canceled at any time</li>
                <li>Payments are processed through PayPal</li>
                <li>All fees are billed in US Dollars (USD)</li>
                <li>Refunds may be requested within 7 days of purchase</li>
                <li>Taxes are not included and are the responsibility of the customer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">5. Content Policy</h2>
              <p><strong>Permitted Content:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pet photos that you own or have rights to use</li>
                <li>Clear, high-quality pet images</li>
                <li>Family-friendly content appropriate for all ages</li>
                <li>Content that complies with applicable laws and regulations</li>
              </ul>
              
              <p className="mt-4"><strong>Prohibited Content:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Content that infringes on others' copyrights or intellectual property</li>
                <li>Inappropriate, offensive, or illegal content</li>
                <li>Human portraits (service is for pets only)</li>
                <li>Commercial logos or copyrighted materials</li>
                <li>Content that promotes violence, hate speech, or discrimination</li>
                <li>Sexually explicit or adult content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Intellectual Property Rights</h2>
              <p><strong>Your Rights:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You retain ownership of the original photos you upload</li>
                <li>Generated AI portraits are for your personal use</li>
                <li>You may share generated portraits on personal social media</li>
                <li>Non-commercial use is permitted with proper attribution</li>
              </ul>
              
              <p className="mt-4"><strong>Our Rights:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pawdia AI brand and website content are our intellectual property</li>
                <li>AI models and technology are proprietary to us</li>
                <li>We may use anonymized data to improve our services</li>
                <li>We retain rights to the service platform and underlying technology</li>
              </ul>
              
              <p className="mt-4"><strong>Commercial Use:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Commercial use requires a separate commercial license</li>
                <li>Contact us for commercial licensing options</li>
                <li>Unauthorized commercial use is prohibited</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Attempt to hack, crack, or circumvent service limitations</li>
                <li>Use automated tools for bulk content generation</li>
                <li>Use the service for commercial purposes without proper licensing</li>
                <li>Interfere with or disrupt service operations</li>
                <li>Distribute malware or engage in cyber attacks</li>
                <li>Reverse engineer or decompile our technology</li>
                <li>Use the service to create content for illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">8. Service Availability</h2>
              <p>We strive to maintain high service availability, but:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Service may be suspended for maintenance, upgrades, or technical issues</li>
                <li>We do not guarantee 100% uninterrupted service</li>
                <li>We reserve the right to modify or terminate the service</li>
                <li>We will provide advance notice of significant changes when possible</li>
                <li>Service levels may vary based on server load and technical conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">9. Disclaimer of Warranties</h2>
              <p>The service is provided "as is" without warranties of any kind:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We do not guarantee the service will be error-free or uninterrupted</li>
                <li>We do not guarantee generated results will meet specific expectations</li>
                <li>We do not guarantee the timeliness, accuracy, or reliability of the service</li>
                <li>We disclaim all implied warranties, including merchantability and fitness for purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">10. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Our total liability to you shall not exceed the amount you paid for services in the past 12 months</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>We are not liable for data loss or corruption</li>
                <li>We are not liable for third-party actions or content</li>
                <li>Some jurisdictions do not allow limitations of liability, so these limitations may not apply to you</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">11. Termination</h2>
              <p>We may terminate or suspend your account under the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violation of these Terms of Service</li>
                <li>Prolonged account inactivity</li>
                <li>Legal or regulatory requirements</li>
                <li>Security concerns or fraudulent activity</li>
                <li>Non-payment of subscription fees</li>
              </ul>
              <p className="mt-2">Upon termination, your right to use the service will immediately cease.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">12. Governing Law and Dispute Resolution</h2>
              <p><strong>Governing Law:</strong> These terms shall be governed by the laws of the State of California, without regard to its conflict of law provisions.</p>
              <p className="mt-2"><strong>Dispute Resolution:</strong> Any disputes shall be resolved through binding arbitration in San Francisco, California, in accordance with the rules of the American Arbitration Association. Each party shall bear its own costs of arbitration.</p>
              <p className="mt-2"><strong>Class Action Waiver:</strong> You agree to resolve disputes on an individual basis and waive any right to participate in class actions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">13. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Material changes will be communicated via email or posted on our website. Continued use of the service after changes constitutes acceptance of the modified terms.</p>
              <p className="mt-2"><strong>Last Updated: December 2025</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">14. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email: support@pawdia-ai.com</li>
                <li>Customer Service Hours: Monday-Friday 9:00 AM - 6:00 PM PST</li>
                <li>Response Time: Within 2 business days</li>
                <li>Mailing Address: [Your Company Address, if applicable]</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link to="/privacy">
            <Button variant="outline" className="mr-4">
              View Privacy Policy
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

export default TermsOfService;