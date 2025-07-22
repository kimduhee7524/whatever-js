---
title: "의존성 관리"
datePublished: Tue Jul 22 2025 16:00:06 GMT+0000 (Coordinated Universal Time)
cuid: cmdeq0mw4001n02k35gwz7kvs
slug: 7j2y7kg07isxioq0goumra

---

## 🔎왜 모듈 시스템이 필요했을까?

**ESM이 도입되기 전에는 브라우저 자체 “모듈 시스템”이 없었습니다.**

즉, 파일을 나누어도 모든 스크립트가 **하나의 전역 스코프**를 공유했기 때문에 다음과 같은 문제들이 발생했습니다:

* **전역 변수 충돌**의 위험
    
* **스크립트 로드 순서**에 따라 에러 발생 가능
    
* **의존성 관리**가 수작업
    

예를 들어 다음과 같은 코드가 있다고 해보겠습니다:

```haml
<!-- index.html -->
<script src="jquery.js"></script>
<script src="main.js"></script>
```

* `main.js`에서 `jquery.js`를 사용(의존)하고 있지만
    

```javascript
// main.js
$(document).ready(function () {
  console.log('Hello world');
});
```

* 여기서 `$` 어디서 온 건지 `main.js`만 보고는 알 수 없음
    
* 브라우저는 단지 `jquery.js`가 먼저 로드됐기 때문에 `$`가 전역에 있는 걸로 간주
    
* 협업자 입장에서는 **“얘가 무슨 모듈에 의존하는지” 알기 어려움**
    

그래서 복잡한 자바스크립트를 효율적으로 다루기 위해 **모듈화**에 대한 수요가 커지게 되었고, 개발자들은 다양한 **비공식 모듈 패턴**들을 만들어 사용하기 시작했습니다.

### ESM 이전의 자바스크립트 모듈 패턴

개발자들은 **다양한 우회 방법**을 써서 모듈 구조를 흉내 냈습니다.

1\. 전역 네임스페이스 패턴

여러 JS 파일이 하나의 전역 객체(MyApp, Utils, App 등)를 공유하도록 해서 전역 변수 충돌을 줄이는 방식입니다.

```javascript
// utils.js
var MyApp = MyApp || {};
MyApp.utils = {
  sum: function(a, b) {
    return a + b;
  }
};
```

```javascript
console.log(MyApp.utils.sum(1, 2)); // 3
```

2. IIFE (Immediately Invoked Function Expression)
    

함수를 정의하고 즉시 실행해서 내부 스코프를 외부로부터 은닉하고 변수 유출을 막는 방식입니다.

```javascript
// utils.js
(function () {
  function sum(a, b) {
    console.log(a + b);
  }

  sum(1, 2); // 3
})();
```

3\. Revealing Module 패턴 (IIFE + 반환)

IIFE 내부에 기능을 정의한 뒤, 필요한 기능만 객체 형태로 외부에 노출하는 방식입니다.

```javascript
// utils.js
var Utils = (function () {
  function sum(a, b) {
    return a + b;
  }

  function subtract(a, b) {
    return a - b;
  }

  // 공개할 함수만 명시적으로 선택해서 반환
  return {
    sum: sum
  };
})();
```

```javascript
// main.js
console.log(Utils.sum(3, 4)); // 7
// console.log(Utils.subtract(5, 2)); // ❌ 접근 불가
```

## 브라우저용 비공식 패턴(AMD, UMD) + Node.js의 공식 시스템(CommonJS)

| 방식 | 설명 | 환경 | 예시 |
| --- | --- | --- | --- |
| AMD | 비동기 로딩 모듈 방식 | 브라우저 | `define()`, 전역 네임스페이스 |
| CommonJS | Node.js 전용 동기 로딩 방식 | Node.js | `require`, `module.exports` |
| UMD | AMD + CJS + 글로벌 대응 | 브라우저 + Node | `define()`, 전역 네임스페이스 |

1\. CommonJS (CJS)

초기 Node.js의 공식/표준 모듈 시스템 (현재는 **ESM과 함께 병행 지원**)입니다.

```javascript
// main.js
const $ = require('jquery'); // ⬅ 여기서 명확히 의존성 표현

$(document).ready(() => {
  console.log('Hello world');
});
```

Node.js는 서버 사이드 환경으로 파일 시스템 접근이 자유롭기 때문에, 이런 방식의 동기 로딩이 자연스럽게 작동합니다.

**장점**:

* 코드를 보면 의존성이 명확히 드러남
    
* 정적 분석 가능
    

**단점**:

* **브라우저는 require를 모름** → 직접 실행 불가
    
* 브라우저에서 사용하려면 **Webpack, Browserify** 같은 도구로 번들링 필요
    

