import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ReasoningProcessProps {
  reasoning: string;
  steps?: string[];
  initiallyExpanded?: boolean;
}

export const ReasoningProcess: React.FC<ReasoningProcessProps> = ({
  reasoning,
  steps,
  initiallyExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  if (!reasoning && (!steps || steps.length === 0)) {
    return null;
  }

  return (
    <div className="reasoning-card">
      <div
        className="reasoning-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="reasoning-label">
          <Brain size={14} />
          <span>Reasoning Process</span>
        </div>

        <div className="reasoning-steps-preview">
          {steps && steps.map((step) => (
            <span key={step} className="step-chip completed">
              {step}
            </span>
          ))}
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {isExpanded && reasoning && (
        <div className="reasoning-body">
          {reasoning}
        </div>
      )}
    </div>
  );
};
