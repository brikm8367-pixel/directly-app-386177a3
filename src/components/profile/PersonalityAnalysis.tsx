import { Sparkles, Brain, Zap } from 'lucide-react';

export interface PersonalityData {
  type?: string;
  description?: string;
  traits?: string[];
  advice?: string;
  insight?: string;
}

interface Props {
  personality: PersonalityData;
  labels: Record<string, string>;
  firstName: string;
}

export default function PersonalityAnalysis({ personality, labels, firstName }: Props) {
  if (!personality.type) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{labels.commStyle}</span>
        </div>
        <p className="text-xl font-bold text-foreground mb-2">{personality.type}</p>
        {personality.description && (
          <p className="text-sm text-muted-foreground mb-3">{personality.description}</p>
        )}
        {personality.traits && personality.traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {personality.traits.slice(0, 5).map((t, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/15">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {personality.advice && (
        <div className="p-4 rounded-2xl bg-accent/50 border border-accent text-start">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">{labels.bestWay} {firstName}</span>
          </div>
          <p className="text-sm text-foreground">{personality.advice}</p>
        </div>
      )}

      {personality.insight && (
        <div className="p-4 rounded-2xl bg-muted/50 border border-border text-start">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">{labels.responsePattern}</span>
          </div>
          <p className="text-sm text-foreground">{personality.insight}</p>
        </div>
      )}
    </div>
  );
}
