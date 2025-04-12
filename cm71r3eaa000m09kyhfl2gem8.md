---
title: "[js] 실행 컨텍스트, 스코프 체인, 클로저"
seoTitle: "JavaScript: Context, Scope, Closure"
seoDescription: "JavaScript 실행 컨텍스트, 스코프 체인, 클로저의 개념"
datePublished: Wed Feb 12 2025 10:11:00 GMT+0000 (Coordinated Universal Time)
cuid: cm71r3eaa000m09kyhfl2gem8
slug: js-1
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1739336850570/2c334cda-42a2-4329-a969-b1dc0524875a.png
tags: 7yg066gc7kca, 7iuk7zaj7luo7ywn7iqk7yq4, 7iqk7l2u7zse7lk07j24

---

## 📌 실행 컨텍스트

실행 컨텍스트는 **코드를 실행하는 데 필요한 정보를 담고 있다.** 주로 **함수가 실행될 때 생성되며, 실행이 끝나면 사라지는** 스택 기반 구조를 따른다.  
이러한 원리에 따라 실행 컨텍스트는 **콜 스택(Call Stack)** 에 쌓이며, **가장 마지막에 추가된 컨텍스트부터 실행됨으로써** 함수 실행 순서를 관리한다.  
이 방식 덕분에 **코드 실행 순서와 실행 환경이 일관되게 유지된다**.

```jsx
var a = 1
function outer() {
  // --------------------------- [2]
  function inner() {
    // ------------------------- [4]
    console.log(a) // ---------- [5]
    var a = 3 // --------------- [6]
  }
  inner() // ------------------- [3]
  console.log(a) // ------------ [7]
}
outer() // -------------------- [1]
console.log(a) // --------------[8]
```

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1739332739830/4af405b0-b5ee-48f1-8dc0-0a40bd62abf7.png align="center")

실행 컨텍스트의 주요 정보

* **VariableEnvironment** (변수 환경)
    
* **LexicalEnvironment** (렉시컬 환경)
    
* **ThisBinding** (`this` 바인딩)
    

**VariableEnvironment** 와 **LexicalEnvironment** 는 아래 두 가지 요소를 포함한다

* **EnvironmentRecord (환경 기록)**
    
    * 변수, 함수 선언을 저장하는 객체 → **호이스팅과 관련**
        
* **OuterEnvironmentReference (외부 환경 참조)**
    
    * **스코프 체인**을 따라 외부 환경을 참조 → **클로저와 관련**
        

