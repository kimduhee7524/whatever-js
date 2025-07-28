---
title: "왜 CRA 대신 Vite를 쓰는가?"
datePublished: Mon Jul 28 2025 10:50:27 GMT+0000 (Coordinated Universal Time)
cuid: cmdmzlj8z000002l4922vhesd
slug: cra-vite

---

React 프로젝트를 시작할 때, 예전에는 대부분 `create-react-app(CRA)`을 썼습니다.  
하지만 요즘은 **거의 모든 새로운 React 프로젝트가 Vite를 선택**하죠.  
CRA도 잘 돌아가는데, 굳이 Vite를 써야 하는 이유가 뭘까요?

---

### **1️⃣** CRA의 문제점 : Webpack 기반

CRA는 내부적으로 Webpack을 사용해서 앱을 실행하고 번들링합니다.  
Webpack은 오랜 기간 **CommonJS(CJS)** 생태계에 최적화되어 있었어요.

하지만 여기엔 한 가지 큰 문제가 있습니다:

> ❌ **브라우저는 CommonJS 문법(require, module.exports)을 이해하지 못해요.**

그래서 Webpack은 다음과 같은 작업을 합니다:

* 모든 `require()`를 찾아서 **의존성 트리**를 만들고
    
* 그걸 하나의 **거대한 JS 파일(bundle)** 로 묶습니다
    
* 이 번들 파일만 브라우저에 전달하죠
    

Webpack은 **개발 도구 + 번들러 + 빌드툴** 역할을 다 합니다

### 😓 그런데 이 방식의 단점은?

* **코드 한 줄만 바꿔도** 전체 번들을 다시 만들어야 해요
    
* 앱 규모가 커질수록 번들링 시간이 느려지고
    
* **핫 리로딩(HMR)** 속도도 떨어집니다
    

### 2️⃣ Vite는 어떻게 다를까? (ESM 기반)

1. ESM의 특징
    

```javascript
// ESM
import { add } from './math.js';
```

* **정적 분석 가능** → 코드 실행 전에 어떤 의존성이 필요한지 컴파일러가 알 수 있음
    
* **브라우저가 직접 모듈을 로딩할 수 있음**
    
* Vite는 이걸 활용해서 **필요한 모듈만 빠르게 서빙**
    

즉, **ESM은 처음부터 번들링 없이도 동작할 수 있도록 설계**된 시스템이에요.

Vite는 이러한 **ESM의 특성**을 최대한 활용해 만든 **모던 프론트엔드 개발 툴**입니다.

2. Vite: "개발 서버"와 "빌드"를 분리
    

#### 🛠 개발 환경 (`vite dev`)

* ESM을 활용해서 **번들 없이** 작동
    
* 파일이 변경되면 해당 파일만 다시 불러옴 → 빠름
    
* **개발 중에는 "번들링"을 하지 않음**
    

#### 🏗 프로덕션 빌드 (`vite build`)

* 내부적으로 **Rollup**을 사용해서 정식 번들 생성
    
* 이때는 Webpack처럼 **최적화, 코드 압축, 트리 셰이킹 등 다 수행**
    

> 즉, Vite는 **개발 서버 역할은 Vite 자체가**,  
> **빌드/번들링은 Rollup에게 위임**해서 처리하는 구조예요

3. Vite의 주요 특징
    

* 🔥 **필요한 파일만 즉시 로딩** (lazy import)
    
* ⚡ **개발 서버 구동이 매우 빠름** (`vite dev` → 거의 즉시 실행)
    
* 🔄 **빠른 HMR (Hot Module Replacement)** → 저장하자마자 브라우저 반영
    
* ⚙️ 설정은 Rollup 기반 → 커스터마이징 쉬움
    
* 📦 ESM 기반 라이브러리와 완벽 호환
    

👀 어떻게 가능할까?

브라우저가 `import`를 직접 이해할 수 있기 때문에,  
Vite는 코드를 전체 번들로 묶지 않고도 **모듈 단위로 실시간 서빙**할 수 있어요.

> 즉, Vite는 “개발할 때는 번들링 없이도 충분히 빠르고 자연스럽게 동작”하도록 만든 도구입니다.

---

### 4️⃣ CJS(CommonJS) vs ESM(ESModules)

| 항목 | CommonJS (CJS) | ES Modules (ESM) |
| --- | --- | --- |
| 사용법 | `require()` / `module.exports` | `import` / `export` |
| 런타임 | Node.js (전통적) | 브라우저 / 최신 Node |
| 동기/비동기 | 동기 (느림) | 비동기 (빠름) |
| 트리 셰이킹 | ❌ 잘 안 됨 | ✅ 잘 됨 (불필요한 코드 제거 가능) |
| CRA | CJS 기반 | ❌ ESM 완전 지원 안 됨 |
| Vite | ESM 기반 | ✅ 네이티브 지원 |

---

### 5️⃣ 그래서 무슨 상관이냐면...

* **CRA는 CJS 기반이라 최신 ESM 패키지와 호환이 어려워요**
    
* 요즘 npm 생태계는 ESM-only 패키지가 늘어남 (`react-router-dom@6`, `uuid`, `lodash-es`, 등)
    

예: CRA에서 생기는 문제

```javascript
Error [ERR_REQUIRE_ESM]: Must use import to load ES Module
```

> CRA에서는 ESM-only 패키지를 쓰려면 복잡한 설정 변경이 필요함 → 불편

---

Webpack은 브라우저가 CommonJS(CJS) 문법(require/module.exports)을 직접 이해하지 못하기 때문에, 개발 단계에서도 모든 모듈을 분석해 하나의 번들로 묶는 빌드 과정을 수행합니다.

반면, Vite는 ES Modules(ESM) 기반으로 작동하고, 브라우저가 ESM의 import/export 문법을 네이티브로 이해할 수 있기 때문에, 개발 환경에서는 번들 없이도 파일 단위로 모듈을 즉시 실행할 수 있습니다.

### 💡 정리

> "CRA는 오래된 Webpack + CommonJS 기반,  
> Vite는 빠른 개발 환경과 ESM을 기본으로 한 현대적인 도구입니다.  
> 그래서 요즘은 다들 Vite 씁니다."