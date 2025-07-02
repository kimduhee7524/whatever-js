---
title: "콜백 함수란?"
seoTitle: "콜백 함수 정의 및 설명"
seoDescription: "콜백 함수란 무엇인지 이해하고, 비동기 처리 중 발생하는 문제를 해결하는 방법을 알아보세요"
datePublished: Thu Feb 20 2025 10:10:34 GMT+0000 (Coordinated Universal Time)
cuid: cm7d6ln0c000e09jsg3l55jd4
slug: 7l2c67cxio2vqoyimouegd8
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1740024399026/1a6ef510-0395-409a-82b8-8fd8835a2ac0.png
tags: 7l2c67cxio2vqoyima

---

### **🔍** 콜백 함수(Callback Function)란?

콜백 함수는 함수 또는 메서드에게 인자로 넘겨줌으로써 그 제어권을 함께 위임한 함수이다.  
제어권을 위임했다는 건 무슨 의미일까요?  
"제어권"은 주로 **호출 시점**, 즉 언제 실행될지를 결정하는 것을 의미한다.  
때로는 인자 전달이나 `this` 바인딩과 같이 실행 환경에 대한 제어도 포함되지만, 핵심은 함수의 실행 시점을 다른 함수에게 맡긴다는 점이다.  
즉, 콜백 함수를 위임받은 코드는 자체적으로 내부 로직에 따라 콜백 함수를 적절한 시점에 실행한다. 쉽게 말해 "이 작업이 끝나면 이 함수를 실행해줘"라고 지시하는 것과 같다.

```javascript
function executeCallback(callback) {
  console.log("콜백 함수를 실행합니다.");
  callback();
}

function myCallback() {
  console.log("이것이 콜백 함수입니다!");
}

executeCallback(myCallback);
```

```markdown
콜백 함수를 실행합니다.
이것이 콜백 함수입니다!
```

#### 📌 동기 콜백

* **동작:** 함수가 호출되는 즉시 실행된다.
    
* **특징:** 실행 순서가 코드 순서대로 진행된다.
    

#### 📌 비동기 콜백

* **동작:** 함수가 호출되어도 바로 실행되지 않고, 일정 시간이 지난 후나 특정 조건이 만족되었을 때 실행된다.
    
* **특징:** 예를 들어, `setTimeout`이나 이벤트 핸들러 등이 이에 해당하며, 실행 시점은 브라우저의 이벤트 루프가 결정한다.
    

---

### **🔍** 콜백 함수가 왜 필요할까?

자바스크립트에서는 다음과 같은 **비동기 처리**가 필요할 때가 많다:

* 파일 읽기/쓰기
    
* API 요청
    
* 데이터베이스 쿼리
    
* 타이머 함수
    

하지만 비동기 작업은 작업 완료 시점을 보장할 수 없기 때문에, 비동기 작업이 끝난 후 실행되어야 하는 코드를 콜백 함수로 전달하면 순서를 제어할 수 있다

📌 예제: 서버에 요청하고 데이터를 받아와서 특정 작업을 해야 하는 경우

#### ❌ 비동기 처리만 한 경우

```java
function fetchData() {
  setTimeout(() => {
    console.log("데이터 받아옴!");
  }, 2000);
}

console.log("1. 데이터 요청");
fetchData();
console.log("2. 다음 작업 실행");
```

```markdown
1. 데이터 요청
2. 다음 작업 실행
데이터 받아옴!
```

* **데이터를 가져오기 전에 "2. 다음 작업 실행"이 먼저 실행되는 문제가 발생!**
    
* 그럼 데이터를 받은 후에 특정작업을 실행하려면? **콜백 함수가 필요!**
    

---

✅ 콜백 함수 적용한 경우

```javascript
function fetchData(callback) {
  setTimeout(() => {
    console.log("데이터 받아옴!");
    callback();  // 데이터 받은 후 실행할 함수 호출
  }, 2000);
}

console.log("1. 데이터 요청");
fetchData(() => {
  console.log("3. 데이터 처리 완료");
});
console.log("2. 다음 작업 실행");
```

```markdown
1. 데이터 요청
2. 다음 작업 실행
데이터 받아옴!
3. 데이터 처리 완료
```

* 이제 데이터가 **완전히 로드된 후**에 `"3. 데이터 처리 완료"`가 실행되었다
    
* 즉, 콜백 함수를 사용하면 **비동기 작업의 결과를 처리**할 수 있다.
    

---

### **🔍** 콜백 함수의 단점과 해결책

콜백 지옥 (Callback Hell)

