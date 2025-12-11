---
title: "리액트는 어떻게 상태를 기억하는가? (Deep Dive: 클로저와 메모리 구조)"
seoDescription: "리액트 상태 관리 비밀: 클로저와 메모리 구조 탐구. 상태 기억 메커니즘, 클로저 원리, React Hooks 사용법을 깊이 설명합니다"
datePublished: Mon Dec 08 2025 10:58:48 GMT+0000 (Coordinated Universal Time)
cuid: cmix1gk3t000e02lb4fk5arql
slug: deep-dive

---

최근 프로젝트에서 `useEffect`의 의존성 배열 경고(`react-hooks/exhaustive-deps`)를 보면서 코드는 정상적으로 동작하는데 왜 이런 경고가 발생할까? 하는 의문이 들었습니다. 정확히 이해하고자 파고들었고, 그리고 그 끝에서 마주한 것은 리액트가 상태를 관리하는 근본적인 원리, 바로 자바스크립트의 메모리 구조와 클로저였습니다.

이 글에서는 클로저가 무엇인지, 리액트가 훅(Hooks)을 관리하기 위해 클로저를 어떻게 활용하는지, 그리고 의존성 배열을 지키는 것이 왜 중요한지에 대해서 하나씩 Deep Dive해 보겠습니다.

---

