---
title: "호이스팅 & Tdz 정리"
seoTitle: "Variable vs Lexical Environment Differences"
seoDescription: "Explains the differences and roles of VariableEnvironment and LexicalEnvironment in JavaScript, especially before and after ES6 updates"
datePublished: Tue Feb 18 2025 10:30:19 GMT+0000 (Coordinated Universal Time)
cuid: cm7acfckn000409juh5nlfbpp
slug: variableenvironment-lexicalenvironment

---

## 호이스팅이란?

코드가 실행되기 전인 **실행 컨텍스트 생성 시점에** 변수나 함수 선언이 실행 전에 메모리에 등록되어, 코드 상에서는 마치 위로 끌어올려진 것처럼 보이는 현상입니다.

```javascript
console.log(msg); // undefined
var msg = "hello";
```

이 코드는 에러가 아니라 `undefined`를 출력합니다.  
왜냐면 자바스크립트는 실제로 이 코드를 **다음처럼 해석하기 때문**입니다:

```javascript
var msg;           // 선언만 먼저 끌어올림 (호이스팅)
console.log(msg);  // 그래서 undefined
msg = "hello";     // 할당은 원래 위치에서 실행됨
```

이것이 바로 **호이스팅**.

## 호이스팅은 실행 컨텍스트와 어떻게 연결될까?

자바스크립트는 **실행 전**에 한 번 전체 스코프를 스캔해서 **"무엇이 선언되었는지"는 미리 알고 시작**하려고 해요.

* 이는 **예측 가능한 실행**, **버그 방지**, **스코프 체인 구성**을 위해 필요
    
* 이 과정이 바로 **호이스팅**, 그리고 **실행 컨텍스트 생성 단계**
    
* 이후 실제 코드를 **한 줄씩 실행**하면서, 필요한 값을 계산하거나 동적으로 속성을 추가함
    

호이스팅은 실행 컨텍스트 생성 시점에 변수/함수 선언이 미리 메모리에 등록되면서 발생하는 현상입니다.

▶ 실행 컨텍스트 생성 단계 (간단 요약)

1. **변수 선언 수집**
    
2. **함수 선언 수집**
    
3. **스코프 설정**
    
4. `this` 바인딩 결정
    

이 시점에서 선언들이 메모리에 "등록"되며 이 현상을 호이스팅이라 부릅니다.

---

## 📌 ES6 이후: `let`, `const`의 등장과 스코프 개선

ES6 이후 **let, const 가 도입된 이유는 var에 문제가 많았기 때문입니다.**

문제 1: `var`는 호이스팅될 때 `undefined`로 초기화됨 → 의도치 않은 버그 발생 가능

```javascript
console.log(a); // undefined (에러 아님!)
var a = 10;
console.log(a); // 10
```

* `var`는 선언과 동시에 `undefined`로 초기화됨
    
* 이로 인해 선언 전에 접근해도 에러가 발생하지 않음.
    
* 문제는 초기화된 값(`undefined`)을 사용하게 되는 것, 즉 의도된 값이 할당되기 전 사용되는 문제
    
* 만약 개발자가 변수를 할당했다고 착각하고 `console.log(a + 1)` 같은 연산을 하면, 예기치 않은 버그가 발생할 수 있음.
    
* 이를 해결하기 위해, **선언 시 undefined로 초기화하지 않고**, **초기화되기 전에는 접근할 수 없도록** `let`과 `const`가 도입되었다.
    

---

**문제 2:** `var`는 함수 스코프만 가짐 → 블록 스코프(`{}`)를 무시함

```javascript
if (true) {
  var x = 100;
}
console.log(x); // 100 (블록 `{}` 내부에서 선언했지만, 밖에서도 접근 가능!)
```

* `{}` 안에서 선언했는데도 블록 밖에서도 접근 가능 → **블록 스코프가 없음!**
    
* 이를 해결하기 위해 **블록 스코프를 가진** `let`과 `const`가 도입됨.
    

---

**문제 3:** `var`는 중복 선언 가능 → 의도치 않은 변수 재정의 발생 가능

```javascript
var a = 10;
var a = 20; // 에러 없이 덮어쓰기 됨
console.log(a); // 20
```

