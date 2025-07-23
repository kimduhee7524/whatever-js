---
title: "AbortController"
datePublished: Wed Jul 23 2025 12:37:03 GMT+0000 (Coordinated Universal Time)
cuid: cmdfy7crw000602jr7ta91rs1
slug: abortcontroller

---

프론트엔드 개발을 하다 보면, 서버와 데이터를 주고받기 위해 `fetch`와 같은 **비동기 웹 요청**을 자주 사용하게 됩니다. 하지만 이러한 비동기 요청은 예측하기 어려운 여러 문제를 야기할 수 있습니다.

* 응답이 너무 오래 걸리는 경우
    
* 사용자가 페이지를 벗어났는데도 요청은 계속 진행 중인 경우
    
* 이전 요청의 응답이 나중에 도착해서 UI가 꼬이는 경
    

이처럼 **제어되지 않는 비동기 요청**은 퍼포먼스와 사용자 경험 모두에 악영향을 줄 수 있습니다.  
이럴 때 이런 비동기 요청을 **중간에 취소할 수 있다면** 어떨까요?  
바로 그걸 가능하게 해주는 도구를 브라우저가 제공해줍니다.

---

### **1️⃣**`AbortController`란?

`AbortController`는 브라우저에서 제공하는 **표준 Web API**입니다. 이름 그대로, **요청을 "중단(abort)"할 수 있게 해주는 컨트롤러**예요.  
쉽게 말해, **요청을 "중간에 멈출 수 있게 해주는 리모컨**" 같은 거예요.

AbortController를 사용하면 얻을 수 있는 이점:

* **불필요한 요청 제거** → 네트워크 비용 절감
    
* **UI 상태 꼬임 방지** → UX 향상
    
* **레이스 컨디션 방지** → 최신 데이터만 반영
    

요청을 보낼 때 `AbortSignal`을 함께 전달해두고,  
필요할 때 `.abort()` 메서드를 호출하면 해당 요청을 즉시 중단할 수 있습니다.

### **2️⃣**기본 사용법

```javascript
const controller = new AbortController(); // 1. AbortController 인스턴스 생성

fetch('/api/data', { signal: controller.signal }) // 2. 요청에 signal 전달
  .then(res => res.json())
  .then(data => {
    console.log('✅ 응답 도착:', data);
  })
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('⛔ 요청이 중단됨!');
    } else {
      console.error('❌ 다른 에러', err);
    }
  });

fetchData()
.then()
.catch(error=>{
  if(error.name === "AbortError"){

  }
})

setTimeout(() => {
  controller.abort(); // 1초 후 요청 취소 시도
}, 1000);
```

### **3️⃣**전체 동작 흐름 이해하기

1. **요청을 컨트롤하는 AbortController 생성**
    

```javascript
const controller = new AbortController();
```

* 이 컨트롤러는 **"요청을 중단시킬 수 있는 리모컨"** 같은 역할이에요.
    
* controller 객체는 signal 프러퍼티와 abort() 메서드를 가집니다
    

---

2. API 요청을 보낼때 `controller.signal`을 함께 전달
    

```javascript
fetch('/api/anything', {
  signal: controller.signal,
});
```

* 이 `signal`이 바로 요청 취소를 감지할 **수신기** 역할을 합니다.
    
* 이 시그널을 넣으면, `fetch()`는 **"이 시그널이 취소되면 요청을 멈춰야겠다"** 하고 등록해놓습니다.
    

---

3. 이후 필요할 때 `.abort()` 호출
    

```javascript
controller.abort();
```

* 이걸 호출하면:
    
    * `signal.aborted === true`로 변경
        
    * 내부적으로 fetch 요청이 **즉시 중단(cancel)** 됨
        
    * `.catch()`로 **AbortError**가 날아옵니다
        
* **signal.reason**
    
    * abort() 메서드에는 `중단이유`를 인자로 넘겨줄 수 있습니다. 여러 케이스에 따라 요청을 중단할 수 있습니다.
        
    * `controller.abort("응답시간이 너무 깁니다")`
        

