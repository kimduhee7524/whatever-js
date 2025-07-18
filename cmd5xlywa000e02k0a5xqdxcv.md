---
title: "React Context와 overlay-kit 분석"
datePublished: Wed Jul 16 2025 12:22:43 GMT+0000 (Coordinated Universal Time)
cuid: cmd5xlywa000e02k0a5xqdxcv
slug: react-context-overlay-kit

---

React에서 Context를 사용할 때 자주 겪는 대표적인 문제는 바로 **불필요한 리렌더링**입니다.

이 글에서는 Context의 리렌더링 구조를 짚어보고, toss의 `overlay-kit`에서는 이 문제를 어떻게 해결하였는지 그 구조와 원리를 자세히 살펴보겠습니다.

[https://github.com/toss/overlay-kit/tree/main/packages](https://github.com/toss/overlay-kit/tree/main/packages)

---

### **1️⃣** 일반적인 리렌더링 vs Context 리렌더링

1. 일반적인 리렌더링
    

부모 컴포넌트가 랜더링되면 자식 컴포넌트들도 함께 랜더링 됩니다. (별도의 최적화가 없다면)

```typescript
function Parent() {
  return <Child />;
}
```

* `Parent`가 리렌더링되면 `Child`도 기본적으로 함께 리렌더링됩니다.
    
* 단, `React.memo` 등으로 `Child`가 최적화되어 있다면 리렌더링을 건너뜁니다.
    

하지만 Context는 다릅니다

2, Context 리랜더링

```typescript
<MyContext.Provider value={someValue}>
  <ComponentA />
  <ComponentB />
</MyContext.Provider>
```

* `ComponentA`가 `useContext(MyContext)`로 Context를 구독 중이라면 → **리렌더링 됨**
    
* `ComponentB`가 Context를 구독하지 않았다면 → **리렌더링 안 됨**
    

💡 Context 리렌더링의 핵심

> Context는 value가 변경되었을 때,  
> 해당 Context를 구독 중인 컴포넌트만 타겟팅해서 리렌더링합니다.

---

### **2️⃣** 일반적인 Context 사용 패턴의 문제점

대부분의 Context 예제는 상태와 상태 변경(명령) 함수를 `value` 안에 **함께** 전달합니다:

```typescript
const CounterContext = createContext();

function CounterProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CounterContext.Provider value={{ count, setCount }}>
      {children}
    </CounterContext.Provider>
  );
}
```

이 방식의 문제는?

```typescript
function CounterButton() {
  const { setCount, count } = useContext(CounterContext);
  return <button onClick={() => setCount(c => c + 1)}>+1</button>;
}
```

* 실제로 필요한 건 `setCount` 뿐인데,
    
* `count` 값도 함께 받다 보니, `count`가 바뀔 때마다 이 컴포넌트도 리렌더링됩니다.
    

(🍟 감자튀김만 먹고 싶은데 햄버거 세트로만 파는 느낌입니다.)

---

### **3️⃣** 명령과 상태를 분리하는 구조

해결책은 Context를 **상태용 / 명령용** 두 개로 분리하는 것입니다:

```typescript
const CountStateContext = createContext();
const CountDispatchContext = createContext();

function CounterProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CountStateContext.Provider value={count}>
      <CountDispatchContext.Provider value={setCount}>
        {children}
      </CountDispatchContext.Provider>
    </CountStateContext.Provider>
  );
}
```

이제 컴포넌트는 필요한 것만 골라서 구독할 수 있습니다:

```typescript
function CounterButton() {
  const setCount = useContext(CountDispatchContext); // '명령'만 구독
  return <button onClick={() => setCount(c => c + 1)}>+1</button>;
}

function CounterDisplay() {
  const count = useContext(CountStateContext); // '상태'만 구독
  return <p>Count: {count}</p>;
}
```

> 이렇게 하면, setCount만 필요한 컴포넌트는 상태 변경에 영향을 받지 않습니다.

하지만 `useContext()`는 React 컴포넌트나 훅 안에서만 호출 가능하므로, 현재 구조에서 명령은 **항상 React 컴포넌트 내부**에서만 가능합니다. 즉 React 외부(예: 전역 유틸, 에러 핸들러 등)에서는 명령을 보낼 수 없습니다.

---

### **4️⃣** overlay-kit: 구조적 분리 + 이벤트 시스템

overlay-kit은 **명령과 상태의 분리**를 넘어서,  
**React 컴포넌트 외부에서도 명령을 내릴 수 있도록 이벤트 시스템을 도입**합니다.

핵심 아이디어

1. Context를 사용하는 컴포넌트와 사용하지 않는 컴포넌트를 물리적으로 분리해, 불필요한 리렌더링을 원천 차단합니다.
    

```typescript
function App() {
  return (
    <OverlayProvider>
      <HomePage /> {/* 메인 콘텐츠 */}
    </OverlayProvider>
  );
}
```

```typescript
function OverlayProvider({ children }) {
  const [overlayState, dispatch] = useReducer(...);

  return (
    <OverlayContext.Provider value={overlayState}>
      {/* A. 메인 콘텐츠: Context에 관심 없음 */}
      {children}

      {/* B. 오버레이만 별도로 렌더링 (Context 사용) */}
      {overlayState.overlayOrderList.map(item => (
        <ContentOverlayController key={item.id} {...item} />
      ))}
    </OverlayContext.Provider>
  );
}
```

* `<HomePage />`는 오버레이 상태를 **읽지도 않고 구독하지도 않습니다.**
    
* 리렌더링 대상이 아니므로, **overlayState가 바뀌어도 영향을 전혀 받지 않습니다.**
    
* 오직 `<ContentOverlayController />` 만 Context를 구독합니다.
    

> 💡 즉, **렌더링 대상 자체를 분리함으로써**, 불필요한 리렌더링을 구조적으로 **원천 차단**합니다.

1. 이벤트 시스템 도입
    

React 내부가 아닌, 외부에서도 명령을 보낼 수 있도록 `overlay-kit`은 **Emitter 기반 이벤트 시스템**을 사용합니다.  
이 시스템은 크게 "신호를 보내는 쪽"과 "신호를 듣는 쪽"으로 나뉩니다.

* **신호를 듣는 쪽 (OverlayProvider)**
    

```typescript
// "open 이벤트가 오면, dispatch 함수를 실행해서 상태를 변경해줘" 라고 등록
useOverlayEvent({
  open: (data) => dispatch({ type: 'ADD', payload: data }),
  close: () => dispatch({ type: 'CLOSE' }),
});
```

앱이 시작 , OverlayProvider는 useOverlayEvent 훅을 통해 'open', 'close' 같은 이벤트가 발생하면 어떤 dispatch 함수를 실행해서 상태를 변경할지를 이벤트 버스(emitter)에 등록합니다.

* **신호를 보내는 쪽 (**[**overlay.open**](http://overlay.open)**)**
    

```typescript
// HomePage.jsx
import { overlay } from 'overlay-kit';
import { MyModalContent } from './MyModal';

function HomePage() {
  const handleClick = () => {
  // "open 이벤트 발생!" 신호를 이벤트 버스에 보냄
    overlay.open(<MyModalContent />);
  };

  return <button onClick={handleClick}>모달 열기</button>;
}
```

사용자가 [overlay.open](http://overlay.open)을 호출하면, 내부적으로 emitter.emit('open', data) 형식으로 이벤트를 발생시킵니다.

```typescript
// emitter.js
const listeners = new Map();

export const emitter = {
  on(eventName, callback) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, []);
    }
    listeners.get(eventName).push(callback);
  },

  emit(eventName, data) {
    const eventListeners = listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((cb) => cb(data));
    }
  },
};
```

emitter는 "open" 신호를 받아서, **미리 등록되어 있던 OverlayProvider의 open 함수를 실행**시킵니다. 결과적으로 dispatch가 호출되어 상태가 변경되고, 화면에 모달이 나타납니다.

* [`overlay.open`](http://overlay.open)은 내부적으로 이벤트 버스(emitter)를 통해 `OverlayProvider`에 신호를 보냅니다.
    
* 따라서 `<HomePage />`는 Context도, 상태도 몰라도 됩니다.
    

---

### 5️⃣ overlay-kit의 오버레이 렌더링 흐름

1. **앱 시작시 이벤트등록**
    

```typescript
<OverlayProvider>
  <mian/>
<OverlayProvider/>
```

```javascript
function OverlayProvider() {
  const [overlayState, overlayDispatch] = useReducer(overlayReducer, {
     current: null,
     overlayOrderList: [],
     overlayData: {},
  });

  // open 함수를 직접 만듦!
  const open = useCallback(({ controller, overlayId, componentKey }) => {
    // 오버레이 상태를 바꾸는 코드
    overlayDispatch({ type: 'ADD', overlay: { ... } });
  }, []);
  
   const close= useCallback((overlayId: string) => {
    // 오버레이 상태를 바꾸는 코드
    overlayDispatch({ type: 'REMOVE', overlayId });
  }, []);

  // 이 함수들을 useOverlayEvent에 전달!
  // "이벤트가 오면, dispatch 함수를 실행해서 상태를 변경해줘" 라고 등록
  useOverlayEvent({ open, close, ... });
}
```

앱 시작 시 OverlayProvider 컴포넌트가 처음 렌더링됩니다.  
이때, OverlayProvider 내부에서는 open, close 등 이벤트에 대한 핸들러(=dispatch 함수)를 emitter에 등록합니다. 이때 등록되는 함수들은 오버레이 상태를 변경하는 함수입니다.

```typescript
useOverlayEvent({ open, close, unmount, closeAll, unmountAll });
```

이 코드는 내부적으로 emitter.on을 호출해서, open, close 등 각각의 이벤트가 오면 각 이벤트에 따라 어떤 **새로운 오버레이(모달) 정보를 overlayState에 추가할**지를 미리 등록(약속)해둡니다.  
**이 시점부터, emitter는 "open" 이벤트가 오면** OverlayProvider의 open 함수를 실행해야 한다는 것을 "알고 있습니다".

---

2. **사용자 명령**
    

```typescript
function MyModal({ isOpen, close, overlayId, unmount }) {
  return (
    isOpen && (
      <div>
        <h1>모달입니다!</h1>
        <button onClick={close}>닫기</button>
      </div>
    )
  );
}

// 오버레이 열기!
overlay.open(MyModal);
```

```javascript
// open 함수는 이렇게 동작
const open = (controller) => {
  // controller = MyModal
  const overlayId = randomId();
  const componentKey = randomId();
  const dispatchOpenEvent = createEvent('open');
  // 오버레이를 띄워달라는 이벤트를 보냄
  dispatchOpenEvent({ controller, overlayId, componentKey });
};
```

사용자가 [overlay.open](http://overlay.open)을 호출하면, 내부적으로 dispatchOpenEvent 를 통해 `emitter.emit('open', { ... })`가 실행됩니다.

---

3. **연결: emitter가 약속을 실행**
    

```javascript
// emitter.js
const listeners = new Map();

export const emitter = {
  on(eventName, callback) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, []);
    }
    listeners.get(eventName).push(callback);
  },

  emit(eventName, data) {
    const eventListeners = listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((cb) => cb(data));
    }
  },
};
```

emitter는 'open' 이벤트가 발생하면, 등록했던 OverlayProvider의 open 함수를 실행합니다.  
이 함수는 overlayDispatch로 상태를 변경합니다.

4\. 실제 오버레이 렌더링

```typescript
<OverlayContextProvider value={overlayState}>
	{overlayState.overlayOrderList.map((item) => {
   const { id: currentOverlayId, componentKey, isOpen, controller: Controller } = overlayState.overlayData[item];
	
	return (
		// 오버레이를 실제로 렌더링할 때
		<ContentOverlayController
		  isOpen={isOpen}
		  overlayId={overlayId}
		  controller={controller} // = MyModal
		  overlayDispatch={...}
		/>
		})}
</OverlayContextProvider>
```

상태가 변경되면, OverlayProvider가 context로 내려주는 overlayState가 바뀌고,  
overlayOrderList를 순회하며, 각 오버레이에 대해 ContentOverlayController를 렌더링합니다.

```typescript
// controller(MyModal)를 실제로 화면에 렌더링할 때
<Controller
  isOpen={isOpen}
  overlayId={overlayId}
  close={() => overlayDispatch({ type: 'CLOSE', overlayId })}
  unmount={() => overlayDispatch({ type: 'REMOVE', overlayId })}
/>
```

open 함수에 넘긴 함수(컴포넌트)는, 실제로 화면에 렌더링될 때,  
ContentOverlayController가 **props(overlayProps)**를 만들어서 넣어줍니다.  
이때, isOpen, overlayId, close, unmount 등의 props가 전달됩니다.

```typescript
<MyModal
  isOpen={true}
  overlayId="랜덤ID"
  close={함수}
  unmount={함수}
/>
```

결국 MyModal이 이렇게 호출됨:

### 6️⃣ openAsync의 동작

```typescript
const open = (controller: OverlayControllerComponent, options?: OpenOverlayOptions) => {
  const overlayId = options?.overlayId ?? randomId();
  const componentKey = randomId();
  const dispatchOpenEvent = createEvent('open');

  dispatchOpenEvent({ controller, overlayId, componentKey });
  return overlayId;
};

const openAsync = async <T>(controller: OverlayAsyncControllerComponent<T>, options?: OpenOverlayOptions) => {
  return new Promise<T>((resolve) => {
    open((overlayProps) => {
      const close = (param: T) => {
        resolve(param);
        overlayProps.close();
      };

      const props = { ...overlayProps, close };
      return controller(props);
    }, options);
  });
};
```

참고로 openAsync 안에 open함수에서 `(overlayProps) => { ... }` 이 화살표 함수가 open 함수의 props에서 controller 컴포넌트를 뜻합니다. 즉 **open에 넘기는 함수는 "컴포넌트"다.**

```tsx
open((overlayProps) => { ... }, options);

open(controller, options?) 
```

아무튼 openAsync는 "오버레이가 닫힐 때, 닫힐 때의 값을 Promise로 돌려주고 싶다”가 핵심입니다.원래 overlayProps.close는 "오버레이를 닫는 함수"입니다.  
하지만 openAsync에서는 "오버레이를 닫으면서, 동시에 Promise도 resolve(완료)하고 싶다!"이런 특별한 동작이 필요합니다. **그래서 close를 덮어씌워** 아래처럼 **새로운 close 함수를 만듭니다**

```typescript
const close = (param: T) => {
  resolve(param);           // 1. Promise를 완료시킴
  overlayProps.close();     // 2. 실제로 오버레이를 닫음
};
```

그리고 이 close를 기존 overlayProps.close 대신 **props로 넘깁니다**:  
오버레이 내부(MyModal 등)에서 props.close(param)을 호출하면,

1. Promise가 resolve됨 (openAsync의 결과값이 됨)
    
2. 오버레이가 닫힘
    

즉, **openAsync로 띄운 오버레이는** 닫힐 때 값을 외부로 전달할 수 있다!  
`resolve`의 파라미터는 **Promise가 성공했을 때 반환하고 싶은 값**입니다. 이 값은 `.then()` 또는 `await`에서 받아서 사용할 수 있어요.

### 정리

* Context는 구독 기반 구조지만, **불필요한 구독은 리렌더링 문제를 유발**합니다.
    
* Context 두 개로 나누면 어느 정도 해결되지만, **명령은 여전히 React 내부에서만 가능**합니다.
    
* `overlay-kit`은 구조적 분리와 이벤트 시스템을 통해, **성능과 유연성 모두를 확보한 설계를 보여줍니다.**