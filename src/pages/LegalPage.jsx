import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { api } from "../services/api";
import {
  FileText,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Printer,
  Mail,
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

// Robust fallback defaults if offline or backend cold-start
const FALLBACK_TERMS = {
  slug: "terms",
  title: "Terms & Conditions",
  subtitle: "Clear guidelines and mutual commitments for an exceptional reading journey.",
  last_updated: "October 2026",
  content: {
    intro:
      "Welcome to BookNest. These Terms and Conditions govern your use of our website, services, and the purchase of books from our catalog. By browsing, creating an account, or placing an order, you agree to comply with and be bound by these terms.",
    sections: [
      {
        id: "eligibility",
        heading: "1. Acceptance of Terms & Eligibility",
        body: "By accessing BookNest, you represent that you are at least 18 years of age or accessing the site under the supervision of a parent or legal guardian. If you do not agree with any part of these terms, please discontinue using the service immediately."
      },
      {
        id: "accounts",
        heading: "2. Accounts, Email OTP Verification & Security",
        body: "To access certain features like order tracking and wishlists, you must register an account. During registration, a 6-digit email OTP is sent to verify your identity. You are responsible for safeguarding your password and account credentials. Notify us immediately of any unauthorized access."
      },
      {
        id: "orders-pricing",
        heading: "3. Book Orders, Pricing & Catalog Availability",
        body: "All book orders placed are subject to inventory availability. We strive for 100% price accuracy, but in the rare event of a typographical error, BookNest reserves the right to cancel or rectify orders prior to dispatch. Prices are quoted in Indian Rupees (₹) inclusive of applicable taxes."
      },
      {
        id: "shipping-delivery",
        heading: "4. Shipping & Delivery Timeline",
        body: "We offer free standard doorstep delivery on all orders over ₹799. Orders below ₹799 incur a standard shipping fee of ₹49. Most orders are dispatched within 24-48 business hours and delivered within 3-5 business days across India."
      },
      {
        id: "returns-refunds",
        heading: "5. Cancellations & Easy 7-Day Returns",
        body: "You may cancel an order before it has been shipped. If you receive a book that is physically damaged, misprinted, or defective, you may initiate a return within 7 calendar days of delivery for a replacement or full refund to the original payment method."
      },
      {
        id: "intellectual-property",
        heading: "6. Intellectual Property & Copyrights",
        body: "All book titles, cover illustrations, descriptions, brand graphics, and logos displayed on BookNest are the intellectual property of their respective publishers, authors, or BookNest Inc. Unauthorized reproduction or scraping is prohibited."
      },
      {
        id: "conduct",
        heading: "7. User Conduct & Reviews",
        body: "When submitting book reviews or ratings, you agree not to submit unlawful, defamatory, or abusive content. BookNest reserves the right to moderate, edit, or remove reviews that violate community standards."
      },
      {
        id: "liability",
        heading: "8. Limitation of Liability & Jurisdiction",
        body: "BookNest shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the platform. These terms are governed in accordance with the laws of India, subject to the jurisdiction of competent courts."
      },
      {
        id: "contact",
        heading: "9. Contact Information & Support",
        body: "For queries or concerns regarding these terms, reach our support team at hello@booknest.example or via telephone at +91 (800) 266-5637 (Mon-Sat, 9am - 7pm IST)."
      }
    ]
  }
};

const FALLBACK_PRIVACY = {
  slug: "privacy",
  title: "Privacy Policy",
  subtitle: "How we protect, respect, and handle your personal reading data.",
  last_updated: "October 2026",
  content: {
    intro:
      "At BookNest, your privacy is a foundational priority. This Privacy Policy describes how we collect, use, store, and protect your personal information when you browse our bookstore, create an account, or order books.",
    sections: [
      {
        id: "collection",
        heading: "1. Information We Collect",
        body: "We collect information you provide directly, such as your full name, email address, contact phone number, delivery address, city, state, and pin code. We also collect transactional details regarding books purchased and saved wishlist titles."
      },
      {
        id: "usage",
        heading: "2. How We Use Your Information",
        body: "Your data is used solely to process book orders, verify your account via one-time verification codes (OTPs), coordinate doorstep deliveries, send transactional order invoices, and offer personalized reading recommendations."
      },
      {
        id: "security",
        heading: "3. Security & Payment Data Protection",
        body: "We implement industry-standard encryption, SSL/TLS transmission protocols, and strict access controls. BookNest does not store your credit/debit card numbers or CVV codes; all payment processing is securely managed by certified PCI-DSS compliant payment gateways."
      },
      {
        id: "sharing",
        heading: "4. Information Sharing & Third Parties",
        body: "We do not sell, rent, or monetize your personal details. We share relevant data only with vetted logistics and delivery partners (e.g. courier services) solely to ensure timely book dispatch and package delivery."
      },
      {
        id: "cookies",
        heading: "5. Cookies & Local Storage",
        body: "We use essential cookies and browser local storage to preserve your shopping bag, wishlist, and session authentication tokens between visits for a seamless reading and shopping experience."
      },
      {
        id: "user-rights",
        heading: "6. Your Data Rights & Choices",
        body: "You have the right to view, update, or edit your saved profile information and delivery address at any time from your Account Profile page. You may also request deletion of your account and associated history by contacting support."
      },
      {
        id: "updates",
        heading: "7. Policy Updates & Notifications",
        body: "We may update this Privacy Policy periodically to reflect changes in our legal obligations or store enhancements. Any significant revisions will be indicated by the 'Last Updated' date at the top of this page."
      },
      {
        id: "privacy-contact",
        heading: "8. Privacy Inquiries & Data Officer",
        body: "If you have any questions about this privacy statement or our handling of your data, please contact our Data Protection desk at privacy@booknest.example."
      }
    ]
  }
};

export const LegalPage = ({ slug = "terms" }) => {
  const { navigate } = useShop();
  const currentSlug = slug === "privacy" || slug === "privacy-policy" ? "privacy" : "terms";

  const fallback = currentSlug === "privacy" ? FALLBACK_PRIVACY : FALLBACK_TERMS;
  const [policyData, setPolicyData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState("");

  // Fetch policy from backend API
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api
      .getPolicy(currentSlug)
      .then((res) => {
        if (!ignore && res && res.policy) {
          setPolicyData(res.policy);
        }
      })
      .catch((err) => {
        console.warn(`Notice loading policy '${currentSlug}', using local template:`, err);
        if (!ignore) {
          setPolicyData(currentSlug === "privacy" ? FALLBACK_PRIVACY : FALLBACK_TERMS);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentSlug]);

  // Set page document title
  useEffect(() => {
    document.title = `${policyData.title || "Legal Policies"} | BookNest`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [policyData.title, currentSlug]);

  const sections = policyData.content?.sections || policyData.content?.clauses || [];
  const intro = policyData.content?.intro || policyData.content?.notice || "";

  const handleTabSwitch = (targetSlug) => {
    if (targetSlug === currentSlug) return;
    navigate(`/${targetSlug}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id) => {
    setActiveSectionId(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="legal-page-root">
      {/* Hero Header */}
      <section className="legal-hero">
        <div className="container">
          <div className="legal-breadcrumbs">
            <span onClick={() => navigate("/")} className="crumb-link">
              Home
            </span>
            <ChevronRight size={14} className="crumb-sep" />
            <span className="crumb-current">{policyData.title}</span>
          </div>

          <div className="legal-hero-content">
            <div className="legal-badge-row">
              <span className="legal-type-badge">
                {currentSlug === "privacy" ? <ShieldCheck size={14} /> : <FileText size={14} />}
                Official Legal Documentation
              </span>
              <span className="last-updated-badge">
                <Calendar size={13} /> Last updated: {policyData.last_updated}
              </span>
            </div>

            <h1 className="legal-title">{policyData.title}</h1>
            <p className="legal-subtitle">{policyData.subtitle}</p>
          </div>

          {/* Policy Switcher Tabs */}
          <div className="legal-nav-tabs">
            <button
              className={`legal-nav-tab ${currentSlug === "terms" ? "active" : ""}`}
              onClick={() => handleTabSwitch("terms")}
              type="button"
            >
              <FileText size={16} />
              <span>Terms & Conditions</span>
            </button>
            <button
              className={`legal-nav-tab ${currentSlug === "privacy" ? "active" : ""}`}
              onClick={() => handleTabSwitch("privacy")}
              type="button"
            >
              <ShieldCheck size={16} />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="legal-content-section">
        <div className="container legal-layout-grid">
          {/* Left Table of Contents Sidebar */}
          <aside className="legal-sidebar">
            <div className="legal-toc-card">
              <h3>Table of Contents</h3>
              <nav className="legal-toc-nav">
                {sections.map((sec, idx) => {
                  const secId = sec.id || `section-${idx}`;
                  const isActive = activeSectionId === secId;
                  return (
                    <button
                      key={secId}
                      className={`toc-link ${isActive ? "active" : ""}`}
                      onClick={() => scrollToSection(secId)}
                      type="button"
                    >
                      <span className="toc-number">{idx + 1}</span>
                      <span className="toc-title">
                        {sec.heading.replace(/^\d+[\.\)]\s*/, "")}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="toc-actions">
                <button type="button" className="btn-print-policy" onClick={handlePrint}>
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div className="legal-support-card">
              <div className="support-card-icon">
                <HelpCircle size={20} />
              </div>
              <h4>Need Legal Assistance?</h4>
              <p>
                Have questions or need clarification regarding our policies? Our customer care desk is here for you.
              </p>
              <a href="mailto:hello@booknest.example" className="support-link">
                <Mail size={14} />
                <span>hello@booknest.example</span>
              </a>
            </div>
          </aside>

          {/* Right Main Policy Text */}
          <main className="legal-main-body">
            {/* Introduction Card */}
            {intro && (
              <div className="legal-intro-card">
                <div className="intro-badge">
                  <CheckCircle2 size={18} />
                  <span>Summary Notice</span>
                </div>
                <p className="intro-text">{intro}</p>
              </div>
            )}

            {/* Policy Sections */}
            <div className="legal-clauses-list">
              {sections.map((sec, idx) => {
                const secId = sec.id || `section-${idx}`;
                return (
                  <article key={secId} id={secId} className="legal-clause-card">
                    <div className="clause-header">
                      <span className="clause-index">Clause {idx + 1}</span>
                      <h2>{sec.heading}</h2>
                    </div>
                    <div className="clause-body">
                      <p>{sec.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Highlights Strip */}
            <div className="legal-perks-strip">
              <div className="perk-item">
                <CheckCircle2 size={16} />
                <span>100% Genuine Publisher Prints</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={16} />
                <span>Encrypted 256-bit SSL Checkout</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={16} />
                <span>Easy 7-Day Replacement Policy</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={16} />
                <span>Verified OTP Account Security</span>
              </div>
            </div>

            {/* Next Policy Switch Banner */}
            <div className="legal-switch-footer-banner">
              <div>
                <span>Looking for our other legal documentation?</span>
                <h4>
                  {currentSlug === "terms"
                    ? "Read our complete Privacy Policy"
                    : "Review our store Terms & Conditions"}
                </h4>
              </div>
              <button
                type="button"
                className="btn-switch-policy"
                onClick={() => handleTabSwitch(currentSlug === "terms" ? "privacy" : "terms")}
              >
                <span>
                  {currentSlug === "terms" ? "View Privacy Policy" : "View Terms & Conditions"}
                </span>
                <ArrowRight size={15} />
              </button>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};
