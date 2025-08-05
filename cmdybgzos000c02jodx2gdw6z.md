---
title: "서버 상태 관리 모듈을 구현해보기"
datePublished: Tue Aug 05 2025 09:08:18 GMT+0000 (Coordinated Universal Time)
cuid: cmdybgzos000c02jodx2gdw6z
slug: 7isc67keioydge2dncdqtidrpqwg66qo65oi7j2eioq1ro2yho2vtouztoq4sa

---

개인 프로젝트를 진행하면서 React Query 없이 서버 상태 관리 시스템을 직접 구현해봤습니다.  
그 과정에서 겪었던 문제들과, 그것들을 해결해 나가며 생긴 사고의 흐름을 정리해보았습니다.

### 🐣 1단계 - 가장 단순한 요청 훅 만들기

```javascript
function useQueryRequest(queryFn, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    queryFn(...params)
      .then(res => setData(res))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [params]);

  return { data, loading, error };
}
```

* 이 훅 하나만으로도 `API 요청 + 로딩/에러 상태 관리`가 모두 가능합니다.
    

---

### ⚠️ 2단계 - 빠르게 바뀌는 요청이 꼬인다?

예를 들어 사용자 검색 중, 빠르게 입력이 바뀔 때:

```javascript
1. fetchUser("a") → 느리게 도착
2. fetchUser("ab") → 빨리 도착
```

* `"ab"`에 대한 요청 결과가 먼저 도착했지만,
    
* `"a"` 요청이 나중에 도착하면서 결과를 **덮어써버리는 현상**이 발생합니다.
    

> ❌ 오래된 요청이 최신 요청을 이겨버리는 **Race Condition** 발생

---

### 🧠 3단계 - 마지막 요청만 유효하게 하고 싶다!

> "이전 요청이 아직 끝나지 않았어도, 최신 요청만 반영되게 하고 싶다"

`AbortController` 적용해서 해결하기

```javascript
function useQueryRequest(queryFn, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(() => {
    abortRef.current?.abort();                     // 이전 요청 취소
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    queryFn(...params, controller.signal)
      .then(res => { if (!controller.signal.aborted) setData(res); })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [JSON.stringify(params)]); // params 변화 감지용 key

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();        // 언마운트 시 요청 취소
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
```

* 요청 전 이전 요청을 abort
    
* signal이 abort되었는지 검사 후 상태 업데이트
    

> **이제 Race Condition이 사라졌습니다!**  
> 이전 요청이 아무리 느리게 끝나도, 무시되거나 취소되니까요.

---

### 🤔 4단계 - 같은 요청이 반복되는데 또 불러온다고?

사용자 목록 같은 데이터를 여러 컴포넌트에서 쓰면 요청이 계속 중복됩니다.

```javascript
const A = useQueryRequest(fetchUsers, []);
const B = useQueryRequest(fetchUsers, []);
```

> 🤔 "다른 컴포넌트에서도 같은 요청을 보내면… 또 요청이 나가네?"  
> 🤔 "아까 받은 데이터를 재활용할 수는 없을까?"  
> 🤔 "왜 같은 요청인데 매번 새로 받아야 하지?"

→ **캐시가 필요합니다!**

---

### 💡 5단계 - 캐시 도입

```javascript
const cache = new Map();

if (cache.has(key)) {
  return cache.get(key);
}

const data = await fetchFn();
cache.set(key, data);
return data;
```

* 이미 한 번 받은 요청 결과를 캐시에 저장
    
* 다음 동일한 요청엔 재사용!
    

> 🙌 중복 요청 방지, 응답 재활용까지 가능!

---

### 🧱 6단계 - 그럼 이 캐시, 어디에 둘까?

* useRef로 저장? → 훅마다 따로 가짐 → **공유 안됨**
    
* 전역 Map으로 저장? → 컴포넌트 바뀌면 불안정
    

➡️ 데이터를 어디서든 꺼내 쓸 수 있어야 함  
➡️ **전역적으로 관리되는 중앙 컨트롤러 필요**

---

### 🧩 7단계 - 중앙 캐시 컨트롤러 만들기

```javascript
class QueryClient {
  private cache = new Map();

  async fetch(key, fn) {
    if (this.cache.has(key)) return this.cache.get(key);
    const data = await fn();
    this.cache.set(key, data);
    return data;
  }

  get(key) {
    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
  }
}
```

* 한 번 받은 데이터는 전역에서 공유 가능
    
* 요청 중복 방지
    
* 필요하면 `invalidate`, `refetch`, `subscribe`까지 확장 가능
    

