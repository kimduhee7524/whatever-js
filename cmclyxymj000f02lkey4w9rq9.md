---
title: "React에서 비동기 제어 가능한 선언형 모달 시스템 구현하기"
datePublished: Wed Jul 02 2025 13:04:39 GMT+0000 (Coordinated Universal Time)
cuid: cmclyxymj000f02lkey4w9rq9
slug: react

---

React에서 `<Modal />`이나 `<Toast />` 같은 오버레이 UI를 다루다 보면, 생각보다 코드가 깔끔하게 유지되지 않더라고요. 처음에는 `useState` 하나로도 충분해 보이지만, 모달이 많아지고 복잡해질수록 금세 코드가 지저분해지기 시작합니다. 이 글에서는 제가 직접 겪었던 문제들을 바탕으로, 모달을 더 선언적으로 관리하는 방법을 정리해보려 합니다.

## 기존 방식: 명령형 접근의 문제

보통은 이런 식으로 모달을 제어하죠:

```javascript
const [isOpen, setIsOpen] = useState(false);

const handleOpen = () => setIsOpen(true);
const handleClose = () => setIsOpen(false);

return (
  <>
    <button onClick={handleOpen}>열기</button>
    {isOpen && <Modal onClose={handleClose} />}
  </>
);
```

이 방식의 문제점은 다음과 같습니다:

* 모달마다 상태(`isOpen`)와 핸들러(`handleOpen`, `handleClose`)를 따로 관리해야 함
    
* 모달이 여러 개일 경우 상태가 기하급수적으로 늘어남
    
* 컴포넌트 응집도가 떨어지고 재사용성도 낮음
    
* 보일러플레이트 코드가 많아져 가독성과 유지보수성 저하
    

이런 구조는 **명령형** 접근이라고 부르며, UI를 직접 "어떻게 보여줄지" 지시하는 방식입니다.

---

## 선언형 방식: 모달을 함수처럼 다루기

React의 철학에 맞게, 우리는 모달을 보다 **선언적(Declarative)** 으로 다룰 수 있습니다.

```javascript
const { showModal, hideModal } = useModal();

const handleOpenModal = () => {
  showModal(<MyModal onClose={hideModal} />);
};

return <button onClick={handleOpenModal}>모달 열기</button>;
```

### 장점

* 상태 관리 코드가 사라짐
    
* `showModal()` 한 줄로 모달 열기 가능
    
* `onClose={hideModal}`만 넘겨주면 닫기 처리 끝
    
* 여러 모달도 깔끔하게 관리 가능
    

```javascript
const { showModal, hideModal } = useModal();

const openUserForm = () => {
  showModal(<UserFormModal onClose={hideModal} />);
};

const openManagerForm = () => {
  showModal(<ManagerFormModal onClose={hideModal} />);
};

return (
  <>
    <button onClick={openUserForm}>유저 폼 열기</button>
    <button onClick={openManagerForm}>매니저 폼 열기</button>
  </>
);
```

---

## 이 방식이 진가를 발휘하는 순간

* 모달이 3개 이상일 때
    
* `confirm()`처럼 비동기 모달 흐름이 필요할 때
    
* 중첩 모달을 띄워야 할 때
    
* 여러 컴포넌트에서 같은 모달을 재사용할 때
    

지금은 간단해 보여도, 프로젝트 규모가 커질수록 선언형 방식은 **중복 제거**, **유지보수성**, **확장성** 측면에서 훨씬 효율적입니다.

---

## 어떻게 구현할까?

### 핵심 아이디어

* 앱 전역에서 모달 상태를 하나로 관리
    
* `showModal(<ModalComponent />)`처럼 호출하면 자동으로 렌더링
    
* 내부적으로는 Context와 Portal을 활용
    

---

### 1\. `ModalContext.tsx` – 핵심 로직

```typescript
import React, { createContext, useContext, useState, ReactNode } from "react";
import ReactDOM from "react-dom";

type ModalContextType = {
  showModal: (modal: ReactNode) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ReactNode | null>(null);

  const showModal = (modalElement: ReactNode) => setModal(modalElement);
  const hideModal = () => setModal(null);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {modal}
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal은 ModalProvider 내부에서만 사용하세요.");
  return context;
}
```

---

### 2\. `App.tsx` – Provider로 감싸기

```javascript
import { ModalProvider } from "./ModalContext";
import HomePage from "./HomePage";

function App() {
  return (
    <ModalProvider>
      <HomePage />
    </ModalProvider>
  );
}
```

---

### 3\. `HomePage.tsx` – 선언형 사용

```typescript
import { useModal } from "./ModalContext";
import UserFormModal from "./UserFormModal";
import ManagerFormModal from "./ManagerFormModal";

export default function HomePage() {
  const { showModal, hideModal } = useModal();

  return (
    <div>
      <button onClick={() => showModal(<UserFormModal onClose={hideModal} />)}>
        유저 폼 열기
      </button>
      <button onClick={() => showModal(<ManagerFormModal onClose={hideModal} />)}>
        매니저 폼 열기
      </button>
    </div>
  );
}
```

