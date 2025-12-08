---
title: "리액트는 어떻게 상태를 기억하는가? (Deep Dive: 클로저와 메모리 구조)"
seoDescription: "리액트 상태 관리 비밀: 클로저와 메모리 구조 탐구. 상태 기억 메커니즘, 클로저 원리, React Hooks 사용법을 깊이 설명합니다"
datePublished: Mon Dec 08 2025 10:58:48 GMT+0000 (Coordinated Universal Time)
cuid: cmix1gk3t000e02lb4fk5arql
slug: deep-dive

---

리액트에서 컴포넌트는 그저 함수일 뿐입니다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

자바스크립트 원리에 따르면, 함수가 호출되고 실행이 끝나면(`return`) 그 함수 내부의 변수들은 메모리에서 사라져야 합니다. 즉, `Counter()`가 다시 렌더링(재호출) 될 때마다 `count`는 0으로 초기화되어야 정상입니다.

그런데 리액트는 어떻게 변수가 초기화되지 않고 1, 2, 3... 이전 값을 '기억'하는 걸까요?

핵심은 바로 자바스크립트의 클로저(Closure)입니다.

이 글에서는 클로저가 무엇인지, React 훅과 어떤 관련이 있는지, 그리고 왜 Stale Closure(오래된 클로저) 문제가 발생하는지 메모리 구조 레벨에서 파헤쳐 보겠습니다.

---

1. ### 자바스크립트 함수의 기억력: 클로저(Closure)
    

클로저란 무엇일까요? MDN에 나와 있는 정의를 한번 살펴보겠습니다.