리액트에서 컴포넌트는 그저 함수일 뿐입니다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((prev) => prev + 1)}> 증가 </button>
    </div>
  );
}
```

자바스크립트 원리에 따르면, 함수가 호출되고 실행이 끝나면(`return`) 그 함수 내부의 변수들은 메모리에서 사라져야 합니다. 즉, `Counter()`가 다시 렌더링(재호출) 될 때마다 `count`는 0으로 초기화되어야 정상입니다.

그런데 리액트는 어떻게 변수가 초기화되지 않고 1, 2, 3... 이전 값을 '기억'하는 걸까요?

핵심은 바로 자바스크립트의 클로저(Closure)입니다.

---

1. ### 자바스크립트 함수의 기억력: 클로저(Closure)
    

클로저란 무엇일까요? MDN에 나와 있는 정의를 한번 살펴보겠습니다.

> [A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).  
> "클로저는 함수와 그 함수가 선언된 렉시컬 환경(Lexical Environment)의 조합이다."](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

쉽게 말해, 함수는 실행이 끝나고 사라져도, 자신이 선언될 당시 주변에 있던 변수들을 계속 붙들고 있을 수 있습니다.

이 정의를 제대로 이해하려면, 먼저 '우리가 아는 일반적인 함수는 어떻게 실행되고 사라지는가?'를 짚고 넘어가야 합니다. 여기서 등장하는 개념이 바로 실행 컨텍스트(Execution Context)입니다.

자바스크립트에서 함수가 호출되면, 엔진은 그 함수를 실행하기 위한 '작업 명세서'를 만듭니다. 이것이 바로 실행 컨텍스트입니다. 이 명세서 안에는 함수 내부의 변수, `this`, 그리고 외부 환경에 대한 정보가 담깁니다.

```typescript
Execution Context(실행 컨텍스트)
├── LexicalEnvironment
│   ├── EnvironmentRecord         ← 변수 저장
│   └── OuterEnvironmentReference ← 상위 스코프 연결
├── VariableEnvironment (≒ LexicalEnvironment)
├── ThisBinding
```

이 컨텍스트는 콜 스택(Call Stack)이라는 곳에 차곡차곡 쌓입니다.

* 함수 **호출**: 실행 컨텍스트 생성 → 스택에 **Push**
    
* 함수 **실행**: 코드 한 줄 한 줄 실행
    
* 함수 **종료(Return)**: 실행 컨텍스트 파기 → 스택에서 **Pop**
    

일반적으로 "스택에서 제거된다"는 것은 "데이터가 소멸한다"는 것을 의미합니다.

```jsx
function add(a, b) {
  const result = a + b; // 지역 변수 result 생성
  return result;
} // 함수 종료 -> 실행 컨텍스트 파기 -> result 변수도 메모리에서 해제(Garbage Collection)
```

위 코드에서 add 함수가 종료되면, result 라는 변수는 더 이상 접근할 수 없게 되며 가비지 컬렉터(GC)에 의해 메모리에서 지워지는 것이 정상적인 흐름입니다.

그런데… 클로저가 있으면?

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

여기서 의문이 생깁니다.

createCounter 함수의 실행 컨텍스트는 이미 스택에서 사라졌는데, 내부 함수는 어떻게 여전히 `count` 변수에 접근할 수 있을까? 이전 실행 컨텍스트가 사라지고, 새로운 실행 컨텍스트가 생성되는데 어떻게 렉시컬 환경을 다시 찾아갈 수 있을까요?

---

이 현상을 이해하려면 자바스크립트 엔진이 데이터를 저장하는 두 가지 공간, Stack(실행 공간)과 Heap(저장 공간)의 차이를 이해해야 합니다.  
(내부 구현은 엔진마다 다를 수 있지만 여기서는 개념 이해를 위해 Stack/Heap으로 단순화했습니다)

* \[Stack\] 실행 컨텍스트: "지금 무슨 함수 실행 중인지" 관리하는 얇은 작업 지시서
    
    * 역할: 함수 실행 순서 관리, 원시 타입(Primitive) 변수 저장, Heap 영역의 주소값(참조) 저장.
        
    * 생명 주기: 매우 엄격합니다. 함수가 실행되는 동안만 데이터가 존재하며, 함수가 종료(Pop)되면 그 안에 있던 데이터도 즉시 삭제됩니다.
        
* \[Heap\] 렉시컬 환경: 변수 데이터가 저장되는 외부 창고.
    
    * 역할: 객체(Object), 배열(Array), 함수(Function) 등 크기가 동적으로 변할 수 있는 복잡한 데이터 저장.
        
    * 생명 주기: 스택과 무관하게 독자적으로 관리됩니다. 이곳의 데이터는 "누군가가 나를 가리키고(참조하고) 있는가?"를 기준으로 생존 여부가 결정됩니다.
        
    * 가비지 컬렉터(GC): 스택에서 함수가 사라져도, 여전히 힙에 있는 데이터를 가리키는 화살표(참조)가 단 하나라도 남아있다면 GC는 그 데이터를 지우지 않습니다.
        

Stack은 사라져도, Heap에 남아 있는 렉시컬 환경을 참조하는 함수가 하나라도 있으면 GC되지 않음 → 이것이 클로저의 본질.

---

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

(A) 단계`createCounter()`가 호출

**\[Stack 영역 - 작업장\]**

* `createCounter` 실행 컨텍스트 (주소: SP-10)
    
    * 현재 상태: 실행 중
        
    * **LexicalEnvironment 참조:** `Heap-100` (여기를 가리킴)
        

**\[Heap 영역 - 창고\]**

1. **렉시컬 환경 (주소: Heap-100)**
    
    * 내용: `{ count: 0 }`
        
    * *특징: 현재 Stack(SP-10)에서 참조 중이므로 GC 대상 아님.*
        
    * 기본적으로 `let count = 0` 같은 원시 타입 변수는 Stack에 저장되지만, 자바스크립트 엔진은 코드를 실행하기 전, 최적화 과정에서 이런 판단을 내립니다. "어? 이 count라는 변수는 내부 함수(increase)가 나중에 또 쓰겠네? Stack에 두면 함수 끝날 때 지워지니까 안 되겠다." 이렇게 클로저가 참조하는 변수라고 판단되면, 엔진은 해당 변수를 Stack이 아닌 Heap에 있는 '렉시컬 환경(Lexical Environment)'이라는 객체 안에 저장합니다.
        
2. `increase` 함수 객체 (주소: Heap-500)
    
    * 내용: `{ 코드: "count++", [[Environment]]: Heap-100 }`
        
    * *특징: 함수가 생성되면서 현재 환경(Heap-100)을 내부에 저장함.*
        

---

(B) `createCounter`가 `increase` 함수를 반환하고 종료(`return`)된 직후

**\[Stack 영역 - 작업장\]**

* `createCounter` 실행 컨텍스트 (SP-10) -&gt; **POP! (삭제됨)**
    
    * 작업 지시서가 파쇄되었습니다.
        
    * 이 컨텍스트가 가지고 있던 `Heap-100`으로 가는 화살표도 사라졌습니다.
        

**\[Heap 영역 - 창고\]**

1. **렉시컬 환경 (주소: Heap-100)**
    
    * 내용: `{ count: 0 }`
        
    * **상태:** Stack에서의 연결은 끊겼습니다.
        
    * **생존 이유:** 하지만! `Heap-500`(`increase` 함수)이 자신의 `[[Environment]]` 슬롯으로 이곳을 가리키고 있습니다.
        
    * **결과: 가비지 컬렉터(GC)가 수거하지 못하고 살아남음.**
        
2. `increase` 함수 객체 (주소: Heap-500)
    
    * 전역 변수 `const counter`가 이 객체를 참조하게 됩니다.
        

---

(C) 단계: `counter()` 실행

**\[Stack 영역 - 작업장\]**

* `increase` 실행 컨텍스트 (주소: SP-20) -&gt; **PUSH! (생성됨)**
    
    * 새로운 작업 지시서가 생겼습니다.
        
    * 이때 엔진은 `Heap-500` 함수 객체를 열어봅니다. "너의 고향(`[[Environment]]`)은 어디니?"
        
    * 확인 후, 이 컨텍스트의 OuterEnvironmentReference **참조**를 `Heap-100`으로 설정합니다.
        

**\[Heap 영역 - 창고\]**

1. **새 렉시컬 환경 (주소: Heap-200)**
    
    * `increase` 함수 실행을 위한 빈 창고가 새로 생깁니다.
        
    * **Outer 참조:** `Heap-100` (옛날 창고를 가리킴)
        
2. **옛 렉시컬 환경 (주소: Heap-100)**
    
    * Stack의 SP-20이 스코프 체인을 타고 이곳에 접근합니다.
        
    * `count` 값을 0에서 1로 수정합니다.
        

`createCounter` 함수는 이미 종료되었지만, 반환된 `increase` 함수가 `count`를 꽉 붙잡고(Closure) 있기 때문에 변수가 메모리에서 사라지지 않는 것입니다.

즉 실행 컨텍스트는 사라졌지만, **렉시컬 환경(변수 저장소)은 메모리에 살아남습니다.**

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

3. ### Stale Closure (오래된 클로저)와 의존성 배열
    

`useEffect`, `useCallback`, `useMemo`처럼 **의존성 배열(deps)** 을 받는 훅들도 위와 똑같습니다. React 내부 어딘가에 "지난번 렌더링 때 저장해둔 의존성 배열"과 "실행할 콜백 함수"를 저장해 둡니다.

**다만 의존성 배열(deps)** 을 받는 훅들은 리액트에서 성능 최적화를 위해 **이 콜백을 저장할지, 기존 것을 재사용할지**를→ 의존성 배열을 보고 결정합니다.

React는 이후 렌더링에서:

* **deps가 바뀌었으면**: “새 렉시컬 환경을 캡처한 새 함수”로 교체
    
* **deps가 그대로면**: “옛 렌더링 때 저장해둔 함수(옛 렉시컬 환경을 가진 클로저)” 그대로 재사용
    

하는 식으로 움직입니다.

> 문제는, 우리가 deps를 잘못 적으면 React가 **옛 클로저를 영원히 재사용**하게 되고,  
> 그 결과 “화면은 최신 값인데, 함수는 옛날 값만 보는” **stale closure** 현상이 생긴다는 점입니다.

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
      hooks[currentHook] = hooks[currentHook] ?? initialValue;
      const setStateIndex = currentHook;
      const setState = (newState) => (hooks[setStateIndex] = newState);
      return [hooks[currentHook++], setState];
    },

    // 👇 useCallback / useMemo / useEffect 모두 비슷한 패턴
    useCallback(callback, depArray) {
      const index = currentHook;
      const prevHook = hooks[index]; // 지난 렌더링에서 저장해둔 {value, deps}

      const hasChanged =
        !prevHook ||
        !depArray ||
        !depArray.every((el, i) => el === prevHook.deps[i]);

      if (hasChanged) {
        // deps 변화 → 새 콜백(새 클로저)와 새 deps 저장
        hooks[index] = { value: callback, deps: depArray };
        console.log(`✅ [업데이트] ${index}번 훅: 새 함수 저장`);
      } else {
        // deps 동일 → 지난 렌더링에서 저장한 함수 재사용
        console.log(`⛔ [재사용] ${index}번 훅: 옛 함수 그대로 사용`);
      }

      currentHook++;
      return hooks[index].value; // 실제 컴포넌트에 넘겨줄 함수
    },
  };
})();
```

