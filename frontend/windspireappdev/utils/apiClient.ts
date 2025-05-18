import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Client for the new backend
 * This file serves as a template for connecting to the new backend API.
 */

// Default configuration for axios
let API_BASE_URL = '';

// Create axios instance with default config
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // Add default Authorization header for all API requests
    // Kullanılan API'nin kabul ettiği bir sabit API anahtarı kullanıyoruz
    // Gerçek uygulamada bu değer .env'den veya güvenli bir depodan alınmalıdır
    config.headers = config.headers || {};
    config.headers['Authorization'] = 'Bearer windspire-default-token';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`DEBUG: ApiClient - Successful response from ${response.config.url}`);
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`DEBUG: ApiClient - Error response for ${error.config?.url}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Special handling for specific error types
      if (error.response.status === 404) {
        console.log(`DEBUG: ApiClient - Resource not found: ${error.config?.url}`);
      } else if (error.response.status === 401) {
        console.log(`DEBUG: ApiClient - Authentication error: ${error.config?.url}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log(`DEBUG: ApiClient - No response received for request to ${error.config?.url}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(`DEBUG: ApiClient - Request setup error: ${error.message}`);
    }
    
    // For network errors, provide a clearer message
    if (error.message && error.message.includes('Network Error')) {
      console.log(`DEBUG: ApiClient - Network error - check if backend server is running and accessible`);
    }
    
    return Promise.reject(error);
  }
);

// API Client interface
export const ApiClient = {
  /**
   * Initialize the API client with base URL and optional config
   */
  initialize: (baseUrl: string, config?: AxiosRequestConfig): void => {
    API_BASE_URL = baseUrl;
    apiClient.defaults.baseURL = baseUrl;
    
    if (config) {
      Object.assign(apiClient.defaults, config);
    }
    
    console.log('API Client initialized with base URL:', baseUrl);
  },
  
  /**
   * GET request
   */
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`DEBUG: ApiClient - Making GET request to: ${url}`);
    try {
      // Make the request with a timeout
      const response = await apiClient.get<T>(url, {
        ...config,
        timeout: 10000
      });
      
      console.log(`DEBUG: ApiClient - Successful response from ${url}`);
      
      if (url.includes('/categories') || url.includes('content-type')) {
        // Log more details for category-related requests
        console.log(`DEBUG: ApiClient - Category data structure:`, response.data);
        
        // Type check for category data structure
        const data = response.data as any;
        if (data && data.data && data.data.categories) {
          console.log(`DEBUG: ApiClient - Number of categories: ${data.data.categories.length}`);
          console.log(`DEBUG: ApiClient - Sample category:`, data.data.categories[0]);
        }
      }
      
      return response.data;
    } catch (error: any) {
      // Handle errors when resources aren't found but we don't want to crash
      if (error.response && error.response.status === 404) {
        console.log(`DEBUG: ApiClient - Resource not found: ${url}`);
        throw error;
      }
      
      // Log and rethrow other errors
      console.error(`DEBUG: ApiClient - GET request failed: ${url}`, error);
      throw error;
    }
  },
  
  /**
   * POST request
   */
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST request failed: ${url}`, error);
      throw error;
    }
  },
  
  /**
   * PUT request
   */
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed: ${url}`, error);
      throw error;
    }
  },
  
  /**
   * DELETE request
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed: ${url}`, error);
      throw error;
    }
  }
};

// Export the base axios instance as well in case it's needed
export { apiClient }; 