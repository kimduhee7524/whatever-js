---
title: "useSyncExternalStore"
datePublished: Thu Jul 10 2025 10:11:19 GMT+0000 (Coordinated Universal Time)
cuid: cmcx89vj9000x02jmc3egeb5k
slug: usesyncexternalstore

---

### useSyncExternalStore란?

외부에 있는 상태가 바뀌었을 때, React 컴포넌트를 **자동으로 다시 렌더링**하게 도와주는 훅입니다. 이는 React가 기존에 가지고 있던 구조적인 한계를 극복하기 위한 시도라고 볼 수 있는데요. 이번 글에서는 `useSyncExternalStore`가 왜 필요한지, 어떤 문제를 해결하는지에 대해 최대한 쉽고 자세하게 정리해보겠습니다.다.

## 기존 문제점

### 1.Context의 구조적 한계

React는 기본적으로 트리 구조 기반의 선언형 UI 라이브러리입니다.  
상태가 바뀌면 해당 상태를 사용하는 컴포넌트와 그 하위 트리 전체가 리렌더링되는 구조를 가지고 있죠. Context의 문제점은 React의 트리 구조에서 비롯됩니다. 전역 상태 공유를 위해 Context API를 사용하는 경우도 상태가 변경될 때마다 **Provider 하위 전체가 리렌더링되는 구조적 한계**를 가지고 있죠

```typescript
<MyContext.Provider value={...}>
  <ChildA />
  <ChildB />
</MyContext.Provider>
```

위와 같은 구조에서 `value`가 변경되면, `ChildA`, `ChildB`, 그리고 그 하위 모든 컴포넌트가 다시 렌더링됩니다. 설령 어떤 자식 컴포넌트가 `value`를 실제로 사용하지 않더라도, **"부모가 바뀌었네?"** 라는 이유만으로 렌더링될 수 있습니다.  
이런 한계는 복잡한 트리, 빈번한 상태 변화, 부분적인 리렌더링 제어가 필요한 앱에서는 **성능 저하**로 이어질 수 있습니다.

### 2.Concurrent Mode와 외부 상태의 불일치

뿐만 아니라 React 18에서는 **Concurrent Mode, Suspense, Transition** 같은 기능들이 추가되었습니다. 이 기능들은 렌더링을 "중단했다가 나중에 재개"할 수 있게 해주는데, 기존 방식(`useEffect + useState`)으로는 이러한 랜더링 과정에서 외부 상태가 변경되면 렌더링 중이던 값과 실제 값이 어긋나며 UI가 깜빡이거나 꼬일 수 있다는 점입니다.

```typescript
function MyComponent() {
  const [value, setValue] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setValue(store.getState());
    });
    return unsubscribe;
  }, []);

  return <div>{value}</div>;
}
```

* 외부 상태(store)의 값이 `5`에서 `10`으로 바뀜
    
* React가 MyComponent를 렌더함
    
* 근데 아직 `useEffect`가 실행되지 않아서 상태는 `5`임
    
* 화면엔 **옛날 값(5)** 이 잠깐 보였다가 → 나중에 다시 `10`으로 바뀜
    

### 3\. SSR에서의 일관성 문제

한편, **SSR(서버 사이드 렌더링)** 환경에서는 초기 HTML을 서버에서 그려서 클라이언트에 보내고,  
클라이언트가 그걸 기반으로 React 앱을 "hydrate"합니다. 이때 클라이언트 측에서 사용하는 외부 상태가 서버 렌더링 시점과 다르면, **초기 화면과 실제 동작이 달라지는 "hydration mismatch" 오류**가 발생할 수 있습니다. SSR에서도 외부 상태와 React 상태가 정확히 동기화되어야 안정적인 초기 렌더링이 가능합니다.

## 그래서 등장한 해결책: `useSyncExternalStore`

이러한 문제들을 해결하기 위해 React는 `useSyncExternalStore`라는 훅을 도입했습니다.

* 렌더링 시점에 정확한 최신 상태(getSnapshot)를 동기적으로 읽음
    
