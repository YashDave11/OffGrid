import React, { useRef, useEffect } from 'react';
import {
  RiFireLine,
  RiAlarmWarningLine,
  RiPulseLine,
  RiDashboard3Line,
  RiSparklingLine,
} from '@remixicon/react';
import { ChatMessage } from '../types/workbench';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSelectStarterPrompt: (prompt: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onCitationClick?: (docName: string, page?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSelectStarterPrompt,
  onRetryMessage,
  onCitationClick,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const starterPrompts = [
    {
      icon: <RiFireLine className="size-5 text-amber-400" />,
      title: 'Atmospheric Distillation Analysis',
      desc: 'Evaluate fractionation tower temperature gradients and calculate overhead reflux ratio.',
      prompt:
        'Analyze distillation column fractionation parameters: Overhead temp 115°C, Bottom temp 345°C, reflux ratio 2.4. Identify any anomaly in kerosene cut yield.',
    },
    {
      icon: <RiAlarmWarningLine className="size-5 text-rose-400" />,
      title: 'HazOp Process Safety Review',
      desc: 'Verify safety barrier integrity, relief valve sizing, and emergency depressurization protocols.',
      prompt:
        'Review process safety guidelines for high-pressure hydrocracker feed pumps. List critical interlocks and fail-safe valve states during emergency shutdown.',
    },
    {
      icon: <RiPulseLine className="size-5 text-sky-400" />,
      title: 'Pump Vibration Telemetry',
      desc: 'Diagnose harmonic vibration spectra to differentiate bearing wear from impeller cavitation.',
      prompt:
        'Examine vibration spectrum: 1X RPM dominant at 4.2 mm/s RMS with secondary 2X harmonic and broadband high-frequency noise. Recommend maintenance actions.',
    },
    {
      icon: <RiDashboard3Line className="size-5 text-emerald-400" />,
      title: 'Fired Heater Thermal Efficiency',
      desc: 'Calculate combustion efficiency, excess O2 percentage, and stack draft pressure losses.',
      prompt:
        'Given flue gas O2 of 2.1%, stack temperature of 185°C, and ambient air at 32°C, calculate the thermal efficiency of the crude preheat furnace and excess air coefficient.',
    },
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center min-h-0">
        <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-500/10 border border-accent-500/20 text-accent-500 shadow-sm">
            <RiSparklingLine className="size-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-title-2-medium font-bold text-text-primary">
              MRPL Sovereign AI Workbench
            </h2>
            <p className="text-body-2-regular text-text-secondary max-w-lg mx-auto">
              Air-gapped on-premise industrial intelligence. Engineered for refinery engineering,
              chemical process safety, telemetry synthesis, and technical inspection reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 text-left">
            {starterPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStarterPrompt(item.prompt)}
                className="flex flex-col gap-2 p-3.5 rounded-2xl bg-background-secondary-default border border-border-button-default hover:bg-background-secondary-hover hover:border-border-button-hover transition-all cursor-pointer shadow-xs text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-background-tertiary-default/80 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-body-2-medium font-semibold text-text-primary truncate">
                    {item.title}
                  </span>
                </div>
                <p className="text-caption-1-regular text-text-secondary line-clamp-2">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
      <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onRetry={onRetryMessage ? () => onRetryMessage(msg.id) : undefined}
            onCitationClick={onCitationClick}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};
