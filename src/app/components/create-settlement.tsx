import { GlassCard } from './glass-card';
import { Upload, FileJson, ChevronDown, ChevronUp, Shield, Lock, CheckCircle, ArrowRight, AlertCircle, Info, XCircle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateSettlementProps {
  onSubmit?: () => void;
  onRunSettlement?: (state: {
    taskId: string;
    dealId: string;
    settlementName: string;
    result?: { payouts: { wallet: string; amount: number }[]; tee_attestation: string };
    error?: string;
  }) => void;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function CreateSettlement({ onSubmit, onRunSettlement }: CreateSettlementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settlementName, setSettlementName] = useState('');
  const [fileContent, setFileContent] = useState<any>(null);
  const [validation, setValidation] = useState<ValidationResult>({ valid: false, errors: [] });
  const [draftSaved, setDraftSaved] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [datasetUrlOverride, setDatasetUrlOverride] = useState('');

  const expectedSchema = {
    rules: {
      minScore: 'number',
      maxRisk: 'number',
    },
    participants: [
      {
        wallet: 'address (string)',
        score: 'number',
        risk: 'number',
      },
    ],
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('shadowsettle_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setSettlementName(draft.settlementName || '');
        if (draft.fileContent) {
          setFileContent(draft.fileContent);
          const validationResult = validateSchema(draft.fileContent);
          setValidation(validationResult);
        }
        setDraftSaved(true);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Validate JSON against expected schema
  const validateSchema = (data: any): ValidationResult => {
    const errors: string[] = [];

    if (!data) {
      return { valid: false, errors: ['No data provided'] };
    }

    // Check rules
    if (!data.rules) {
      errors.push('Missing "rules" object');
    } else {
      if (typeof data.rules.minScore !== 'number') {
        errors.push('rules.minScore must be a number');
      }
      if (typeof data.rules.maxRisk !== 'number') {
        errors.push('rules.maxRisk must be a number');
      }
    }

    // Check participants
    if (!data.participants || !Array.isArray(data.participants)) {
      errors.push('Missing "participants" array');
    } else {
      if (data.participants.length === 0) {
        errors.push('participants array is empty');
      }
      data.participants.forEach((participant: any, index: number) => {
        if (!participant.wallet || typeof participant.wallet !== 'string') {
          errors.push(`participants[${index}].wallet must be a string`);
        }
        if (typeof participant.score !== 'number') {
          errors.push(`participants[${index}].score must be a number`);
        }
        if (typeof participant.risk !== 'number') {
          errors.push(`participants[${index}].risk must be a number`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    
    // Read and parse JSON
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        setFileContent(content);
        const validationResult = validateSchema(content);
        setValidation(validationResult);
      } catch (error) {
        setFileContent(null);
        setValidation({
          valid: false,
          errors: ['Invalid JSON format'],
        });
      }
    };
    reader.readAsText(file);
  };

  const hasUrl = datasetUrlOverride.trim().length > 0 && (datasetUrlOverride.startsWith('http://') || datasetUrlOverride.startsWith('https://'));
  const isFormValid = settlementName.trim() && ((uploadedFile && validation.valid) || hasUrl);

  const handleSubmit = () => {
    if (!onSubmit || !onRunSettlement) return;
    if (!settlementName.trim() || !isFormValid) return;
    if (!hasUrl && (!fileContent || !validation.valid)) return;

    setRunError(null);
    onRunSettlement({
      settlementName: settlementName.trim(),
      status: 'submitting',
      fileContent: hasUrl ? undefined : fileContent ?? undefined,
      datasetUrlOverride: hasUrl ? datasetUrlOverride.trim() : undefined,
    });
    localStorage.removeItem('shadowsettle_draft');
    onSubmit();
  };

  const handleSaveDraft = () => {
    const draft = {
      settlementName,
      fileContent,
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('shadowsettle_draft', JSON.stringify(draft));
    setDraftSaved(true);
    setShowSaveSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 3000);
  };

  const handleDownloadExample = () => {
    const exampleData = {
      rules: {
        minScore: 650,
        maxRisk: 0.15
      },
      participants: [
        {
          wallet: '0x742d35Cc6634C0532925a3b844Bc9e7631Eb5c9f',
          score: 780,
          risk: 0.08
        },
        {
          wallet: '0x9a3f2b5c8e1d4a7c9f2e5b8a1d4c7f9e2b5a8c1d',
          score: 720,
          risk: 0.12
        },
        {
          wallet: '0x1c5e7a9b3d6f8e2a4c7b9d1e4a6c8f2b5d7e9a3c',
          score: 590,
          risk: 0.22
        },
        {
          wallet: '0x8d2f4a6c9e1b3d5a7c9f2e4b6a8d1c3e5f7b9d2a',
          score: 810,
          risk: 0.05
        }
      ]
    };

    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadowsettle-example-dataset.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenSecurityDocs = () => {
    // In a real app, this would open actual documentation
    // For now, we'll simulate opening TEE security docs
    const docsContent = `ShadowSettle TEE Security Documentation

1. TRUSTED EXECUTION ENVIRONMENT (TEE)
   - Hardware-enforced isolation using Intel SGX or AMD SEV
   - All computation occurs inside encrypted memory enclaves
   - No privileged access can read enclave contents

2. DATA ENCRYPTION
   - Client-side encryption using AES-256-GCM
   - Data encrypted before leaving your browser
   - Decryption keys only available inside TEE

3. ATTESTATION
   - Remote attestation verifies TEE integrity
   - Cryptographic proof that code runs in genuine TEE
   - Publicly verifiable attestation reports

4. PRIVACY GUARANTEES
   - Backend cannot access plaintext data
   - Workers cannot access computation inputs
   - Only encrypted results published on-chain

5. VERIFICATION
   - All computations include cryptographic proofs
   - Anyone can verify computation correctness
   - No trust required in operator or infrastructure

For more information, visit: https://iex.ec/tee-security
`;

    const blob = new Blob([docsContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadowsettle-tee-security-docs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Side - Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Create Confidential Settlement Job</h1>
          <p className="text-sm text-muted-foreground">
            Upload encrypted data for private computation inside iExec Trusted Execution Environments.
          </p>
        </div>

        {/* Settlement Name */}
        <GlassCard className="p-6">
          <label htmlFor="settlement-name" className="block text-sm font-medium text-foreground mb-2">
            Job Name
          </label>
          <input
            id="settlement-name"
            type="text"
            value={settlementName}
            onChange={(e) => setSettlementName(e.target.value)}
            placeholder="e.g. Q1 rewards"
            className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
          />
        </GlassCard>

        {/* Dataset Upload Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileJson className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Encrypted Dataset</h2>
              <p className="text-xs text-muted-foreground">Upload settlement data in JSON format</p>
            </div>
          </div>

          {/* Upload Field */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : uploadedFile && validation.valid
                ? 'border-success bg-success/5'
                : uploadedFile && !validation.valid
                ? 'border-destructive bg-destructive/5'
                : 'border-border bg-input'
            }`}
          >
            <input
              type="file"
              onChange={handleFileInput}
              accept=".json"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="block p-8 cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {uploadedFile ? (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      validation.valid ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      {validation.valid ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setUploadedFile(null);
                        setFileContent(null);
                        setValidation({ valid: false, errors: [] });
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drop your JSON file here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">JSON format only (max 10MB)</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Optional: public dataset URL (e.g. GitHub Gist raw URL) — used when backend is not public */}
          <div className="mt-4">
            <label htmlFor="dataset-url" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Or paste a public dataset URL
            </label>
            <input
              id="dataset-url"
              type="url"
              value={datasetUrlOverride}
              onChange={(e) => setDatasetUrlOverride(e.target.value)}
              placeholder="https://example.com/dataset.json"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional. If you upload a file, we create a public URL automatically so the job can run. Use this only if you prefer your own URL (e.g. GitHub Gist → Raw).
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Dataset is encrypted client-side before upload and decrypted only inside the iExec TEE.
            </p>
          </div>
        </GlassCard>

        {/* Validation Feedback */}
        {uploadedFile && (
          <GlassCard className={`p-6 ${
            validation.valid 
              ? 'bg-success/5 border-success/30' 
              : 'bg-destructive/5 border-destructive/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                validation.valid
                  ? 'bg-success/20 border border-success/30'
                  : 'bg-destructive/20 border border-destructive/30'
              }`}>
                {validation.valid ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {validation.valid ? 'Schema Valid' : 'Schema Validation Failed'}
                </h3>
                {validation.valid ? (
                  <p className="text-xs text-muted-foreground">
                    Your dataset matches the expected schema. Ready to submit.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span>{error}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Schema Definition (Collapsible) */}
        <GlassCard className="p-6">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Expected Schema</h2>
                <p className="text-xs text-muted-foreground">View required data structure</p>
              </div>
            </div>
            {showSchema ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {showSchema && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="p-4 rounded-lg bg-background border border-border">
                <pre className="text-xs font-mono text-foreground overflow-auto">
{`{
  "rules": {
    "minScore": <number>,
    "maxRisk": <number>
  },
  "participants": [
    {
      "wallet": <address (string)>,
      "score": <number>,
      "risk": <number>
    }
  ]
}`}
                </pre>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  The meaning of each field is defined by the confidential computation logic. Schema validation ensures structural correctness only.
                </p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Privacy Explanation Box */}
        <GlassCard className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Privacy Architecture</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>Backend is untrusted—it cannot decrypt your data</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>Dataset decrypted only inside iExec TEE with hardware-enforced isolation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>No sensitive data appears on-chain—only computation results and proofs</span>
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* JSON Preview (Optional) */}
        {fileContent && (
          <GlassCard className="p-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPreview ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showPreview ? 'Hide' : 'Show'} data preview
            </button>
            {showPreview && (
              <div className="mt-4 p-4 rounded-lg bg-background border border-border overflow-auto max-h-64">
                <pre className="text-xs text-muted-foreground font-mono">
                  {JSON.stringify(fileContent, null, 2)}
                </pre>
              </div>
            )}
          </GlassCard>
        )}

        {/* Run error */}
        {runError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{runError}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-4">
          <button
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`flex-1 px-6 py-3.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
          >
            <>
              Run Confidential Compute
              <ArrowRight className="w-4 h-4" />
            </>
          </button>
          <button 
            onClick={handleSaveDraft}
            disabled={!settlementName.trim() && !fileContent}
            className={`px-6 py-3.5 rounded-lg font-medium transition-all border flex items-center gap-2 ${
              settlementName.trim() || fileContent
                ? 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 border-border'
                : 'bg-muted/30 text-muted-foreground cursor-not-allowed border-border/50'
            }`}
          >
            {draftSaved ? <CheckCircle className="w-4 h-4" /> : null}
            Save Draft
          </button>
        </div>


        {/* Save Success Message */}
        {showSaveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-success" />
            <p className="text-sm text-success">Draft saved successfully</p>
          </div>
        )}

        {/* No Wallet Required Notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>No wallet connection required for confidential computation</span>
        </div>
      </div>

      {/* Right Side - Context Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          {/* What happens next? */}
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-2">Execution Pipeline</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Secure, verifiable computation workflow
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Job Submitted</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Encrypted dataset sent to iExec network
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-4 w-0.5 h-4 bg-gradient-to-b from-primary/20 to-accent/20" />

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-accent">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">TEE Execution</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data decrypted inside secure enclave
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-4 w-0.5 h-4 bg-gradient-to-b from-accent/20 to-success/20" />

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-success">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Computation Complete</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Results and proofs generated
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-4 w-0.5 h-4 bg-gradient-to-b from-success/20 to-info/20" />

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-info">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Results Available</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    View outcomes and publish on-chain
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estimated completion</span>
                <span className="font-medium text-foreground">~5-10 minutes</span>
              </div>
            </div>
          </GlassCard>

          {/* Schema Examples */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Example Dataset</h3>
            <div className="p-3 rounded-lg bg-background border border-border">
              <pre className="text-xs font-mono text-muted-foreground overflow-auto">
{`{
  "rules": {
    "minScore": 650,
    "maxRisk": 0.15
  },
  "participants": [
    {
      "wallet": "0x742d...",
      "score": 780,
      "risk": 0.08
    },
    {
      "wallet": "0x9a3f...",
      "score": 590,
      "risk": 0.22
    }
  ]
}`}
              </pre>
            </div>
          </GlassCard>

          {/* Help Card */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Resources</h3>
            <div className="space-y-3">
              <button
                onClick={handleDownloadExample}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <Download className="w-3 h-3 text-primary" />
                </div>
                Download example JSON
              </button>
              <button
                onClick={handleOpenSecurityDocs}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-accent" />
                </div>
                TEE security documentation
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}