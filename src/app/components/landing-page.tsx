import { GlassCard } from './glass-card';
import { Shield, Lock, Eye, Server, CheckCircle, ArrowRight, FileJson, Zap, Play, Github, FileText } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  const features = [
    {
      icon: Shield,
      title: 'Hardware-Enforced Privacy',
      description: 'Computation runs inside Intel SGX Trusted Execution Environments. Not software privacy—hardware privacy.',
    },
    {
      icon: Lock,
      title: 'Zero Knowledge Settlement',
      description: 'Rejected participants remain invisible. Eligibility rules never disclosed. Only results are public.',
    },
    {
      icon: Eye,
      title: 'Publicly Verifiable',
      description: 'Cryptographic proofs published on-chain. Anyone can audit without accessing private data.',
    },
  ];

  const useCases = [
    {
      title: 'Private Credit & RWA',
      description: 'Tokenized debt, real estate, and fund distributions with confidential eligibility and compliance rules.',
      metrics: ['Confidential KYC/AML', 'Private accreditation', 'Jurisdiction filtering'],
    },
    {
      title: 'DeFi Risk Models',
      description: 'Execute proprietary liquidation logic, credit scoring, and risk assessments without on-chain exposure.',
      metrics: ['Protected algorithms', 'Private scoring', 'Confidential thresholds'],
    },
    {
      title: 'Institutional Settlement',
      description: 'Treasury operations, LP rewards, and staking distributions with privacy-preserving computation.',
      metrics: ['Batch settlements', 'Private allocations', 'Verifiable outcomes'],
    },
  ];

  const techStack = [
    { label: 'iExec Protocol', description: 'Confidential computing orchestration' },
    { label: 'Intel SGX / AMD SEV', description: 'Hardware-backed TEE attestation' },
    { label: 'Arbitrum', description: 'L2 settlement and proof verification' },
    { label: 'IPFS', description: 'Encrypted dataset storage' },
  ];

  return (
    <div className="min-h-screen">
      {/* Minimal Header */}
      <header className="border-b border-border/30 backdrop-blur-xl bg-background/50 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm border-2 border-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold text-foreground">ShadowSettle</span>
              <span className="text-[10px] text-muted-foreground leading-none">Confidential Settlement Engine</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </a>
            <button
              onClick={onLaunchApp}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-8 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Powered by iExec Confidential Computing</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Private Settlement for
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                DeFi & Real-World Assets
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
              Execute confidential eligibility rules and payout logic inside hardware-enforced Trusted Execution
              Environments. Privacy-preserving computation with public verifiability.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <button
                onClick={onLaunchApp}
                className="px-8 py-4 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
              >
                Launch App
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#architecture"
                className="px-8 py-4 rounded-lg border-2 border-border text-lg font-medium text-foreground hover:bg-accent/5 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Hardware Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Zero Trust Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Publicly Verifiable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="relative py-24 bg-gradient-to-b from-background to-accent/5">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Architecture</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Clear trust boundaries. Private computation. Public verification.
            </p>
          </div>

          <GlassCard className="p-8 md:p-12 max-w-5xl mx-auto">
            {/* Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-center mb-12">
              {/* Frontend */}
              <div className="relative">
                <div className="p-6 rounded-xl border border-border bg-background/50 hover:border-primary/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-muted/20 border border-border flex items-center justify-center mb-4">
                    <FileJson className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Frontend</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data encrypted client-side before upload
                  </p>
                </div>
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Backend */}
              <div className="relative">
                <div className="p-6 rounded-xl border border-border bg-background/50 hover:border-primary/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-muted/20 border border-border flex items-center justify-center mb-4">
                    <Server className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Backend</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Encrypted data only. Zero plaintext access
                  </p>
                </div>
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* iExec TEE - HERO BLOCK */}
              <div className="relative">
                <div className="p-6 rounded-xl border-2 border-accent bg-gradient-to-br from-accent/20 to-primary/20 shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/30 border-2 border-accent flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-accent/30 border border-accent/50">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wide">Private</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">iExec TEE</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hardware-enforced confidential execution
                  </p>
                </div>
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Blockchain */}
              <div>
                <div className="p-6 rounded-xl border border-border bg-background/50 hover:border-success/50 transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wide">Public</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Blockchain</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Results & proofs published on-chain
                  </p>
                </div>
              </div>
            </div>

            {/* Key Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Private Computation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Eligibility rules, participant data, and settlement logic remain confidential inside the TEE.
                    Hardware guarantees no operator access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Public Verification</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Results and cryptographic proofs published on-chain. Anyone can verify computation correctness
                    without accessing private inputs.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Privacy Matters</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-world settlement requires confidentiality that public smart contracts cannot provide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard key={index} className="p-8 hover:border-primary/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24 bg-gradient-to-b from-accent/5 to-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Use Cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Institutional-grade settlement infrastructure for Web3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <GlassCard key={index} className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-3">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{useCase.description}</p>
                <div className="space-y-2">
                  {useCase.metrics.map((metric, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{metric}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Technology Stack</h2>
            <p className="text-lg text-muted-foreground">Built on proven confidential computing infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {techStack.map((tech, index) => (
              <div key={index} className="p-6 rounded-xl border border-border bg-background/50 hover:bg-accent/5 transition-all">
                <p className="text-sm font-semibold text-foreground mb-2">{tech.label}</p>
                <p className="text-xs text-muted-foreground">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-background pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto px-8">
          <GlassCard className="p-12 md:p-16 text-center border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Build with Privacy?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Launch your first confidential settlement in under 5 minutes
              </p>
              <button
                onClick={onLaunchApp}
                className="px-10 py-4 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 inline-flex items-center gap-2"
              >
                Launch App Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-xl py-12">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">ShadowSettle</p>
                <p className="text-xs text-muted-foreground">Confidential Settlement Engine</p>
              </div>
            </div>

            {/* Center: Links */}
            <div className="flex items-center gap-6">
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <FileText className="w-4 h-4" />
                Documentation
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Play className="w-4 h-4" />
                Demo Video
              </a>
            </div>

            {/* Right: Built with iExec */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <a href="https://iex.ec" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors group">
                <Shield className="w-4 h-4 text-accent group-hover:text-primary transition-colors" />
                iExec Confidential Computing
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
