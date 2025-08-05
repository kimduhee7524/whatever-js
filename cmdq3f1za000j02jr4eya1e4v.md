---
title: "React Query, 왜 이제는 거의 필수일까?"
datePublished: Wed Jul 30 2025 15:00:42 GMT+0000 (Coordinated Universal Time)
cuid: cmdq3f1za000j02jr4eya1e4v
slug: react-query

---

직접 써보고 느낀 서버 상태 관리의 필요성  
이제는 React Query로 서버 상태를 관리하는것이 거의 필수가 된 거 같아, React Query 없이 하면 얼나 불편할까 몸소 경험해보고자..? React Query 없이 구현해보고자 했습니다.

---

### 🔙 과거 방식: 전통적인 API 요청 방식

```javascript
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

이런 식으로 데이터를 불러오고 `useState`에 저장하면 끝!  
딱히 문제 없어 보이지만..

### useState + useEffect로 다 하려니까 너무 반복됐어요

이 세 가지는 거의 필수처럼 따라붙습니다:

```javascript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
const [error, setError] = useState(null);
```

그리고 항상 이런 식으로 `useEffect` 안에서 fetch 호출하고 상태 바꾸고...  
데이터 하나 불러오는데 코드가 너무 길어지고, 다른 컴포넌트에서도 쓰려면 또 복붙해야 했습니다.

* 컴포넌트마다 비슷한 요청/상태 로직 반복
    
* 동일한 요청도 **컴포넌트마다 따로 실행**
    
* 응답 결과를 **공유하거나 캐시하는 건 불가능**
    

❓ 그럼 Redux로 공유하면 되지 않나요? 맞아요. 그래서 실제로 많은 프로젝트에서 Redux로 서버 상태까지 관리했었습니다.

### ⚙️그럼 전역 상태로 빼면 되지!" → Redux

그래서 상태를 `Redux`로 빼보기로 했습니다.  
데이터를 한 번 불러오고 `store`에 저장하면 전역에서 관리하니까 어디서든 쓸 수 있고, 다른 컴포넌트에선 `useSelector()`로 꺼내 쓰면 끝이니까요. 그런데…

---

#### 1\. 액션 타입 정의 (`actions/types.ts`)

```javascript
export const FETCH_USERS_REQUEST = 'FETCH_USERS_REQUEST';
export const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS';
export const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE';
```

---

#### 2\. 액션 크리에이터 (`actions/users.ts`)

```javascript
export const fetchUsersRequest = () => ({ type: FETCH_USERS_REQUEST });
export const fetchUsersSuccess = (data) => ({ type: FETCH_USERS_SUCCESS, payload: data });
export const fetchUsersFailure = (error) => ({ type: FETCH_USERS_FAILURE, error });
```

---

#### 3\. 비동기 함수 (`thunks/users.ts`)

```javascript
import {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure
} from '../actions/users';

export const fetchUsers = () => async (dispatch) => {
  dispatch(fetchUsersRequest());
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    dispatch(fetchUsersSuccess(data));
  } catch (err) {
    dispatch(fetchUsersFailure(err.message));
  }
};
```

---

#### 4\. 리듀서 (`reducers/users.ts`)

```javascript
import {
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAILURE
} from '../actions/types';

const initialState = {
  data: [],
  loading: false,
  error: null
};

export function userReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_USERS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_USERS_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case FETCH_USERS_FAILURE:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}
```

---

#### 5\. 컴포넌트에서 사용 (`components/UserList.tsx`)

```javascript
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../thunks/users';

export function UserList() {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    if (!data || data.length === 0) {
        dispatch(fetchUsers());
    }
  }, [data]);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>에러 발생: {error}</p>;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

서버 요청 하나 처리하려고…

* 액션 타입 만들고
    
* 액션 생성자 만들고
    
* thunk 만들어서 비동기 처리하고
    
* 리듀서에 로직 넣고
    
* 컴포넌트에서 디스패치하고, 셀렉터 쓰고…
    

하나의 요청을 처리하는데 **진짜 50줄 가까이** 되는 코드를 쓰고 있었어요.  
게다가 요청 중복, 캐싱, stale 처리도 직접 해야 하고…

