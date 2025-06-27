---
title: "Js 돌아보기2"
datePublished: Fri Jun 27 2025 11:48:14 GMT+0000 (Coordinated Universal Time)
cuid: cmcer0fuw002h02ichjgx11eb
slug: js-2

---

이전 포스팅에서 설명했듯이, 자바스크립트는 원래 웹페이지에 **간단한 동작**을 넣기 위한 언어로 시작했습니다. 그래서 자바스크립트는 다음처럼 설계됐습니다:

| 특징 | 설명 |
| --- | --- |
| 클래스 없음 | 개발자가 클래스를 정의하지 않아도 객체를 쉽게 만들 수 있게 |
| 실행 중 확장 가능 | 객체에 속성을 언제든 추가/삭제할 수 있게 |
| 함수 중심 설계 | 함수를 1급 객체로 만들고, 자유롭게 넘길 수 있게 |
| 유연한 상속 구조 | 복잡한 상속 계층 없이 객체끼리 직접 연결할 수 있게 |

이런 목표를 실현하기 위해 **프로토타입(Prototype)** 기반의 객체 구조가 도입된 겁니다.

---

1️⃣ 클래스 없이 객체를 만들기

JS는 **클래스 없이도 객체를 곧바로 만들 수 있습니다:**

```jsx
const dog = {
  name: "초코",
  bark() {
    console.log("멍멍");
  }
};
```

간단하고 직관적이죠. 하지만 공통 구조를 가진 객체를 **100**개 만들고 싶다면?

```xml
const dog = { ... };
const cat = { ... };
// 똑같은 구조를 계속 복붙해야 함
```

---

2️⃣ 객체를 반복해서 만드는 두 가지 방식

방법 1: Object.create() — 원형(프로토타입) 객체를 직접 연결

수동으로 원형을 설정하여 객체 생성

```jsx
const animal = {
  eats: true,
  walk() {
    console.log("걷는다");
  }

const dog = Object.create(animal); // animal을 원형으로 연결
dog.name = "초코";

console.log(dog.eats); // true ← 원형의 속성
dog.walk();  // animal(원형)에서 상속된 메서드
```

* `Object.create(proto)`로 객체를 만들면
    
* 새 객체의 `__proto__`가 proto로 연결됨
    
* `dog`는 `animal`을 복사하지 않고, animal을 **원형(prototype)으로 참조로 연결**합니다.
    
* 속성이 없으면 animal에게 물어보는 구조입니다.
    
* 이처럼 기존 객체를 원형으로 삼아 새로운 객체를 만드는 방식을 **원형 기반 생성**이라고 합니다.
    

방법 2. 생성자 함수 + `.prototype`

함수를 통해 원형을 지정하고 객체 생성 (`new`)

```jsx
function Animal(name, age) {
  this.name = name;
  this.age = age;
}

const dog = new Animal("초코" ,1);
const cat = new Animal("냥이",3);
```

그런데 아래와 같이 메서드를 생성자 함수 내부에 정의하면 어떻게 될까요?

```jsx
function Animal(name,age) {
  this.name = name;
  this.age = age;
  this.walk = function () {
    console.log(`${this.name} 걷는 중`);
  };
}

const dog = new Animal("초코" ,1);
const cat = new Animal("냥이",3);
```

이렇게 되면, `walk`함수가 **객체마다 새로 생성**되어 **비효율적**입니다(메모리 낭비)

---

모든 객체는 내부에 `[[Prototype]]` (또는 `__proto__`)이라는 숨겨진 참조를 가지고 있으며, **공통 기능은** `prototype`에 정의하는 것이 효율적입니다.

```jsx
function Animal(name) {
  this.name = name;
}
Animal.prototype.walk = function () {
  console.log(`${this.name} 걷는 중`);
};

const dog = new Animal("초코");
dog.walk (); // 초코 걷는 중
```

Animal.prototype.walk = ...  
처럼 함수를 prototype에 넣으면, **그 함수는 각 객체의** `[[Prototype]]`에 연결된 곳에 저장되고, **모든** 인스턴스는 그걸 **공유해서 참조하게 됩니다.**

✅ 많은 객체를 효율적으로 만들 수 있는 구조  
✅ ES6 `class` 문법도 이 구조 위에서 동작

👉 둘 다 결국 **프로토타입을 기반으로 새로운 객체를 만드는 방식**입니다.  
자바스크립트는 객체를 “복사”하지 않고, “연결”하여 재사용합니다.

---

3️⃣ Prototype이란?

> Prototype = 객체의 원형이자, 공통 기능이 담긴 참조 대상

객체는 어떤 속성을 찾을 때:

1. **자기 자신에게서 먼저 찾고**
    
2. **없으면 연결된 prototype 객체에서 찾습니다**
    

즉, 자바스크립트에서는 새로운 객체를 만들 때, **기존 객체(= 원형)를 참조해서** 필요한 부분만 추가하거나 바꿉니다.

```jsx
const dog = Object.create(animal);
// dog.__proto__ === animal
```

`dog`는 `animal`을 복사하지 않고, **필요한 속성이 없으면 animal(원형)에게 물어보는 구조**로 연결됩니다.

이 연결 구조를 **프로토타입 체인(prototype chain)**이라고 합니다.

---

4️⃣ 프로토타입 체인: 객체는 연결되어 있다

dog → animal → Object.prototype → null  
이처럼 객체는 직접 만든 속성뿐 아니라 **자신의 prototype**, 그 prototype의 prototype, 그 prototype의 prototype… 을 따라가며 속성을 찾습니다.

