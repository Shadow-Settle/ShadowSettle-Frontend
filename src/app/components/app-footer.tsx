import { Github, FileText, Video, Shield } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-xl mt-24">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Left: Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4" />
              Documentation
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Video className="w-4 h-4" />
              Demo Video
            </a>
          </div>

          {/* Right: Built with iExec */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <a
              href="https://iex.ec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors group"
            >
              <Shield className="w-4 h-4 text-accent group-hover:text-primary transition-colors" />
              iExec Confidential Computing
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
