import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PromptAnimation from '@/components/PromptAnimation';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-blue-50 dark:from-background dark:to-blue-950/30">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-foreground h-40">
              Create amazing{' '}
              <span className="block mt-2">AI-generated images</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The most user friendly way of creating AI images thanks to the
              power of SeedDream. Create stunning images in any style
              imaginable, edit portraits and even change facial expressions with
              just one prompt. Joins us now, and get 5 free credits!
            </p>
            <div className="mt-10 flex justify-center gap-6">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 transition-all duration-200 cursor-pointer">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 hover:bg-muted transition-all duration-200 cursor-pointer">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Image Section */}
          <PromptAnimation />

          {/* Features Section */}
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 bg-clip-text text-foreground">
              Why Choose IntelliPic-Lite?
            </h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="group bg-card p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground flex">
                  Lightning Fast
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate stunning images in seconds with our advanced AI
                  technology. No waiting, just instant creativity.
                </p>
              </div>
              <div className="group bg-card p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="rounded-xl bg-gradient-to-br from-green-100 to-green-200 p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground flex">
                  High Quality
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create high-resolution images that look professional and
                  realistic. Perfect for any project.
                </p>
              </div>
              <div className="group bg-card p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-purple-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground flex">
                  Endless Possibilities
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create any type of image you can imagine with simple text
                  prompts. Let your creativity run wild.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
