// src/config/environment.ts

/**
 * 백엔드 서버 정보
 * 
 * 서버 도메인: https://ebiztable.shop
 * 퍼블릭 IP: 43.202.52.161
 * 서버 위치: AWS EC2 (Ubuntu 22.04 LTS)
 * 애플리케이션 런타임: Spring Boot (JDK 21, Spring Boot 3.x)
 * 서버 실행 포트: 8080 (내부) → Nginx → 443(HTTPS, 외부)
 * 웹서버: Nginx (Reverse Proxy, SSL + HTTP→HTTPS)
 * SSL 인증서: Let's Encrypt (자동 갱신)
 * 
 * CORS 설정:
 * - 허용 Origin: https://ebiztable.shop (Production)
 * - 허용 메서드: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - 인증 헤더: Authorization: Bearer <JWT>
 * - 응답 헤더: Content-Type, Authorization, X-Requested-With
 */

export interface EnvironmentConfig {
  // API Base URL
  apiBaseUrl: string;
  // Production 도메인
  productionDomain: string;
  // Development IP (로컬 테스트용)
  developmentIp: string;
  // Development 포트
  developmentPort: number;
  // 서버 내부 포트
  serverPort: number;
  // 서버 위치
  serverLocation: string;
  // 환경 플래그
  isDevelopment: boolean;
  isProduction: boolean;
}

// 환경별 설정
const environments = {
  development: {
    // Production HTTPS 사용 (SSL 적용됨, 권장)
    apiBaseUrl: 'https://ebiztable.shop/api',
    // 로컬 테스트용 설정 (필요시 주석 해제)
    // apiBaseUrl: 'http://43.202.52.161:8080/api',
    
    productionDomain: 'https://ebiztable.shop',
    developmentIp: '43.202.52.161',
    developmentPort: 8080,
    serverPort: 8080,
    serverLocation: 'AWS EC2 (Ubuntu 22.04 LTS)',
    isDevelopment: true,
    isProduction: false,
  },
  production: {
    apiBaseUrl: 'https://ebiztable.shop/api',
    productionDomain: 'https://ebiztable.shop',
    developmentIp: '43.202.52.161',
    developmentPort: 8080,
    serverPort: 8080,
    serverLocation: 'AWS EC2 (Ubuntu 22.04 LTS)',
    isDevelopment: false,
    isProduction: true,
  },
};

// 현재 환경 선택 (React Native의 __DEV__ 플래그 사용)
const currentEnvironment = __DEV__ ? 'development' : 'production';

export const config: EnvironmentConfig = environments[currentEnvironment];

// 헬스체크 URL
export const HEALTH_CHECK_URL = 'https://ebiztable.shop/actuator/health';

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // 인증 관련 엔드포인트
  LOGIN: '/users/login',
  PLACES: '/places',
  PLACES_NEARBY: '/places/nearby',
  PLACES_USER: '/places/user', // 사용자 장소 목록 (추정)
  PLACES_DETAIL: (placeId: string) => `/places/${placeId}`,
  // 친구 관련 엔드포인트
  FRIENDS: '/friends',
  FRIENDS_ADD: '/friends/add',
  FRIENDS_REQUESTS: '/friends/requests',
  FRIENDS_RESPOND: (friendUserId: number, accept: boolean) => `/friends/respond?friendUserId=${friendUserId}&accept=${accept}`,
  // 프로필 관련 엔드포인트
  PROFILE_ACTIVITY: '/profile/me/activity',
} as const;

/**
 * 서버 정보 출력 (디버깅용)
 */
export const logServerInfo = () => {
  if (__DEV__) {
    console.log('═══════════════════════════════════════');
    console.log('📡 서버 환경 설정');
    console.log('═══════════════════════════════════════');
    console.log('🌍 환경:', currentEnvironment);
    console.log('🔗 API Base URL:', config.apiBaseUrl);
    console.log('🏢 프로덕션 도메인:', config.productionDomain);
    console.log('🔌 개발 IP:', config.developmentIp);
    console.log('🔌 개발 포트:', config.developmentPort);
    console.log('📍 서버 위치:', config.serverLocation);
    console.log('✅ Production:', config.isProduction);
    console.log('🛠️  Development:', config.isDevelopment);
    console.log('💚 헬스체크:', HEALTH_CHECK_URL);
    console.log('═══════════════════════════════════════');
  }
};