2\. **AMD**

브라우저 환경에서 **비동기 로딩**을 지원하기 위한 패턴으로 `define()` 함수의 첫 번째 인자로 **의존성 배열**을 명시합니다.

```javascript
define(['jquery'], function ($) {
  // 의존성은 'jquery'
  console.log($.fn.jquery);
});
```

**장점**:

* 브라우저에서 바로 사용 가능
    
* 동적 로딩을 지원
    

**단점**:

* 문법이 다소 복잡
    
* 실행 순서나 모듈 중복 관리 어려움
    

3\. **UMD**

AMD, CommonJS, 브라우저 전역 환경까지 모두 대응할 수 있는 패턴으로 주로 라이브러리 배포에 사용됩니다.

```javascript
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory); // AMD
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery')); // CommonJS
  } else {
    root.MyLib = factory(root.jQuery); // 전역
  }
}(this, function ($) {
  return {
    greet: function () {
      console.log('Hello from MyLib');
    }
  };
}));
```

**장점**:

* 다양한 환경에 대응 가능 (AMD, CJS, 브라우저 전역)
    

**단점**:

* 읽기 어렵고 복잡함
    
* 결국 브라우저에서는 전역 의존에 기대는 방식
    

### ES6 모듈 (ESM)의 등장

ES6에서는 모듈이 표준으로 정의되었고 모듈 정의를 위해 `export`와 `import` 키워드를 사용합니다.

```javascript
// utils.js
export function sum(a, b) {
  return a + b;
}

// main.js
import { sum } from './utils.js';
console.log(sum(2, 3)); // 5
```

HTML에서도 모듈을 명시적으로 로딩할 수 있습니다:

```javascript
<script type="module" src="main.js"></script>
```

**장점**:

* 모듈이 정적 구조라 분석, 트리 쉐이킹, 최적화에 유리
    
* 의존성이 코드로 명확하게 표현됨
    
* 브라우저와 Node.js에서 모두 공식 지원
    

이처럼 ESM이나 CommonJS 같은 모듈 시스템이 등장하기 전에는, 개발자가 직접 스크립트의 순서를 맞추고 전역 변수를 조심스럽게 다뤄야 했습니다. 하지만 이제는 **코드 상의 의존성 관계**, **모듈 간 경계 분리**, **로딩 순서 결정**이 자동화되어 매우 편리해졌습니다.

또한 실제 개발 환경에서는 **여러 모듈이 모여 있는 외부 패키지 라이브러리**를 사용합니다. 이때 다음과 같은 복잡한 의존성 문제가 발생할 수 있습니다:

* A 라이브러리와 B 라이브러리가 모두 내부적으로 lodash를 사용
    
* lodash 같은 하위 의존성도 자동으로 설치되어야 함
    
* 각 의존성의 **버전 범위**를 고려해 충돌 없이 설치되어야 함
    

이런 작업을 사람이 직접 하면 실수가 많고 시간이 오래 걸립니다. 그래서 등장한 것이 바로 **패키지 매니저**입니다.

### 패키지 매니저의 역할

패키지 매니저(npm, yarn, pnpm 등)는 다음과 같은 역할을 합니다:

* `package.json`에 명시된 의존성 정보 기반으로 필요한 패키지 설치
    
* 패키지가 또 다른 패키지를 의존할 수 있기 때문에, 하위 의존성의 버전도 고려해야하며, 전체 트리를 계산해 설치 순서를 결정합니다
    
* 각 패키지를 `node_modules`에 배치하거나, 캐시에 저장하거나, 가상 경로로 연결합니다. (**패키지 매니저마다 방식이 다름**)
    

### ⚠️ 그런데 왜 설치 결과가 매번 다를까?

모든 패키지 매니저들은 package.json을 기준으로 의존성을 관리하지만,  
같은 package.json으로 설치하더라도 설치 시점마다 nodemodules에 설치되는 패키지는 완벽히 같지 않을 수 있습니다. *왜냐하면, 설치 시점에서 의존 패키지가 업데이트되었을 수도 있기 때문이죠.*

`package.json`에는 일반적으로 다음과 같은 방식으로 의존성을 명시합니다:

```json
"dependencies": {
  "axios": "^1.5.0"
}
```

위와 같이 `^`가 붙은 경우 "버전 **1.5.0 이상이면서도 2.0.0 미만**이면 어떤 버전이든 괜찮다"는 의미입니다. 즉:

* 설치 시점에 `1.5.7`이 최신이라면 → `1.5.7`이 설치됨
    
* 다음날 `1.5.8`이 나오면 → 그게 설치됨
    

> 이처럼 **범위 내에서 가장 최신 버전이 설치**되는 게 기본 동작입니다.