---

### 🧠 Redux의 한계

> **서버 상태는 클라이언트 상태랑 다르다!**

| 구분 | 클라이언트 상태 | 서버 상태 |
| --- | --- | --- |
| 내가 만든 상태 | O (ex. 모달, 토글) | X (서버에서 옴) |
| 변경 주체 | 내가 바꿈 | 서버가 바꿈 |
| stale 가능성 | 거의 없음 | 항상 있음 |
| 캐싱 필요 | X | O |
| 공유 필요 | 드물게 | 자주 |

`useState`나 `Redux`는 원래 **내가 직접 바꾸는 상태**를 위한 도구라서,  
**서버에서 받아오는 데이터**를 다루기엔 뭔가 억지로 맞춰 쓰는 느낌이었어요.

| 문제 | 설명 |
| --- | --- |
| 🔁 요청 중복 처리 안 됨 | 같은 API 요청도 중복 실행됨 |
| 🧠 상태 구조가 무거움 | 액션, 리듀서, thunk까지 다 만들어야 함 |
| 🛠️ 갱신/동기화 직접 처리 | stale 처리나 refetch는 수동으로 구현해야 함 |
| 🧱 단순 API 요청에도 보일러플레이트 쌓임 | 요청 하나에 최소 50줄 필요 |

즉, **가능은 했지만** 모든 로직을 직접 구현해야했기에..

| 시대 | 서버 상태 관리 방식 | 설명 |
| --- | --- | --- |
| 🔙 예전 | Redux + thunk/saga | 다 직접 만들었음 |
| 🔁 과도기 | Redux Toolkit Query | RTK에서 자체적인 캐싱 기능 추가 |
| 🔥 현재 | React Query, SWR | 서버 상태를 전문 도구로 관리 |

---

### 💡 React Query의 등장

React Query는 딱 이 문제를 해결해주는 도구예요.

> **"서버 상태는 클라이언트 상태랑 다르니까, 따로 관리하자!"**

그래서 React Query는 다음을 자동화합니다:

| 기능 | 역할 |
| --- | --- |
| ✅ 캐싱 | 같은 요청 반복 방지 |
| ✅ 공유 | 여러 컴포넌트에서 결과 공유 |
| ✅ 구독 | 데이터 변경 시 자동 갱신 |
| ✅ stale 관리 | 최신성 판단 및 갱신 트리거 |
| ✅ refetch 제어 | 수동/자동 갱신 모두 지원 |

---

직접 해보니 알겠더라고요.  
**내가 매번 하던 귀찮은 일들을 React Query가 다 해주는구나** 하는 걸..!

---

React Query는 위의 복잡한 상태 관리 없이도 **서버 데이터를** `useState`처럼 쉽게 다룰 수 있게 해줍니다:

```typescript
const { data, error, isLoading } = useQuery(['posts'], fetchPosts);
```

React Query는 어떻게 우리가 요청한 서버 데이터를 자동으로 추적하고 관리할 수 있을까?

---

### 🔍 React Query의 두 가지 핵심 원리

1️⃣ 서버 데이터 상태를 추적한다

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

### 🛠 이게 어떻게 작동하는 걸까?

React는 상태가 바뀌면 무조건 컴포넌트를 **다시 리랜더링합니다.**  
**커스텀 훅 내부에서도 useState, useReducer 등으로 상태를 바꾸면, 그 훅을 사용한 컴포넌트는 당연히 리렌더링됩니다.** React Query는 **이 원리를 이용해서** "컴포넌트를 강제로 다시 그리게 만들고 싶을 때 setState를 사용하여 forceUpdate가 강제 리랜더링하도록 만든 업데이트 함수를 만들어줍니다.

그래서 `forceUpdate()`를 실행하면 그 컴포넌트만 다시 그림!  
React Query는 이 `update()` 함수를 `observers` 배열에 저장해두었다가,  
데이터가 바뀌면 이걸 전부 실행해서 **자동 리렌더링**이 일어나게 하는 거예요.

---

### ✅ 정리: React Query의 작동 원리는?

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