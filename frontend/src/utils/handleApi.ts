import { useState } from 'react';

export interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface ApiState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const useApiHandler = () => {
  const [state, setState] = useState<ApiState>({
    loading: false,
    error: null,
    success: null,
  });

  const handleApi = async <T>(
    apiCall: () => Promise<T>,
    options: ApiOptions = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, successMessage, errorMessage } = options;

    setState({ loading: true, error: null, success: null });

    try {
      const result = await apiCall();
      
      setState({ 
        loading: false, 
        error: null, 
        success: successMessage || null 
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error: any) {
      const errorMsg = errorMessage || error.response?.data?.error || error.message || 'An error occurred';
      
      setState({ 
        loading: false, 
        error: errorMsg, 
        success: null 
      });

      if (onError) {
        onError(error);
      }

      return null;
    }
  };

  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, success: null }));
  };

  return {
    ...state,
    handleApi,
    clearMessages,
  };
};