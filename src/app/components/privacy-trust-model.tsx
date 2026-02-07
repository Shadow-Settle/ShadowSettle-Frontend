import { GlassCard } from './glass-card';
import { Shield, X, Eye, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

export function PrivacyTrustModel() {
  const trustComponents = [
    {
      component: 'Frontend (React App)',
      trust: 'untrusted',
      reason: 'Runs in user browser. Can be compromised or modified.',
      access: 'Display only. Cannot access private data.',
    },
    {
      component: 'Backend API (if present)',
      trust: 'untrusted',
      reason: 'Controlled by operator. Could log or leak data.',
      access: 'Encrypted data only. No plaintext access.',
    },
    {
      component: 'Blockchain (Arbitrum)',
      trust: 'public',
      reason: 'All data on-chain is publicly visible and permanent.',
      access: 'Final results and proofs only. No private inputs.',
    },
    {
      component: 'IPFS Storage',
      trust: 'untrusted',
      reason: 'Decentralized but public. Anyone can access.',
      access: 'Encrypted datasets only. Encryption key stays in TEE.',
    },
    {
      component: 'iExec TEE',
      trust: 'trusted',
      reason: 'Hardware-backed confidential execution. Cryptographically verified.',
      access: 'Full access to plaintext data during computation only.',
    },
  ];

  const dataFlow = [
    { step: 1, action: 'User uploads dataset', location: 'Frontend (Browser)', status: 'plaintext' },
    { step: 2, action: 'Data encrypted client-side', location: 'Frontend (Browser)', status: 'encrypted' },
    { step: 3, action: 'Encrypted data uploaded', location: 'IPFS / Storage', status: 'encrypted' },
    { step: 4, action: 'Job submitted to iExec', location: 'Blockchain', status: 'metadata only' },
    { step: 5, action: 'TEE fetches encrypted data', location: 'iExec Worker', status: 'encrypted' },
    { step: 6, action: 'Decryption in TEE', location: 'iExec TEE (isolated)', status: 'plaintext' },
    { step: 7, action: 'Computation executed', location: 'iExec TEE (isolated)', status: 'plaintext' },
    { step: 8, action: 'Results + proof generated', location: 'iExec TEE', status: 'public output' },
    { step: 9, action: 'Results published', location: 'Blockchain', status: 'public' },
  ];

  const securityGuarantees = [
    {
      guarantee: 'Data Confidentiality',
      description: 'Private data never leaves the TEE in plaintext',
      mechanism: 'Hardware-enforced memory isolation',
    },
    {
      guarantee: 'Computation Integrity',
      description: 'Results are computed correctly and cannot be tampered with',
      mechanism: 'TEE attestation + cryptographic proof',
    },
    {
      guarantee: 'Privacy Preservation',
      description: 'Rejected/ineligible participants remain completely private',
      mechanism: 'Only eligible outputs are published',
    },
    {
      guarantee: 'Public Verifiability',
      description: 'Anyone can verify the computation was performed correctly',
      mechanism: 'On-chain proof + TEE attestation signature',
    },
  ];

  const attackScenarios = [
    {
      attack: 'Compromised Frontend',
      impact: 'Low',
      reason: 'Frontend has no access to private data. Users verify transaction before signing.',
    },
    {
      attack: 'Compromised Backend/Storage',
      impact: 'Low',
      reason: 'Only encrypted data is accessible. Decryption keys never leave TEE.',
    },
    {
      attack: 'Blockchain Analysis',
      impact: 'None',
      reason: 'Only final results are on-chain. Input data and rejected participants are not revealed.',
    },
    {
      attack: 'TEE Side-Channel Attack',
      impact: 'Medium',
      reason: 'Theoretical. Mitigated by constant-time operations and minimal attack surface.',
    },
    {
      attack: 'Operator Collusion',
      impact: 'Low',
      reason: 'Operator cannot decrypt data or modify computation. TEE enforces rules.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Privacy & Trust Model</h1>
        <p className="text-sm text-muted-foreground">
          Technical documentation for reviewers and auditors
        </p>
      </div>

      {/* Trust Boundary Overview */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Trust Boundaries</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Component</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Trust Level</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Rationale</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Data Access</th>
              </tr>
            </thead>
            <tbody>
              {trustComponents.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-4 pr-4">
                    <span className="text-sm font-medium text-foreground">{item.component}</span>
                  </td>
                  <td className="py-4 pr-4">
                    {item.trust === 'trusted' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-xs font-medium text-success">
                        <Shield className="w-3 h-3" />
                        Trusted
                      </span>
                    ) : item.trust === 'untrusted' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                        <X className="w-3 h-3" />
                        Untrusted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                        <Eye className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-xs text-muted-foreground">{item.reason}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs text-muted-foreground">{item.access}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Trust Model:</strong> Only the iExec TEE is trusted. All other components are assumed to be potentially compromised or malicious. The system is designed to maintain privacy and integrity even if the frontend, backend, and storage layers are fully controlled by an adversary.
          </p>
        </div>
      </GlassCard>

      {/* Data Flow */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Data Flow</h2>

        <div className="space-y-3">
          {dataFlow.map((flow, index) => (
            <div key={index} className="relative">
              <div className="flex items-start gap-4">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{flow.step}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{flow.action}</h3>
                    {flow.status === 'plaintext' ? (
                      <span className="px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                        plaintext
                      </span>
                    ) : flow.status === 'encrypted' ? (
                      <span className="px-2 py-0.5 rounded bg-success/10 border border-success/20 text-xs text-success">
                        <Lock className="w-3 h-3 inline mr-1" />
                        encrypted
                      </span>
                    ) : flow.status === 'public' ? (
                      <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-xs text-accent">
                        public
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-muted/30 border border-border text-xs text-muted-foreground">
                        {flow.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{flow.location}</p>
                </div>
              </div>

              {/* Connector */}
              {index < dataFlow.length - 1 && (
                <div className="ml-4 mt-1 mb-1 w-0.5 h-4 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Key Property:</strong> Private data exists in plaintext only within the TEE (steps 6-7). At all other stages, data is either encrypted or only metadata/public results are exposed.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Guarantees */}
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-foreground mb-6">Security Guarantees</h2>

          <div className="space-y-4">
            {securityGuarantees.map((item, index) => (
              <div key={index} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <h3 className="text-sm font-medium text-foreground mb-1">{item.guarantee}</h3>
                <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/70">Mechanism:</span>
                  <span className="text-xs font-mono text-foreground">{item.mechanism}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Attack Surface Analysis */}
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-foreground mb-6">Attack Surface Analysis</h2>

          <div className="space-y-4">
            {attackScenarios.map((item, index) => (
              <div key={index} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-sm font-medium text-foreground">{item.attack}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      item.impact === 'None'
                        ? 'bg-success/10 border border-success/20 text-success'
                        : item.impact === 'Low'
                        ? 'bg-accent/10 border border-accent/20 text-accent'
                        : 'bg-warning/10 border border-warning/20 text-warning'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> This analysis assumes the TEE hardware and attestation mechanism are functioning correctly. TEE security relies on hardware manufacturer guarantees (Intel SGX, AMD SEV, etc.).
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Verification Process */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Verification Process</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <span className="text-sm font-semibold text-primary">1</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">TEE Attestation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Before computation begins, the TEE generates a cryptographic attestation proving it is running genuine hardware in a secure enclave.
            </p>
          </div>

          <div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <span className="text-sm font-semibold text-primary">2</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Computation Proof</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The TEE generates a cryptographic proof that the computation was executed correctly using the specified algorithm and dataset.
            </p>
          </div>

          <div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <span className="text-sm font-semibold text-primary">3</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">On-Chain Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The proof and attestation are published on-chain. Anyone can independently verify the computation without accessing private data.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-background border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-2">What Can Be Verified</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
              <span>Computation ran inside a genuine TEE</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
              <span>Correct algorithm was executed</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
              <span>Results match the proof</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
              <span>No tampering occurred</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-background border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-2">What Cannot Be Verified</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <X className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
              <span>The contents of the private input dataset</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
              <span>Which participants were rejected or why</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
              <span>Intermediate computation states</span>
            </li>
          </ul>
        </div>
      </GlassCard>

      {/* Technical Assumptions */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Assumptions & Limitations</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-foreground">1</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">TEE Hardware Trust</p>
              <p className="text-xs text-muted-foreground">
                System security depends on the integrity of TEE hardware (Intel SGX, AMD SEV, etc.) and the manufacturer's implementation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-foreground">2</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Client-Side Encryption</p>
              <p className="text-xs text-muted-foreground">
                Users must encrypt data correctly before upload. Compromised client software could leak plaintext before encryption.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-foreground">3</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Network Assumptions</p>
              <p className="text-xs text-muted-foreground">
                Blockchain finality and liveness are assumed. Settlement cannot proceed if the underlying blockchain network is unavailable.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-foreground">4</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">iExec Protocol Dependency</p>
              <p className="text-xs text-muted-foreground">
                System relies on the iExec protocol for task scheduling, attestation verification, and result publication. Protocol bugs or downtime affect availability.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
