import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { generateOrganizationSchema } from "@/components/SEO/StructuredData";
import { SEO_CONFIG, BASE_URL } from "@/config/seo";
import { Footer } from "@/components/Footer";
import { Mail, Instagram, MessageCircle, Clock } from "lucide-react";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Contact = () => {
  const seo = SEO_CONFIG['/contact'];

  const orgSchema = generateOrganizationSchema({
    name: 'Pawdia AI',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://instagram.com/pawdia.creative',
    ],
    contactPoint: {
      contactType: 'Customer Service',
      email: 'pawdia.creative@gmail.com',
    },
  });

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
      />
      <StructuredData data={orgSchema} type="Organization" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Contact Us
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12">
              Have a question, feedback, or need support? We're here to help!
              Reach out to us through any of the channels below.
            </p>

            {/* Send us a message form */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow mb-12">
              <h3 className="text-2xl font-semibold mb-4">Send us a message</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Name" id="contact-name" />
                  <Input placeholder="Email" id="contact-email" />
                </div>
                <Input placeholder="Phone number (optional)" id="contact-phone" />
                <Textarea placeholder="Your message" id="contact-message" rows={6} />
                <div className="flex justify-end">
                  <Button onClick={async () => {
                    const name = (document.getElementById('contact-name') as HTMLInputElement)?.value || '';
                    const email = (document.getElementById('contact-email') as HTMLInputElement)?.value || '';
                    const phone = (document.getElementById('contact-phone') as HTMLInputElement)?.value || '';
                    const message = (document.getElementById('contact-message') as HTMLTextAreaElement)?.value || '';
                    if (!name || !email || !message) {
                      toast.error('Please fill name, email and message.');
                      return;
                    }
                    try {
                      const apiUrl = '/api/contact';
                      const resp = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, phone, message })
                      });
                      const data = await resp.json();
                      if (resp.ok) {
                        toast.success('Message sent. We will contact you shortly.');
                        (document.getElementById('contact-name') as HTMLInputElement).value = '';
                        (document.getElementById('contact-email') as HTMLInputElement).value = '';
                        (document.getElementById('contact-phone') as HTMLInputElement).value = '';
                        (document.getElementById('contact-message') as HTMLTextAreaElement).value = '';
                      } else {
                        toast.error(data.message || 'Failed to send message');
                      }
                    } catch (err) {
                      console.error('Contact send error', err);
                      toast.error('Network error. Please try again later.');
                    }
                  }}>
                    Send
                  </Button>
                </div>
              </form>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Instagram</h3>
                    <p className="text-muted-foreground">Follow us for updates & examples</p>
                  </div>
                </div>
                <a
                  href="https://instagram.com/pawdia.creative"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  @pawdia.creative
                </a>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-red-500 to-blue-600 p-3 rounded-full">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Email</h3>
                    <p className="text-muted-foreground">Send us a message</p>
                  </div>
                </div>
                <a
                  href="mailto:pawdia.creative@gmail.com"
                  className="text-primary hover:underline font-medium"
                >
                  pawdia.creative@gmail.com
                </a>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-6 mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Response Time</h3>
              </div>
              <p className="text-muted-foreground">
              We typically respond as soon as possible. For urgent matters, 
                please mention "URGENT" in your subject line.
              </p>
            </div>

            <div className="bg-primary/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How do I create a pet portrait?</h4>
                  <p className="text-muted-foreground">
                    Simply upload your pet photo, choose a style, and generate your portrait. 
                    You can preview it for free before downloading.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What file formats do you support?</h4>
                  <p className="text-muted-foreground">
                    We support JPG, PNG, and WebP formats for uploads. Downloads are available 
                    in high-resolution JPG and PNG formats.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I use the portrait commercially?</h4>
                  <p className="text-muted-foreground">
                    Yes! You own the full commercial rights to your generated pet portrait.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Removed duplicate "Send us a message" block (already placed between Instagram and Email) */}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Contact;