예시: 화면은 바뀌는데, 첫 값만 기억하는 경우

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ deps 누락: count를 쓰면서 deps에는 넣지 않음
  const logCount = useCallback(() => {
    console.log("logCount 안의 count:", count); // 첫 렌더 때의 count 캡처
  }, []); // 👈 빈 배열

  return (
    <>
      <div>count: {count}</div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={logCount}>log</button>
    </>
  );
}
```

기대하는 동작

* `+` 버튼을 여러 번 눌러서 `count`가 3까지 올라갔다면
    
* `log` 버튼을 누를 때마다
    
    → `logCount 안의 count: 3` 이 찍히길 기대
    

실제 동작 (stale closure)

* `+`로 화면의 `count`는 0 → 1 → 2 → 3 잘 올라가지만
    
* `log` 버튼을 여러 번 눌러도
    
    → `logCount 안의 count: 0` 만 계속 찍힘
    

메모리 관점에서 한 번 더 보자면

(A) 첫 번째 렌더링 — `Counter()` 최초 호출

**\[Stack 영역 - 작업장\]**

* Counter 실행 컨텍스트 (EC-1, 주소: SP-10)
    
    * LexicalEnvironment → `Heap-100`
        

**\[Heap 영역 - 창고\]**

1. **Lexical Environment (Heap-100)**
    
    ```plaintext
    {
      count: 0,
      setCount: function …,
    }
    ```
    
2. `logCount` 콜백 함수 객체 (Heap-501)
    
    ```plaintext
    {
      code: "console.log(count)",
      [[Environment]]: Heap-100  // count = 0 이 들어 있는 환경
    }
    ```
    
3. **React Hook 저장소 (useCallback 한 칸)**
    
    ```plaintext
    Hook[0] = {
      value: Heap-501,   // count=0 을 캡처한 함수
      deps: []           // 빈 배열
    }
    ```
    

→ 이 시점 이후로, 컴포넌트가 어떤 이유로 다시 렌더링되더라도

`Hook[0].value`에는 Heap-501(옛 콜백)이 계속 남아 있게 됩니다.

---

(B) 두 번째 렌더링 — 버튼 클릭 → `setCount(1)` → Counter 재호출

**\[Stack 영역\]**

* Counter 실행 컨텍스트 (EC-2, 주소: SP-20)
    
    * LexicalEnvironment → `Heap-200`
        

**\[Heap 영역\]**

1. **새 Lexical Environment (Heap-200)**
    
    ```plaintext
    {
      count: 1,              // 최신 값
      setCount: same function
    }
    ```
    
2. **새롭게 만들어진 logCount 콜백 (Heap-502)**
    
    ```plaintext
    {
      code: "console.log(count)",
      [[Environment]]: Heap-200  // count=1 을 캡처한 새 클로저
    }
    ```
    

이제 `useCallback` 훅이 호출되면, MyReact는 이런 결정을 합니다:

* 지난 렌더링 때 저장된 Hook\[0\].deps = `[]`
    
* 이번 렌더링에서 받은 depArray = `[]`
    
* 비교 결과: **변화 없음**
    

그래서:

* ❌ Heap-502 (새 콜백, 최신 렉시컬 환경)는 **저장하지 않고 버림** (GC 대상)
    
* ✅ Hook\[0\].value 는 여전히 **Heap-501 (count=0을 캡처한 옛 함수)**
    

```plaintext
Hook[0] = {
  value: Heap-501,  // 여전히 count=0을 잡고 있는 함수
  deps: []
}
```

따라서 이후 사용자가 `log` 버튼을 누를 때마다 실행되는 건:

```plaintext
Hook[0].value === Heap-501 // 첫 렌더에서 만든 그 함수
```

이고, 이 함수는 **항상** `[[Environment]] → Heap-100 (count=0)` 만 본다.

그래서 로그는 계속 `0`만 찍히는 것.

4. ### **Lint 규칙을 켜야 하는 이유**
    

이 원리를 이해하면 "의존성 배열에는 사용하는 모든 변수를 적어야 한다(Don't lie to React)"는 린트(Lint) 규칙이 논리적 오류를 막기 위한 필수 안전장치임을 알 수 있습니다. `eslint-plugin-react-hooks` 의 `exhaustive-deps` 규칙은 자바스크립트 클로저의 특성상 발생할 수밖에 없는 논리적 오류를 막아주는 **안전벨트**입니다.

이것은 단순한 잔소리가 아닙니다.

1. 컴포넌트는 렌더링마다 **새로운 환경**을 만듭니다.
    
2. 의존성 배열을 생략하면, 리액트는 **과거의 환경**을 기억하는 함수를 강제로 재사용합니다.
    
3. 결국 Stale Closure가 발생합니다.
    

따라서 린트 규칙을 `Error`로 설정하여, 리액트가 항상 올바른 시점의 상태를 참조하도록(필요할 때만 클로저를 갱신하도록) 강제하는 것이 안전합니다.

---

5. ### 의존성 배열과 함수&객체
    

하지만 모든 변수를 deps에 넣다 보면 또 다른 문제가 생깁니다. 객체나 배열은 매 렌더링마다 참조 주소가 바뀌기 때문에, 내용이 같아도 `useEffect`가 무한 실행될 수 있습니다.

문제 상황: 객체의 참조 동일성

```jsx
function MyComponent() {
  // 렌더링 될 때마다 새로운 객체가 생성됩니다!
  // 내용({a:1})은 같아도, 메모리 주소(0x100 -> 0x200)는 다릅니다.
  const options = { filter: true }; 

  useEffect(() => {
    fetchData(options);
  }, [options]); // 🚨 무한 루프 발생
}
```

자바스크립트 엔진 입장에서 `{}` 리터럴을 만난다는 건 "Heap 메모리에 새로운 공간을 할당하라"는 명령입니다. 리액트는 얕은 비교를 하기 때문에, 내용이 같아도 메모리 주소가 다르면 "값이 바뀌었다"고 판단합니다.

* **원칙:** `options`를 쓰니까 deps에 넣어야 한다.
    
* **현실:** 넣었더니 매 렌더링마다 주소가 바뀌어서 Effect가 계속 실행된다.
    

6. 해결책: useRef와 제어권의 분리
    

**"실행 트리거(Trigger)"와 "값의 읽기(Read)"를 분리**하는 것입니다.

이때 등장하는 것이 `useRef`입니다.

```jsx
// 1. useRef는 렌더링과 상관없이 같은 ref 객체를 재사용합니다.
const optionsRef = useRef(options);

