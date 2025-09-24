import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import FBRErrorModal from '../common/FBRErrorModal';

interface FBRError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  url?: string;
  method?: string;
}

interface FBRErrorContextType {
  showError: (error: FBRError) => void;
  hideError: () => void;
}

const FBRErrorContext = createContext<FBRErrorContextType | undefined>(undefined);

export const useFBRError = () => {
  const context = useContext(FBRErrorContext);
  if (context === undefined) {
    throw new Error('useFBRError must be used within a FBRErrorProvider');
  }
  return context;
};

interface FBRErrorProviderProps {
  children: ReactNode;
}

export const FBRErrorProvider: React.FC<FBRErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<FBRError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showError = (error: FBRError) => {
    setError(error);
    setIsModalOpen(true);
  };

  const hideError = () => {
    setIsModalOpen(false);
    // Clear error after modal close animation
    setTimeout(() => setError(null), 300);
  };

  useEffect(() => {
    // Listen for FBR API errors
    const handleFBRApiError = (event: CustomEvent) => {
      const errorDetails = event.detail as FBRError;
      showError(errorDetails);
    };

    // Add event listener
    window.addEventListener('fbrApiError', handleFBRApiError as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('fbrApiError', handleFBRApiError as EventListener);
    };
  }, []);

  const contextValue: FBRErrorContextType = {
    showError,
    hideError
  };

  return (
    <FBRErrorContext.Provider value={contextValue}>
      {children}
      <FBRErrorModal
        open={isModalOpen}
        onClose={hideError}
        error={error}
      />
    </FBRErrorContext.Provider>
  );
};

export default FBRErrorProvider;