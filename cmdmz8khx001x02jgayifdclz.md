---
title: "유령 의존성이란?"
datePublished: Mon Jul 28 2025 10:40:22 GMT+0000 (Coordinated Universal Time)
cuid: cmdmz8khx001x02jgayifdclz
slug: 7jyg66c5ioydmoyhtoyeseydtouegd8

---

### **1️⃣**유령 의존성이란?

> `package.json`에 명시되어 있지 않지만, 코드에서 사용되고 있는 외부 의존성.

* 실제로는 다른 의존성의 **하위 의존성**으로 설치되어 있어서 작동함
    
* 직접 설치하지 않았기 때문에 **예상치 못한 오류나 의존성 충돌의 원인**이 될 수 있음
    

1\. `package.json`에 lodash 없음

```javascript
{
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

2\. 코드에서 lodash 사용

```javascript
import _ from 'lodash';

_.debounce(() => console.log('hi'), 300);
```

3\. 그런데 앱은 잘 작동함!

* 이유: `react`의 내부 의존성이 `lodash`를 포함하고 있고,
    
* `npm`이 그것을 **최상위 node\_modules로 hoist** 했기 때문
    

👉 이것이 바로 유령 의존성입니다.

### **2️⃣**발생 원인: node\_modules 구조와 Hoisting

* node\_modules 디렉토리에는 package.json에 명시된 라이브러리가 저장되며, 각 라이브러리에도 자신의 `package.json`에 따라 하위 의존성을 가지며, 이를 자신만의 `node_modules`에 설치함
    
* 여러 패키지가 **같은 버전**의 의존성을 공유하면, **중복 설치를 피하고자** `npm`, `Yarn Classic(v1)`은 해당 의존성을 **최상위 node\_modules로 끌어올림** → 이 과정을 **Hoisting(호이스팅)**이라고 함
    
* 프로젝트가 직접 의존하지 않았어도 **의존성 트리 상위에 있는 덕분에 코드에서 import 가능**
    

![artifacts](https://lovemewithoutall.github.io/assets/images/2021-12-03-node-module-phantom-dependency.png align="left")

출처: [https://toss.tech/article/node-modules-and-yarn-berry](https://toss.tech/article/node-modules-and-yarn-berry)

* 예를 들어, 왼쪽 트리처럼 여러 패키지가 동일한 버전의 라이브러리를 사용하면, 기존 구조에서는 동일한 라이브러리를 여러 번 설치하게 되어 디스크를 낭비하게 됩니다.
    
* NPM과 Yarn v1에서는 디스크 공간을 아끼기 위해 원래 트리의 모양을 오른쪽 트리처럼 바꿉니다.
    
* 오른쪽 트리로 의존성 트리가 바뀌면서 package-1 에서는 원래 import() 할 수 없었던 **\[B (1.0)\]** 라이브러리를 불러올 수 있게 되었습니다.
    
* 이렇게 끌어올리기에 따라 직접 의존하고 있지 않은 라이브러리를 import() 할 수 있는 현상을 유령 의존성(Phantom Dependency)이라고 부릅니다.
    
* 유령 의존성 현상이 발생할 때, package.json에 명시하지 않은 라이브러리를 조용히 사용할 수 있게 됩니다. 다른 의존성을 package.json 에서 제거했을 때 소리없이 같이 사라지기도 합니다. 이런 특성은 의존성 관리 시스템을 혼란스럽게 만듭니다.
    

### 🚫 왜 위험한가?

| 위험 요소 | 설명 |
| --- | --- |
| ❌ 깨지기 쉬움 | 상위 패키지가 해당 의존성을 제거하거나 버전 바꾸면 코드가 바로 에러 |
| ❌ 협업 문제 | 팀원이 클린 상태에서 `npm install` 하면 실행 불가 |
| ❌ CI/CD 오류 | 명확하지 않은 종속성 때문에 빌드 실패 가능성 |
| ❌ 디버깅 어려움 | 어떤 패키지가 이걸 제공하는지 추적하기 어려움 |

### **3️⃣** 어떻게 방지할?

1\. **의존성은 직접 명시하자**

* 사용 중인 모든 패키지는 `npm install [패키지명] --save` 또는 `yarn add`로 설치
    

2\. **정적 분석 도구 사용**

* `depcheck`: 사용 중인데 명시되지 않은 패키지 탐지
    
* `eslint-plugin-import`: import한 모듈이 의존성에 없으면 에러 표시
    

```javascript
npx depcheck
```

3\. **유령 의존성 방지하는 패키지 매니저 사용**

| 패키지 매니저 | 유령 의존성 발생 여부 | 설명 |
| --- | --- | --- |
| **npm (v6 이하)** | ⛔ 많이 발생 | 기본적으로 hoisting |
| **npm (v7+)** | ⚠️ 개선됨 | peerDependency 관리 강화 |
| **Yarn Classic (v1)** | ⛔ 많이 발생 | npm과 동일 |
| **Yarn Berry (v2+)** | ✅ 방지 | Plug'n'Play 방식 사용 |
| **pnpm** | ✅ 방지 | 의존성 격리 구조, 엄격한 접근 제한 |

### **4️⃣** pnpm은 어떻게 유령 의존성을 방지할까?

우선 Node.js가 어떤 방식으로 사용할 모듈들을 찾는지부터 알아봅시다

```javascript
// 예: 현재 파일이 /Users/you/project/src/index.js 라고 가정할 때

