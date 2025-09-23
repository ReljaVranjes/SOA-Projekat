import axios from 'axios';
import api from '../api';

export enum TourLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

export enum TourStatus {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived'
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  level: TourLevel;
  tags: string[];
  status: TourStatus;
  price: number;
  duration: number;
  maxPeople: number;
  distance: number;
  travelTimeOnFoot: number;
  travelTimeBike: number;
  travelTimeCar: number;
  guideID: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface KeyPoint {
  id: string;
  tourID: string;
  name: string;
  description: string;
  longitude: number;
  latitude: number;
  imageURL?: string;
}

export interface Review {
  id: string;
  tourID: string;
  touristID: string;
  rate: number;
  comment: string;
  tourDate: string;
  images: string[];
  createdAt: string;
}

const prefix = '/api/tours-service';

export const toursService = {
  // Tours
  getAllTours: async (): Promise<Tour[]> => {
    const response = await api.get(`${prefix}/tours`);
    console.log('DEBUG: API response:', response.data);
    return response.data.tours || response.data;
  },

  getToursByGuide: async (guideId: string): Promise<Tour[]> => {
    const response = await api.get(`${prefix}/tours/guide/${guideId}`);
    return response.data;
  },

  getTourById: async (tourId: string): Promise<Tour> => {
    const response = await api.get(`${prefix}/tour/${tourId}`);
    return response.data;
  },

  createTour: async (tourData: Partial<Tour>): Promise<Tour> => {
    const response = await api.post(`${prefix}/tours`, tourData);
    return response.data;
  },

  createTourWithKeyPoints: async (formData: FormData): Promise<Tour> => {
    const response = await api.post(`${prefix}/tours`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateTour: async (tourId: string, tourData: Partial<Tour>): Promise<Tour> => {
    const response = await api.put(`${prefix}/tours/${tourId}`, tourData);
    return response.data;
  },

  checkPublishRequirements: async (tourId: string): Promise<{ canPublish: boolean; missingRequirements: string[] }> => {
    const response = await api.get(`${prefix}/tours/${tourId}/publish-requirements`);
    return response.data;
  },

  publishTour: async (tourId: string): Promise<void> => {
    await api.put(`${prefix}/tours/${tourId}/publish`);
  },

  archiveTour: async (tourId: string): Promise<void> => {
    await api.put(`${prefix}/tours/${tourId}/archive`);
  },

  // Key Points
  getKeyPointsByTour: async (tourId: string): Promise<KeyPoint[]> => {
    const response = await api.get(`${prefix}/tours/${tourId}/keypoints`);
    return response.data;
  },

  createKeyPoint: async (tourId: string, keyPointData: FormData): Promise<KeyPoint> => {
    const response = await api.post(`${prefix}/tours/${tourId}/keypoints`, keyPointData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateKeyPoint: async (keyPointId: string, keyPointData: FormData, tourId: string): Promise<KeyPoint> => {
    const response = await api.put(`${prefix}/tours/${tourId}/keypoints/${keyPointId}`, keyPointData)
    return response.data;
  },

  deleteKeyPoint: async (keyPointId: string, tourId: string): Promise<void> => {
    await api.delete(`${prefix}/tours/${tourId}/keypoints/${keyPointId}`);
  },

  // Reviews
  getReviewsByTour: async (tourId: string): Promise<Review[]> => {
    const response = await api.get(`${prefix}/tours/${tourId}/reviews`);
    return response.data;
  },

  getReviewsByTourist: async (): Promise<Review[]> => {
    const response = await api.get(`${prefix}/reviews/my`);
    return response.data;
  },

  createReview: async (tourId: string, reviewData: FormData): Promise<Review> => {
    const response = await api.post(`${prefix}/tours/${tourId}/reviews`, reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateReview: async (reviewId: string, reviewData: FormData): Promise<Review> => {
    const response = await api.put(`${prefix}/reviews/${reviewId}`, reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`${prefix}/reviews/${reviewId}`);
  },
};