---

### 🔑 8단계 - 쿼리 키(Query Key)로 요청 구분하기

요청 구분 기준이 필요하잖아?

이때 떠오르는 질문:

> ❓ "같은 API라도 파라미터가 다르면 어떻게 하지?"

```javascript
fetchUser(1) ↔ fetchUser(2)
```

* `queryFn`은 같지만 결과는 다름
    
* 그럼 키도 파라미터를 포함해야겠네?
    

➡️ 그래서 등장하는 게 **쿼리 키(Query Key)**

```javascript
const key = JSON.stringify(['user', 1]);
```

→ `fetchUser(1)`과 `fetchUser(2)`를 정확히 구분 가능!

---

### 🪝 9단계 - useQuery 훅으로 추상화

```javascript
function useQuery<T>(key: any[], fetchFn: () => Promise<T>) {
  const stringKey = JSON.stringify(key);
  const [data, setData] = useState<T | null>(() => queryClient.get(stringKey) ?? null);
  const [loading, setLoading] = useState(data === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (data !== null) return;

    queryClient.fetch(stringKey, fetchFn)
      .then(res => setData(res))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [stringKey]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    queryClient.invalidate(stringKey);
    queryClient.fetch(stringKey, fetchFn)
      .then(res => setData(res))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
}
```

이제 React 컴포넌트에서는 이렇게 간단히 사용 가능:

```javascript
const { data, loading, error } = useQuery(['user', 1], () => fetchUser(1));
```

---

### 🔁 10단계 - 컴포넌트 간 상태 동기화를 위한 구독 시스템

그런데 데이터 바뀌면, 다른 컴포넌트는 어떻게 알지?

"A 컴포넌트에서 데이터 갱신했는데, B 컴포넌트는 왜 몰라?"  
→ 상태는 캐시에 있지만, React는 그걸 자동으로 알 수 없어요.  
→ React의 렌더링은 **state나 props가 바뀌어야만** 발생하기 때문입니다.  
→ 그래서 직접 알려줘야 해요: "야, 너 데이터 바뀜! 다시 렌더해!"  
→ 이게 바로 **구독(Pub/Sub)**입니다.

구독 시스템 추가

```javascript
type Subscriber = () => void;

class QueryClient {
  private cache = new Map();
  private subs = new Map<string, Set<Subscriber>>();

  // 생략: fetch, get, set 등...

  subscribe(key: string, callback: Subscriber) {
    if (!this.subs.has(key)) {
      this.subs.set(key, new Set());
    }
    this.subs.get(key)!.add(callback);
  }

  unsubscribe(key: string, callback: Subscriber) {
    this.subs.get(key)?.delete(callback);
  }

  notify(key: string) {
    this.subs.get(key)?.forEach(cb => cb());
  }

  set<T>(key: string, data: T) {
    this.cache.set(key, data);
    this.notify(key);
  }
}
```

`useQuery` 훅에서도 구독/해제를 반영:

```javascript
useEffect(() => {
  const rerender = () => {
    const cached = queryClient.get<T>(stringKey);
    setData(cached ?? null);
  };

  queryClient.subscribe(stringKey, rerender);
  return () => queryClient.unsubscribe(stringKey, rerender);
}, [stringKey]);
```

→ 컴포넌트 A에서 데이터 변경 시, B도 자동 리렌더링!

---

### 🎉 최종 사고 흐름 요약

| 단계 | 문제 | 깨달음 | 해결책 |
| --- | --- | --- | --- |
| 1단계 | 기본 요청 필요 | API 훅 추상화 | `useQueryRequest` |
| 2단계 | 응답 순서 꼬임 | Race Condition 발생 | `AbortController` |
| 3단계 | 중복 요청 발생 | 상태 재사용하고 싶음 | 캐싱 도입 |
| 4단계 | 캐시 관리 어려움 | 상태 공유 필요 | 중앙 캐시 컨트롤러 도입 |
| 5단계 | 여러 컴포넌트 갱신 필요 | 상태 변화 자동 전파 필요 | 구독(Pub/Sub) 시스템 추가 |

---

React Query의 핵심은 두 가지입니다:

1. **데이터와 상태를 캐시에 저장한다**
    
2. **그 데이터를 구독하고 있는 컴포넌트를 자동으로 다시 그려준다**
    

이제는 단지 "React Query 쓰면 편해요"가 아니라 **왜 그렇게 설계됐는지**, **어떤 문제를 해결하는지**에 대해 알아보았습니다.

결론 React Query를 쓰자..