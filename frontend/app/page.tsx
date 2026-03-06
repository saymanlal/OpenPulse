export default function Home() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-4">
            OpenPulse
          </h1>
          <p className="text-center text-xl mb-8">
            3D Interactive Intelligence Platform
          </p>
          <div className="border border-gray-700 rounded-lg p-8 bg-gray-900/50">
            <h2 className="text-2xl font-semibold mb-4">Phase 1 Complete ✅</h2>
            <p className="mb-4">
              Project structure initialized and ready for development.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Next.js 14 with App Router configured</li>
              <li>TypeScript strict mode enabled</li>
              <li>TailwindCSS integrated</li>
              <li>Three.js dependencies installed</li>
              <li>Project structure established</li>
            </ul>
            <p className="mt-6 text-sm text-gray-400">
              Next: Phase 2 - Frontend layout and 3D canvas setup
            </p>
          </div>
        </div>
      </main>
    )
  }