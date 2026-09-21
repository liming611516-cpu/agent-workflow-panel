"use client";

import { useMemo, useState } from 'react';
import runData from '@/src/mock/run.json';

type TabKey = 'dag' | 'prompt' | 'timeline';

type NodeStatus = 'success' | 'failed' | 'running';
interface WorkflowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status: NodeStatus;
  inputs: string[];
  outputs: string[];
  toolCalls: { tool: string; args: Record<string, unknown>; ms: number }[];
}
interface WorkflowEdge { from: string; to: string }

interface TimelineRow {
  step: string;
  status: NodeStatus;
  ms: number;
  tokensIn: number;
  tokensOut: number;
  note: string;
}

// ---- DAG ---------------------------------------------------------------

function DagView() {
  const nodes = runData.workflow.nodes as WorkflowNode[];
  const edges = runData.workflow.edges as WorkflowEdge[];
  const [selected, setSelected] = useState<string>('codegen');

  const nodeMap = useMemo(() => {
    const m = new Map<string, WorkflowNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const sel = nodeMap.get(selected);
  const W = 1200;
  const H = 380;

  return (
    <div className="grid-2">
      <div className="panel">
        <h2 className="section">Workflow DAG — click a node</h2>
        <div className="dag-wrap" style={{ width: '100%', height: H }}>
          <svg className="dag-svg" width={W} height={H}>
            {edges.map((e, i) => {
              const a = nodeMap.get(e.from)!;
              const b = nodeMap.get(e.to)!;
              const x1 = a.x + 140;
              const y1 = a.y + 30;
              const x2 = b.x;
              const y2 = b.y + 30;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  stroke="#3a4356"
                  strokeWidth={2}
                  fill="none"
                />
              );
            })}
          </svg>
          {nodes.map((n) => (
            <div
              key={n.id}
              className={`dag-node ${selected === n.id ? 'selected' : ''}`}
              style={{ left: n.x, top: n.y }}
              onClick={() => setSelected(n.id)}
            >
              <div className="title">{n.label}</div>
              <div className="sub">
                <span className={`badge ${n.status === 'success' ? 'ok' : n.status === 'failed' ? 'err' : 'warn'}`}>
                  {n.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="section">Node inspector</h2>
        {sel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kv">
              <span className="k">Node</span><span>{sel.label} ({sel.id})</span>
              <span className="k">Status</span><span>{sel.status}</span>
            </div>
            <div>
              <div className="kv">
                <span className="k">Inputs</span><span>{sel.inputs.join(' / ')}</span>
                <span className="k">Outputs</span><span>{sel.outputs.join(' / ')}</span>
              </div>
            </div>
            <div>
              <h2 className="section">Tool call history</h2>
              <pre className="json">{JSON.stringify(sel.toolCalls, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---- Prompt playground -------------------------------------------------

function PromptPlayground() {
  const [system, setSystem] = useState(runData.prompt.system);
  const [user, setUser] = useState(runData.prompt.user);

  const toolSchemaJson = useMemo(
    () => JSON.stringify(runData.toolSchema, null, 2),
    [],
  );
  const mockCallsJson = useMemo(
    () => JSON.stringify(runData.mockToolCalls, null, 2),
    [],
  );

  // Approximate token estimate = chars / 4.
  const estTokens = Math.round((system.length + user.length) / 4);

  return (
    <div className="grid-2">
      <div className="panel">
        <h2 className="section">Prompt editor</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="kv" style={{ marginBottom: 6 }}>
              <span className="k">system</span><span>{system.length} chars</span>
            </div>
            <textarea value={system} onChange={(e) => setSystem(e.target.value)} rows={8} />
          </div>
          <div>
            <div className="kv" style={{ marginBottom: 6 }}>
              <span className="k">user</span><span>{user.length} chars · est. tokens ≈ {estTokens}</span>
            </div>
            <textarea value={user} onChange={(e) => setUser(e.target.value)} rows={6} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h2 className="section">Tool schema (OpenAI tools JSON)</h2>
          <pre className="json">{toolSchemaJson}</pre>
        </div>
        <div>
          <h2 className="section">Mock tool_calls output</h2>
          <pre className="json">{mockCallsJson}</pre>
        </div>
      </div>
    </div>
  );
}

// ---- Run timeline -------------------------------------------------------

function RunTimeline() {
  const rows = runData.timeline as TimelineRow[];
  const maxMs = Math.max(...rows.map((r) => r.ms), 1);
  const totalMs = rows.reduce((s, r) => s + r.ms, 0);
  const totalIn = rows.reduce((s, r) => s + r.tokensIn, 0);
  const totalOut = rows.reduce((s, r) => s + r.tokensOut, 0);

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="badge">total {totalMs} ms</span>
        <span className="badge">tokens in {totalIn}</span>
        <span className="badge">tokens out {totalOut}</span>
        <span className="badge">steps {rows.length}</span>
      </div>
      <div className="tl">
        {rows.map((r, i) => (
          <div key={i} className="tl-row">
            <strong>{r.step}</strong>
            <span className={`badge ${r.status === 'success' ? 'ok' : r.status === 'failed' ? 'err' : 'warn'}`}>
              {r.status}
            </span>
            <span>{r.ms} ms</span>
            <span>↑{r.tokensIn} ↓{r.tokensOut}</span>
            <span className="note" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="tl-bar" style={{ width: 120 }}>
                <span style={{ width: `${(r.ms / maxMs) * 100}%` }} />
              </span>
              {r.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Page shell --------------------------------------------------------

export default function Page() {
  const [tab, setTab] = useState<TabKey>('dag');
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dag', label: 'Workflow DAG' },
    { key: 'prompt', label: 'Prompt Playground' },
    { key: 'timeline', label: 'Run Timeline' },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Agent Workflow Panel</h1>
        <span className="meta">
          run {runData.runId} · goal: {runData.goal}
        </span>
      </header>
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {tab === 'dag' && <DagView />}
        {tab === 'prompt' && <PromptPlayground />}
        {tab === 'timeline' && <RunTimeline />}
      </main>
    </div>
  );
}
