import api from '../api';
import { Location } from '../types/user';

// Interface for the tour execution response
export interface TourExecutionResponse {
  id: string;
  tourId: string;
  touristId: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  keyPoints: Array<{
    keyPointId: string;
    completedAt: string;
    name?: string;
  }>;
}

export const tourExecutionService = {
  // Start a new tour execution
  createTourExecution: async (tourId: string, location: Location): Promise<TourExecutionResponse> => {
    const response = await api.post(`/api/tours-service/tours/${tourId}/execute`, { location });
    return response.data as TourExecutionResponse;
  },

  // Get tour execution details by executionId
  getTourExecutionById: async (executionId: string): Promise<TourExecutionResponse> => {
    const response = await api.get(`/api/tours-service/tour-executions/${executionId}`);
    return response.data as TourExecutionResponse;
  },

  // Update tour execution status (complete/abandon)
  updateTourExecutionStatus: async (executionId: string, status: string) => {
    const response = await api.put(`/api/tours-service/tour-executions/${executionId}/status`, { status });
    return response.data;
  },

  // Add completed key point to tour execution
  addCompletedKeyPoint: async (executionId: string, keyPointId: string) => {
    const response = await api.post(`/api/tours-service/tour-executions/${executionId}/keypoint`, { keyPointId });
    return response.data;
  }
};