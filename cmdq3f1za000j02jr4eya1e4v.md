---
title: "React Query"
datePublished: Wed Jul 30 2025 15:00:42 GMT+0000 (Coordinated Universal Time)
cuid: cmdq3f1za000j02jr4eya1e4v
slug: react-query

---

React 자체는 `useState`, `useReducer` 같은 훅을 통해 컴포넌트 내부의 UI 상태는 잘 관리하지만,  
서버에서 가져오는 데이터의 상태는 직접 관리하지 않죠.

React Query가 나오기 이전에는 다음과 같이 직접 처리해야 했습니다:

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getList(id);
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);
```

서버 상태 (`loading`, `error`, `success`), 직접 useEffect, useState 다 쓰고, 새로고침이나 데이터 최신화도 직접 처리해야 했죠.

---

## 🧠 React Query는 무엇을 해주나?

React Query는 위의 복잡한 상태 관리 없이도 **서버 데이터를** `useState`처럼 쉽게 다룰 수 있게 해줍니다:

```typescript
const { data, error, isLoading } = useQuery(['posts'], fetchPosts);
```

React Query는 어떻게 우리가 요청한 서버 데이터를 자동으로 추적하고 관리할 수 있을까?

---

## 🔍 React Query의 두 가지 핵심 원리

### 1️⃣ 서버 데이터 상태를 추적한다

React Query는 **데이터를 요청하고 상태를 전역 캐시에 저장**합니다:

```typescript
const queryCache = {
  'todos': {
    status: 'idle',     // 'loading' | 'success' | 'error'
    data: null,
    error: null,
    observers: []
  }
};
```

* 요청 전: `status = 'idle'`
    
* 요청 중: `status = 'loading'`
    
* 성공 시: `status = 'success', data = ...`
    
* 실패 시: `status = 'error', error = ...`
    

---

### 2️⃣ 누가 이 데이터를 보고 있는지 기억하고, 바뀌면 다시 그려준다

React Query는 이 데이터를 쓰고 있는 컴포넌트의 **리렌더링 함수를** `observers` 배열에 저장해둡니다.

```typescript
function useQuery(key, fetchFn) {
  const [, forceUpdate] = useState(0); // 현재 컴포넌트를 다시 그리는 함수

  useEffect(() => {
    const update = () => forceUpdate(n => n + 1); 
    queryCache[key].observers.push(update);

    return () => {
      // 컴포넌트가 사라지면 등록 해제
      queryCache[key].observers = queryCache[key].observers.filter(cb => cb !== update);
    };
  }, []);

  if (!queryCache[key].data) {
    fetchFn()
      .then(data => {
        queryCache[key].data = data;
        queryCache[key].status = 'success';
        queryCache[key].observers.forEach(fn => fn()); // 모든 컴포넌트 리렌더링
      })
      .catch(err => {
        queryCache[key].error = err;
        queryCache[key].status = 'error';
        queryCache[key].observers.forEach(fn => fn());
      });
  }

  return queryCache[key];
}
```

---

## 🛠 이게 어떻게 작동하는 걸까?

React는 상태가 바뀌면 무조건 컴포넌트를 **다시 리랜더링합니다.**  
**커스텀 훅 내부에서도 useState, useReducer 등으로 상태를 바꾸면, 그 훅을 사용한 컴포넌트는 당연히 리렌더링됩니다.** React Query는 **이 원리를 이용해서** "컴포넌트를 강제로 다시 그리게 만들고 싶을 때 setState를 사용하여 forceUpdate가 강제 리랜더링하도록 만든 업데이트 함수를 만들어줍니다.

그래서 `forceUpdate()`를 실행하면 그 컴포넌트만 다시 그림!  
React Query는 이 `update()` 함수를 `observers` 배열에 저장해두었다가,  
데이터가 바뀌면 이걸 전부 실행해서 **자동 리렌더링**이 일어나게 하는 거예요.

---

## ✅ 정리: React Query의 작동 원리는?

| 개념 | 역할 |
| --- | --- |
| `useState` | 컴포넌트 리렌더링 기능 (setState) 제공 |
| `useEffect` | 컴포넌트가 mount/unmount될 때 리액션 |
| `observers` | 데이터를 사용하는 컴포넌트의 리렌더 함수들을 저장 |
| `fetchFn` | 데이터를 불러오는 함수 |
| `queryCache` | 서버 상태 + 구독자(observer)를 저장하는 전역 상태 저장소 |

---

## 🎯 결론

> React Query는 `useState + useEffect` 기반의 옵저버 패턴을 활용하여  
> **서버 상태를 자동으로 추적하고, 관련된 컴포넌트만 리렌더링**해주는 똑똑한 라이브러리입니다.