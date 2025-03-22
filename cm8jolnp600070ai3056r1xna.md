---
title: "SPA에서 History API로 직접 라우팅 구현하기 ②"
datePublished: Sat Mar 22 2025 04:00:47 GMT+0000 (Coordinated Universal Time)
cuid: cm8jolnp600070ai3056r1xna
slug: spa-history-api-1

---

지난 포스팅에 이어, 이번 글에서는 라우팅을 직접 구현하면서 마주한 문제들과 그 해결 과정을 따라간 **사고의 흐름**을 정리해보고자 한다.

---

### **1️⃣** 현재까지의 구현

```jsx
export const router = function () {
  const routes = {};

  function addRoute(path, pageRenderer) {
    routes[path] = pageRenderer;
  }

  function render(path) {
    const pageRenderer = routes[path] || routes["/404"];
    if (pageRenderer) {
      document.querySelector("#content").innerHTML = pageRenderer();
    }
  }

  function navigateTo(path) {
    history.pushState(null, "", path);
    const pageRenderer = routes[path] || routes["/404"];
    if (pageRenderer) pageRenderer();
  }

  function initRouter() {
    window.addEventListener("popstate", () => {
      const path = window.location.pathname || "/";
      render(path);
    });
    const path = window.location.pathname || "/";
    render(path);
  }

  return { addRoute, navigateTo, initRouter };
};
```

그리고 아래처럼 라우트를 등록하면, 라우팅은 정상적으로 작동했다.

```javascript
myRouter.addRoute("/", Home);
myRouter.addRoute("/404", NotFound);
```

---

### **2️⃣** 문제 상황

* 그러나 게시글 상세 페이지와 같은 **동적 경로**(`/post/:id`)를 추가하려고 하자 문제가 발생했다.
    

```jsx
myRouter.addRoute("/post/:id", PostDetail);
myRouter.navigateTo("/post/123"); // ❌ 매칭 실패
```

### **3️⃣ 문제 원인 파악**

왜 실패했을까?

기존 라우터는 다음과 같이 문자열을 키로 사용하고 있다:

```jsx
routes = {
  "/": Home,
  "/404": NotFound,
  "/post/:id": PostDetail
}
```

* 이 구조는 단순히 문자열을 비교하는 방식이기 때문에,
    
* `"/post/:id"`와 `"/post/123"`은 **서로 다른 문자열**로 인식되어 매칭에 실패한다.
    
* 즉, `'/post/:id' !== '/post/123'` 이므로 매칭 실패
    

---

### **4️⃣** 필요에 따른 도구 및 방법 탐색

→ 고정된 문자열만 비교하는 건 한계가 있다...

→ 뭔가 더 유연한 경로 매칭이 필요한데,,

→ 유사한 패턴을 인식하고, 그 안에서 값을 추출할 수 있는 방법이 뭐지?

→ 아 **정규식이란 도구가 있구나!!**

---

### **5️⃣** 도구 학습

정규식을 사용하면 `:id`와 같은 동적 파라미터를 `([^/]+)`로 치환해 매칭할 수 있다.  
(정규식 패턴 작성은 GPT의 도움을 받음)

* match : 정규식 패턴과 일치하는 모든 부분을 한 번에 배열로 반환
    

→ 이걸 활용해서 경로를 매칭해서 구현하면 되겠다..!

---

### **6️⃣** 구조 재설계

그런데 기존 구조에서 정규식을 적용하려면 어떻게 바꿔야 할까?

→ 경로를 등록할 때, path랑 pageRenderer만 저장하는게 아니라, 정규식도 함께 저장해야겠네

→ 그리고 기존처럼 `path`를 키로 바로 찾는 방식은 사용할 수 없으니, path를 받으면 등록된 정규식 중에 path와 매칭되는 정규식이 있는지 먼저 찾아야겠네?

→ 그럼 하나씩 라우트들을 순회하면서 해당 경로와 매칭되는지 찾고

→ 찾으면 추출한 값을 pageRenderer 파라미터로 넘겨주는 방식으로 처리해야겠다.

### 7️⃣ 구현하기

① 경로 등록 시 정규식도 함께 저장

```javascript
function addRoute(path, pageRenderer) {
    const regex = new RegExp("^" + path.replace(/:([^/]+)/g, "([^/]+)") + "$");
    routes.push({
      path,
      regex,
      pageRenderer,
    });
  }
```

② 정규식으로 매칭 후 파라미터 전달

```javascript
function render(path) {
    for (const route of routes) {
      const match = path.match(route.regex);
      if (match) {
        const param = match[1];
        const html = route.pageRenderer(param);
        document.querySelector("#content").innerHTML = html;
        return;
      }
    }
  }
```

이제 `/post/:id` 같은 **동적 라우팅**도 매끄럽게 작동하게 되었다!!