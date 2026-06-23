import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <span className="text-background font-heading text-sm font-bold">OR</span>
              </div>
              <span className="font-heading text-lg tracking-widest">OASIS ROYALE</span>
            </Link>
            <p className="text-muted max-w-md leading-relaxed">
              Digital menu &amp; ordering system for upscale restaurants. View dishes in AR, order from your phone, and experience dining reimagined.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-6">Navigate</h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-6">Access</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/profile" className="text-muted hover:text-foreground transition-colors text-sm">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-6">Contact</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li>Beverly Hills, California, USA</li>
              <li>
                <a href="mailto:hello@oasisroyale.com" className="hover:text-foreground transition-colors">
                  hello@oasisroyale.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted text-xs">&copy; {new Date().getFullYear()} Oasis Royale. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted">
            <Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