// 2. 매 렌더링마다 상자 안의 내용물만 최신으로 갈아끼웁니다. (Effect 실행 트리거 X)
// Mutation은 리렌더링을 유발하지 않습니다.
useEffect(() => {
  optionsRef.current = options;
});

useEffect(() => {
  // 3. Effect 실행 시점에는 ref를 통해 최신 값에 접근합니다.
  // 의존성 배열에서 options를 제거해도 안전합니다.
  fetchData(optionsRef.current);
}, [trigger]); // trigger가 바뀔 때만 실행됨
```

왜 useRef인가?

useRef는 컴포넌트가 마운트되어 있는 동안, 같은 ref 객체를 계속 재사용하는 Mutable한 컨테이너입니다. 리렌더링이 일어나도 이 객체 자체는 바뀌지 않고, .current 값만 바뀝니다. 리액트에게 "값이 바뀌었다"고 알리지 않으면서(리렌더링 방지), 언제든 최신 값을 꺼내 볼 수 있는 창구 역할을 하는 것이죠.

### 마치며

해당 학습을 마치고 저희 프로젝트를 다시 살펴보니 굳이 `useEffect`와 `useRef`로 복잡하게 데이터를 동기화할 필요가 없었습니다.

사용 중이던 `react-hook-form` 라이브러리의 `values` 옵션이 이 모든 것을 내부적으로 더 우아하게 처리해주고 있었기 때문입니다.

```javascript
const { data } = useQuery({ ...

const form = useForm({
  // values에 데이터를 넘기면 라이브러리가 Deep Compare 후 알아서 동기화
  values: data?.formData, 
});
```

**react-hook-form 내부 원리:**

RHF 내부적으로도 useEffect를 사용하지만, 들어온 values prop을 **Deep Equal(깊은 비교)** 하거나 최적화된 로직을 통해 값이 진짜로 의미 있게 변경되었을 때만 폼을 갱신합니다. 즉, 개발자가 직접 해야 할 useRef나 비교 로직을 라이브러리가 대신 해주고 있었던 것입니다.

이번 `exhaustive-deps` 경고는 저에게 두 가지를 가르쳐 주었습니다.

1. 리액트가 상태를 기억하는 원리(클로저)와 메모리 구조를 이해해고, "왜 경고가 뜨는지" 알 수 있었다.
    
2. 원리를 알면 `useRef` 같은 해결책을 쓸 수도 있고, 잘 만들어진 추상화(라이브러리)를 적절히 선택할 수도 있다.
    

리액트 훅의 원리를 다시 한번 파헤쳐 보면서 깨달은 점은, **결국 '기본기'가 가장 중요하다**는 사실이었습니다. 결국 클로저(Closure)와 실행 컨텍스트 등 **자바스크립트라는 언어의 가장 본질적인 특성을 아주 영리하게 활용한 결과물**일 뿐이었습니다.

이제는 단순히 “잘 돌아가는 코드”를 넘어서, **“왜 잘 돌아가는지 이해하고 작성하는 코드”가 더 중요하다**는 것을 한번 더 느끼게 되었습니다.