"use client"

import { SustainabilityDashboard } from "../../../components/dao/SustainabilityDashboard"

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-muted/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="container mx-auto py-8 px-4 max-w-7xl relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            DAO Sustainability Scoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive sustainability analysis based on academic research methodology
          </p>
        </div>

        {/* Main Dashboard */}
        <SustainabilityDashboard />
      </div>
    </div>
  )
}
