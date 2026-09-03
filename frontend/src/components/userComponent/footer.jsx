import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
  Shield,
  Star,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "All Courses", to: "/#courses" },
    { label: "Free Quizzes", to: "/quizeDetail?type=Free" },
    { label: "Premium Tests", to: "/quizeDetail?type=Paid" },
    { label: "Success Stories", to: "/#success-stories" },
  ];

  const examLinks = [
    { label: "NDA Foundation (11th+12th+NDA+SSB Interview)", href: "#" },
    { label: "NDA Target (12th Pass)", href: "#" },
    { label: "CDS", href: "#" },
    { label: "MNS", href: "#" },
    { label: "AFCAT", href: "#" },
    { label: "SSB Interview", href: "#" },
    { label: "NDA Test", href: "#" },
    { label: "CDS Test", href: "#" },
    { label: "AFCAT Test", href: "#" },
    { label: "NDA Mock Test 2026", href: "#" },
    { label: "CDS Mock Test 2026", href: "#" },
  ];

  const socialLinks = [
    {
      label: "Facebook",
      href: "https://facebook.com/TEJAS-Defence-Academy-106368614649863",
      icon: (
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com/tejasdefenceacademypatna",
      icon: (
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zm0 6.915a2.753 2.753 0 1 1 0-5.506 2.753 2.753 0 0 1 0 5.506zm5.222-6.52a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z" />
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com/@tejasdefenceacademypatna",
      icon: (
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      ),
    },
    {
      label: "Telegram",
      href: "#",
      icon: (
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      ),
    },
  ];

  return (
    <footer style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Newsletter CTA Strip ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0d2b1a 0%, #1a4a2e 50%, #0d2b1a 100%)",
          borderBottom: "1px solid rgba(212,175,55,0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative stars */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "2px",
                height: "2px",
                borderRadius: "50%",
                background: "rgba(212,175,55,0.4)",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "56px 24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "32px",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <Shield size={22} style={{ color: "#d4af37" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "#d4af37",
                }}
              >
                Join the Mission
              </span>
            </div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#ffffff",
                margin: "0 0 8px 0",
                lineHeight: 1.3,
              }}
            >
              Ready to Serve the Nation?
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#a3bfaa",
                margin: 0,
                maxWidth: "420px",
              }}
            >
              Subscribe for daily current affairs, exam notifications, and
              defence prep tips delivered to your inbox.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: "flex",
              gap: "0",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(212,175,55,0.4)",
            }}
          >
            <label
              htmlFor="footer-email"
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                overflow: "hidden",
                clip: "rect(0,0,0,0)",
              }}
            >
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Enter your email"
              style={{
                padding: "14px 20px",
                border: "none",
                outline: "none",
                background: "rgba(255,255,255,0.05)",
                color: "#ffffff",
                fontSize: "14px",
                width: "260px",
                backdropFilter: "blur(4px)",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 22px",
                background: "linear-gradient(135deg, #d4af37, #f0d060)",
                color: "#0d2b1a",
                fontWeight: 700,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
                transition: "filter 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              Subscribe <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Main Footer Body ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #091a10 0%, #050e08 100%)",
          padding: "72px 24px 48px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "48px",
          }}
        >
          {/* ── Brand Column ── */}
          <div style={{ gridColumn: "span 1" }}>
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #1a4a2e, #0d2b1a)",
                  border: "1px solid rgba(212,175,55,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(212,175,55,0.15)",
                }}
              >
                <Shield size={26} style={{ color: "#d4af37" }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1.1,
                  }}
                >
                  Tejas Defence
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#d4af37",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  Academy
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#7a9e82",
                lineHeight: 1.8,
                marginBottom: "24px",
              }}
            >
              Bihar's premier defence coaching academy. We shape future officers
              with disciplined preparation, expert faculty, and battle-tested
              study material.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "12px" }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7a9e82",
                    transition: "all 0.25s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(212,175,55,0.15)";
                    e.currentTarget.style.color = "#d4af37";
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#7a9e82";
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)";
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: "16px",
                      height: "16px",
                      fill: "currentColor",
                    }}
                  >
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              Quick Links
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {quickLinks.map((link) => {
                const isHash = link.to.includes('#');
                return (
                  <li key={link.label}>
                    {isHash ? (
                      <a
                        href={link.to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "#7a9e82",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#d4af37")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#7a9e82")
                        }
                      >
                        <ChevronRight size={14} />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "#7a9e82",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#d4af37")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#7a9e82")
                        }
                      >
                        <ChevronRight size={14} />
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Exam Prep ── */}
          <div>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              Exam Prep
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {examLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#7a9e82",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#d4af37")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#7a9e82")
                    }
                  >
                    <ChevronRight size={14} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact & Hours ── */}
          <div>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              Contact Us
            </h3>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Address */}
              <li
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <MapPin size={14} style={{ color: "#d4af37" }} />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#7a9e82",
                    lineHeight: 1.7,
                  }}
                >
                  3rd Floor, Rai Complex, E Boring Canal Rd,
                  <br />
                  Near Panchmukhi Mandir,
                  <br />
                  Kidwaipuri, Patna, Bihar 800001
                </span>
              </li>

              {/* Phone */}
              <li
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={14} style={{ color: "#d4af37" }} />
                </div>
                <a
                  href="tel:6287029439"
                  style={{
                    fontSize: "13px",
                    color: "#7a9e82",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4af37")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#7a9e82")
                  }
                >
                  6287029439
                </a>
              </li>

              {/* Email */}
              <li
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mail size={14} style={{ color: "#d4af37" }} />
                </div>
                <a
                  href="mailto:tejaseducationindia20@gmail.com"
                  style={{
                    fontSize: "13px",
                    color: "#7a9e82",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4af37")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#7a9e82")
                  }
                >
                  tejaseducationindia20@gmail.com
                </a>
              </li>

              {/* Website */}
              <li
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Globe size={14} style={{ color: "#d4af37" }} />
                </div>
                <a
                  href="https://tejasdefence.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "13px",
                    color: "#7a9e82",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4af37")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#7a9e82")
                  }
                >
                  tejasdefence.com
                </a>
              </li>
            </ul>

            {/* Working Hours Card */}
            <div
              style={{
                marginTop: "28px",
                padding: "16px",
                borderRadius: "10px",
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Clock size={14} style={{ color: "#d4af37" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "#d4af37",
                  }}
                >
                  Working Hours
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#7a9e82" }}>
                  Tue – Sat
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  10:00 AM – 6:00 PM
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#7a9e82" }}>
                  Sunday
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    letterSpacing: "1px",
                  }}
                >
                  CLOSED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider with Stars ── */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "56px auto 0",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(212,175,55,0.3))",
            }}
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Star size={10} style={{ color: "#d4af37", fill: "#d4af37" }} />
            <Shield size={16} style={{ color: "#d4af37" }} />
            <Star size={10} style={{ color: "#d4af37", fill: "#d4af37" }} />
          </div>
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(to left, transparent, rgba(212,175,55,0.3))",
            }}
          />
        </div>
      </div>

      {/* ── Copyright Bar ── */}
      <div
        style={{
          background: "#030a05",
          borderTop: "1px solid rgba(212,175,55,0.1)",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ fontSize: "12px", color: "#3d5c43", margin: 0 }}>
              &copy; {new Date().getFullYear()} Tejas Defence Academy. All
              rights reserved.
            </p>
            <p style={{ fontSize: "11px", color: "#2a402e", margin: 0 }}>
              Designed & Developed by{" "}
              <strong style={{ color: "#7a9e82" }}>IITNS</strong> | Contact:{" "}
              <a
                href="https://wa.me/918521859948"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#7a9e82", textDecoration: "none" }}
              >
                WhatsApp (+91 85218 59948)
              </a>
            </p>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Refund Policy"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    fontSize: "12px",
                    color: "#3d5c43",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#d4af37")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#3d5c43")
                  }
                >
                  {item}
                </a>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