require('lodash');
```

Node.js는 다음 순서로 `lodash`를 찾습니다:

```javascript
1. /Users/you/project/src/node_modules/lodash
2. /Users/you/project/node_modules/lodash
3. /Users/you/node_modules/lodash
4. /Users/node_modules/lodash
5. /node_modules/lodash
```

Node.js는 모듈 해석 시 현재 디렉토리부터 시작해 상위 디렉토리 방향으로 `node_modules/패키지명` 경로를 1 depth만 탐색합니다. **하위 폴더는 전혀 탐색하지 않기 때문에**, 그걸 역이용한 것이 `pnpm`의 구조적 특징입니다.

`pnpm`은 모든 패키지를 node\_modules 하위에 `.pnpm`이라는 전용 폴더에 깔아두고,  
**내가** `package.json`에 명시한 의존성만 `node_modules`에 심볼릭 링크를 걸어줘서,  
Node.js가 오직 **직접 설치한 것만 import 가능**하게 만듭니다.

즉 `.pnpm`폴더는 Node.js 모듈 해석법을 회피하기 위해서는 필수적인 존재입니다.

1\. `.pnpm` 폴더에 모든 패키지를 "실제로" 설치합니다

```javascript
project/
├── node_modules/        ← Node.js가 참조하는 곳
├── .pnpm/               ← 진짜 라이브러리 저장소 (숨김 처리됨)
│   ├── react@18.2.0/
│   ├── lodash@4.17.21/
│   └── other-deps@x.x.x/
```

* `.pnpm` 내부에는 모든 패키지가 **고유한 폴더명**으로 정리되어 설치됨  
    (`lodash@4.17.21/node_modules/lodash` 이런 식으로 내부적으로 유지)
    

---

2\. `package.json`에 **명시된 의존성만** `node_modules`에 링크

```javascript
project/
├── node_modules/
│   ├── react  → 심볼릭 링크 (실제 경로는 .pnpm/react@18.2.0)
│   └── lodash → 이건 명시해야만 생김!
```

* `lodash`를 `package.json`에 명시하지 않으면?  
    → `node_modules/lodash`에는 **링크가 생기지 않음**  
    → `import 'lodash'` 하면 `MODULE_NOT_FOUND` 에러
    

### **5️⃣** Yarn Berry는 어떻게 유령 의존성을 방지할까?

Yarn Berry는 `Plug'n'Play (PnP)`라는 완전히 새로운 방식으로 node\_modules를 생성하지 않습니다. 대신 `.yarn/cache` 폴더에 의존성의 정보가 저장되고, `.pnp.cjs` 파일에 의존성을 찾을 수 있는 정보가 기록됩니다. `.pnp.cjs`를 이용하면 디스크 I/O 없이 어떤 패키지가 어떤 라이브러리에 의존하는지, 각 라이브러리는 어디에 위치하는지를 바로 알 수 있습니다.

1\. 패키지 설치

* Yarn Berry는 의존성들을 `.yarn/cache/` 폴더에 **압축 파일(zip)** 형태로 저장합니다.
    
    ```javascript
    .yarn/cache/lodash-npm-4.17.21.zip
    ```
    

2\. `.pnp.cjs` 파일 생성

* Yarn은 설치된 모든 의존성과 그 경로를 `.pnp.cjs` 파일에 기록합니다.
    
    ```javascript
    exports.resolveToUnqualified = (request, issuer) => {
      if (request === 'lodash') {
        return '/Users/me/project/.yarn/cache/lodash-npm-4.17.21.zip';
      }
    }
    ```
    
* Node.js에 Hook을 추가
    

* 실행 시 `.pnp.cjs`가 Node의 모듈 로더에 **"얘는 여기 있어요!"** 라고 알려줍니다
    
* `require('lodash')`는 `.pnp.cjs`를 거쳐 실제 zip 파일 내 모듈을 찾아감
    
* `.pnp.cjs` 파일은 Node.js의 `require()` / `import` 요청을 처리할 때,  
    **어떤 경로의 패키지를 사용할지 정확히 알려주는 매핑 테이블** 역할을 합니다.
    

> 이걸 **Plug'n'Play 모듈 해석기**라고 해요.  
> (Node의 `require.resolve()`를 **오버라이드**해서 동작합니다)

---

3\. 런타임에서 무슨 일이 일어날까?

* Node.js가 `require('lodash')`를 실행하면,
    
* `.pnp.cjs`가 `"lodash"`는 `"./.yarn/cache/`[`lodash-npm-4.17.21.zip`](http://lodash-npm-4.17.21.zip)`"`에 있다고 알려줍니다.
    
* 그리고 **내가 설치 안 한 패키지는 아예 연결 정보가 없기 때문에 에러**가 납니다.
    

👉 즉, **명시적으로 설치한 패키지만 import 가능**

Yarn Berry (PnP)는 **Node.js의 기본 의존성 탐색 방식(**`node_modules`)을 우회해서, **자체 의존성 해석 시스템**을 사용합니다

### **6️⃣**정리

유령 의존성은 설치하지 않은 패키지를 코드에서 사용하는 것으로,  
npm/Yarn Classic 구조에서는 쉽게 발생할 수 있지만,  
**pnpm과 Yarn Berry는 구조적으로 이를 차단하여 더 안정적인 의존성 관리**를 제공합니다.