import React, { useState, useMemo } from 'react';
import { RiBrainLine, RiArrowDownSLine, RiArrowRightSLine, RiCheckLine } from '@remixicon/react';
import { LogRow, useLogMotion } from './application/agent-log/agent-log';

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
  const reduceMotion = useLogMotion();

  const paragraphs = useMemo(() => {
    if (!reasoning) return [];
    return reasoning
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [reasoning]);

  if (!reasoning && (!steps || steps.length === 0)) {
    return null;
  }

  return (
    <div className="w-full my-2 rounded-2xl bg-background-secondary-default border border-border-button-default shadow-xs overflow-hidden transition-colors">
      {/* Header / Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-body-2-medium cursor-pointer hover:bg-background-secondary-hover transition-colors"
      >
        <div className="flex items-center gap-2 text-text-primary">
          <RiBrainLine className="size-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Reasoning Process</span>
        </div>

        <div className="flex items-center gap-2">
          {steps && steps.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {steps.map((step) => (
                <span
                  key={step}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-caption-1-medium border border-emerald-500/20"
                >
                  <RiCheckLine className="size-3" />
                  <span>{step}</span>
                </span>
              ))}
            </div>
          )}

          <div className="text-text-tertiary">
            {isExpanded ? (
              <RiArrowDownSLine className="size-4" />
            ) : (
              <RiArrowRightSLine className="size-4" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable Agent Log Tree Body */}
      {isExpanded && (
        <div className="px-4 pb-3.5 pt-1 border-t border-border-separator-border bg-background-primary-default/50">
          <ul className="space-y-2 text-caption-1-regular text-text-secondary leading-relaxed pt-2">
            {paragraphs.map((p, idx) => (
              <LogRow
                key={idx}
                first={idx === 0}
                last={idx === paragraphs.length - 1}
                reduce={reduceMotion}
              >
                <div className="py-0.5 whitespace-pre-wrap font-sans text-text-secondary">
                  {p}
                </div>
              </LogRow>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
