---
title: "form 딥 다이브"
datePublished: Sun Aug 03 2025 15:25:24 GMT+0000 (Coordinated Universal Time)
cuid: cmdvu28m7000m02jrhi9v56fb
slug: form

---

대규모 폼을 다루게 되면서 리액트에서 상태가 변경되면 ui를 자동으로 업데이트 해준다는 철학을 바탕으로 폼까지 리액트 지상주의로만 다루기에는 살짝 비효율적인 측면이 있다고 생각하여 form에 더 공부해야겠다고 느꼈었 공부했던 내용을 정리해보려고합니다.

**HTML-only 시절**:

js가 등장하기 이전부터 HTML만 가지고도 &lt;form&gt; 요소로 **사용자로부터 데이터를 입력받아 서버로 전송가능했다. 뿐만 아니라** js가 등장하기 **이전**, HTML에서는 **&lt;form&gt; 요소가 서버와 소통할 수 있는 거의 유일한**창구였다.

* 오직 **HTML + 서버**로 구성
    
* 폼 제출 시 **페이지가 완전히 새로고침됨**
    
* 자바스크립트 없음 → 서버 검증만
    

```html
<form action="/submit" method="post">
  <input name="username">
  <input type="submit" value="전송">
</form>
```

&lt;form&gt; 이 하는 일:

* 사용자가 데이터를 입력 (예: 이름, 이메일 등)
    
* 제출 버튼 클릭 (`<button>` 또는 `<input type="submit">`)
    
* `action` 속성에 지정된 **서버 주소로** 브라우저가 HTTP 요청을 보냄(**데이터를 전송)**
    
* 사용자가 입력 후 제출하면 브라우저가 서버에 HTTP 요청을 보냄
    
* 서버는 처리 후 새로운 HTML 페이지를 반환
    
* 브라우저는 전체 페이지를 새로 그림
    

즉, &lt;form&gt; **전송 = 새로고침 + 서버 요청/응답 → 자바스크립트 없이도 작동 가능한 유일한 방식**

HTML만으로도 웹사이트는 "기본 구조"와 "폼 제출" 같은 핵심 기능은 됐지만,동적 UI 제어같은 사용자 경험은 매우 부족했다.

참고로 브라우저가 기본적으로 제공하는 form 기능들을 굉장히 유용한 것들이 많다.

1. **HTML5 유효성 검사**
    

* `required`, `type="email"`, `minlength`, `pattern` 등만 설정해도 자동으로 입력 유효성 체크
    
* 자바스크립트 한 줄 없이 **입력 오류 메시지**와 UI를 브라우저가 자동 제공
    
* 사용자 경험(UX)을 최소한의 코드로 개선 가능
    

```html
<form>
  <input type="email" required />
  <button type="submit">Submit</button>
</form>
```

---

2. **브라우저 자동완성 / 자동저장**
    

* 이름, 이메일, 카드번호, 주소 등은 `<form>` 내에 있어야 브라우저가 인식하고 **자동완성 제안**을 해줌
    
* `<input autocomplete="email">` 같은 속성을 활용하면 더 정확하게 작동
    
* 이는 UX와 **접근성 향상**, 사용자 피로도 감소에 매우 효과적
    

3. **접근성(Accessibility, a11y)**
    

* `<form>`, `<label>`, `<fieldset>` 등은 **스크린 리더(말로 읽어주는 기능)와 키보드 네비게이션**에 최적화되어 있음
    
* `<label for="id">` 구조는 시각장애 사용자에게도 큰 도움을 줌
    

4. **Enter 키로 제출 기능**
    

* `<form>` 안에 `<input>`이 있을 경우, 사용자가 **Enter 키만 눌러도 자동으로 제출됨**
    
* `<form>` 없이 버튼과 input만 배치하면 이 동작이 사라짐 → 명시적 핸들링 필요
    

즉 `<form>`은 단순히 입력 박스 모음이 아니라,

"브라우저가 사용자 입력을 최적으로 처리하도록 설계된 고급 컴포넌트 집합"

---

JavaScript 등장 이후의 변화

JavaScript가 본격적으로 활용되기 시작하면서 웹은 **정적 → 동적**으로 진화하게 됩니다.

* **AJAX 등장: 새로고침 없이 전송 가능**
    
* 유효성 검사, 동적 UI 제어 가능
    

자바스크립트와 AJAX 기술(`XMLHttpRequest`, `fetch()`)의 등장으로 웹은 **정적 → 동적**으로 진화했다. **전체 페이지를 새로고침하지 않고,** 필요한 데이터만 서버에 보내고, 화면 일부만 업데이트 가능해졌다.

```html
<form id="myForm">
  <input name="email">
  <button type="submit">Send</button>
</form>

<script>
document.getElementById('myForm').addEventListener('submit', function(e) {
  e.preventDefault(); // 기본 제출 막기
  const data = new FormData(e.target);
  fetch('/submit', {
    method: 'POST',
    body: data
  }).then(res => res.text()).then(alert);
});
</script>
```

---

React 등장 이후의 변화

"리액트 지상주의"로 모든 폼을 제어하는 것이 항상 최선은 아니다

