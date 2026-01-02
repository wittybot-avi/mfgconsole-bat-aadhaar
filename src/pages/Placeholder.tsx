import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui/design-system';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  features: string[];
}

export default function Placeholder({ title, description, features }: PlaceholderProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full text-primary">
          <Construction size={48} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-xl text-muted-foreground max-w-2xl">{description}</p>
      </div>

      <Card className="mt-8 border-dashed border-2">
        <CardHeader>
          <CardTitle>Coming Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md font-mono text-xs text-muted-foreground">
        <strong>INTEGRATION NOTE:</strong> This module requires backend endpoints for {title.toLowerCase()}. 
        See src/services/api.ts for service interface definitions to implement.
      </div>
    </div>
  );
}