콜백을 너무 많이 사용하면 **코드가 복잡해지고 가독성이 떨어지는 문제**가 발생할 수 있다.

```javascript
getUser(userId, (user) => {
  getPosts(user, (posts) => {
    getComments(posts[0], (comments) => {
      console.log(comments);
    });
  });
});
```

* 이렇게 **콜백 함수가 중첩되면 코드가 유지보수하기 어려워진다.**
    

### 🔹 해결책: **Promise & async/await**

**Promise**나 **async/await**을 사용하면 코드를 더 깔끔하게 정리할 수 있다.

**1️⃣ Promise**

#### Promise(프로미스)는 비동기 작업의 결과(성공 또는 실패)를 나타내는 객체.

👉 쉽게 말하면, "**미래에 값이 반환될 것을 약속(Promise)하는 객체**"라고 보면 된다.  
👉 비동기 작업이 끝나면(예: 데이터 요청) 성공(`resolve`)하거나 실패(`reject`)하는 두 가지 상태로 나뉘어 처리된다.

* `resolve()`가 호출되면 `.then()` 실행
    
* `reject()`가 호출되면 `.catch()` 실행
    

```javascript
function getUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId) {
        resolve({ id: userId, name: "철수" });
      } else {
        reject("❌ 사용자 정보를 가져오지 못했습니다.");
      }
    }, 1000);
  });
}

getUser(1)
  .then(user => {
    console.log(`사용자: ${user.name}`);
    return getPosts(user);
  })
  .then(posts => {
    console.log(`게시글: ${posts}`);
    return getComments(posts[0]);
  })
  .then(comments => {
    console.log(`댓글: ${comments}`);
  })
  .catch(error => console.error("에러 발생:", error));  // 모든 에러를 처리
```

* 장점
    
    * Promise를 사용하면 `.then()`을 체이닝(연결)해서 사용하면, 중첩을 줄이고 가독성을 높일 수 있다.
        
* 단점
    
    * **콜백 함수보단 낫지만 비동기 작업이 많아질수록** Promise 또한 `.then()` 체이닝이 길어지고 가독성이 떨어진다.
        

**2️⃣** `Async/Await`

`await`은 **해당 Promise가 끝날 때까지 기다리는 문법이다.**  
`async/await`을 사용하면 **비동기 코드를 동기 코드처럼 읽을 수 있기 때문에 가독성이 훨씬 좋아짐!**

```javascript
async function fetchUserData(userId) {
  try {
    const user = await getUser(userId);
    console.log(`사용자: ${user.name}`);

    const posts = await getPosts(user);
    console.log(`게시글: ${posts}`);

    const comments = await getComments(posts[0]);
    console.log(`댓글: ${comments}`);
  } catch (error) {
    console.error("에러 발생:", error);
  }
}

fetchUserData(1);
```

* 장점
    
    * `await`을 사용하면 `.then()` 없이도 비동기 작업이 순차적으로 실행됨!
        
    * `try/catch`로 **에러 처리를 훨씬 직관적으로 할 수 있음!**
        
    * **비동기 코드가 동기 코드처럼 읽혀서 이해하기 쉬움!** 🚀
        
* 단점
    
    * 기본적으로 `await`은 **비동기 작업을 순차 실행**하므로 **여러 개의 요청을 병렬로 실행할 때는** `Promise`를 사용해야 함.
        

이 두 가지 방법은 각각의 장단점이 있으며, 상황에 따라 적절히 선택하여 사용해야 한다.

👉 직접 만드는 예시

```javascript
function confirm(message) {
  return new Promise((resolve) => {
    // 유저가 '확인' 누르면
    resolve(true);

    // 유저가 '취소' 누르면
    // resolve(false);
  });
}
```

그리고 이렇게 사용:

```javascript
const result = await confirm("정말 삭제할까요?");

if (result) {
  // 유저가 '확인'을 눌렀다!
} else {
  // 유저가 '취소'를 눌렀다!
}
```

**즉** `async/await`는 "기존 Promise를 더 쉽게 기다리는 문법"

### ✨ 콜백 함수 정리

✔ **콜백 함수란?** → **나중에 실행될 함수를 인자로 넘겨주는 것**  
✔ **콜백 함수가 필요한 이유?** → **비동기 작업의 실행 순서를 조정하기 위해**  
✔ **콜백 지옥을 피하려면** `Promise` **또는** `async/await`**을 활용하자!**  
✔ **가독성과 유지보수를 위해** `async/await`이 가장 추천됨  
✔ **병렬 실행이 필요하면** `Promise`를 함께 사용