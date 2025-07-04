---
title: "패키지 매니저"
datePublished: Tue Jul 01 2025 13:05:01 GMT+0000 (Coordinated Universal Time)
cuid: cmckjil0i000a02l2cg0o525v
slug: 7yyo7ykk7keaiounpoulioygga

---

> "npm vs yarn vs pnpm vs yarn PnP… 도대체 뭐가 다른 거지?"

이 글에서는 **패키지 매니저의 흐름과 변화**를 따라가며,  
npm → Yarn Classic → pnpm → Yarn Berry (PnP, Zero-install)까지  
각 방식이 어떤 원리로 동작하고, 어떤 장단점이 있는지 정리하였습니다.

### **1\. 왜 패키지 매니저가 필요할까?**

우리는 프로젝트를 만들 때 보통 모든 코드를 직접 다 구현하지 않습니다.  
예를 들어 웹앱을 만들 때:

* UI는 이미 잘 만든 라이브러리(`React`)가 있고,
    
* 날짜 포맷도 남이 잘 만든 함수(`date-fns`, `moment`)가 있고,
    
* HTTP 요청도 직접 안 짜고(`axios`, `fetch`) 사용합니다.
    

즉, 우리는 **남이 만든 코드(=패키지)**를 가져다 쓰는 게 일반적이죠. 그런데 이런 패키지를 그냥 복사 붙여넣기 하면 문제가 생깁니다:

* 업데이트나 보안 패치 추적이 힘들고
    
* 의존성도 같이 관리해야 하고
    
* 설치 위치, 버전 충돌 등을 직접 신경 써야 합니다.
    

👉 그래서 이런 과정을 자동화해주는 **도구가 바로 패키지 매니저**입니다

### 📦 **2\. 패키지 매니저란?**

> 외부 패키지의 설치, 제거, 업데이트, 의존성 관리 등을 자동화해주는 도구

```javascript
import React from 'react';
```

이 한 줄이 가능한 이유는 **패키지 매니저** 덕분입니다.  
개발자는 `import 'react'`만 쓰고, **어디서 어떤 버전의 리액트를 가져올지, 어떻게 연결할지**는 전부 패키지 매니저가 처리하죠.

대표적인 JS 생태계 패키지 매니저:

* `npm`: Node.js 기본 탑재
    
* `Yarn`: 속도, 안정성을 개선한 대안
    
* `pnpm`: 디스크 효율성과 속도 최적화
    
* `Yarn Berry`: 최신 기능(PnP, Zero-install) 도입
    

---

### **3\.** 패키지 매니저가 하는 일

* 예를 들어, `npm install react`를 실행하면:
    

* 패키지 매니저는 자동으로 `package.json`에 최신버전을 추가하고
    

```javascript
"dependencies": {
  "react": "^18.3.1"
}
```

* `package-lock.json`(또는 `yarn.lock`)에 실제 설치된 정확한 버전이 고정됩니다.
    
* 고른 버전의 패키지를 **npm 서버**(패키지 레지스트리)에서 가져옵니다.
    
* 패키지가 또 다른 패키지를 의존할 수 있기 때문에, 전체 트리를 계산해 설치 순서를 결정합니다
    
* 각 패키지를 `node_modules`에 배치하거나, 캐시에 저장하거나, 가상 경로로 연결합니다. (**패키지 매니저마다 방식이 다름**)
    

### 4\. 각 패키지 매니저의 작동 방식 비교

🧰 **4-1. npm: 전통적인 설치 방식**

* 모든 라이브러리를 `node_modules/` 폴더에 복사해서 저장
    
* 프로젝트마다 모든 의존성이 실제 파일로 들어간다 → 동일한 패키지를 쓰더라도, 프로젝트마다 별도로 저장
    

#### ✅장점: 대부분의 툴과 호환성이 높음  
⚠️ 단점:

* 중복 설치: 같은 패키지가 여러 버전으로 여러 위치에 존재
    
* 의존성 간 충돌 가능성 높음
    
* `node_modules`가 너무 크고 느림
    

---

🧰 **4-2. Yarn: npm 개선 버전**

* `npm`보다 빠른 설치 속도
    
* 자동화된 `yarn.lock`제공 (초기 npm은 직접 입력해야함)
    
* 내부 구조는 `npm`과 거의 동일 (`node_modules` 기반)
    

