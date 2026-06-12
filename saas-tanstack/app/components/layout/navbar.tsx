import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '~/components/language/language-switcher';
import { useAuth } from '~/lib/auth/context';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-4 z-50 mx-4 mt-4 glass-strong rounded-2xl shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-primary hover:text-secondary transition-colors duration-200 font-heading">
          SaaS Template
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/#features"
            className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
          >
            Blog
          </Link>
          <Link
            to="/about"
            className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
          >
            About
          </Link>
          <LanguageSwitcher />
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-primary/25 cursor-pointer"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div id="mobile-menu" className="border-t border-border md:hidden">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <Link
              to="/#features"
              className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/blog"
              className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/about"
              className="px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:text-primary rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <div className="pt-2 border-t border-border">
              <LanguageSwitcher />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full px-4 py-2 text-sm font-medium text-center text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full px-4 py-2 text-sm font-medium text-center text-foreground bg-white border border-border rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/login"
                    className="w-full px-4 py-2 text-sm font-medium text-center text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
