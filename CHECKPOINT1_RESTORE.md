# Checkpoint 1 - 복원 가이드

이 파일은 MultiDex 수정 전 상태를 저장한 checkpoint입니다.

## 수정된 파일들

1. `android/app/build.gradle`
2. `android/app/src/main/java/com/ssok_new/MainApplication.kt`

## 복원 방법

### 방법 1: 백업 파일에서 복원
```bash
# build.gradle 복원
copy android\app\build.gradle.checkpoint1 android\app\build.gradle

# MainApplication.kt 복원
copy android\app\src\main\java\com\ssok_new\MainApplication.kt.checkpoint1 android\app\src\main\java\com\ssok_new\MainApplication.kt
```

### 방법 2: 수동 복원

#### android/app/build.gradle
- `defaultConfig`에서 `multiDexEnabled true` 제거
- `dependencies`에서 `implementation 'androidx.multidex:multidex:2.0.1'` 제거
- `packaging` 블록 전체 제거

#### android/app/src/main/java/com/ssok_new/MainApplication.kt
- `import androidx.multidex.MultiDexApplication` 제거
- `class MainApplication : MultiDexApplication()` → `class MainApplication : Application()`
- `import android.app.Application` 추가

## 원본 상태 요약

- MultiDex 비활성화
- MultiDex 의존성 없음
- packaging 옵션 없음
- MainApplication은 Application 상속

