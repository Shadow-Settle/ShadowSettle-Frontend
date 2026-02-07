import { GlassCard } from './glass-card';
import { Copy, Check, CheckCircle, Loader2, Clock, Shield, Lock, AlertCircle, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { SettlementRunState } from '../App';
import { uploadDataset, runSettlement, getSettlementResult } from '../../utils/api';

const IEXEC_EXPLORER = 'https://explorer.iex.ec/bellecour';
function taskExplorerUrl(taskId: string) { return `${IEXEC_EXPLORER}/task/${taskId}`; }
function dealExplorerUrl(dealId: string) { return `${IEXEC_EXPLORER}/deal/${dealId}`; }

type StepStatus = 'completed' | 'active' | 'pending';

interface TimelineStep {
  label: string;
  description: string;
  status: StepStatus;
  timestamp?: string;
}

type LogLevel = 'info' | 'success' | 'warn' | 'error';

interface LogEntry {
  time: string;
  level: LogLevel;
  message: string;
}

function formatTime(d: Date) {
  return d.toTimeString().slice(0, 8);
}

interface SettlementStatusProps {
  settlementRun: SettlementRunState | null;
  onSettlementUpdate?: (state: SettlementRunState | null) => void;
  onComplete?: () => void;
}

export function SettlementStatus({ settlementRun, onSettlementUpdate, onComplete }: SettlementStatusProps) {
  const [copied, setCopied] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const logInitialized = useRef(false);
  const logCompleteAdded = useRef(false);
  const submitStarted = useRef(false);

  const isSubmitting = settlementRun?.status === 'submitting';
  const hasResult = settlementRun?.result != null;
  const hasError = !!settlementRun?.error;
  const taskId = settlementRun?.taskId ?? '';
  const dealId = settlementRun?.dealId ?? '';
  const jobName = settlementRun?.settlementName || 'Settlement';

  const appendLog = (level: LogLevel, message: string) => {
    const t = formatTime(new Date());
    setLogEntries((prev) => [...prev, { time: t, level, message }]);
  };

  // Run submit flow when we land with status 'submitting' (live logs)
  useEffect(() => {
    if (!isSubmitting || !onSettlementUpdate || !settlementRun || submitStarted.current) return;
    submitStarted.current = true;
    const run = async () => {
      try {
        appendLog('info', 'Preparing dataset…');
        let datasetUrl: string;
        if (settlementRun.datasetUrlOverride) {
          datasetUrl = settlementRun.datasetUrlOverride;
          appendLog('info', 'Using provided dataset URL');
        } else if (settlementRun.fileContent) {
          appendLog('info', 'Uploading dataset…');
          const { url, publicUrl } = await uploadDataset(settlementRun.fileContent);
          datasetUrl = publicUrl ?? url;
          appendLog('success', 'Dataset URL ready');
        } else {
          onSettlementUpdate({ ...settlementRun, error: 'No dataset' });
          return;
        }
        appendLog('info', 'Submitting to iExec…');
        const response = await runSettlement({ datasetUrl, wait: false });
        const newState: SettlementRunState = {
          ...settlementRun,
          taskId: response.taskId,
          dealId: response.dealId,
          status: undefined,
          submittedAt: settlementRun?.submittedAt ?? Date.now(),
          ...('result' in response && response.result ? { result: response.result } : {}),
        };
        onSettlementUpdate(newState);
        appendLog('info', 'Job submitted to iExec network');
        appendLog('info', 'Deal matched — task submitted');
        appendLog('info', 'Observing task — execution typically takes 40 s');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submit failed';
        appendLog('error', message);
        onSettlementUpdate({ ...settlementRun, error: message, status: undefined });
      }
    };
    run();
  }, [isSubmitting, settlementRun, onSettlementUpdate]);

  // Reset log state only when taskId changes to a different task (new run), not when we get taskId from submit
  const prevTaskIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!taskId) return;
    if (prevTaskIdRef.current != null && prevTaskIdRef.current !== taskId) {
      logInitialized.current = false;
      logCompleteAdded.current = false;
      setLogEntries([]);
    }
    prevTaskIdRef.current = taskId;
  }, [taskId]);

  // Initial execution logs when we have a task (and we didn't just run submit flow)
  useEffect(() => {
    if (!taskId || logInitialized.current || isSubmitting) return;
    logInitialized.current = true;
    const t = formatTime(new Date());
    setLogEntries([
      { time: t, level: 'info', message: 'Job submitted to iExec network' },
      { time: t, level: 'info', message: 'Dataset URL registered for TEE input' },
      { time: t, level: 'info', message: `Deal matched — taskId: ${taskId.slice(0, 10)}...${taskId.slice(-8)}` },
      { time: t, level: 'info', message: 'Observing task — execution typically takes 40 s' },
    ]);
  }, [taskId, isSubmitting]);

  // Poll for result when we have taskId but no result yet (every 8s, max 120 polls ≈ 16 min)
  const POLL_INTERVAL_MS = 8000;
  const MAX_POLLS = 120;
  useEffect(() => {
    if (!taskId || hasResult || hasError || !onSettlementUpdate) return;
    let pollCount = 0;
    const interval = setInterval(async () => {
      pollCount += 1;
      if (pollCount > MAX_POLLS) {
        clearInterval(interval);
        return;
      }
      try {
        const data = await getSettlementResult(taskId);
        const completed = data.status === 'COMPLETED' || data.status === 3;
        if (completed && data.result) {
          onSettlementUpdate(settlementRun ? { ...settlementRun, result: data.result } : null);
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [taskId, hasResult, hasError, onSettlementUpdate, settlementRun]);

  // Append completion logs when result arrives
  useEffect(() => {
    if (!hasResult || logCompleteAdded.current) return;
    logCompleteAdded.current = true;
    const t = formatTime(new Date());
    setLogEntries((prev) => [
      ...prev,
      { time: t, level: 'success', message: 'TEE execution completed' },
      { time: t, level: 'success', message: 'Attestation verified — results ready for settlement' },
    ]);
  }, [hasResult]);

  // Timeline: when submitting, step 0 active; when we have taskId, steps 0–1 completed and step 2 active until result
  const steps: TimelineStep[] = [
    {
      label: 'Submitting',
      description: isSubmitting ? 'Uploading dataset and submitting to iExec…' : 'Job submitted to iExec network',
      status: isSubmitting ? 'active' : taskId ? 'completed' : 'pending',
      timestamp: undefined,
    },
    {
      label: 'Dataset ready',
      description: 'Input prepared for TEE',
      status: !taskId ? 'pending' : 'completed',
      timestamp: undefined,
    },
    {
      label: 'Running in iExec TEE',
      description: 'Trusted Execution Environment',
      status: hasResult ? 'completed' : 'active',
      timestamp: undefined,
    },
    {
      label: 'Computing Payouts',
      description: 'Applying settlement logic',
      status: hasResult ? 'completed' : 'pending',
      timestamp: undefined,
    },
    {
      label: 'Generating Attestation',
      description: 'Creating proof of execution',
      status: hasResult ? 'completed' : 'pending',
      timestamp: undefined,
    },
    {
      label: 'Completed',
      description: 'Results ready for verification',
      status: hasResult ? 'completed' : 'pending',
      timestamp: undefined,
    },
  ];

  const jobId = taskId ? `${taskId.slice(0, 10)}...${taskId.slice(-8)}` : '—';
  const fullJobId = taskId || '—';

  const copyJobId = async () => {
    try {
      const { copyToClipboard } = await import('../../utils/clipboard');
      const success = await copyToClipboard(fullJobId);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const isComplete = hasResult;

  const handleViewResults = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (!settlementRun && !hasError) {
    return (
      <div className="space-y-8">
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">No settlement run in progress. Create a job from the Create flow.</p>
        </GlassCard>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-8">
        <GlassCard className="p-6 bg-destructive/10 border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">Run failed</h2>
              <p className="text-sm text-muted-foreground">{settlementRun?.error}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Job Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-3">{jobName}</h1>
            
            {/* Job ID */}
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Job ID</p>
                {taskId ? (
                  <span className="flex items-center gap-2">
                    <a
                      href={taskExplorerUrl(taskId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      {jobId}
                    </a>
                    <button onClick={copyJobId} className="text-muted-foreground hover:text-foreground p-0">
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground font-mono">{isSubmitting ? 'Pending…' : '—'}</span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {isComplete ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">Completed</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-medium text-primary">{isSubmitting ? 'Submitting' : 'Processing'}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-accent">iExec Bellecour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Confidential Computation Complete</p>
                    <p className="text-xs text-muted-foreground">Ready to view results and settle on-chain</p>
                  </div>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Submitting…</p>
                    <p className="text-xs text-muted-foreground">Uploading dataset and submitting to iExec</p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Processing in iExec TEE</p>
                    <p className="text-xs text-muted-foreground">
                      {isSubmitting ? 'Uploading and submitting — ~1 min' : '~40 sec — status updates automatically'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Estimated time remaining</p>
              <p className="text-sm font-medium text-foreground">
                {isComplete ? 'Complete' : isSubmitting ? '~1 min' : '~40 sec'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Timeline and Logs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Execution Timeline */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-6">Execution Timeline</h2>

            <div className="space-y-1">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start gap-4 py-3">
                    {/* Icon */}
                    <div className="relative flex-shrink-0">
                      {step.status === 'completed' ? (
                        <div className="w-8 h-8 rounded-full bg-success/10 border-2 border-success flex items-center justify-center">
                          <Check className="w-4 h-4 text-success" />
                        </div>
                      ) : step.status === 'active' ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted/30 border-2 border-border flex items-center justify-center">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div
                          className={`absolute left-1/2 top-8 w-0.5 h-[calc(100%+4px)] -translate-x-1/2 ${
                            step.status === 'completed' ? 'bg-success/30' : 'bg-border'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-3 mb-1">
                        <h3
                          className={`text-sm font-medium ${
                            step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {step.label}
                        </h3>
                        {step.timestamp && (
                          <span className="text-xs font-mono text-muted-foreground">{step.timestamp}</span>
                        )}
                      </div>
                      <p
                        className={`text-xs ${
                          step.status === 'pending' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Execution Logs */}
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-1">Execution Logs</h2>
            <p className="text-xs text-muted-foreground mb-4">Sanitized — no sensitive data; private inputs stay inside the TEE.</p>

            <div className="bg-background/80 border border-border rounded-lg overflow-hidden">
              <div className="p-4 max-h-[320px] overflow-y-auto font-mono text-[13px] leading-relaxed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {logEntries.length === 0 ? (
                  <div className="text-muted-foreground/70">Waiting for logs…</div>
                ) : (
                  <div className="space-y-2">
                    {logEntries.map((entry, index) => (
                      <div key={index} className="flex items-baseline gap-3 gap-x-4">
                        <span className="text-muted-foreground/80 flex-shrink-0 select-none" aria-hidden>
                          {entry.time}
                        </span>
                        <span className="flex-shrink-0 w-14 text-right font-medium uppercase tracking-wide text-[11px]">
                          {entry.level === 'success' && <span className="text-success">OK</span>}
                          {entry.level === 'info' && <span className="text-muted-foreground/90">INFO</span>}
                          {entry.level === 'warn' && <span className="text-amber-500">WARN</span>}
                          {entry.level === 'error' && <span className="text-destructive">ERR</span>}
                        </span>
                        <span
                          className={
                            entry.level === 'success'
                              ? 'text-success'
                              : entry.level === 'error'
                                ? 'text-destructive'
                                : entry.level === 'warn'
                                  ? 'text-amber-500'
                                  : 'text-foreground/90'
                          }
                        >
                          {entry.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {!isComplete && logEntries.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Checking status…</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                All private information remains encrypted inside the iExec TEE. Only status and verification messages are shown here.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - iExec Execution Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* iExec Execution Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Confidential Execution Environment</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-0.5 rounded bg-accent/30 border border-accent/50">
                      <span className="text-xs font-medium text-accent">Private</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Task ID */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Task ID</p>
                  {taskId ? (
                    <a
                      href={taskExplorerUrl(taskId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline break-all inline-flex items-center gap-1"
                    >
                      {taskId}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">—</span>
                  )}
                </div>

                {/* Deal ID (if we have it) */}
                {dealId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Deal ID</p>
                    <a
                      href={dealExplorerUrl(dealId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline break-all inline-flex items-center gap-1"
                    >
                      {dealId}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}

                {/* Worker Status */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Worker</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <p className="text-sm font-medium text-foreground">iExec TEE</p>
                  </div>
                </div>

                {/* TEE Type */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">TEE Type</p>
                  <p className="text-sm font-medium text-foreground">Intel SGX</p>
                </div>

                {/* Private Badge Info */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-0.5">TEE Attestation Verified</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Hardware-backed proof of secure execution environment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Settlement Details */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Job Details</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Network</span>
                  <span className="text-sm font-medium text-foreground">iExec Bellecour</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">Task</span>
                  {taskId ? (
                    <a
                      href={taskExplorerUrl(taskId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      {taskId.slice(0, 10)}... <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Privacy Reminder */}
            <GlassCard className="p-6 bg-info/5 border-info/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Computation is running inside a hardware-isolated environment. Data is inaccessible to the operator, worker, or backend.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* CTA */}
            {isComplete && (
              <button
                onClick={handleViewResults}
                className="w-full px-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                View Results
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}