#### ✅ 장점: npm보다 빠름

#### ⚠️ 단점: 구조상 한계는 npm과 동일

---

🧰 **4-3. pnpm: 하드링크 기반 최적화**

* 모든 패키지를 전역 저장소 (`~/.pnpm-store`)에 **한 번만** 설치하고,
    
* 각 프로젝트는 `node_modules`에 그걸 가리키는 링크를 만들어 연결
    
* 여전히 `node_modules/`를 사용하지만 내부 구조는 더 효율적임
    

#### ✅ 장점:

* 중복 설치 없음 → 디스크 공간 절약
    
* 설치 속도 빠름 (캐시 재사용)
    
* 같은 버전은 모든 프로젝트에서 공유
    

#### ⚠️ 단점: 일부 도구에서 경로 문제

---

🧰 **4-4. Yarn berry**

📌 PnP (Plug'n'Play)

* `node_modules/` 디렉토리를 **아예 만들지 않음**
    
* 대신 `.yarn/cache/`에 압축(zip)된 형태로 패키지를 저장하고, `.pnp.cjs`라는 **경로 매핑 파일**을 사용해서 모듈을 연결
    

```javascript
// React를 import 하면, 이 경로를 참조하세요!
"react": {
  "npm:18.2.0": "./.yarn/cache/react-npm-18.2.0-abc.zip"
}
```

* Node.js가 실행될 때, 이 맵을 참조해서 zip 안에서 모듈을 직접 불러옵니다.
    
* 파일을 직접 압축 해제하지 않고도 내부에서 바로 모듈을 불러옴
    

#### ✅ 장점:

* 디스크 사용량 매우 작음
    
* 의존성 중복 완전 제거
    
* 설치 속도 빠름
    
* 어떤 패키지가 어떤 경로에서 불렸는지 정확하게 추적 가능
    

#### ⚠️ 단점:

* 가장 빠르고 효율적이지만, 호환성은 낮음
    
* 러닝커브 있음
    

#### 📌 Zero-install

* `.yarn/cache/`, `.pnp.cjs` 등을 Git에 커밋
    

* **모든 의존성 파일을 Git에 포함**해서
    
* 누군가 레포를 클론하면 `yarn install` 없이 바로 실행 가능
    

✅ 장점

* 빠른 브랜치 전환
    
* CI/CD 속도 향상
    

❌ 단점

* Git 사이즈 증가
    
* 병합 충돌 리스크
    

비유로 설명하면:

* `npm`\+ `node_modules`: “책을 종이로 프린트해서 모든 책꽂이 마다 꽂아두는 것”
    
* `pnpm`\+ `node_modules`: “책을 한 권만 보관하고, **각 코너에는 책갈피(링크)만 줌**”
    
* `.yarn/cache/` + `.pnp.cjs`: 책은 다 PDF로 저장해놓고, 책꽂이는 없음. 대신 ‘어떤 책이 어디 있는지’ 전부 적힌 목차 파일이 있어요. 이 파일만 보면 바로 찾을 수 있음”
    
* `Zero-install`: "PDF와 목차 파일까지 전부 USB에 담아 공유함. 받자마자 바로 열람 가능"
    

---

### **5\. 설치 속도 비교 요약**

| 속도 순위 | 패키지 매니저 | 이유 |
| --- | --- | --- |
| 🥇 1등 | **Yarn PnP** | `node_modules` 없음, 가상 파일 시스템 |
| 🥈 2등 | **pnpm** | 하드링크 기반, 캐시 재사용 |
| 🥉 3등 | **Yarn (Classic)** or **npm** | 기존 방식, 중복 설치 있음 |

**Zero-install은 설치 속도 개념이 의미 없어질 정도로 빠릅니다.** 레포 클론만 해도 바로 실행 가능한 상태이기 때문입니다.

---

### 결론: 어떤 걸 써야 할까?

| 상황 | 추천 |
| --- | --- |
| **호환성 최우선**, 무난한 선택 | `npm` 또는 `Yarn Classic` |
| **빠른 설치 + 디스크 절약** | `pnpm` |
| **최고의 속도 + 완전한 추적성** | `Yarn Berry (PnP)` |
| **CI/CD 최적화, 큰 팀** | `Yarn Berry + Zero-install` |