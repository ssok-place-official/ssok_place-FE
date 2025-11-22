// src/services/api.ts
import { config, API_ENDPOINTS } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 토큰 관리 키
const TOKEN_KEY = 'auth_token';

export interface Place {
  id?: string;
  placeId?: number;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  memo?: string;
  tags?: string[];
  emoji?: string;
  isClosed?: boolean;
  distanceM?: number;
  createdAt?: string;
}

export interface PlaceDetail extends Place {
  naverPlaceId?: string;
  placeUrl?: string;
  insight?: {
    emoji: string;
    keywords: Array<{
      term: string;
      weight: number;
    }>;
  };
}

export interface NearbyPlacesResponse {
  content: Place[];
  page: number;
  size: number;
  totalElements: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

// 친구 관련 타입 정의
export interface Friend {
  userId: number;
  nickname: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

export interface FriendsResponse {
  content: Friend[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface FriendRequest {
  userId: number;
  nickname: string;
  status: 'PENDING';
}

// 활동 관련 타입 정의
export interface ActivityPlace {
  placeId: number;
  name: string;
  emoji: string;
  isClosed: boolean;
  lat: number;
  lng: number;
  distanceM: number;
}

export interface ActivityResponse {
  frequent: ActivityPlace[];
  dormant: ActivityPlace[];
}

// 로그인 관련 타입 정의
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    nickname: string;
  };
}

// 사용자 정보 관련 타입 정의
export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
}

// 환경 설정에서 API Base URL 가져오기
const BASE_URL = config.apiBaseUrl;

class ApiService {
  // 토큰 가져오기
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // 토큰 저장하기
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to set token:', error);
    }
  }

  // 토큰 삭제하기
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // 토큰 가져오기 (동기식 - 간단한 사용용)
  async getStoredToken(): Promise<string | null> {
    return this.getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // 토큰 가져오기
      const token = await this.getToken();
      
      // 헤더 설정
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // 응답 본문을 텍스트로 먼저 가져오기
      const text = await response.text();
      
      // 빈 응답 처리
      if (!text || text.trim().length === 0) {
        return {
          code: response.status,
          message: response.statusText || 'Empty response',
          data: null,
        };
      }

      // JSON 파싱 시도
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // JSON 파싱 실패 시 에러 응답 반환
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', text);
        return {
          code: response.status || 500,
          message: 'Invalid JSON response',
          data: null,
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      // 네트워크 오류나 기타 오류 처리
      return {
        code: 500,
        message: error instanceof Error ? error.message : 'Network error',
        data: null,
      };
    }
  }

  // GET /places/nearby - 지도 중심 근처 저장/후보 조회
  async getNearbyPlaces(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<NearbyPlacesResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.lat) queryParams.append('lat', params.lat.toString());
    if (params?.lng) queryParams.append('lng', params.lng.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const queryString = queryParams.toString();
    const endpoint = `${API_ENDPOINTS.PLACES_NEARBY}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<NearbyPlacesResponse>(endpoint);
  }

  // GET /places/{placeId} - 내 저장 장소 상세
  async getPlaceDetail(placeId: string): Promise<ApiResponse<PlaceDetail>> {
    return this.request<PlaceDetail>(API_ENDPOINTS.PLACES_DETAIL(placeId));
  }

  // POST /places - 새 장소 저장
  async createPlace(placeData: {
    name: string;
    address?: string;
    naverPlaceId?: string;
    placeUrl?: string;
    lat: number;
    lng: number;
    memo?: string;
    tags?: string[];
  }): Promise<ApiResponse<Place>> {
    return this.request<Place>(API_ENDPOINTS.PLACES, {
      method: 'POST',
      body: JSON.stringify(placeData),
    });
  }

  // PATCH /places/{placeId} - 메모/태그/상태 수정
  async updatePlace(
    placeId: string,
    updateData: {
      memo?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<Place>> {
    return this.request<Place>(API_ENDPOINTS.PLACES_DETAIL(placeId), {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // GET /places - 사용자의 모든 저장된 장소 목록 조회
  async getUserPlaces(): Promise<ApiResponse<Place[]>> {
    return this.request<Place[]>(API_ENDPOINTS.PLACES);
  }

  // GET /places/all - 사용자 저장 장소 전체 목록 조회
  async getUserPlacesAll(): Promise<ApiResponse<Place[]>> {
    return this.request<Place[]>(API_ENDPOINTS.PLACES_ALL);
  }

  // 서버 헬스체크
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      const response = await fetch('https://ebiztable.shop/actuator/health', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // 친구 관련 API 함수들
  
  // GET /friends - 친구 목록 조회
  async getFriends(params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<FriendsResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const queryString = queryParams.toString();
    const endpoint = `${API_ENDPOINTS.FRIENDS}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FriendsResponse>(endpoint);
  }

  // POST /friends/add - 친구 추가
  async addFriend(friendUserId: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(API_ENDPOINTS.FRIENDS_ADD, {
      method: 'POST',
      body: JSON.stringify({ friendUserId }),
    });
  }

  // GET /friends/requests - 받은 친구 요청 목록 조회
  async getFriendRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return this.request<FriendRequest[]>(API_ENDPOINTS.FRIENDS_REQUESTS);
  }

  // POST /friends/respond - 친구 요청 수락/거절
  async respondToFriendRequest(
    friendUserId: number,
    accept: boolean
  ): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(
      API_ENDPOINTS.FRIENDS_RESPOND(friendUserId, accept),
      {
        method: 'POST',
      }
    );
  }

  // GET /profile/me/activity - 내 활동(자주 방문한 장소/뜸한 장소)
  async getMyActivity(lookbackDays: number = 90): Promise<ApiResponse<ActivityResponse>> {
    const endpoint = `${API_ENDPOINTS.PROFILE_ACTIVITY}?lookbackDays=${lookbackDays}`;
    return this.request<ActivityResponse>(endpoint);
  }

  // POST /users/login - 로그인
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // 로그인 성공 시 토큰 저장
    if (response.code === 200 && response.data) {
      await this.setToken(response.data.accessToken);
    }

    return response;
  }

  // GET /users/me - 내 정보 조회
  async getMyInfo(): Promise<ApiResponse<UserInfo>> {
    return this.request<UserInfo>(API_ENDPOINTS.USERS_ME);
  }

  // 현재 환경 정보 반환
  getEnvironmentInfo() {
    return {
      baseUrl: BASE_URL,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction,
    };
  }
}

export const apiService = new ApiService();