* 렌더링 도중 외부 상태가 바뀌면 → 현재 렌더링을 무효화하고 처음부터 다시 렌더링
    
* 덕분에 UI가 중간에 꼬이거나 섞이는 현상 없이 항상 일관된 상태로 렌더링
    
* SSR과 Concurrent Mode 환경에서도 안전하게 작동하도록 설계됨
    
* 외부 상태(store)를 정확하게 구독하고, 필요한 컴포넌트만 리렌더링하여 성능도 향상
    

### 기본 사용법

```typescript
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

* subscribe: 상태 변경 시 React가 다시 렌더링할 수 있도록 콜백을 등록하는 함수
    
* getSnapshot : 현재 상태를 반환하는 함수
    
* getServerSnapshot: SSR 환경에서 초기 상태를 반환하는 함수 (선택)
    

### 예시: 간단한 카운터 스토어 만들기

1. 외부 저장소 정의
    

```typescript
// store.ts
let count = 0;
const listeners = new Set<() => void>();

export const counterStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);    //cb 저장
    return () => listeners.delete(cb);  // cleanup 함수 반환 
  },
  getSnapshot() {
    return count;
  },
  increment() {
    count++;
    listeners.forEach((cb) => cb());  // 상태 변경 알림 -> 저장된 cb 실행 -> 리렌더링 
  },
};
```

2\. 컴포넌트에서 사용

```typescript
// Counter.tsx
import { useSyncExternalStore } from 'react';
import { counterStore } from './store';

function Counter() {
  const count = useSyncExternalStore(counterStore.subscribe, counterStore.getSnapshot);

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={counterStore.increment}>+1</button>
    </div>
  );
}
```

### 🔍 내부에서 어떤 일이 벌어지냐?

```typescript
const count = useSyncExternalStore(subscribe, getSnapshot);
```

1. React는 `getSnapshot()`을 실행하여 현재 외부 상태(count) 값을 가져옵니다.
    
2. 동시에 React는 자체적으로 만든 콜백 함수(cb)를 `subscribe(cb)`에 전달하여 **리스너 목록에 저장**합니다. 이 콜백 함수(cb)는 외부 상태가 변경될 때 실행되어 해당 컴포넌트를 다시 렌더링하게 만듭니다.
    

```typescript
increment() {
    count++;
    listeners.forEach((cb) => cb());  // 상태 변경 알림 -> 저장된 cb 실행
  },
```

3. 외부 상태가 변경되면 `cb()`가 실행되고, React는 getSnapshot()을 다시 실행해 새로운 스냅샷을 가져오고, 이전 값과 비교하여 변경 여부를 판단합니다.
    
4. 값이 변경되었다면 → 해당 컴포넌트를 다시 렌더링합니다.
    

### 💡 참고

React 입장에서는 외부 상태가 어떻게 구현돼 있는지 알 수 없기 때문에, `subscribe`와 `getSnapshot`이라는 **인터페이스만 요구**합니다. 어떻게 리스너를 저장하고, 어떤 방식으로 상태를 변경하고 알릴지는 **직접 구현해야 합니다.**

```typescript
// store.ts
let count = 0;
const listeners = new Set<() => void>();

export const counterStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);    //cb 저장
    return () => listeners.delete(cb);  // cleanup 함수 반환 
  },
  getSnapshot() {
    return count;
  },
  increment() {
    count++;
    listeners.forEach((cb) => cb());  // 상태 변경 알림 -> 저장된 cb 실행 -> 리렌더링 
  },
};
```

## ✅ 마무리

`useSyncExternalStore`는 외부 상태와 React 컴포넌트의 일관된 동기화를 보장해주는 훅입니다.  
렌더링 시점의 상태 불일치, 깜빡임, 불필요한 리렌더링 등의 문제를 해결하기 위한 안정적인 인터페이스를 제공합니다.  
Zustand, Redux, Jotai 같은 상태관리 라이브러리들도 내부적으로 이 구조를 기반으로 동작하고 있습니다. 외부 상태를 안정적으로 다뤄야 하는 경우라면, `useSyncExternalStore`를 활용해보시면 좋을 것 같습니다.