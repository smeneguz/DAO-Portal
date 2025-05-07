'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TokenDistributionProps {
  distribution: {
    "0-1": number;
    "1-10": number;
    "10-100": number;
    "100-1000": number;
    "1000-10000": number;
    "10000+": number;
  };
  largestHolderPercent: number;
}

export function TokenDistributionChart({ distribution, largestHolderPercent }: TokenDistributionProps) {
  // Convert the distribution object to an array for Recharts
  const data = Object.entries(distribution || {}).map(([range, value]) => ({
    range,
    holders: value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Token Distribution</span>
          <span className="text-sm text-muted-foreground">
            Largest Holder: {largestHolderPercent?.toFixed(2)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="range" 
                label={{ value: 'Token Range', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Number of Holders', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="holders" name="Holders" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}