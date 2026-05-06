"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageSquare, Facebook, Instagram } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    // Replace with real API call when backend contact endpoint is ready
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast.success("Message sent! We'll reply within 24 hours.");
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground">
          Have a question, need help with an order, or want to know more about a product?
          We're here 7 days a week.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left — contact info */}
        <div className="space-y-5">
          <div className="card-base p-6 space-y-5">
            {[
              {
                icon: MapPin,
                label: "Address",
                value: "Street 271, Toul Kork, Phnom Penh, Cambodia",
              },
              {
                icon: Phone,
                label: "Phone / Telegram",
                value: "+855 12 345 678",
              },
              {
                icon: Mail,
                label: "Email",
                value: "support@techstore.kh",
              },
              {
                icon: Clock,
                label: "Business Hours",
                value: "Monday – Sunday: 8:00 AM – 8:00 PM",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-sm mb-3">Follow Us</h3>
            <div className="flex gap-3">
              {[
                { icon: Facebook,  label: "Facebook",  href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: MessageSquare, label: "Telegram", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Shipping info */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-sm mb-3">Delivery & Returns</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📦 Free shipping on orders over <strong className="text-foreground">$100</strong></li>
              <li>🚚 Flat rate <strong className="text-foreground">$2.50</strong> shipping under $100</li>
              <li>⏱ Delivery within <strong className="text-foreground">2–3 business days</strong> nationwide</li>
              <li>🔄 7-day return policy for defective items</li>
              <li>💳 Bakong KHQR &amp; Cash on Delivery accepted</li>
            </ul>
          </div>
        </div>

        {/* Right — contact form */}
        <div className="card-base p-6">
          <h2 className="font-bold text-lg mb-5">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Sopheak Meng"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order enquiry, product question..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="How can we help you?"
                className={`${inputCls} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