---

### 4\. 모달 컴포넌트 예시

```typescript
export default function UserFormModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white p-6 rounded">
      <h2>유저 폼</h2>
      <input className="border p-2" placeholder="이름 입력" />
      <button className="mt-4" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
```

---

지금까지 선언형 모달을 만들어보았는데요.  
지금 구조에서는 단순히 화면에 모달을 띄우고 닫는 역할만 가능합니다  
하지만 현재 구조만으로는 큰 한계를 가지고 있습니다.

예를 들어 이름을 입력받는 모달에서 사용자가 값을 입력하고 "확인"을 눌렀을 때,  
이 값을 받아서 API 요청을 하고 싶어도, 기존 구조에선 그 값을 받을 방법이 없습니다.  
모달이 닫힐 뿐, 외부에서 결과를 알 수는 없습니다.

```javascript
const { showModal, hideModal } = useModal();

const handleOpenModal = () => {
  showModal(<MyModal onClose={hideModal} />);  //  여기선 값을 받을 수 없다!!!!
  // 사용자가 뭘 입력했는지 알 수 없음
};

return <button onClick={handleOpenModal}>모달 열기</button>;
```

모달을 열고, 사용자가 입력을 완료하면 그 값을 받아서 후속 작업을 하고 싶은데...  
지금 구조에선 그게 안 되네..?

### 😣 기존 구조의 한계

* 사용자 입력 결과를 외부로 전달받을 수 없음
    
* 그래서 `모달 결과를 받아서 처리하는 로직을 작성할 수 없음`
    

이 한계를 해결하기 위해, 모달을 보다 **비동기적으로 사용할 수 있는 구조**로 확장합니다.

즉, `window.confirm()`처럼 **모달이 닫힐 때까지 기다렸다가**, **사용자 입력 값을 반환 받는 방식**입니다.

### 우리가 원하는 구조

```typescript
const { open } = useModal(UserFormModal);
const result = await open(); // 모달을 띄우고, 결과를 기다림

if (result) {
  await api.createUser(result);
}
```

* `open()`을 호출하면 모달이 뜨고
    
* 사용자가 입력하면 `close(value)`를 호출
    
* 그럼 `await open()`이 깨어나서 값을 받아옴
    

### 어떻게 구현할까?

그러기위해서는 **Promise를 반환하는 함수**를 제공해야 합니다.

### 1\. `useModal.ts`

```typescript
export function useModal<T>(component: ModalComponent<T>) {
  const { openModal } = useModalContext();  // 전역 모달 상태에 접근
  const open = useCallback(() => openModal(component), [component]);
  return { open };
}
```

### 2\. `ModalContext.tsx`

```typescript
const openModal = <T,>(Component: ModalComponent<T>): Promise<T> => {
  // 모달을 열 때마다 모달 닫기 함수를 포함한 Promise를 반환
  return new Promise<T>((resolve) => {
    const key = `modal-${keyCounter.current++}`;
    const close = (result: T) => {
      resolve(result);  // 모달 닫기 시 결과값 반환
      setModals((prev) => prev.filter((m) => m.key !== key));
    };
    const element = <Component close={close} />;
    setModals((prev) => [...prev, { key, element }]);
  });
};
```

---

### 사용 예시

```typescript
const { open } = useModal<UserFormValues>(UserFormModal);

const handleClick = async () => {
  const formValues = await open(); // 결과값(사용자 입력) 기다림
  if (!formValues) return;

  await api.createUser(formValues);
  toast.success('등록 성공!');
};
```

---

### 모달 컴포넌트

```typescript
export function UserFormModal({ close }: { close: (value: UserFormValues | null) => void }) {
  const [name, setName] = useState('');
  const handleSubmit = () => {
    if (!name) return;
    close({ name }); 
  };

  return (
    <div className="bg-white p-6 rounded">
      <h2>이름 입력</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => close(null)}>취소</button>
        <button onClick={handleSubmit}>등록</button>
      </div>
    </div>
  );
}
```

---

### 모달 구조 흐름 요약

```yaml
[ useModal(UserFormModal).open() 호출 ]
           ↓
[ openModal() 내부에서 모달 JSX 생성 + 상태에 추가 ]
           ↓
[ ModalRoot가 자동 렌더링 → 모달 화면에 뜸 ]
           ↓
[ 사용자 입력 후 close(result) 호출 ]
           ↓
[ resolve(result) → open() Promise가 완료됨 ]
           ↓
[ 외부에서 result 값 받아서 후속 처리 ]
```

지금까지 선언형 모달을 비동기적으로 제어하는 구조에 대해 알아보았습니다.