| 단계 | 설명 |
| --- | --- |
| `new AbortController()` | 컨트롤러 생성 (abort 리모컨) |
| `controller.signal` | fetch에 넘길 감시 대상 |
| `{ signal: controller.signal }` | fetch에 연결하면 취소 가능해짐 |
| `controller.abort()` | 실제로 요청을 멈추는 트리거 |

### **4️⃣**브라우저 내부에서 일어나는 일

1. `fetch(..., { signal })` 호출 시
    
    * 브라우저는 `signal.addEventListener('abort', ...)` 등록
        
    * 내부적으로는 이 이벤트가 발생하면 → 요청 취소 로직으로 연결됨
        
2. 나중에 `controller.abort()`가 호출되면
    
    * `signal.dispatchEvent('abort')` 발생
        
    * 리스너에 등록돼 있던 fetch가 그 이벤트를 감지함
        
    * 브라우저가 HTTP 요청을 중단하고, Promise를 reject시킴 → `AbortError`
        

### **5️⃣**상태 확인: `signal.aborted`

**aborted** 읽기 전용 프로퍼티는 신호가 통신하는 DOM 요청이 취소되었는지(true) 그렇지 않은지(false)를 나타내는 Boolean을 반환한다.

```javascript
const controller = new AbortController();
console.log(controller.signal.aborted); // false
controller.abort();
console.log(controller.signal.aborted); // true
```

이렇게 `aborted` 값을 통해 **취소 여부를 체크**할 수 있습니다.

### **6️⃣**AbortController 는 주로 언제 쓰나요?

* 요청이 여러 번 빠르게 연속해서 발생하는 상황 (검색어 입력 등) → 중복 요청 방지
    
* 오래 걸릴 수 있는 요청이 컴포넌트가 사라지기 전에 중단돼야 할 때
    
* 최신 요청 응답만 반영되도록 하고 싶을 때 (레이스 컨디션 방지)
    

예제: 검색 자동완성에서 중복 요청 방지

```javascript
let controller: AbortController | null = null;

const search = async (query: string) => {
  if (controller) {
    controller.abort(); // 이전 요청 중단
  }

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const res = await fetch(`/api/search?q=${query}`, { signal });
    const data = await res.json();

    if (!signal.aborted) {
      console.log('🔍 검색 결과:', data);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⛔ 요청 취소됨');
    } else {
      console.error('❌ 에러 발생:', err);
    }
  }
};
```

* 사용자가 검색어를 빠르게 바꾸면 **기존 요청을 중단**
    
* **최신 요청의 결과만 반영**
    
* 서버 리소스와 네트워크 낭비를 막을 수 있음
    

### 7️⃣ 다른 라이브러리에서는 어떻게 활용할까요?

1. #### Axios와 함께 쓰기
    

Axios는 예전에는 자체적으로 `cancelToken`을 사용했지만, **v1.1.0 이후부터는** `AbortController`를 공식 지원합니다.

```javascript
const controller = new AbortController();

axios.get('/api/data', {
  signal: controller.signal,
})
  .then(res => console.log(res.data))
  .catch(err => {
    if (axios.isCancel(err)) {
      console.log('⛔ 요청 취소됨');
    } else {
      console.error(err);
    }
  });

controller.abort();
```

2. #### React Query에서 사용하기
    

React Query에서는 `queryFn` 내부에서 직접 `AbortSignal`을 사용할 수 있도록 `context.signal`을 제공해줍니다.

```javascript
useQuery({
  queryKey: ['data'],
  queryFn: async ({ signal }) => {
    const res = await fetch('/api/data', { signal });
    return res.json();
  },
});
```

이렇게 하면, 컴포넌트가 언마운트되거나, 쿼리가 리패치될 때 **기존 요청이 자동으로 취소**되어 메모리 누수나 레이스 컨디션을 방지할 수 있어요.

---

이렇게 `AbortController`는 브라우저 기본 API뿐만 아니라 Axios, React Query 같은 서드파티 라이브러리와도 유기적으로 연결되어 있습니다. 이제 요청을 "보내기만 하는" 코드를 넘어서, 요청을 제어하고 관리하는 코드를 작성할 수 있습니다.