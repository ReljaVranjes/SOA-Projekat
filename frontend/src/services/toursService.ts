import axios from 'axios';

export const toursApi = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

toursApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

toursApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Tour {
  id: string;
  name: string;
  description: string;
  level: string;
  tags: string[];
  status: string;
  price: number;
  duration: number;
  maxPeople: number;
  guideID: string;
  createdAt: string;
  updatedAt: string;
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
  _id: string;
  tourID: string;
  touristID: string;
  rate: number;
  comment: string;
  tourDate: string;
  images: string[];
  createdAt: string;
}

export const toursService = {
  // Tours
  getAllTours: async (): Promise<Tour[]> => {
    const response = await toursApi.get('/tours');
    return response.data;
  },

  getToursByGuide: async (guideId: string): Promise<Tour[]> => {
    const response = await toursApi.get(`/tours/guide/${guideId}`);
    return response.data;
  },

  getTourById: async (tourId: string): Promise<Tour> => {
    const response = await toursApi.get(`/tour/${tourId}`);
    return response.data;
  },

  createTour: async (tourData: Partial<Tour>): Promise<Tour> => {
    const response = await toursApi.post('/tours', tourData);
    return response.data;
  },

  publishTour: async (tourId: string): Promise<void> => {
    await toursApi.put(`/tours/${tourId}/publish`);
  },

  archiveTour: async (tourId: string): Promise<void> => {
    await toursApi.put(`/tours/${tourId}/archive`);
  },

  // Key Points
  getKeyPointsByTour: async (tourId: string): Promise<KeyPoint[]> => {
    const response = await toursApi.get(`/tours/${tourId}/keypoints`);
    return response.data;
  },

  createKeyPoint: async (tourId: string, keyPointData: FormData): Promise<KeyPoint> => {
    const response = await toursApi.post(`/tours/${tourId}/keypoints`, keyPointData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateKeyPoint: async (keyPointId: string, keyPointData: FormData, tourId: string): Promise<KeyPoint> => {
    console.log("UPDATE KP DATA", keyPointData)
    const response = await toursApi.put(`/tours/${tourId}/keypoints/${keyPointId}`, keyPointData)
    return response.data;
  },

  deleteKeyPoint: async (keyPointId: string,tourId: string): Promise<void> => {
    await toursApi.delete(`/tours/${tourId}/keypoints/${keyPointId}`);
  },

  // Reviews
  getReviewsByTour: async (tourId: string): Promise<Review[]> => {
    const response = await toursApi.get(`/tours/${tourId}/reviews`);
    return response.data;
  },

  getReviewsByTourist: async (): Promise<Review[]> => {
    const response = await toursApi.get('/reviews/my');
    return response.data;
  },

  createReview: async (tourId: string, reviewData: FormData): Promise<Review> => {
    const response = await toursApi.post(`/tours/${tourId}/reviews`, reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateReview: async (reviewId: string, reviewData: FormData): Promise<Review> => {
    const response = await toursApi.put(`/reviews/${reviewId}`, reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await toursApi.delete(`/reviews/${reviewId}`);
  },
};