> [A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).  
> "클로저는 함수와 그 함수가 선언된 렉시컬 환경(Lexical Environment)의 조합이다."](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

즉 자바스크립트 함수는 실행이 끝나고 사라져도, 자신이 선언될 때 주변에 있던 변수들을 계속 붙들고 있을 수 있습니다.

여기서 의문이 생깁니다. 이전 실행 컨텍스트가 사라지고, 새로운 실행 컨텍스트가 생성되는데, 새로운 실행 컨텍스트에서 어떻게 과거의 환경(변수)을 다시 찾아갈 수 있을까요?"

이것을 이해하려면 자바스크립트의 **논리적 구조**와 **물리적 구조**를 구분해야 합니다.

전제: 논리 vs 물리 구조의 차이

* **논리적 모델 (ECMAScript 스펙):**
    
    ```typescript
    Execution Context(실행 컨텍스트)
    ├── LexicalEnvironment
    │   ├── EnvironmentRecord         ← 변수 저장
    │   └── OuterEnvironmentReference ← 상위 스코프 연결
    ```
    
    * 초반에는 위와같이 실행 컨텍스트를 메모리 관점이 아닌 개념적으로만 이해하다보니 살짝 혼란스러웠습니다.
        
* **물리적 모델 (자바스크립트 엔진 구현):**
    
    * **\[Stack\] 실행 컨텍스트:** "지금 무슨 함수 실행 중인지" 관리하는 얇은 **작업 지시서**. (함수 실행 끝나면 무조건 삭제)
        
    * **\[Heap\] 렉시컬 환경:** 변수 데이터가 저장되는 **외부 창고**. (참조가 있으면 절대 안 됨)
        
    * **관계:** 실행 컨텍스트는 렉시컬 환경의 주소(참조)만 가지고 있습니다.
        

이 구조를 바탕으로 다음 코드가 메모리에서 어떻게 동작하는지 확인해봅시다.

```jsx
function createCounter() {
  let count = 0; // 원래는 이 함수가 끝나면 사라져야 할 변수

  return function increase() {
    count++; // 내부 함수가 외부 변수 count를 참조(기억)하고 있음!
    console.log(count);
  };
}

const counter = createCounter(); 
counter(); // 1
counter(); // 2 (count 변수가 죽지 않고 살아있음!)
```

(A) 단계: `createCounter()`가 호출 중

**\[Stack 영역 - 작업장\]**

* `createCounter` 실행 컨텍스트 (주소: SP-10)
    
    * **LexicalEnvironment 참조:** `Heap-100` (여기를 가리킴)
        

**\[Heap 영역 - 창고\]**

* **렉시컬 환경 (주소: Heap-100)**
    
    * 내용: `{ count: 0 }`
        
* `increase` 함수 객체 (주소: Heap-500)
    
    * 내용: `{ 코드: "count++", [[Environment]]: Heap-100 }`
        
    * 특징: 함수가 생성되면서 자신의 내부 슬롯 `[[Environment]]`에 현재 환경(`Heap-100`)의 주소를 저장함.
        

(B) 단계: `createCounter` 종료 직후

**\[Stack 영역 - 작업장\]**

* `createCounter` 실행 컨텍스트 (주소: SP-10) -&gt; **POP! (삭제됨)**
    
    * 이 컨텍스트가 가지고 있던 `Heap-100`으로 가는 화살표도 사라졌습니다.
        

**\[Heap 영역 - 창고\]**

* **렉시컬 환경 (주소: Heap-100)**
    
    * 내용: `{ count: 0 }`
        
    * **상태:** Stack에서의 연결은 끊겼습니다. 하지만! `Heap-500`(`increase` 함수)이 자신의 `[[Environment]]` 슬롯으로 이곳을 가리키고 있습니다. (참조 카운트 &gt; 0)
        
    * **결과: 가비지 컬렉터(GC)가 수거하지 못하고 살아남음.**
        
* `increase` 함수 객체 (주소: Heap-500)
    
    * 전역 변수 `const counter`가 이 객체를 참조하게 됩니다.
        

**결과:** 실행 컨텍스트는 사라졌지만, **렉시컬 환경(변수 저장소)은 메모리에 살아남습니다.**

---

(C) 단계: `counter()` 실행

**\[Stack 영역 - 작업장\]**

* `increase` 실행 컨텍스트 (주소: SP-20) -&gt; **PUSH! (생성됨)**
    
    * **연결:** 이때 엔진은 `increase` 함수 객체의 `[[Environment]]`를 열어봅니다. "아, 너의 고향은 `Heap-100`이구나."
        
    * 새로운 컨텍스트의 OuterEnvironmentReference **참조**를 `Heap-100`으로 설정합니다.
        
    * `Heap-100`을 상위 스코프로 참조하게 되고, 덕분에 죽지 않고 살아있는 `count` 변수를 찾아내 1을 더할 수 있게 됩니다.
        

**\[Heap 영역 - 창고\]**

* **새 렉시컬 환경 (주소: Heap-200)**
    
    * `increase` 함수 실행을 위한 빈 창고가 새로 생깁니다.
        
    * **Outer 참조:** `Heap-100` (옛날 창고를 가리킴)
        
* **옛 렉시컬 환경 (주소: Heap-100)**
    
    * Stack의 SP-20이 스코프 체인을 타고 이곳에 접근합니다.
        
    * `count` 값을 0에서 1로 수정합니다.
        

`createCounter` 함수는 이미 종료되었지만, 반환된 `increase` 함수가 `count`를 꽉 붙잡고(Closure) 있기 때문에 변수가 메모리에서 사라지지 않는 것입니다.

즉 실행 컨텍스트가 사라져도 렉시컬 환경은 남는다

```typescript
[ 1. 실행 컨텍스트 스택 (Stack) ]
(createCounter 실행 중...)
+-----------------------------+
| createCounter 컨텍스트      |
|  - VariableEnv              |
|  - LexicalEnv  ----------+  | <--- "나는 지금 LE-100을 쓰고 있어"
+--------------------------|--+
                           |
                           | (참조)
                           v
[ 2. 힙 메모리 (Heap) - 데이터 저장소 ]

   (A) 렉시컬 환경 (LE-100)  <-------------+
   +-----------------------+               |
   | count: 0              |               |
   +-----------------------+               |
                                           |
   (B) 함수 객체 (increase)                |
   +-----------------------+               |
   | 함수 코드: ...        |               |
   | [[Environment]]: LE-100 |  -----------+ 
   +-----------------------+    (가리킴)
```

**리액트는 바로 이 원리를 이용해 상태를 저장합니다.**

---

2. ### 클로저를 이용한 `useState` 구현
    

리액트는 이 클로저 원리를 이용해, 컴포넌트(함수)가 렌더링(재호출)되어도 데이터가 사라지지 않도록 만들었습니다.

컴포넌트 외부(React 모듈 내부)에 변수를 저장해두고, 클로저를 통해 그 변수에 접근하게 하는 것.

```jsx
// 아주 단순화한 useState의 내부 구현 (모듈 스코프)
let _val; // 상태를 저장할 변수 (컴포넌트 밖에 있음!)

function useState(initialValue) {
  // _val이 없으면 초기값 할당 (첫 렌더링)
  if (_val === undefined) {
    _val = initialValue;
  }

  const setState = (newVal) => {
    _val = newVal; // 클로저! setState는 외부 변수 _val을 참조하고 있음
    render(); // 리액트에게 다시 그리라고 알림 (가상의 함수)
  };

  // 현재 값과, 값을 바꿀 수 있는 함수를 반환
  return [_val, setState];
}

function CounterComponent() {
  const [count, setCount] = useState(0); // 여기서 useState 호출

  console.log("렌더링됨:", count);

  return {
    click: () => setCount(count + 1)
  };
}

// 시뮬레이션
const app = CounterComponent(); // 첫 렌더링. _val은 0이 됨.
app.click(); // setState 호출 -> _val이 1로 바뀜 -> 재렌더링 트리거
const app2 = CounterComponent(); // 재렌더링. useState 호출 -> _val은 이미 1임! -> 1 반환
```

`CounterComponent` 함수는 계속 새로 호출되지만, `useState`는 **자신이 선언된 곳(React 모듈)의** `_val`을 클로저로 잡고 있기 때문에 상태가 유지되는 것입니다.

실제 리액트는 여러 개의 `useState`를 처리하기 위해, 값을 하나가 아니라 배열(Hook List)로 관리하고 인덱스(순서)로 접근한다는 점만 다를 뿐, 원리는 이것과 똑습니다.

```jsx
// 리액트 엔진 내부 (메모리) 
const MyReact = (function() {
  let hooks = []; // 훅의 상태들을 저장할 배열 (여기가 진짜 저장소!)
  let currentHook = 0; // 현재 몇 번째 훅을 실행 중인지 가리키는 인덱스

  return {
    render(Component) {
      currentHook = 0; // 렌더링 시작할 때마다 인덱스 초기화
      const Comp = Component(); // 컴포넌트 실행!
      Comp.render();
      return Comp;
    },
    
    // useState 구현체
    useState(initialValue) {
      const index = currentHook; // 이번 훅의 인덱스를 기억 (클로저!)
      
      // 1. 기존에 저장된 값이 없으면 초기값 할당
      if (hooks[index] === undefined) {
        hooks[index] = initialValue;
      }

      // 2. 상태 변경 함수 (setState)
      const setState = (newValue) => {
        hooks[index] = newValue; // 기억해둔 index 위치의 값을 변경 (클로저!)
      };

      // 3. 다음 훅을 위해 인덱스 한 칸 이동
      currentHook++; 

      // 4. 현재 값과 설정 함수 반환
      return [hooks[index], setState];
    }
  };
})();
```

이 구조 때문에 "Hooks는 최상위 레벨에서만 호출해야 한다(조건문 금지)"는 규칙이 생겼습니다.  
**왜 조건문을 쓰면 안 될까요?**

(A) 정상적인 경우

```jsx
function MyComponent() {
  const [name, setName] = useState("Tom");   // 1번 훅
  const [age, setAge] = useState(20);        // 2번 훅
  const [job, setJob] = useState("Dev");     // 3번 훅
}
```

**\[첫 번째 렌더링\]**

1. `useState("Tom")` 호출 -&gt; `hooks[0]`에 "Tom" 저장. (index 0 -&gt; 1)
    
2. `useState(20)` 호출 -&gt; `hooks[1]`에 20 저장. (index 1 -&gt; 2)
    
3. `useState("Dev")` 호출 -&gt; `hooks[2]`에 "Dev" 저장. (index 2 -&gt; 3)
    

**결과:** `hooks = ["Tom", 20, "Dev"]`

**\[두 번째 렌더링\]** 리액트는 다시 처음부터 코드를 실행하네.

1. 첫 번째 `useState` 만남 -&gt; `hooks[0]`인 "Tom"을 꺼내줌. (문제없음)
    
2. 두 번째 `useState` 만남 -&gt; `hooks[1]`인 20을 꺼내줌. (문제없음)
    
3. 세 번째 `useState` 만남 -&gt; `hooks[2]`인 "Dev"를 꺼내줌. (문제없음)
    
4. 조건문을 사용한 경우
    

(B) 조건문을 사용한 경우  
만약 "이름이 Tom일 때만 나이를 보여줘"라고 조건문을 넣었다고 하면

```jsx
function MyComponent() {
  const [name, setName] = useState("Tom"); // 1번
  if (name !== "Tom") { // 이름이 바뀌면 이 훅은 실행 안 됨!
     const [age, setAge] = useState(20);   // 2번 (조건부)
  }
  const [job, setJob] = useState("Dev");   // 3번
}
```

**상황: 사용자가 이름을 "Alice"로 바꿨다! (리렌더링 발생)**

1. **1번 훅 실행:** `useState("Alice")` 호출.
    
    * 리액트: "어, 첫 번째네? `hooks[0]` 줄게." -&gt; **"Alice" 반환.** (성공
        
2. **2번 훅(나이) 실행:** `name`이 "Alice"니까 `if`문이 거짓(False)이 되어 **건너뜀!**
    
3. **3번 훅(직업) 실행:** `useState("Dev")` 호출.
    
    * **여기서 사고 발생!**
        
    * 이게 '직업' 훅이라고 생각하지만, **리액트는 그냥 "두 번째 훅 호출이네?"라고 생각함.**
        
    * 리액트: "어, 두 번째 호출이네? 아까 저장해둔 `hooks[1]` 줄게."
        
    * **결과:** `job` 변수에 `20`(나이)이 들어감!
        
    * 결국 **직업 변수에 나이 데이터가 들어가는 대참사**가 발생합니다.
        

리액트는 변수명이 아니라 **오직 '호출 순서(Index)'에 의존**하여 상태를 관리하기 때문입니다.  
이래서 Hooks를 조건문 안에서 쓰면 순서가 꼬여서 안 된다는 규칙이 생긴 것

**결론:** 리액트는 코드를 분석해서 "아, 이건 job state구나"라고 알지 못하고. 오직 "이게 몇 번째 호출인가"만 따지기떄문에. 중간에 하나가 빠지면 뒤에 있는 모든 훅들이 한 칸씩 당겨지면서 데이터가 뒤죽박죽 섞여버립니다. 이게 바로 "Hooks는 최상위 레벨에서만 호출해야 한다(조건문 금지)"는 규칙의 이유입니다.

---

3. ### `useEffect`
    

`useEffect` 또한 앞서 설명한 **클로저의 원리**로 동작합니다. 리액트 내부 어딘가에는 "지난번 렌더링 때 사용한 의존성 배열"과 "실행할 콜백 함수"가 저장되어 있습니다.

렌더링이 일어날 때마다 힙(Heap) 메모리에는 새로운 렉시컬 환경(Lexical Environment)이 생성됩니다. 하지만 리액트는 성능 최적화를 위해 **의존성 배열(deps)이 변하지 않으면**, 새로 만들어진 환경을 무시하고 \*\*이전에 저장해 둔 함수(과거의 환경을 기억하는 클로저)\*\*를 재사용합니다. 즉, 현재의 변수가 아닌 과거의 변수를 계속 바라보게 되는 것입니다.계속 바라봅니다.

```jsx
const MyReact = (function() {
  let hooks = [];
  let currentHook = 0;

  return {
    render(Component) {
      currentHook = 0;
      const Comp = Component();
      Comp.render();
      return Comp;
    },

    useState(initialValue) {
      hooks[currentHook] = hooks[currentHook] || initialValue;
      const setStateHookIndex = currentHook;
      const setState = (newState) => (hooks[setStateHookIndex] = newState);
      return [hooks[currentHook++], setState];
    },

    // 👇 useEffect
    useEffect(callback, depArray) {
      const index = currentHook;
      
      // 1. 저장소에서 '지난번' 훅 정보(이전 의존성)를 꺼냅니다.
      const prevHook = hooks[index]; 

      // 2. 의존성이 바뀌었는지 검사합니다.
      // (처음 실행이거나, 의존성 배열이 없거나, 의존성 내용이 하나라도 다르면 true)
      const hasChanged = !prevHook || !depArray || 
        !depArray.every((el, i) => el === prevHook.deps[i]);

      // 🚨 [핵심 로직] 결정의 순간
      if (hasChanged) {
        // 조건 A: 의존성이 바뀌었음!
        // 👉 저장소에 "새로운 콜백"과 "새로운 의존성"을 덮어씁니다. (업데이트)
        hooks[index] = { callback: callback, deps: depArray };
        console.log(`✅ [Effect 업데이트] ${index}번 훅: 새 함수 저장됨`);
      } else {
        // 조건 B: 의존성이 안 바뀌었음! ([] === [])
        // 👉 "아무것도 안 합니다." 
        // 즉, 컴포넌트가 방금 전달해준 '따끈따끈한 새 callback'은 
        // 저장소에 들어가지 못하고 이 라인이 끝나는 순간 메모리에서 삭제(GC)됩니다.
        // 저장소엔 여전히 '옛날 콜백'이 들어있습니다.
        console.log(`⛔ [Effect 유지] ${index}번 훅: 옛날 함수 유지 (새 함수 버림)`);
      }

      currentHook++; // 다음 훅을 위해 인덱스 이동
    },

    // (설명을 위해 추가) 리액트가 렌더링 후 저장된 Effect들을 실행시키는 함수
    runEffects() {
      console.log("🏃 [Effect 실행] 저장된 콜백들을 실행합니다...");
      hooks.forEach(hook => {
        // hook 객체 안에 저장된 callback을 실행 (이게 옛날 거일 수도, 새 거일 수도 있음)
        if (hook && hook.callback) { 
            hook.callback(); 
        }
      });
    }
  };
})();
```

컴포넌트가 렌더링 될 때마다 새로운 스코프가 만들어지고, 그 안에서 최신 상태를 기억하는 \*\*새로운 함수(클로저)\*\*가 생성됩니다. 하지만 위 코드에서 볼 수 있듯이, 리액트의 훅 엔진(`MyReact`)은 의존성 배열(`deps`)이 바뀌지 않으면 **새로 만들어진 함수를 저장하지 않고 버려버립니다.**

4. Stale Closure (오래된 클로저)
    

`useEffect`나 `useCallback`, `useMemo` , `React.memo` 에서 의존성 배열(dependency array)을 잘못 설정했을 때, Stale Closure가 발생합니다.

```typescript
function App() {
  const [count, setCount] = useState(0);

  // 🚨 의존성 배열을 비워버림 ([]). 
  // 즉, "처음 태어날 때 찍은 사진만 계속 써!"라고 리액트에게 명령함.
  const logCount = useCallback(() => {
    console.log(count);
  }, []); 

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={logCount}>로그 출력</button>
    </div>
  );
}
```

위 코드에서 의존성 배열이 비어 있으면, 리렌더링마다 새 함수는 만들어지지만 React는 저장소에 새 함수를 넣지 않고 최초 렌더링 때 만들어진 함수를 계속 재사용합니다. 화면의 숫자는 100까지 올라가도, 로그에는 영원히 `0`만 찍히는 **Stale Closure** 현상이 발생합니다.

5. ### **Lint 규칙을 켜야 하는 이유**
    

이 모든 원리를 이해하면 `eslint-plugin-react-hooks`의 `exhaustive-deps` 규칙이 왜 중요한지 알 수 있습니다.

> **"사용하는 모든 변수를 의존성 배열에 적으세요."**

이것은 단순한 잔소리가 아닙니다.

1. 컴포넌트는 렌더링마다 **새로운 환경**을 만듭니다.
    
2. 의존성 배열을 생략하면, 리액트는 **과거의 환경**을 기억하는 함수를 강제로 재사용합니다.
    
3. 결국 논리적 오류(Stale Closure)가 발생합니다.
    

따라서 린트 규칙을 `Error`로 설정하여, 리액트가 항상 올바른 시점의 상태를 참조하도록(필요할 때만 클로저를 갱신하도록) 강제하는 것이 안전합니다.

### 마치며

리액트 훅의 원리를 다시 한번 파헤쳐 보면서 깨달은 점은, **결국 '기본기'가 가장 중요하다**는 사실이었습니다. 결국 클로저(Closure)와 실행 컨텍스트 등 **자바스크립트라는 언어의 가장 본질적인 특성을 아주 영리하게 활용한 결과물**일 뿐이었습니다.