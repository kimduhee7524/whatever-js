---
title: "React에서 모달 선언적으로 관리하는 방법"
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

## 마무리

React로 UI를 만들 때, 선언형 패턴은 유지보수성과 확장성 측면에서 큰 장점을 제공합니다. `useModal()` 같은 방식으로 모달을 관리하면 코드가 훨씬 더 깔끔하고 재사용 가능해진답니다.