자바스크립트에서 상속은 곧 프로토타입 체인을 이용한 속성/메서드의 참조 연결입니다.

* 부모 역할의 객체가 원형이 되고
    
* 자식 객체는 필요시 부모를 참조해서 기능을 "상속처럼" 사용합니다
    

5️⃣ 프로토타입 체인과 shadowing 원리

> 속성(프로퍼티)은 “읽을 때”와 “수정/추가할 때” 작동 방식이 다릅니다.

읽을 때

```jsx
const animal = {
  eats: true,
};

const dog = Object.create(animal);
console.log(dog.eats); // true ← animal.eats에서 찾아옴
```

* 자신의 객체에 `eats`가 없으면
    
* 프로토타입 체인을 따라 올라가서 찾음
    

수정/추가할 때

```javascript
dog.eats = false;
```

* 이건 `animal.eats`를 바꾸는 게 아니라
    
* `dog`에 **새로운 eats 속성을 추가**하는 것!
    

```jsx
console.log(dog.eats);    // false ← dog에 생긴 속성
console.log(animal.eats); // true  ← 원형은 그대로
```

이처럼 **프로토타입 체인에서 같은 이름의 속성을 가리는 현상**을  
**shadowing** 또는 **(메서드일 경우) 오버라이딩**이라 부릅니다.

---

6️⃣ 원시값 vs 참조값 — 공유와 복사의 차이

객체 안에 속성의 "값"이 어떤 타입이냐에 따라 작동이 또 다릅니다.

✅ 원시값 (number, string 등)은 복사

```jsx
const parent = { age: 10 };
const child = Object.create(parent);

child.age = 99;

console.log(parent.age); // 10
```

* `child.age = 99`는 parent에서 복사한 게 아님
    
* 단순히 `child` 객체에 **새 속성을 추가**한 것
    
* 숫자는 **값 복사**이기 때문에 shadowing 발생
    

✅ 참조값 (object, array 등)은 주소 공유

```jsx
const parent = { info: { hobby: "sleep" } };
const child = Object.create(parent);

child.info.hobby = "code";

console.log(parent.info.hobby); // "code" ← 같은 객체 참조
```

* [`child.info`](http://child.info)는 [parent.info](http://parent.info)와 **같은 주소 공유**
    
* 객체는 **주소 참조**라서 내부 속성 수정이 부모에도 반영됨
    

---

7️⃣함수는 어떻게 ‘원형’을 제공할까?: 내부 동작: new 키워드의 작동 원리

자바스크립트는 함수를 생성자로 쓸 수 있습니다.

```jsx
const dog = new Animal("초코");
```

이 한 줄에서 일어나는 일:

1. 새로운 빈 객체 `{}`를 만든다
    
2. 그 객체의 `__proto__`를 `Animal.prototype`으로 연결한다
    
3. [`Animal.call`](http://Animal.call)`(새 객체, "초코")` 실행 → `this`는 새 객체를 가리킴
    
4. 완성된 객체 반환
    

즉, `new`는 **Object.create + this 바인딩**을 간단히 만든 문법입니다.

---

8️⃣ ES6 class는 결국 이 구조를 감싸는 문법적 설탕

```jsx
class Animal {
  constructor(name) {
    this.name = name;
  }
  eat() {
    console.log(this.name + " eats.");
  }
}
```

사실 이것도 내부적으로는 다음과 같은 구조입니다:

```jsx
function Animal(name) {
  this.name = name;
}
Animal.prototype.eat = function () { ... };
```

**class도 결국 prototype 기반**입니다. 외형은 달라졌지만, **내부 구조는 동일**해요.

---

🧠 그래서 왜 ‘프로토타입’이 필요했는가?

정리하면, JS에서 프로토타입이 필요한 이유는 다음과 같습니다:

| 필요성 | 설명 |
| --- | --- |
| **클래스 없이 객체 재사용** | 객체를 복사하지 않고, 원형을 참조하여 새로운 객체 생성 |
| **공통 기능의 공유** | 메서드를 prototype에 두고 여러 객체가 공유 |
| **유연한 확장성** | 원형 구조에 따라 언제든지 상속 구조 변경 가능 |
| **메모리 절약** | 같은 기능을 객체마다 복사하지 않고 연결해서 사용 |

---

✅ 최종 정리: 자바스크립트의 프로토타입은 이런 것이다

| 개념 | 설명 |
| --- | --- |
| **Prototype** | 객체의 원형, 공통 속성과 동작을 담는 본보기 |
| **Object.create(proto)** | 특정 객체를 원형으로 삼아 새 객체 생성 |
| **프로토타입 체인** | 속성/메서드를 찾을 때 상위 원형 객체들을 따라가는 구조 |
| **생성자 함수** | 함수 + `.prototype` 조합으로 객체 원형 제공 |
| **class 문법** | 기존 prototype 구조를 보기 좋게 감싼 껍데기 |

---

📌 결론: 프로토타입을 이해하면 자바스크립트 객체가 보인다

> 자바스크립트는 객체를 복사하지 않고, **연결**합니다.  
> 이 연결의 핵심이 **프로토타입**입니다.
> 
> 속성은 **읽을 때는 프로토타입 체인을 따라가고**,  
> **쓸 때는 자기 객체에 직접 저장**됩니다.  
> 이것이 바로 **shadowing**이고, 함수에 적용되면 **오버라이딩**입니다.