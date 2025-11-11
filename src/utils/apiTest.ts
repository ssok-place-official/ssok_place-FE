// src/utils/apiTest.ts
import { apiService } from '../services/api';

export interface ApiTestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

export class ApiTester {
  // 모든 API 엔드포인트 테스트
  static async testAllEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];
    
    // 헬스체크 테스트
    const healthCheckResult = await this.testHealthCheck();
    results.push(healthCheckResult);
    
    // 사용자 장소 목록 테스트
    const userPlacesResult = await this.testUserPlaces();
    results.push(userPlacesResult);
    
    return results;
  }

  // 헬스체크 테스트
  static async testHealthCheck(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const isHealthy = await apiService.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: 'Health Check',
        success: isHealthy,
        responseTime,
        error: isHealthy ? undefined : 'Server is not healthy',
      };
    } catch (error) {
      return {
        endpoint: 'Health Check',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 사용자 장소 목록 테스트
  static async testUserPlaces(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await apiService.getUserPlaces();
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: 'GET /places/user',
        success: response.code === 200,
        responseTime,
        error: response.code !== 200 ? response.message : undefined,
      };
    } catch (error) {
      return {
        endpoint: 'GET /places/user',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 근처 장소 조회 테스트
  static async testNearbyPlaces(lat: number = 37.5665, lng: number = 126.9780): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await apiService.getNearbyPlaces({ lat, lng, size: 10 });
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: 'GET /places/nearby',
        success: response.code === 200,
        responseTime,
        error: response.code !== 200 ? response.message : undefined,
      };
    } catch (error) {
      return {
        endpoint: 'GET /places/nearby',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 환경 정보 출력
  static logEnvironmentInfo(): void {
    const envInfo = apiService.getEnvironmentInfo();
    console.log('=== API Environment Info ===');
    console.log('Base URL:', envInfo.baseUrl);
    console.log('Is Development:', envInfo.isDevelopment);
    console.log('Is Production:', envInfo.isProduction);
    console.log('============================');
  }
}
