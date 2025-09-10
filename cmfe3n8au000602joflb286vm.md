---
title: "Cursor 사용법 정리"
datePublished: Wed Sep 10 2025 14:53:14 GMT+0000 (Coordinated Universal Time)
cuid: cmfe3n8au000602joflb286vm
slug: cursor

---

1. **Chat** (ctrl + L , ctrl + i)
    

**: “대화하며 질문/설명 받기”**

* **Agent Mode** → 내가 직접 코드 수정/생성을 요청할 때
    
* **Ask Mode** → 내가 직접 질문/개념 설명 받고 싶을 때
    
* **Background Agent** → 내가 뭘 안 물어봐도, **코드 흐름을 계속 지켜보다가 자동으로 도움을 주는 역할**
    
    * 백그라운드에서 설명이나 개선안을 미리 띄워줌.
        
    * 자잘한 boilerplate 코드 자동 작성.
        
    * 참고) `Background Agent`는 사실상 GitHub Copilot의 확장 기능이기때문에, GitHub 계정 연동이 필수
        

2. @ Add Context
    

단순히 질문을 던지는 게 아니라, “해당 코드/파일/문서/대화 기록을 바탕으로 답변하도록 하는 기능.  
즉, AI가 답변할 때 맥락(Context)을 붙여주는 거죠.

* **@Files** - 프로젝트의 특정 파일 참조
    
* **@Folders** - 더 넓은 컨텍스트를 위한 전체 폴더 참조
    
* **@Code** - 코드베이스의 특정 코드 스니펫 또는 심볼 참조
    
* **@Docs** - 문서 및 가이드 액세스
    
* **@Git** - Git 히스토리 및 변경사항 액세스
    
* **Past Chats** → 예전 Copilot 대화 내용
    
* **Rules** → 워크스페이스 규칙(프롬프트 지침 같은 것)
    
* **Terminals**→ VS Code 내 터미널 출력 로그를 참고
    
* **Active Tabs** → 현재 열려 있는 편집기 탭(코드 파일들)을 맥락으로 추가.
    
* **Linter Errors**→ ESLint, Pylint 같은 린터 에러 메시지를 Copilot이 참고할 수 있게 해줌.
    
* **Web** → Copilot이 로컬 파일뿐 아니라 웹 검색 결과도 참고 가능
    
    * 회사 정책/설정에 따라 켜거나 끌 수 있음
        
    * 설정 ( \[Cursor Settings ⚙️ &gt; Chat\] )에서 항상 사용할지 체크 가능
        
* **Recent Changes** → 최근에 수정한 코드(코밋 전 변경 사항 포함)를 컨텍스트로 추가.
    

3. Rules: 내가 직접 정의하는 "규칙(가이드라인)”
    

User Rules

* **개인 사용자 차원에서 적용되는 규칙**
    
* VS Code 전역에 걸쳐 내가 cursor를 쓸 때 항상 따라야 할 개인 취향/스타일을 지정
    
    * “답변은 한국어로 해줘”
        
    * “항상 TypeScript 예제를 우선으로 제시해줘”
        
    * “코드 스타일은 snake\_case 말고 camelCase로 맞춰줘”
        

→ 즉, 내가 어떤 프로젝트를 열든 **항상 나한테 맞춘 기본 규칙**을 적용.

Project Rules

* **특정 프로젝트에만 적용되는 규칙**
    
* 보통은 팀 컨벤션이나 레포지토리 규칙을 cursor에 알려줄 때 씀
    
    * “복잡한 로직/인터랙션은 전용 컴포넌트/HOC로 분리한다.”
        
    * “깊은 props 전달 대신 컴포넌트 컴포지션을 사용한다.”
        

→ 즉, 이 규칙은 해당 프로젝트 안에서만 적용되고, 다른 프로젝트 열면 적용되지 않음.

4, Memories

* AI가 **내 대화/사용 패턴을 스스로 기억하는 것**
    
* 내가 따로 규칙을 안 정해도, AI가 “아, 이 사람은 함수만들 때 항상 ~~식으로 만들었네” 같은 걸 자동 학습.
    

예시:

* The user prefers not to use internal scrollbars in UI components and wants to unify scrolling under a single global scroll.
    
* 내가 여러 번 "답변은 짧게"라고 요청했으면, 앞으로 알아서 짧게 답하려 함.
    

👉 즉, Memories는 “AI가 스스로 나를 학습한 기록”