import React, { useRef, useEffect } from 'react';
import { Flame, ShieldAlert, Activity, Gauge } from 'lucide-react';
import { ChatMessage } from '../types/workbench';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSelectStarterPrompt: (prompt: string) => void;
  onRetryMessage?: (messageId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSelectStarterPrompt,
  onRetryMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const starterPrompts = [
    {
      icon: <Flame size={16} />,
      title: 'Atmospheric Distillation Analysis',
      desc: 'Evaluate fractionation tower temperature gradients and calculate overhead reflux ratio.',
      prompt: 'Analyze distillation column fractionation parameters: Overhead temp 115°C, Bottom temp 345°C, reflux ratio 2.4. Identify any anomaly in kerosene cut yield.',
    },
    {
      icon: <ShieldAlert size={16} />,
      title: 'HazOp Process Safety Review',
      desc: 'Verify safety barrier integrity, relief valve sizing, and emergency depressurization protocols.',
      prompt: 'Review process safety guidelines for high-pressure hydrocracker feed pumps. List critical interlocks and fail-safe valve states during emergency shutdown.',
    },
    {
      icon: <Activity size={16} />,
      title: 'Centrifugal Pump Vibration Telemetry',
      desc: 'Diagnose harmonic vibration spectra to differentiate bearing wear from impeller cavitation.',
      prompt: 'Examine vibration spectrum: 1X RPM dominant at 4.2 mm/s RMS with secondary 2X harmonic and broadband high-frequency noise. Recommend maintenance actions.',
    },
    {
      icon: <Gauge size={16} />,
      title: 'Fired Heater Thermal Efficiency',
      desc: 'Calculate combustion efficiency, excess O2 percentage, and stack draft pressure losses.',
      prompt: 'Given flue gas O2 of 2.1%, stack temperature of 185°C, and ambient air at 32°C, calculate the thermal efficiency of the crude preheat furnace and excess air coefficient.',
    },
  ];

  if (messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="empty-workspace">
          <div className="empty-logo">M</div>
          <h2 className="empty-title">MRPL Sovereign AI Workbench</h2>
          <p className="empty-desc">
            Air-gapped on-premise industrial intelligence. Engineered for refinery engineering,
            chemical process safety, telemetry synthesis, and technical inspection reasoning.
          </p>

          <div className="starter-grid">
            {starterPrompts.map((item, idx) => (
              <div
                key={idx}
                className="starter-card"
                onClick={() => onSelectStarterPrompt(item.prompt)}
              >
                <div className="starter-card-header">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                <div className="starter-card-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-inner">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onRetry={onRetryMessage ? () => onRetryMessage(msg.id) : undefined}
          />
        ))}
        <div ref={bottomRef} style={{ height: '8px' }} />
      </div>
    </div>
  );
};
