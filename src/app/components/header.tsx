import { Search, Bell, ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search settlements, transactions..."
              className="w-full pl-10 pr-4 py-2 bg-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Network Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Mainnet</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* Account Dropdown */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors">
            <div className="text-right">
              <div className="text-xs font-medium text-foreground">Account</div>
              <div className="text-xs text-muted-foreground">View details</div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
