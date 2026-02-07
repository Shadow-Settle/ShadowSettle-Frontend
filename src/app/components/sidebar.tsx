import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Activity, 
  Settings, 
  Lock,
  User
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: true },
  { label: 'Settlements', icon: <FileText className="w-5 h-5" /> },
  { label: 'Privacy Proofs', icon: <Shield className="w-5 h-5" /> },
  { label: 'Activity', icon: <Activity className="w-5 h-5" /> },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">ShadowSettle</div>
            <div className="text-xs text-muted-foreground">Confidential DeFi</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              item.active
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* User Profile */}
        <div className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-sidebar-foreground truncate">
              0x742d...b5c9
            </div>
            <div className="text-xs text-muted-foreground">Connected</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
