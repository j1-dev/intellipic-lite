import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-blue-50">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 h-40">
              Create amazing{' '}
              <span className="block mt-2">AI-generated images</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into stunning visuals with our AI image
              generation platform. Perfect for creating unique artwork,
              visualizing concepts, or just having fun!
            </p>
            <div className="mt-10 flex justify-center gap-6">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 hover:bg-gray-50 transition-all duration-200 hover:scale-105">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Image Section */}
          <div className="max-w-5xl mx-auto mb-32">
            <div className="relative overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 mix-blend-overlay"></div>
              <Image
                src="/intellipic-lite.png"
                alt="AI Generated Image Example"
                width={1000}
                height={600}
                className="w-full"
                priority
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Why Choose IntelliPic Lite?
            </h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Lightning Fast
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate stunning images in seconds with our advanced AI
                  technology. No waiting, just instant creativity.
                </p>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  High Quality
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Create high-resolution images that look professional and
                  realistic. Perfect for any project.
                </p>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Endless Possibilities
                </h3>
                <p className="text-gray-600 leading-relaxed">
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
