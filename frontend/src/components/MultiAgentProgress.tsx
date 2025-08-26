import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Check, Brain, Route, MessageSquare, Bot, ListChecks } from 'lucide-react';

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
  const shouldMinimize = status === 'completed' && !isActive && hasDetails;

  return (
    <div style={{ position: 'relative', padding: '8px 0 8px 28px' }}>
      {/* timeline node */}
      <div style={{
        position: 'absolute',
        left: 6,
        top: 10,
        width: 20,
        height: 20,
        borderRadius: 9999,
        background: status === 'pending' ? '#fff' : iconBg,
        color: status === 'pending' ? '#374151' : '#fff',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        boxShadow: '0 0 0 2px #e5e7eb, 0 1px 1px rgba(0,0,0,0.05)',
        border: status === 'pending' ? '2px solid #9ca3af' : '2px solid #fff'
      }}>{stepNumber}</div>

      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: hasDetails ? 'pointer' : 'default', borderRadius: 8, paddingRight: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '18px' }}>{title}</div>
            <span style={{ fontSize: 11, color: status === 'completed' ? '#166534' : status === 'running' ? '#1d4ed8' : '#6b7280', background: status === 'completed' ? '#dcfce7' : status === 'running' ? '#dbeafe' : '#f3f4f6', padding: '1px 6px', borderRadius: 6 }}>{status === 'completed' ? 'Done' : status === 'running' ? 'Running' : 'Pending'}</span>
          </div>
          {!shouldMinimize && (
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {status === 'running' && 'Processing...'}
              {status === 'completed' && 'Completed'}
              {status === 'pending' && 'Waiting...'}
            </div>
          )}
        </div>
        {hasDetails && (
          <button
            aria-label="Toggle step"
            style={{
              color: '#6b7280',
              padding: 2,
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
          >
            {isActive ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {isActive && !shouldMinimize && (
        <div style={{ marginTop: 6, display: 'grid', rowGap: 8, fontSize: 13 }}>
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

// Simple bullet-list step used in compact variant
const BulletStep = ({
  title,
  status,
  children,
  isActive,
  onToggle,
  hasDetails,
}: {
  title: string;
  status: 'pending' | 'running' | 'completed';
  children: React.ReactNode;
  isActive: boolean;
  onToggle?: () => void;
  hasDetails: boolean;
}) => {
  const statusColor = status === 'completed' ? '#16a34a' : status === 'running' ? '#2563eb' : '#9ca3af';
  const pillText = status === 'completed' ? '#166534' : status === 'running' ? '#1d4ed8' : '#6b7280';
  const pillBg = status === 'completed' ? '#dcfce7' : status === 'running' ? '#dbeafe' : '#f3f4f6';
  const rowHover = hasDetails ? '#f8fafc' : 'transparent';
  return (
    <div style={{ position: 'relative', padding: '8px 6px 8px 28px', borderRadius: 8 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = rowHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* bullet */}
      <div style={{ position: 'absolute', left: 8, top: 12, width: 12, height: 12, borderRadius: 9999, background: status === 'pending' ? '#fff' : statusColor, boxShadow: '0 0 0 2px #e5e7eb', border: status === 'pending' ? '2px solid #9ca3af' : '2px solid #fff' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{title}</div>
          <span style={{ fontSize: 11, color: pillText, background: pillBg, padding: '1px 6px', borderRadius: 6 }}>
            {status === 'completed' ? 'Done' : status === 'running' ? 'Running' : 'Pending'}
          </span>
        </div>
        {hasDetails && (
          <button
            aria-label="Toggle step"
            onClick={onToggle}
            style={{ color: '#6b7280', background: 'transparent', border: 'none', padding: 2, cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
          >
            {isActive ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>
      {isActive && (
        <div style={{ marginTop: 6, fontSize: 13 }}>{children}</div>
      )}
    </div>
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
  // Allow multiple expanded sections at once
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (orchestratorPlan) initial['orchestrator'] = true;
    if (routingInfo) initial['routing'] = true;
    // Expand running or last completed agent by default
    const runningAgent = agents.find(a => a.status === 'running');
    if (runningAgent) initial[runningAgent.name] = true;
    else if (agents.length > 0 && agents[agents.length - 1].status === 'completed') {
      initial[agents[agents.length - 1].name] = true;
    }
    return initial;
  });

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  let stepCounter = 1;

  // Choose the new feed variant by default (clean, minimal, matches site style)
  const variant: 'feed' | 'bullets' | 'timeline' = 'feed';

  if (variant === 'feed') {
    const statusToColors = (status: 'pending'|'running'|'completed') => {
      if (status === 'running') return { bg: '#fffbeb', border: '#fde68a', icon: '#111827' }; // amber
      if (status === 'completed') return { bg: '#fef9c3', border: '#fde68a', icon: '#111827' }; // soft amber
      return { bg: '#ffffff', border: '#e5e7eb', icon: '#9ca3af' }; // neutral
    };

    const StatusPill = ({status}:{status:'pending'|'running'|'completed'}) => (
      <span style={{
        fontSize: 11,
        color: '#111827',
        background: status==='completed'?'#fde68a':status==='running'?'#fef3c7':'#f3f4f6',
        borderRadius: 999,
        padding: '2px 8px'
      }}>{status==='completed'?'Done':status==='running'?'Running':'Pending'}</span>
    );

    const IconCircle = ({status, children}:{status:'pending'|'running'|'completed', children: React.ReactNode}) => {
      const c = statusToColors(status);
      return (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: c.bg,
          border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{children}</div>
      );
    };

    const FeedItem = ({
      title, status, icon, children, isActive, onToggle, hasDetails
    }: { title: string; status:'pending'|'running'|'completed'; icon: React.ReactNode; children?: React.ReactNode; isActive: boolean; onToggle?: ()=>void; hasDetails?: boolean }) => {
      const c = statusToColors(status);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 20px', columnGap: 12, alignItems: 'flex-start', padding: '10px 8px', borderRadius: 10 }}
          onMouseEnter={(e)=>{ (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
          onMouseLeave={(e)=>{ (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          <IconCircle status={status}>{icon}</IconCircle>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
                <StatusPill status={status} />
              </div>
            </div>
            {isActive && children && (
              <div style={{ marginTop: 8, border: `1px solid ${c.border}`, background: '#fff', borderRadius: 10, padding: 10, fontSize: 13 }}>
                {children}
              </div>
            )}
          </div>
          {hasDetails && (
            <button aria-label="Toggle details" onClick={onToggle} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              {isActive ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>
      );
    };

    return (
      <div style={{ display: 'grid', rowGap: 4 }}>
        {orchestratorPlan && (
          <FeedItem
            title="Orchestrator Planning"
            status={orchestratorStatus}
            icon={<Brain size={16} color={'#111827'} />}
            isActive={!!expandedSteps['orchestrator']}
            onToggle={() => toggleStep('orchestrator')}
            hasDetails
          >
            <div style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>{orchestratorPlan}</div>
          </FeedItem>
        )}

        {routingInfo && (
          <FeedItem
            title="Routing Decision"
            status={'completed'}
            icon={<Route size={16} color={'#111827'} />}
            isActive={!!expandedSteps['routing']}
            onToggle={() => toggleStep('routing')}
            hasDetails
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Agents:</span>
              {routingInfo.agents_needed.map((a, i) => (
                <span key={i} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#fffbeb', border: '1px solid #fde68a', color: '#111827' }}>
                  {a.replace('_agent','').replace('_',' ')}
                </span>
              ))}
            </div>
            {routingInfo.reasoning && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#334155', whiteSpace: 'pre-wrap' }}>{routingInfo.reasoning}</div>
            )}
          </FeedItem>
        )}

        {agents.map((agent, idx) => (
          <FeedItem
            key={`${agent.name}-${idx}`}
            title={agent.name.replace('_',' ').replace(/\b\w/g, l=>l.toUpperCase())}
            status={agent.status}
            icon={<Bot size={16} color={'#111827'} />}
            isActive={!!expandedSteps[agent.name]}
            onToggle={() => toggleStep(agent.name)}
            hasDetails={(agent.events?.length ?? 0) > 0 || (agent.actions?.length ?? 0) > 0}
          >
            {/* Reasoning */}
            {agent.events?.some(e=>e.type==='thought') && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a', fontWeight: 600, fontSize: 12 }}>
                  <ListChecks size={14} color="#0f172a" /> Reasoning
                </div>
                <div style={{ marginTop: 6, display: 'grid', rowGap: 6 }}>
                  {agent.events.filter(e=>e.type==='thought').map((event, i)=>(
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{event.content}</div>
                  ))}
                </div>
              </div>
            )}
            {/* Actions */}
            {agent.events?.some(e=>e.type==='action') && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a', fontWeight: 600, fontSize: 12 }}>Actions</div>
                <div style={{ marginTop: 6, display: 'grid', rowGap: 6 }}>
                  {agent.events.filter(e=>e.type==='action').map((event, i)=>(
                    <ToolCallDisplay key={i} tool={event.tool || ''} args={event.args} />
                  ))}
                </div>
              </div>
            )}
            {/* Results */}
            {agent.actions && agent.actions.length>0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a', fontWeight: 600, fontSize: 12 }}>Results</div>
                <div style={{ marginTop: 6, display: 'grid', rowGap: 6 }}>
                  {agent.actions.map((action,i)=>(
                    <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 8, fontSize: 12, color: '#111827' }}>
                      <span style={{ fontWeight: 600 }}>{action.action}</span>
                      <span style={{ marginLeft: 6 }}>{action.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FeedItem>
        ))}

        {isComplete && finalMessage && (
          <FeedItem
            title="Process Complete"
            status={'completed'}
            icon={<Check size={16} color={'#111827'} />}
            isActive={true}
          >
            <div style={{ color: '#111827', fontSize: 12, whiteSpace: 'pre-wrap', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}>{finalMessage}</div>
          </FeedItem>
        )}
      </div>
    );
  }

  if (variant === 'bullets') {
    let stepCounter = 1;
    return (
      <div style={{ position: 'relative', paddingLeft: 6 }}>
        {/* subtle vertical guide */}
        <div aria-hidden="true" style={{ position: 'absolute', left: 14, top: 6, bottom: 6, width: 1, background: '#e5e7eb' }} />
        {orchestratorPlan && (
          <BulletStep
            title={`Orchestrator Planning`}
            status={orchestratorStatus}
            isActive={!!expandedSteps['orchestrator']}
            onToggle={() => toggleStep('orchestrator')}
            hasDetails={true}
          >
            <div style={{ marginLeft: 14 }}>
              <div style={{ color: '#374151', fontWeight: 600, marginBottom: 4, fontSize: 12 }}>Strategic Plan</div>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, fontSize: 12, whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                {orchestratorPlan}
              </div>
            </div>
          </BulletStep>
        )}

        {routingInfo && (
          <BulletStep
            title={`Routing Decision`}
            status={'completed'}
            isActive={!!expandedSteps['routing']}
            onToggle={() => toggleStep('routing')}
            hasDetails={true}
          >
            <div style={{ marginLeft: 14, display: 'grid', rowGap: 4, fontSize: 12 }}>
              <div><span style={{ fontWeight: 600, color: '#374151' }}>Agents</span><span style={{ marginLeft: 8, color: '#1d4ed8' }}>{routingInfo.agents_needed.map(a => a.replace('_agent','')).join(' → ')}</span></div>
              <div>
                <span style={{ fontWeight: 600, color: '#374151' }}>Complexity</span>
                <span style={{ marginLeft: 8, padding: '0px 6px', borderRadius: 6, background: routingInfo.complexity==='complex' ? '#fee2e2' : '#fef3c7', color: routingInfo.complexity==='complex' ? '#991b1b' : '#92400e' }}>{routingInfo.complexity}</span>
              </div>
              {routingInfo.reasoning && (
                <div style={{ color: '#374151', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, background: '#f8fafc' }}>{routingInfo.reasoning}</div>
              )}
            </div>
          </BulletStep>
        )}

        {agents.map((agent, idx) => (
          <BulletStep
            key={`${agent.name}-${idx}`}
            title={agent.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            status={agent.status}
            isActive={!!expandedSteps[agent.name]}
            onToggle={() => toggleStep(agent.name)}
            hasDetails={(agent.events?.length ?? 0) > 0 || (agent.actions?.length ?? 0) > 0}
          >
            {/* Reasoning */}
            {agent.events?.some(e => e.type === 'thought') && (
              <div style={{ marginLeft: 14 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Reasoning</div>
                {agent.events.filter(e => e.type === 'thought').map((event, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, fontSize: 12, whiteSpace: 'pre-wrap', color: '#1f2937', marginBottom: 6 }}>{event.content}</div>
                ))}
              </div>
            )}
            {/* Actions */}
            {agent.events?.some(e => e.type === 'action') && (
              <div style={{ marginLeft: 14 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Actions</div>
                <div style={{ display: 'grid', rowGap: 6 }}>
                  {agent.events.filter(e => e.type === 'action').map((event, i) => (
                    <ToolCallDisplay key={i} tool={event.tool || ''} args={event.args} />
                  ))}
                </div>
              </div>
            )}
            {/* Results */}
            {agent.actions && agent.actions.length > 0 && (
              <div style={{ marginLeft: 14 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 12 }}>Results</div>
                <div style={{ display: 'grid', rowGap: 4 }}>
                  {agent.actions.map((action, i) => (
                    <div key={i} style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6, padding: 8, fontSize: 12, color: '#065f46' }}>
                      <span style={{ fontWeight: 600 }}>{action.action}</span>
                      <span style={{ marginLeft: 6, color: '#047857' }}>{action.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </BulletStep>
        ))}

        {isComplete && finalMessage && (
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 8, top: 2, width: 14, height: 14, borderRadius: 9999, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #bbf7d0' }}>
              <Check size={12} color="#fff" />
            </div>
            <div style={{ padding: '8px 10px', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>Process Complete</div>
              <p style={{ color: '#065f46', fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>{finalMessage}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to timeline variant (unused now but kept for flexibility)
  return (
    <div style={{ position: 'relative', padding: 8 }}>
      {/* vertical rail */}
      <div aria-hidden="true" style={{ position: 'absolute', left: 16, top: 8, bottom: 8, width: 2, background: '#e5e7eb', borderRadius: 1 }} />
      <div style={{ display: 'grid', rowGap: 4 }}>
          {/* Orchestrator Planning */}
          {orchestratorPlan && (
            <StepCard
              title="Orchestrator Planning"
              status={orchestratorStatus}
              isActive={!!expandedSteps['orchestrator']}
              onToggle={() => toggleStep('orchestrator')}
              hasDetails={true}
              stepNumber={stepCounter++}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Strategic Plan</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, fontSize: 12, whiteSpace: 'pre-wrap', color: '#1f2937' }}>
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
              isActive={!!expandedSteps['routing']}
              onToggle={() => toggleStep('routing')}
              hasDetails={true}
              stepNumber={stepCounter++}
            >
              <div style={{ display: 'grid', rowGap: 4, fontSize: 12 }}>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>Agents</span><span style={{ marginLeft: 8, color: '#1d4ed8' }}>{routingInfo.agents_needed.map(a => a.replace('_agent','')).join(' → ')}</span></div>
                <div>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Complexity</span>
                  <span style={{ marginLeft: 8, padding: '0px 6px', borderRadius: 6, background: routingInfo.complexity==='complex' ? '#fee2e2' : '#fef3c7', color: routingInfo.complexity==='complex' ? '#991b1b' : '#92400e' }}>{routingInfo.complexity}</span>
                </div>
                {routingInfo.reasoning && (
                  <div style={{ color: '#374151', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, background: '#f8fafc' }}>{routingInfo.reasoning}</div>
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
              isExpanded={!!expandedSteps[agent.name]}
            />
          ))}

          {/* Final Result */}
          {isComplete && finalMessage && (
            <div style={{ position: 'relative', padding: '6px 0 0 28px' }}>
              <div style={{ position: 'absolute', left: 6, top: 6, width: 20, height: 20, borderRadius: 9999, background: '#16a34a', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #e5e7eb, 0 1px 1px rgba(0,0,0,0.05)', border: '2px solid #fff' }}>✓</div>
              <div style={{ padding: '8px 10px', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>Process Complete</div>
                <p style={{ color: '#065f46', fontSize: 12, whiteSpace: 'pre-wrap' }}>{finalMessage}</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}