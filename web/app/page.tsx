export default function Home() {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-10">
        <div className="text-center space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            DAO Analytics Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor, analyze, and visualize DAO metrics to gain insights into governance, participation, and treasury health.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <a
              href="/dao"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
            >
              View DAOs
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100"
            >
              Documentation
            </a>
          </div>
        </div>
  
        {/* Feature Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12">
          <FeatureCard
            title="Comprehensive Metrics"
            description="Track participation rates, proposal outcomes, treasury health, and token distribution across multiple DAOs."
          />
          <FeatureCard
            title="Historical Analysis"
            description="Analyze trends over time with interactive charts and historical data visualizations."
          />
          <FeatureCard
            title="Multi-Chain Support"
            description="Monitor DAOs across different blockchain networks with unified analytics."
          />
        </div>
      </div>
    )
  }
  
  function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    )
  }