import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Blockmail
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/try" className="text-sm text-gray-600 hover:text-gray-900">
              Try It
            </Link>
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Block Disposable Emails
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Protect your signup flows with our powerful 6-tier verification engine. Detect and block
            temporary emails before they pollute your user database.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/try">Try It Live</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-gray-50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">Why Blockmail?</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <FeatureCard
                title="6-Tier Verification"
                description="Multi-layered detection engine that catches 99.9% of disposable emails."
              />
              <FeatureCard
                title="Lightning Fast"
                description="Sub-100ms response times with intelligent short-circuiting."
              />
              <FeatureCard
                title="Developer First"
                description="Simple API, comprehensive docs, and SDKs for every language."
              />
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="container mx-auto px-4 py-24">
          <h2 className="text-center text-3xl font-bold text-gray-900">Integrate in Minutes</h2>
          <div className="mx-auto mt-12 max-w-2xl">
            <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-6">
              <code className="text-sm text-gray-900">
                {`import { Blockmail } from '@blockmail/sdk';

const blockmail = new Blockmail('your-api-key');

const result = await blockmail.verify('user@example.com');

if (result.is_disposable) {
  // Block the signup
}`}
              </code>
            </pre>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-200 bg-gray-50 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Ready to Get Started?</h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              Start blocking disposable emails today. Free tier includes 100 verifications per day.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/try">Try It Live</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Blockmail. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/try" className="text-sm text-gray-600 hover:text-gray-900">
                Try It
              </Link>
              <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
                Docs
              </Link>
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}
