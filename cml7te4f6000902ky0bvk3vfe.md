---
title: "배열을 처리하는 세 가지 방법 (chaining,  reduce, for loop)"
seoTitle: "Array Processing: Chaining, Reduce, For Loop"
datePublished: Wed Feb 04 2026 09:17:50 GMT+0000 (Coordinated Universal Time)
cuid: cml7te4f6000902ky0bvk3vfe
slug: chaining-reduce-for-loop

---

개발을 하다 보면 배열 데이터를 가공할 일이 정말 많은데요.  
저는 평소에는 `filter`, `map` 같은 메서드 체이닝 방식을 주로 사용합니다. 읽기 쉽고, 데이터 흐름이 단계별로 명확하게 보이기 때문이죠.

하지만 어떠한 계기로(?) 인해 이런 의문을 가지게 되었습니다..

"만약 데이터가 수천만 건으로 늘어난다면? 배열을 여러 번 순회하는 체이닝 방식이 성능 병목을 일으키지는 않을까?" 혹은 "`reduce` 하나로 합치는 게 베스트일까?"

이 질문을 계기로, 배열을 처리하는 방식인 chaining / reduce / for loop 를 성능 + 가독성 + React 불변성 기준으로 정리해보았습니다.

---

### 🛒 예제: 장바구니 결제 로직

서버에서 받아온 장바구니 상품 목록 중에서 "품절되지 않은 상품만 골라, 할인 가격을 적용한 뒤, 총 결제 금액"을 계산해야 한다고 가정해보겠습니다.

```typescript
const cartItems = [
  {id:1,name:'티셔츠',price:20000,outOfStock:false },
  {id:2,name:'청바지',price:50000,outOfStock:true },
  {id:3,name:'양말',price:5000,outOfStock:false },
];

const discountRate =0.1;// 10% 할인
```

---

### ① 메서드 체이닝 — filter → map → reduce

제가 평소 가장 자주 사용하는 방식입니다.

```typescript
const totalPrice = cartItems
  .filter(item => !item.outOfStock)// 1. 품절 제거
  .map(item => item.price * (1 - discountRate))// 2. 할인 적용
  .reduce((acc, price) => acc + price,0);// 3. 합산
```

✔ 장점

* `filter`와 `map`은 항상 새로운 배열을 반환합니다. 원본 데이터를 훼손하지 않는 '불변성'을 자동으로 보장하므로 상태 관리시 안전합니다.
    
* 선언적이고 읽기 쉬우며 “데이터 흐름”이 단계별로 보입니다.
    

✘ 단점

* filter, map, reduce 모두 새 배열 생성 + 콜백 호출로 인해 여러 번 순회가 발생합니다.
    
* 데이터가 수십만 건 이상이되면 중간 배열 비용이 누적될 수 있습니다.( 대부분의 규모 데이터에서는 성능 이슈가 거의 없음)
    

👉 언제 사용할까?

> 일반적인 UI 개발 — 가독성 + 불변성이 모두 보장됨

프론트엔드에서 다루는 대부분의 데이터 규모에서는 거의 항상 체이닝이 가장 적합합니다.

---

### ② reduce — 모든 처리를 한 번에

하나의 순회 안에서 모든 로직을 처리하는 방식입니다.

```typescript
const totalPrice = cartItems.reduce((acc, item) => {
  if (!item.outOfStock) {
    const discounted = item.price * (1 - discountRate);
    return acc + discounted;
  }
  return acc;
}, 0);
```

✔ 장점

* 배열을 단 한 번만 순회하여 효율적입니다. (조건, 변환, 누산을 모두 한 곳에서 처리 가능)
    
* “배열 → 객체”처럼 데이터 구조를 아예 바꿀 때 가장 강력합니다.
    

✘ 단점

* 로직이 복잡해지면 누적값(`acc`)의 변화를 추적하기 어렵고 가독성이 떨어집니다.
    
* 만약 누적값(`acc`)가 배열이나 객체일 경우, 내부에서 직접 수정하면 리액트의 불변성 원칙을 깨뜨릴 위험이 있습니다.
    

👉 언제 사용할까?

> 순회는 한 번만 해야 하고, 결과물의 형태가 달라지는 경우
> 
> (예: 배열 → Map, 배열 → 객체, 배열 → 다른 자료구조)

단순 계산 로직이라면 차라리 체이닝이나 for-of가 읽기 더 쉽습니다.

---

### ③ for...of 루프 — 가장 빠르고 명확한 방식

가장 고전적인 반복문이지만, 의외로 깔끔합니다.

```typescript
let totalPrice = 0;
for (const item of cartItems) {
  if (item.outOfStock) continue; // 품절이면 스킵

  const discounted = item.price * (1 - discountRate);
  totalPrice += discounted;
}
```

✔ 장점

* 가장 빠른 성능: 엔진 최적화가 잘 되어 있고 중간 배열 생성이 없어 메모리 효율이 좋습니다.
    
* `break`, `continue` 등 세밀한 제어가 가능합니다.
    

✘ 단점

* 함수형 스타일을 선호하는 사람에겐 다소 명령형으로 보일 수 있습니다.
    
* 루프 외부의 변수를 직접 수정(Mutation)해야 하므로, 리액트 상태를 다룰 때는 루프가 끝난 뒤 새로운 값을 통째로 넘겨주는 식의 수동 불변성 관리가 필요합니다. → 원본 데이터 변경을 실수로 하기 쉬움
    

👉 언제 사용할까?

> 데이터가 매우 많을 때(수만~수십만 건)
> 
> 또는 중간에 루프를 멈춰야 하는 상황 (break)

대량 처리나 퍼포먼스 최우선 상황이라면 사실상 가장 좋은 선택입니다.

---

### 📊 비교 요약

| 방식 | 추천 상황 | 장점 | 단점 |
| --- | --- | --- | --- |
| **체이닝(map·filter)** | 일반적인 UI 개발 | 선언적 · 불변성 안전성 | 여러 번 순회, 중간 배열 비용 |
| **reduce** | 구조 변환, 한 번에 처리 | 유연함, 단일 순회 | 복잡해지기 쉬움 |
| **for...of** | 대량 데이터, 제어 흐름 필요 | 매우 빠름, 명령 제어 쉬움 | 함수형 스타일 아님 |

---

### ✨ 마치며

코딩에 정답은 없지만 저는 대부분의 경우 단순히 성능 수치에 집착해서 읽기 어려운 코드를 만들기보다는, 내 상황에 맞는 가장 단순한 코드를 선택하는 편입니다.

따라서 저의 기준은

1. 평소에는 가독성이 좋고 불변성을 보장하는 체이닝을 우선으로 작성합니다.
    
2. 데이터가 너무 많아 성능 저하가 우려되거나 로직이 꼬인다면, `reduce`보다는 차라리 명확한 `for loop`로 리팩토링하겠습니다. (경험상 `reduce`는 코드를 불필요하게 복잡하게 만드는 경우가 많았습니다.)