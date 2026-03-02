import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import PlatformIllustration from "@/components/landing/PlatformIllustration";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1a]">
      {/* Simple Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl text-white">
            Realtime Coding Arena
          </Link>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <Link
                href="/sign-up"
                className="rounded-md bg-[#10b981] px-4 py-2 text-sm text-white font-medium hover:bg-[#059669] transition-colors"
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Illustration */}
            <div className="order-2 lg:order-1">
              <PlatformIllustration />
            </div>

            {/* Right Column - Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                A New Way to Learn Coding
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
                Realtime Coding Arena is the best platform to help you enhance your skills, expand your knowledge and prepare for technical interviews. Race with friends, practice with AI, and level up your coding skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-lg bg-[#10b981] px-8 py-4 text-white font-semibold hover:bg-[#059669] transition-colors"
                  >
                    Go to Dashboard
                    <span className="ml-2">→</span>
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center rounded-lg bg-[#10b981] px-8 py-4 text-white font-semibold hover:bg-[#059669] transition-colors"
                  >
                    Create Account
                    <span className="ml-2">→</span>
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard/practice"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Practice
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/contest"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Contests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/race"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Race
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/interview"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Interview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/analytics"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cookie-policy"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} Realtime Coding Arena. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