리액트의 철학: UI = 상태 를 따른다. 그래서 입력값을 `useState`로 관리하는 **Controlled 컴포넌트**가 기본 방식이지만, 매 키 입력마다 상태 변경 발생 → 리렌더링이 발생하여 큰 규모 또는 복잡한 폼에서는 성능에 부담이 되기 때문에, **Uncontrolled 방식과 적절히 혼용**하는 게 효율적인 상황들이 많다. 브라우저가 값을 직접 관리하고, 필요할 때만 `ref`로 접근하도록 사용

**Controlled Component**

리액트의 상태(`useState`)로 폼 입력 값을 관리하고, 그 값을 UI에 반영합니다.

```jsx
const [name, setName] = useState("");

<input value={name} onChange={e => setName(e.target.value)} />
```

* 장점:
    
    * 상태와 UI가 완전히 동기화됨
        
    * 입력 검증, 조건부 렌더링, 디버깅 등에 유리
        
* 단점:
    
    * 매 키 입력마다 상태 변경 발생 → 리렌더링
        
    * 큰 규모 또는 복잡한 폼에서는 성능에 **부담**
        
    * 코드가 길어지고 반복적이 될 수 있음
        

---

**Uncontrolled Component**

UI = DOM

Uncontrolled 컴포넌트는 "리액트가 아닌 브라우저(DOM)가 상태를 관리"하는 방식

폼 요소가 직접 값을 관리하고, `ref`로 접근하거나 `onSubmit` 시점에 읽음.

```jsx
const inputRef = useRef();

<form onSubmit={(e) => {
  e.preventDefault();
  console.log(inputRef.current.value);
}}>
  <input ref={inputRef} />
  <button type="submit">Submit</button>
</form>
```

* 사용자가 글자를 입력해도 리액트는 그 값을 기억하거나 추적하지 않는다.
    
* 대신 브라우저 내부(DOM)에서 값이 저장되고 갱신된다.
    
* **브라우저가 직접 값 관리**
    
* 필요할 때만 `ref.current.value`로 읽음
    
* 장점:
    
    * 더 간단하고 빠름, 불필요한 렌더링 없음
        
    * 작은 폼이나 1회성 입력에 적합
        
* 단점:
    
    * 상태 추적이나 검증이 번거로움
        

따라서 대규모 폼의 경우 리액트 지상주의(Controlled)로만 폼을 다루는 것의 **비효율적 측면**:

* **input, select, textarea 같은 폼 요소들의 값은 리액트 상태로 관리하지 않음**
    
    → 즉, uncontrolled 방식 (브라우저 DOM이 값 관리)
    
* **유효성 검사, 제출 처리, 조건부 로직이 필요한 시점에만 값 꺼내서 처리**
    
* **리액트 상태로 굳이 컨트롤하지 않기 때문에 리렌더링이 최소화됨**
    

react-hook-form이 딱 이 구조

**uncontrolled 방식 + 필요한 순간에만 값 추출(ref)** → 이게 혼용 방식이고, 실제로 **가장 많이 쓰이는 방식**

**값은 DOM에게 맡기고**, **상태 기반 제어는 필요한 경우에만**

→ 폼이 크거나 복잡할수록 이런 방식의 이점이 더욱 크다

---

SSR과 하이드레이션 문제

SSR에서 폼을 사용하는 경우 입력이랑 전송은 html 기능이라 하이드레이션 이전에도 작동하지만, 그로 인해 클라이언트 로직(이벤트 핸들러 등)이 붙기 전에 폼이 전송되면 문제가 생길 수 있다

그래서 서버 컴포넌트 기반의 폼 처리방식이 다시 주목 받음

---

서버 컴포넌트 등장

React가 컴포넌트 기반 UI 모델을 포기하지 않으면서도, 서버 렌더링의 이점을 더 잘 활용하려고

* **JavaScript 없이도 가능**
    
* `action` 함수 or 서버 액션(server actions) 사용
    

```jsx
// 서버 컴포넌트
export default function Page() {
  async function submitForm(formData) {
    "use server"
    const name = formData.get("name");
    await saveToDatabase(name);
  }

  return (
    <form action={submitForm}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

* `action={submitForm}`는 JS 없이도 작동
    
* 클라이언트가 제출하면 React가 **서버 함수** 호출
    
* 서버에서 직접 처리 → JS 로딩 없이도 폼 동작 가능 (점진적 향상, progressive enhancement)
    

추가) **Remix(리믹스)는 질문하신 내용—“폼은 HTML의 기본 기능이다 → JS 없이도 제대로 동작해야 한다”**—라는 철학을 **핵심 원칙**으로 삼아 만들어진 프레임워크

> ❝ React를 기반으로 하되, HTML, 폼, HTTP 등을 최대한 활용해서 더 빠르고, 더 신뢰할 수 있고, JS 없는 상황에서도 작동하는 앱을 만들 수 있게 하자 ❞

즉, **폼은 기본적으로 동작해야 하고**, **JS는 선택 사항이며 향상을 위한 보너스**라는 사고방식을 지향합니다.

따라서 **폼을 서버가 직접 처리**하는 구조를 지향