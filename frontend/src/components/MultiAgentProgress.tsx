import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TraceEvent {
  type: string;
  agent: string;
  content?: string;
  tool?: string;
  args?: any;
  actions?: any[];
}

interface Agent {
  name: string;
  status: 'pending' | 'running' | 'completed';
  events: TraceEvent[];
  summary?: string;
  actions?: any[];
}

interface MultiAgentProgressProps {
  orchestratorPlan?: string;
  orchestratorStatus?: 'pending' | 'running' | 'completed';
  routingInfo?: {
    agents_needed: string[];
    reasoning: string;
    complexity: string;
  };
  agents: Agent[];
  finalMessage?: string;
  isComplete: boolean;
}

const StepCard = ({ 
  title, 
  status, 
  children, 
  isActive, 
  onToggle, 
  hasDetails,
  stepNumber 
}: {
  title: string;
  status: 'pending' | 'running' | 'completed';
  children: React.ReactNode;
  isActive: boolean;
  onToggle?: () => void;
  hasDetails: boolean;
  stepNumber: number;
}) => {
  const iconBg = status === 'completed' ? '#16a34a' : status === 'running' ? '#2563eb' : '#9ca3af';
  const textMuted = '#6b7280';
  const borderColor = '#e5e7eb';
  const shouldMinimize = status === 'completed' && !isActive && hasDetails;

  return (
    <div style={{ position: 'relative', padding: '10px 12px 10px 28px', borderRadius: 8, border: `1px solid ${borderColor}`, background: '#fff', transition: 'max-height 200ms ease', maxHeight: shouldMinimize ? 56 : undefined, overflow: shouldMinimize ? 'hidden' as const : 'visible' }}>
      {/* step node */}
      <div style={{ position: 'absolute', left: 6, top: 10, width: 18, height: 18, borderRadius: 9999, background: iconBg, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>{stepNumber}</div>

      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: hasDetails ? 'pointer' : 'default' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '18px' }}>{title}</div>
          {!shouldMinimize && (
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {status === 'running' && 'Processing...'}
              {status === 'completed' && 'Completed'}
              {status === 'pending' && 'Waiting...'}
            </div>
          )}
        </div>
        {hasDetails && (
          <button aria-label="Toggle step" style={{ color: '#9ca3af', padding: 2, marginLeft: 8 }}>
            {isActive ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {isActive && !shouldMinimize && (
        <div style={{ marginTop: 8, display: 'grid', rowGap: 8, fontSize: 13 }}>
          {children}
        </div>
      )}
    </div>
  );
};

const ToolCallDisplay = ({ tool, args }: { tool: string; args: any }) => (
  <div style={{ background: '#f3f4f6', borderRadius: 6, padding: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', fontSize: 12 }}>
    <div style={{ color: '#1d4ed8', fontWeight: 600 }}>{tool}</div>
    {args && Object.keys(args).length > 0 && (
      <div style={{ color: '#4b5563', marginTop: 4 }}>
        {JSON.stringify(args, null, 2)}
      </div>
    )}
  </div>
);

const AgentStep = ({ 
  agent, 
  stepNumber, 
  isLatest, 
  onToggle, 
  isExpanded 
}: { 
  agent: Agent; 
  stepNumber: number; 
  isLatest: boolean;
  onToggle: () => void;
  isExpanded: boolean;
}) => {
  const getAgentTitle = (name: string) => {
    switch (name) {
      case 'furniture_agent': return 'Furniture Agent';
      case 'color_agent': return 'Color Agent';
      default: return name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const thoughtEvents = agent.events.filter(e => e.type === 'thought');
  const actionEvents = agent.events.filter(e => e.type === 'action');
  const hasDetails = thoughtEvents.length > 0 || actionEvents.length > 0;

  return (
    <StepCard
      title={getAgentTitle(agent.name)}
      status={agent.status}
      isActive={isExpanded}
      onToggle={hasDetails ? onToggle : undefined}
      hasDetails={hasDetails}
      stepNumber={stepNumber}
    >
      {/* Reasoning */}
      {thoughtEvents.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Reasoning:</div>
          {thoughtEvents.map((event, idx) => (
            <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', color: '#1f2937', marginBottom: 6 }}>
              {event.content}
            </div>
          ))}
        </div>
      )}

      {/* Tool Calls */}
      {actionEvents.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Actions:</div>
          <div style={{ display: 'grid', rowGap: 6 }}>
            {actionEvents.map((event, idx) => (
              <ToolCallDisplay key={idx} tool={event.tool || ''} args={event.args} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {agent.actions && agent.actions.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Results:</div>
          <div style={{ display: 'grid', rowGap: 4 }}>
            {agent.actions.map((action, idx) => (
              <div key={idx} style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6, padding: 8, fontSize: 12, color: '#065f46' }}>
                <span style={{ fontWeight: 600 }}>{action.action}</span>
                <span style={{ marginLeft: 6, color: '#047857' }}>{action.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </StepCard>
  );
};

export default function MultiAgentProgress({
  orchestratorPlan,
  orchestratorStatus = 'pending',
  routingInfo,
  agents,
  finalMessage,
  isComplete
}: MultiAgentProgressProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(() => {
    // Default to expand the latest running/completed step
    if (agents.length > 0) {
      const runningAgent = agents.find(a => a.status === 'running');
      if (runningAgent) return runningAgent.name;
      
      const lastAgent = agents[agents.length - 1];
      if (lastAgent.status === 'completed') return lastAgent.name;
    }
    
    if (routingInfo) return 'routing';
    if (orchestratorPlan) return 'orchestrator';
    return null;
  });

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  let stepCounter = 1;

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 13, letterSpacing: '-0.01em' }}>Multi-Agent Process</div>
          {isComplete && (
            <span style={{ padding: '2px 6px', background: '#dcfce7', color: '#166534', fontSize: 11, borderRadius: 6 }}>Complete</span>
          )}
        </div>
      </div>

      {/* vertical rail */}
      <div style={{ position: 'relative', padding: 12 }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: 16, top: 16, bottom: 16, width: 1, background: '#e5e7eb' }} />
        <div style={{ display: 'grid', rowGap: 8 }}>
          {/* Orchestrator Planning */}
          {orchestratorPlan && (
            <StepCard
              title="Orchestrator Planning"
              status={orchestratorStatus}
              isActive={expandedStep === 'orchestrator'}
              onToggle={() => toggleStep('orchestrator')}
              hasDetails={true}
              stepNumber={stepCounter++}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Strategic Plan</div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, fontSize: 12, whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                  {orchestratorPlan}
                </div>
              </div>
            </StepCard>
          )}

          {/* Routing Decision */}
          {routingInfo && (
            <StepCard
              title="Routing Decision"
              status="completed"
              isActive={expandedStep === 'routing'}
              onToggle={() => toggleStep('routing')}
              hasDetails={true}
              stepNumber={stepCounter++}
            >
              <div style={{ display: 'grid', rowGap: 6, fontSize: 12 }}>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>Agents</span><span style={{ marginLeft: 8, color: '#1d4ed8' }}>{routingInfo.agents_needed.map(a => a.replace('_agent','')).join(' → ')}</span></div>
                <div>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Complexity</span>
                  <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: routingInfo.complexity==='complex' ? '#fee2e2' : '#fef3c7', color: routingInfo.complexity==='complex' ? '#991b1b' : '#92400e' }}>{routingInfo.complexity}</span>
                </div>
                {routingInfo.reasoning && (
                  <div style={{ color: '#374151', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, background: '#fff' }}>{routingInfo.reasoning}</div>
                )}
              </div>
            </StepCard>
          )}

          {/* Agent Execution Steps */}
          {agents.map((agent, idx) => (
            <AgentStep
              key={`${agent.name}-${idx}`}
              agent={agent}
              stepNumber={stepCounter++}
              isLatest={idx === agents.length - 1}
              onToggle={() => toggleStep(agent.name)}
              isExpanded={expandedStep === agent.name}
            />
          ))}

          {/* Final Result */}
          {isComplete && finalMessage && (
            <div style={{ marginTop: 4, marginLeft: 24, padding: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>Process Complete</div>
              <p style={{ color: '#065f46', fontSize: 12, whiteSpace: 'pre-wrap' }}>{finalMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}