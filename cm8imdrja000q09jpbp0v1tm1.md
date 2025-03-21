---
title: "SPA에서 History API로  직접 라우팅 구현하기 ①"
seoTitle: "SPA Routing with History API"
seoDescription: "Learn to implement routing in SPAs using the History API to change URLs and update UI without page reloads, fostering enhanced user experience"
datePublished: Fri Mar 21 2025 10:10:53 GMT+0000 (Coordinated Universal Time)
cuid: cm8imdrja000q09jpbp0v1tm1
slug: spa-history-api

---

이번 포스팅에서는 라우팅을 직접 구현하면서 마주한 문제들과, 이를 해결해가는 사고의 흐름을 정리해보고자 한다.

### 🧭 목표

> SPA에서 `a 태그`나 `URL 이동`을 했을 때 페이지 새로고침 없이,  
> **적절한 화면(UI)만 바꿔주는 라우팅을 직접 구현한다.**

### **1️⃣** 문제 정의

보통 페이지 전환을 어떻게 구현하지..?

* **기존 MPA 방식**: **브라우저 + 서버**가 페이지와 라우팅을 처리
    
    * **URL 해석**: 브라우저가 경로를 보고 서버에 요청
        
    * **라우팅 로직**: 서버가 요청 경로에 맞는 HTML 반환
        
    * **화면 전환**: 서버가 새 HTML 전송 → 전체 페이지 새로고침
        
* **반면 SPA 방식**: **브라우저 + JavaScript**가 라우팅을 처리
    
    * **URL 해석**: 브라우저는 주소만 바꾸고, 실제 화면 변경은 JavaScript가 처리
        
    * **라우팅 로직**: JavaScript(라우터)가 URL에 따라 컴포넌트를 렌더링
        
    * **화면 전환**: JavaScript가 기존 HTML 유지한 채 일부만 변경
        

그런데 문제는…

> ❌ 브라우저는 기본적으로 **URL이 바뀌면 서버에 요청**하려고 한다  
> 👉 하지만 SPA에서는 **URL은 바뀌되**, 새로고침 없이  
> 해당 URL에 맞는 화면을 **JS로 직접 렌더링**해야 한다.

---

### **2️⃣** 필요에 따른 도구 및 방법 탐색

* 그럼 새로고침 없이 브라우저의 URL 변경은 해주는 방법이 뭐지?
    

→ 아 이걸 도와주는 게 바로 **History API 구나!**

---

### **3️⃣** 도구 학습 : History API 학습

* `history.pushState()` : URL 변경 + 새로고침 없음
    
* `popstate` 이벤트 : 뒤로/앞으로 버튼 클릭 시 발생
    

→ 이걸 이용하면 **SPA에서도 브라우저 주소창과 UI를 동기화**할 수 있겠다!

---

### **5️⃣** 구조 설계: 라우터가 해야 할 일

| 기능 | 설명 |
| --- | --- |
| 경로 등록 | URL에 맞는 렌더링 함수(컴포넌트)를 등록 |
| 렌더 함수 | 현재 URL에 맞는 화면을 렌더링 |
| 이동 함수 | JS로 URL을 바꾸고 렌더링도 실행 |
| popstate 대응 | 뒤로가기/앞으로가기 시 렌더링 다시 실행 |
| 초기 진입 처리 | 새로고침 시 현재 URL에 맞는 화면 보여주기 |

---

### **6️⃣** 구현하기: 라우터 기능별 코드 작성

① 경로 등록

```javascript
const routes = {};

function addRoute(path, pageRenderer) {
  routes[path] = pageRenderer;
}
```

---

② 렌더 함수

```javascript
function render(path) {
  const page = routes[path] || routes["/404"];
  document.querySelector("#content").innerHTML = page();
}
```

---

③ 이동 함수 (JS로 경로 바꾸기)

```javascript
function navigateTo(path) {
  history.pushState(null, "", path);  // 주소는 바뀌지만 새로고침 X
  render(path);
}
```

---

④ 뒤로/앞으로 가기 대응 및 초기 진입 처리

```javascript
function initRouter() {
  window.addEventListener("popstate", () => {
    render(window.location.pathname);
  });

  render(window.location.pathname);
}
```

---

⑤ 전체 라우터 조립

```javascript
export const router = function () {
  const routes = {};

  function addRoute(path, pageRenderer) {
    routes[path] = pageRenderer;
  }

  function render(path) {
    const page = routes[path] || routes["/404"];
    document.querySelector("#content").innerHTML = page();
  }

  function navigateTo(path) {
    history.pushState(null, "", path);
    render(path);
  }

  function initRouter() {
    window.addEventListener("popstate", () => {
      render(window.location.pathname);
    });
    render(window.location.pathname);
  }

  return { addRoute, navigateTo, initRouter };
};
```

목표 확인 → 문제 발견 및 정의 → 필요에 따른 도구 및 방법 탐색 → (필요한 경우) 도구 및 방법 학습 → 구조 설계 → 기능 구현

### 🔄 흐름 요약

SPA를 만들고 싶은데 → 페이지 전환은 어떻게 하지?  
→ 브라우저 주소는 바뀌어야 하는데, 새로고침은 안 돼고...  
→ 근데 기본 브라우저 동작은 새로고침이 일어남..  
→ 그럼 새로고침 없이 주소를 바꿀 방법이 뭐지?  
→ 아 History API가 그걸 해줌! (pushState, popstate)  
→ 그럼 이제 JS가 URL을 보고 화면을 바꾸는 "라우터" 역할을 직접 해야겠다!