**VariableEnvironment** 와 **LexicalEnvironment에 대한 자세한 내용은 이전 포스팅참고**👇[https://ddoit.hashnode.dev/variableenvironment-lexicalenvironment](https://ddoit.hashnode.dev/variableenvironment-lexicalenvironment)

---

### 🔍 **OuterEnvironmentReference** 란?

실행 컨텍스트가 생성될 때, 함수가 선언된 위치(렉시컬 스코프)를 기준으로 `OuterEnvironmentReference`가 설정된다.

자바스크립트에서 변수를 찾을 때는 **스코프 체인(Scope Chain)** 을 따라간다.

1. **현재 실행 컨텍스트의 EnvironmentRecord**에서 변수를 찾음.
    
2. 없으면 **OuterEnvironmentReference(외부 환경 참조)** 를 따라 **상위 컨텍스트**로 이동.
    
3. 계속 올라가다가 **전역 컨텍스트까지 가도 없으면 ReferenceError 발생**.
    

```jsx
function outer() {
  let x = 10;
  
  function inner() {
    console.log(x); // outer()의 x를 찾을 수 있음!
  }
  
  inner();
}

outer(); // 10
```

1. `inner()` 실행 컨텍스트가 생성됨
    
2. `inner()` 안에는 `x`가 없으므로 **OuterEnvironmentReference를 통해** `outer()`의 x를 찾음
    
3. `console.log(x);` 실행 → `10` 출력
    

➡️ **이 과정이 스코프 체인(Scope Chain)!**

➡️ **클로저(Closure)도 이 원리를 기반으로 동작함!**

---

## 📌클로저란?

**클로저(Closure)** 는 **"외부 함수의 변수(스코프)를 참조하는 내부 함수"**  
➡️ **외부 함수가 종료된 후에도, 내부 함수가 그 변수를 계속 사용할 수 있는 상태**

1️⃣ `foo()` 실행 → 실행 컨텍스트 생성  
2️⃣ `x = 10` 메모리에 저장  
3️⃣ `console.log(x)` 실행 (출력: `10`)  
4️⃣ `foo()` 실행 종료 → **실행 컨텍스트가 콜 스택에서 제거됨!**  
5️⃣ `x = 10`도 더 이상 참조되지 않으므로, 가비지 컬렉션(GC)이 메모리에서 삭제함!

✔ **즉, 실행 컨텍스트가 사라지면, 일반적으로 함수 내부의 변수들도 삭제됨.**  
✔ **하지만! 클로저가 있으면, 변수가 삭제되지 않고 유지된다!**

✅ **예제 1: 클로저가 없는 경우**

```jsx
function outer() {
  let count = 0;
}

outer();
console.log(count); // ❌ ReferenceError
```

1. `outer()` 실행 → 실행 컨텍스트 생성
    
2. `count = 0` 메모리에 저장
    
3. `outer()` 실행 종료 → **실행 컨텍스트가 콜 스택에서 제거됨!**
    
4. `count = 0`도 더 이상 참조되지 않으므로, 가비지 컬렉션(GC)이 메모리에서 삭제함!
    
5. `console.log(count);` 실행 시 변수 `count`를 찾을 수 없음 → `ReferenceError` 발생.
    

➡️ **즉, 함수가 종료되면** 함수 내부의 변수들도 삭제된다.

---

✅ **예제 2: 클로저를 사용한 경우**

```jsx
function outer() {
  let count = 0;

  return function inner() {
    count++; // 외부 변수 count를 계속 사용할 수 있음
    console.log(count);
  };
}

const counter = outer(); // outer() 실행 후 inner() 반환
counter(); // 1
counter(); // 2
counter(); // 3
```

1. `outer()` 실행 → 실행 컨텍스트 생성
    
    * `count = 0` 메모리에 저장
        
    * inner() 함수가 선언후 반환됨.
        
2. outer() 실행 종료 → 실행 컨텍스트 제거
    
    * 일반적으로 실행 컨텍스트가 제거되면 `count = 0`도 삭제되어야 하지만 inner() 함수가 스코프체인을 따라 `count`를 참조하고 있기 때문에, **GC(Garbage Collection)가** x를 메모리에서 **제거하지 않음!**
        
3. `counter();` 실행 → `count`가 여전히 메모리에 남아 있어서, `count++`가 실행되면서 값을 유지함.
    

➡️ 즉, 실행 컨텍스트는 사라졌지만, 클로저가 변수를 참조하고 있기 때문에`count`는 메모리에 남아 있음!  
➡️ **클로저는 실행 컨텍스트가 콜스택에서 사라진 후에도 특정 변수를 "힙 메모리"에 유지하는 개념이다!**  
➡️**실행 컨텍스트 자체는 사라지지만, 클로저가 참조하는 변수는 메모리에 남아 있다.**

✅ **예제 2: 클로저가 안 되는 경우 (값이 복사됨)**

```jsx
function outer() {
    let count = 0;

    return count; // ❌ 기본형(숫자)을 반환 (클로저 X)
}

const counter = outer();
const counter_ = outer();
console.log(counter); // 0 ✅
console.log(counter_); // 0 ✅
counter++;
console.log(counter); // 1 
console.log(counter_); // 0
```

* `outer()` 함수가 실행되면, `count = 0`이 생성됨
    
* `return count;`는 `count`라는 **변수 자체가 아니라**, 그 **값(0)**을 반환함
    
* `counter = 0;`이 되며 **원래의** `count`와는 연결이 끊김
    
* 즉 `counter`는 더 이상 `count`와 관계가 없음. 그냥 숫자 변수에 불과함
    
* 이건 클로저가 아님
    

➡️ **기본형 데이터를 반환하면, 값이 복사될 뿐 클로저가 되지 않음!**  
➡️ 클로저를 만들려면 함수(참조형 데이터)를 반환해야 한다!

---

### 🔍 **클로저가 왜 필요해?**

**클로저를 활용하면 변수를 숨기고 특정 함수에만 접근 권한을 주어 캡슐화를 할 수 있기 때문이다.**  
따라서 **클로저를 사용하면 변수는 반환된 함수 내에서만 접근이 가능하며, 외부에서는 직접 접근할 수 없다**

```jsx
// 사용자의 장바구니를 관리하는 함수
function createShoppingCart() {
    // private 변수들
    let items = [];
    let totalPrice = 0;

    return {
        // 상품 추가 함수
        addItem: function(item) {
            items.push(item);
            totalPrice += item.price;
            return `${item.name}이(가) 장바구니에 추가되었습니다.`;
        },

        // 상품 제거 함수
        removeItem: function(itemName) {
            const index = items.findIndex(item => item.name === itemName);
            if (index > -1) {
                totalPrice -= items[index].price;
                items.splice(index, 1);
                return `${itemName}이(가) 장바구니에서 제거되었습니다.`;
            }
            return "상품을 찾을 수 없습니다.";
        },

        // 장바구니 정보 조회 함수
        getCartInfo: function() {
            return {
                itemCount: items.length,
                total: totalPrice,
                items: [...items] // 배열의 복사본을 반환
            };
        }
    };
}

// 장바구니 사용 예시
const cart = createShoppingCart();

// 상품 추가
console.log(cart.addItem({ name: "노트북", price: 1000000 }));
console.log(cart.addItem({ name: "마우스", price: 50000 }));

// 장바구니 정보 확인
console.log(cart.getCartInfo());
// 출력: { itemCount: 2, total: 1050000, items: [...] }

// 상품 제거
console.log(cart.removeItem("마우스"));

// 직접 접근 불가능
console.log(cart.items);        // undefined
console.log(cart.totalPrice);   // undefined
```

✔ **데이터 은닉 (정보 보호)**  
✔ **상태 유지 (ex: 카운터, 설정 값)**  
✔ **비동기 처리 (setTimeout, eventListener)**

### 📝 **클로저 정리**

✔ **클로저는 내부 함수(inner function)다.**  
✔ **클로저는 외부 함수(outer function)의 변수를 참조한다.**  
✔ **외부 함수 실행이 끝나도, 내부 함수가 변수를 유지한다.**

**한 마디로: "함수가 끝난 후에도 변수를 유지하면, 그게 클로저다!"** 🚀