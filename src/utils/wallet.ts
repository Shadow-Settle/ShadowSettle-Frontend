import { BrowserProvider, Eip1193Provider } from 'ethers';

// Arbitrum Sepolia configuration
const ARBITRUM_SEPOLIA = {
  chainId: '0x66eee', // 421614 in hex
  chainName: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
};

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: BrowserProvider;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && !!window.ethereum.isMetaMask;
};

/**
 * Connect to MetaMask wallet
 */
export const connectMetaMask = async (): Promise<WalletConnection> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
  }

  try {
    const provider = new BrowserProvider(window.ethereum!);
    
    // Request account access
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock your wallet.');
    }

    // Get current chain ID
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Check if we're on Arbitrum Sepolia
    const targetChainId = parseInt(ARBITRUM_SEPOLIA.chainId, 16);
    
    if (chainId !== targetChainId) {
      // Try to switch to Arbitrum Sepolia
      await switchToArbitrumSepolia();
    }

    return {
      address: accounts[0],
      chainId: targetChainId,
      provider,
    };
  } catch (error: any) {
    console.error('MetaMask connection error:', error);
    
    if (error.code === 4001) {
      throw new Error('Connection rejected. Please approve the connection request.');
    }
    
    throw new Error(error.message || 'Failed to connect to MetaMask');
  }
};

/**
 * Switch to Arbitrum Sepolia network
 */
export const switchToArbitrumSepolia = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_SEPOLIA.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ARBITRUM_SEPOLIA],
        });
      } catch (addError: any) {
        console.error('Failed to add network:', addError);
        throw new Error('Failed to add Arbitrum Sepolia network. Please add it manually.');
      }
    } else if (switchError.code === 4001) {
      throw new Error('Network switch rejected. Please switch to Arbitrum Sepolia manually.');
    } else {
      throw new Error(switchError.message || 'Failed to switch network');
    }
  }
};

/**
 * WalletConnect integration (placeholder for future implementation)
 * This would require @walletconnect/ethereum-provider package
 */
export const connectWalletConnect = async (): Promise<WalletConnection> => {
  // For now, throw an informative error
  throw new Error(
    'WalletConnect is not yet implemented. Please use MetaMask for now, or contact support to request WalletConnect integration.'
  );
};

/**
 * Listen for account changes
 */
export const onAccountsChanged = (callback: (accounts: string[]) => void): (() => void) => {
  if (!window.ethereum) return () => {};

  const handler = (accounts: string[]) => {
    callback(accounts);
  };

  window.ethereum.on('accountsChanged', handler);

  // Return cleanup function
  return () => {
    window.ethereum?.removeListener('accountsChanged', handler);
  };
};

/**
 * Listen for chain changes
 */
export const onChainChanged = (callback: (chainId: string) => void): (() => void) => {
  if (!window.ethereum) return () => {};

  const handler = (chainId: string) => {
    callback(chainId);
  };

  window.ethereum.on('chainChanged', handler);

  // Return cleanup function
  return () => {
    window.ethereum?.removeListener('chainChanged', handler);
  };
};

const SESSION_KEY = 'shadowsettle_wallet';

/**
 * Sign a verification message to prove wallet ownership (no on-chain tx).
 */
export const signVerificationMessage = async (
  provider: BrowserProvider,
  address: string
): Promise<void> => {
  const signer = await provider.getSigner();
  const message = `Sign this message to verify your wallet for ShadowSettle.\n\nThis request will not trigger a transaction.\n\nTimestamp: ${Date.now()}`;
  try {
    await signer.signMessage(message);
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err?.code === 4001 || (err as Error)?.message?.toLowerCase().includes('reject')) {
      throw new Error('Signature rejected. Please sign the message to verify your wallet.');
    }
    throw error;
  }
};

/**
 * Save wallet session to sessionStorage (persists until tab is closed).
 */
export const saveWalletSession = (address: string): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address }));
  } catch (e) {
    console.warn('Could not save wallet session', e);
  }
};

/**
 * Load wallet session from sessionStorage. Returns null if none or invalid.
 */
export const loadWalletSession = (): { address: string } | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { address?: string };
    if (typeof data?.address !== 'string') return null;
    return { address: data.address };
  } catch {
    return null;
  }
};

/**
 * Clear wallet session from sessionStorage.
 */
export const clearWalletSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Could not clear wallet session', e);
  }
};

/**
 * Disconnect wallet (clears session storage and local state; no programmatic wallet disconnect).
 */
export const disconnectWallet = (): void => {
  clearWalletSession();
  console.log('Wallet disconnected from app');
};

/**
 * Get current connected account
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Format address for display (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