* 같은 이름으로 변수를 선언해도 에러가 발생하지 않음 → **변수를 실수로 덮어쓰는 오류가 발생할 가능성이 높음.**
    
* 이를 해결하기 위해 `let`과 `const`는 중복 선언을 금지함.
    

---

## **📌** `let`과 `const`의 등장: `var`의 문제 해결!

위와 같은 `var`의 문제를 해결하기 위해 **ES6에서** `let`과 `const`가 도입되었다.

**해결책 1: TDZ(Temporal Dead Zone) 도입 → 선언 전 접근 불가**

```javascript
console.log(a); // ❌ ReferenceError (TDZ)
let a = 10;
console.log(a); // ✅ 10
```

* `let`과 `const`는 변수 **선언은 실행 컨텍스트 생성 시 이루어지지만**, **초기화는 실제 코드가 해당 줄에 도달할 때 수행**됩니다.
    
* 초기화되기 전까지는 **TDZ에 걸려 있어서 접근 자체가 불가능**합니다.
    
* 이렇게 함으로써, **선언 전에 실수로 사용하는 것을 근본적으로 막을 수 있게** 되었습니다.
    

👉 결과적으로, **예기치 않은 버그를 방지**하고 **논리적인 코드 흐름**을 강제할 수 있습니다.

⏳ 5. TDZ(Temporal Dead Zone)란?  
**"선언은 되었지만, 아직 초기화되지 않아 접근이 불가능한 상태"**

```javascript
console.log(x); // ❌ ReferenceError
let x = 5;
```

* `x`는 호이스팅되어 메모리에 올라갔지만, **초기화 전(TDZ)**이기 때문에 접근하면 **ReferenceError 발생**
    

TDZ가 생긴 이유

| 목적 | 설명 |
| --- | --- |
| ❌ 버그 방지 | 변수에 **초기화되기 전에 접근하는 실수**를 막기 위해 |
| ✅ 코드 예측성 | 모든 변수는 **초기화된 이후에만** 접근 가능하도록 제한 |
| ✅ 논리적 흐름 보장 | 실행 순서에 따라 **정확한 시점 이후에만 변수 사용**을 허용함 (호이스팅으로 인한 혼란 제거) |

---

**해결책 2: 블록 스코프 지원 →** `{}` 안에서만 유효함

```javascript
if (true) {
  let y = 200;
}
console.log(y); // ❌ ReferenceError (블록 밖에서는 접근 불가능!)
```

* **블록** `{}` 내부에서 선언된 변수는 블록을 벗어나면 사라짐 → 전역 오염 방지!
    
* `const`도 동일한 블록 스코프를 가짐.
    

---

**해결책 3: 중복 선언 방지**

```javascript
let z = 30;
let z = 40; // ❌ SyntaxError: Identifier 'z' has already been declared
```

* **같은 변수 이름을 여러 번 선언할 수 없도록 강제 → 실수 방지!**
    
* `const`도 동일하게 중복 선언 불가.
    

**👉 TDZ, 블록 스코프, 중복 선언 방지 기능을 추가해 더 안전한 코드 작성이 가능해졌다!**

---

| 타입 | 호이스팅 여부 | 초기 값 | 선언 전 접근 |
| --- | --- | --- | --- |
| `var` 변수 | ✅ 선언 & 초기화 됨 | `undefined` | ✅ 가능 (undefined) |
| `let` / `const` | ✅ 선언만 됨 (TDZ) | ❌ 초기화 X | ❌ ReferenceError |
| 함수 선언 (`function`) | ✅ 선언 & 초기화 됨 | 함수 전체 | ✅ 가능 (정상 실행) |
| 함수 표현식 (`var f = function()`) | ✅ 변수만 호이스팅 | `undefined` | ✅ 가능 (❌ TypeError) |
| 함수 표현식 (`let` / `const`) | ✅ 선언만 됨 (TDZ) | ❌ 초기화 X | ❌ ReferenceEr |

모든 변수와 함수 선언은 실행 컨텍스트 생성 시점에 **메모리에 등록(호이스팅)** 되지만,  
**초기화 시점**과 **접근 가능 여부(TDZ 적용 여부)**는 선언 방식에 따라 달라집니다