🔍 이 범위 지정 기호들이 설치 결과에 영향을 줍니다:

| 기호 | 의미 |
| --- | --- |
| `^1.5.0` | `1.x.x` 중 가장 최신 (메이저 버전 고정) |
| `~1.5.0` | `1.5.x` 중 가장 최신 (마이너까지 고정) |
| `>=1.5.0` | 1.5.0 이상 아무거나 |
| 고정 (`1.5.0`) | 항상 같은 버전 설치됨 |

### 해결 방법: Lock 파일

*완벽히 같은 node*modules를 설치하기 위해서 `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` 같은 **lock 파일**이 생겼습니다.

이 파일들은 아래 정보를 고정시킵니다:

* 정확한 버전
    
* 다운로드 URL
    
* 의존성 구조
    
* 설치 경로
    

그래서 lock 파일이 있으면 누구든 어떤 시점에 설치하든 항상 동일한 구조의 `node_modules`를 만들 수 있는 것이죠.

> `package.json`은 **버전의 범위를 정의**하고,  
> `lock 파일`은 **실제로 설치된 버전을 고정**합니다.  
> lock 파일이 없으면, 시간에 따라 새로운 버전이 설치되므로 설치 결과가 달라질 수 있습니다.

설치 시점뿐 아니라 같은 `package.json`이라도 “어떤 패키지 매니저를 쓰느냐”에 따라서도 `node_modules` 구성은 달라질 수 있습니다.

각 패키지 매니저 마 "어떤 경우에 어떤 의존성을 설치할지, 어디에, 어떻게 설치할지"정하는 방식이 달라요.

#### 예를 들어:

```json
"dependencies": {
  "a-lib": "^1.0.0",
  "b-lib": "^1.0.0"
}
```

그리고 `a-lib`과 `b-lib`이 둘 다 내부에서 `lodash`를 사용한다고 할게요.

* **npm**은 다음처럼 할 수 있어요:
    
    * `a-lib/node_modules/lodash`
        
    * `b-lib/node_modules/lodash`  
        → 버전이 같더라도 **중복 설치 가능**
        
* **pnpm**은 이렇게 해요:
    
    * `.pnpm/` (전역 저장소)아래 한 번만 설치하고
        
    * `a-lib`과 `b-lib`에서 **링크로 참조**  
        → 중복을 최대한 **제거**
        

> 즉, 누가 설치하든 `package.json`은 같지만 설치된 실제 파일 구조는 다르게 나올 수 있어요.

뿐만 아니라 같은 `package.json`, 같은 패키지 매니저라도 패키지 매니저 버전에 따라 `node_modules` 구성이 달라질 수 있습니다.

패키지 매니저는 버전이 올라가면서 내부 동작 방식이나 규칙이 **자주 개선되고 바뀝니다**. 이 변화가 설치 결과에 영향을 줍니다.

대표적인 예시

#### `pnpm v6` vs `pnpm v7+`

* `pnpm`도 버전이 올라가면서 **lock 파일 구조, 저장 방식, 의존성 해석 규칙**이 달라졌어요.
    
* 예전에는 `peerDependencies` 충돌을 허용했지만,  
    최근 버전은 **더 엄격하게 에러로 처리**합니다.
    

**뿐만 아니라 같은** `package.json`, 같은 패키지 매니저, 같은 패키지 매니저 버전을 쓰더라도,  
**Node.js 버전이 다르면** `node_modules` 구성이나 개발 환경이 달라질 수 있습니다.

Node.js가 가진 기능이 버전마다 다르기 때문이에요

예를 들어,

```javascript
await fetch('https://example.com')
```

* 최신 Node(18 이상)에서는 `fetch`가 기본 내장
    
* 예전 Node(16 이하)에서는 `node-fetch` 같은 외부 패키지가 필요해요
    

> ✅ 같은 코드를 써도 어떤 Node를 쓰느냐에 따라 필요한 패키지가 달라질 수 있어요

또한, `sharp`, `node-sass` 같은 패키지는 Node 버전마다 **다른 바이너리**를 설치합니다.

**그래서 Node 버전까지 맞추는 게 아주 중요해요!**

* `.nvmrc`: Node 버전 기록하는 파일
    
* `volta`: Node + npm/pnpm 버전까지 고정해주는 툴
    

### 결론

**현대 프론트엔드 개발 환경**은 `package.json` 뿐만 아니라 다음 요소들을 모두 통일해야 예측 가능한 결과를 얻을 수 있습니다:

1. Lock 파일
    
2. 패키지 매니저 종류와 버전
    
3. Node.js 버전
    

➡️ **개발 환경 통일**이 정말 중요해요!