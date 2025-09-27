---
title: "OpenAI API로 영화 추천 기능 구현하기(feat 프롬프트 엔지니어링)"
datePublished: Sat Sep 27 2025 14:45:30 GMT+0000 (Coordinated Universal Time)
cuid: cmg2durzy000502jxf3wr3btt
slug: openai-api-feat

---

최근에 사이드 프로젝트에서 OpenAI API를 활용해 **영화를 추천하는 기능**을 구현했습니다.  
OpenAI API를 활용해 영화 추천 기능을 구현하는 것 자체는 어렵지 않았지만, **AI의 응답을 코드 레벨에서 바로 활용 가능하도록 안정적으로 구조화하는 것**이 생각보다 까다로웠습니다

## 🎯 문제 정의

처음 목표는 간단했습니다.

> “특정 영화를 좋아하는 사용자에게 어울리는 영화 5편을 추천해보자.”

### 1\. 초기 구현: 단순한 접근

처음에는 가장 직관적인 방법으로 시작했습니다.

```typescript
const prompt = `
영화 "${movie.title}"을(를) 좋아하는 사람에게 추천할 만한 영화 5편을 제안해주세요.  
각 추천 영화는 다음 정보를 포함해야하고 JSON형식으로 반환해주세요:
- 영화 제목(title)
- 추천 이유 (reason)  
- 장르 (genres)
- 예상 평점대 (rating)  

현재 영화 정보:
- 제목: ${movie.title}  
- 장르: ${genres}  
- 평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)  
- 개봉일: ${movie.release_date}  
- 러닝타임: ${movie.runtime}분  
- 제작사: ${companies}  
- 줄거리: ${movie.overview}
`;
```

그러나 JSON을 요청했음에도 불구하고 다음과 같은 형태로 응답했습니다:

```plaintext
확인 "Gatillero"와 비슷한 매력을 가진 영화들을 추천해 드리겠습니다. 아래 5편의 영화는 스릴러와 액션 요소를 포함하며, "Gatillero"를 좋아하는 사람에게 적합할 것입니다.

1. **영화 제목**: Sicario  
   - **추천 이유**: 마약 밀매와 범죄의 세계를 사실적으로 묘사하며 긴장감을 유지하는 스릴러로, 강렬한 액션과 복잡한 도덕적 딜레마를 다룹니다.  
   - **장르**: 스릴러, 범죄, 액션  
   - **예상 평점대**: 7.6/10  

2. **영화 제목**: Narcos (TV 시리즈)  
   - **추천 이유**: 콜롬비아의 마약 밀매와 범죄를 다룬 실화를 바탕으로 한 드라마로, 강렬한 캐릭터와 스릴 넘치는 전개가 매력적입니다.  
   - **장르**: 범죄, 드라마, 액션  
   - **예상 평점대**: 8.8/10  

3. **영화 제목**: City of God (Cidade de Deus)  
   - **추천 이유**: 브라질의 슬럼가에서의 범죄와 생존을 다룬 작품으로, 현실적인 스토리와 뛰어난 연출이 돋보입니다.  
   - **장르**: 범죄, 드라마  
   - **예상 평점대**: 8.6/10  

4. **영화 제목**: El Chicano  
   - **추천 이유**: 범죄와 복수를 주제로 한 액션 스릴러로, 문화적 배경과 강렬한 캐릭터들이 매력적입니다.  
   - **장르**: 액션, 범죄, 스릴러  
   - **예상 평점대**: 6.0/10  

5. **영화 제목**: Blood In, Blood Out  
   - **추천 이유**: 갱단과 범죄의 삶을 다룬 강렬한 드라마로, 가족과 충성심의 주제가 심도 있게 다루어집니다.  
   - **장르**: 범죄, 드라마, 액션  
   - **예상 평점대**: 7.8/10  

이 영화들은 "Gatillero"와 유사한 스릴과 액션을 제공하며, 범죄와 인간의 복잡한 감정을 탐구하는 데 중점을 두고 있습니다.
```

문제점:

\- 앞뒤로 불필요한 설명 텍스트 포함

\- 파싱이 불가능한 구조

### 2\. 규칙 추가

더 명확한 규칙을 추가해봤습니다.

```typescript
const prompt = `
영화 "${movie.title}"을(를) 좋아하는 사람에게 추천할 만한 영화 5편을 제안해주세요.  
각 추천 영화는 다음 정보를 포함해야 합니다:
- 영화 제목(title)
- 추천 이유 (reason)  
- 장르 (genres)
- 예상 평점대 (rating)  

규칙:
- 오직 JSON만 출력하세요
- 반드시 5개의 영화 객체를 배열로 반환하세요

현재 영화 정보:
- 제목: ${movie.title}  
- 장르: ${genres}  
- 평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)  
- 개봉일: ${movie.release_date}  
- 러닝타임: ${movie.runtime}분  
- 제작사: ${companies}  
- 줄거리: ${movie.overview}
```

그러자 JSON은 나왔지만, 앞뒤로 \`\`\`json 같은 마크다운이 붙어버렸습니다.  
파싱은 가능하지만 추가 처리가 필요했습니다.

````plaintext
```json
[
    {
        "title": "Scarface",
        "reason": "Gatillero fans will appreciate the intense crime drama and the rise and fall of a drug lord.",
        "genres": ["Crime", "Drama", "Thriller"],
        "rating": "8.3/10"
    },
    {
        "title": "El Chicano",
        "reason": "This film combines action and crime with a focus on a vigilante taking on drug cartels, similar to the themes in Gatillero.",
        "genres": ["Action", "Crime", "Thriller"],
        "rating": "6.0/10"
    },
    {
        "title": "Kill Bill: Vol. 1",
        "reason": "The revenge-driven plot and stylish action sequences will resonate with fans of Gatillero.",
        "genres": ["Action", "Adventure", "Thriller"],
        "rating": "8.1/10"
    },
    {
        "title": "Sicario",
        "reason": "This film offers a gritty portrayal of the drug war, showcasing tension and moral dilemmas that fans of Gatillero would enjoy.",
        "genres": ["Action", "Crime", "Drama"],
        "rating": "7.6/10"
    },
    {
        "title": "Narcos: Mexico (TV Series)",
        "reason": "Although a series, it dives deep into the drug trade and organized crime, appealing to those who liked the themes in Gatillero.",
        "genres": ["Crime", "Drama", "Thriller"],
        "rating": "8.4/10"
    }
]
```
````

### 3\. 구체적인 예시 제공

원하는 JSON 구조 예시를 함께 제시했습니다.

```typescript
const prompt = `
영화 "${movie.title}"을 좋아하는 사람에게 추천할 만한 영화 5개를 추천해주세요.
현재 영화 정보:
- 제목: ${movie.title}
- 장르: ${genres}
- 평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)
- 개봉일: ${movie.release_date}
- 러닝타임: ${movie.runtime}분
- 제작사: ${companies}
- 줄거리: ${movie.overview}

다음 JSON 형식으로 정확히 5개의 영화를 추천해주세요:
[
  {
    "title": "영화 제목",
    "reason": "추천 이유 (한 문장으로)",
    "genre": "주요 장르",
    "rating": "예상 평점대 (예: 8.5/10)"
  }
]
규칙:
- 실존하는 유명한 영화들로만 추천해주시고, 한국어로 작성해주세요.
- JSON 형식만 반환하고 다른 텍스트는 포함하지 마세요.
`
```

AI는 구체적인 예시를 주어 동일한 포맷으로 출력을 유도하니 **출력 안정성이 가장 크게 개선되었습니다.**

```plaintext
[
  {
    "title": "나쁜 녀석들",
    "reason": "강렬한 액션과 스릴이 넘치는 범죄 드라마로, Gatillero를 좋아하는 이들에게 적합합니다.",
    "genre": "스릴러, 액션",
    "rating": "8.0/10"
  },
  {
    "title": "올드보이",
    "reason": "복수와 스릴이 결합된 이야기로, 긴장감 넘치는 전개가 매력적입니다.",
    "genre": "스릴러, 드라마",
    "rating": "8.6/10"
  },
  {
    "title": "신세계",
    "reason": "범죄와 배신이 얽힌 긴장감 넘치는 스토리로, Gatillero 팬들에게 추천합니다.",
    "genre": "스릴러, 범죄",
    "rating": "7.8/10"
  },
  {
    "title": "부산행",
    "reason": "액션과 스릴이 결합된 좀비 재난 영화로, 긴박한 상황이 매력적입니다.",
    "genre": "액션, 공포",
    "rating": "7.6/10"
  },
  {
    "title": "킬 빌",
    "reason": "복수극과 화려한 액션이 조화된 작품으로, Gatillero와 유사한 매력을 지닙니다.",
    "genre": "액션, 스릴러",
    "rating": "8.1/10"
  }
]
```

### 4\. 폴백 로직 설계

혹여나 AI가 약속을 어기는 경우를 대응하기 위해 폴백 로직을 추가하였고, 폴백 함수에서는 조금 더 실패 확률을 줄이기 위해서 더 단순한 형식으로 재요청 후 파싱하도록 구현하였습니다.

```plaintext
${movie.title}" (${genres}) 영화를 좋아하는 사람에게 추천할 영화 3개를 다음 형식으로 알려주세요:
1. 영화제목 - 추천이유
2. 영화제목 - 추천이유
3. 영화제목 - 추천이유
간단하고 명확하게 작성해주세요.
```

폴백 전략의 핵심:  
\- 더 단순한 형식 요구  
\- AI에게 더 많은 자유도 제공  
\- 실패 확률 최소화

### 5\. 역할 부여

기능적으로는 완성되었지만, 추천 이유가 단조로웠습니다. 추천 이유가 전혀 흥미를 유도하지 못하는 것 같아 아쉬워하던 도중, 마침 회사에 AI 부서 이사님이 책을 추천해주셨는데, 책(개발자를 위한 생성형 AI 활용 가이드)에서 "AI에게 특정 역할을 부여하면 더 전문적인 응답을 유도할 수 있다"는 내용을 보고 적용해보게되었습니다.

```typescript
const prompt = `
역할: 
당신은 세계적인 영화 평론가이자 관객을 사로잡는 영화 큐레이터입니다. 
추천 이유(reason)는 단순 줄거리 소개가 아니라, 작품의 연출, 서사, 배우의 연기, 장르적 매력 등을 관객이 영화를 보고 싶어지도록 흥미와 설득력을 담아 작성하세요. 
스타일은 영화 잡지 리뷰나 예고편 카피처럼 전문적이면서 매력적으로 표현하세요.

"${movie.title}" 영화를 좋아하는 사람에게 추천할 만한 영화 5편을 제안해주세요.

현재 영화 정보:
- 제목: ${movie.title}
- 장르: ${genres}
- 평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)
- 개봉일: ${movie.release_date}
- 러닝타임: ${movie.runtime}분
- 제작사: ${companies}
- 줄거리: ${movie.overview}

출력 형식
반드시 다음 JSON 형식으로, 정확히 5개의 추천 영화를 출력하세요:

[
  {
    "title": "영화 제목",
    "reason": "관객의 흥미를 끌 수 있는 전문가적인 추천 이유 (300자 이내)",
    "genre": "주요 장르",
    "rating": "예상 평점대 (예: 8.5/10)"
  }
]

규칙:
- 실존하는 유명한 영화만 추천
- 한국어로 작성
- JSON 외 다른 텍스트 금지
`
```

역할을 부여하니 이전 보다 내용이 전문적이면서 깊이감 있게 표현이 되었습니다.

```typescript
[
  {
    "title": "노인을 위한 나라는 없다",
    "reason": "코맥 맥카시의 소설을 바탕으로 한 이 작품은 치밀한 서사와 차가운 스릴로 관객을 사로잡습니다. 특히, 제시 아이젠버그의 섬뜩한 연기와 코언 형제의 독창적인 연출은 긴장감을 극대화하며, 범죄와 도망자의 심리를 심도 있게 탐구합니다. 정교한 카메라워크와 긴장감 넘치는 음악이 어우러져 시청자를 압도합니다.",
    "genre": "스릴러, 범죄",
    "rating": "8.5/10"
  },
  {
    "title": "킬 빌",
    "reason": "퀀틴 타란티노의 독창적인 비주얼과 강력한 여성 캐릭터는 액션 스릴러의 새로운 지평을 엽니다. 우마 서먼의 카리스마 넘치는 연기와 함께, 화려한 액션 시퀀스는 단순한 복수극을 넘어서 미학적 경험을 선사합니다. 각 장면마다 숨겨진 의미와 오마주가 가득하여, 반복해서 보고 싶은 매력을 지닙니다.",
    "genre": "액션, 스릴러",
    "rating": "8.4/10"
  },
  {
    "title": "시카리오",
    "reason": "이 영화는 마약 카르텔과의 전투를 배경으로 한 강렬한 드라마입니다. 드니 빌뇌브 감독의 탁월한 연출과 베니시오 델 토로의 압도적인 연기는 서스펜스를 극대화하며, 도덕적 혼란을 불러일으킵니다. 특히, 음산한 분위기와 강렬한 사운드트랙은 관객을 끝까지 매료시키는 힘이 있습니다.",
    "genre": "스릴러, 드라마",
    "rating": "7.6/10"
  },
  {
    "title": "존 윅",
    "reason": "키아누 리브스의 찬란한 액션 연기가 돋보이는 이 영화는 스타일과 스릴을 완벽하게 결합합니다. 잔혹한 세계관 속에서 펼쳐지는 복수극은 뛰어난 액션 코레오그래피와 세련된 촬영 기법 덕분에 시각적 쾌감을 제공합니다. 영화의 리듬감 넘치는 전개는 긴장감과 쾌감을 동시에 안겨줍니다.",
    "genre": "액션, 스릴러",
    "rating": "7.4/10"
  },
  {
    "title": "마드맥: 분노의 도로",
    "reason": "포스트 아포칼립스의 세계를 배경으로 한 이 영화는 스릴과 액션의 정수를 보여줍니다. 조지 밀러 감독의 비범한 비주얼 스타일과 강렬한 캐릭터들은 관객을 압도하며, 모든 장면이 영화적 쾌감을 선사합니다. 특히, 하이퍼 액션과 사회적 메시지가 어우러져 보는 이로 하여금 깊은 여운을 남깁니다.",
    "genre": "액션, 스릴러",
    "rating": "8.1/10"
  }
]
```

## 💡 인사이트

이번 경험에서 크게 얻은 건 두 가지였습니다.

1. **프롬프트의 중요성**
    
    → 원하는 아웃풋을 얻기 위해선 *명확한 지시, 예시, 제약 조건, 역할 부여* 같은 **프롬프트 엔지니어링**이 필수적이다.
    
    실제로 제가 사용했던 구조에 대한 예시를 제공하는 방식이 퓨샷 프롬프팅 방식으로 프롬프트 엔지니어링 방식에서 자주 쓰이는 방식이였습니다.
    
2. **제어 로직도 중요하다**
    
    → 모델이 항상 약속을 지키지 않으므로, **폴백·검증·후처리 로직**을 설계하는 것이 실제 서비스 품질을 결정한다.
    

## 📌마무리

단순히 AI API 연동하기를 넘어, 출력 구조를 제어하고, 실패에 대비한 로직을 설계하며,  
프롬프트 엔지니어링을 통해 응답 품질을 개선하는 과정을 거쳤습니다.

그 과정 속에서 **어떻게 하면 AI를 더 효율적으로 다루고, 원하는 결과를 안정적으로 이끌어낼 수 있을지** 고민하고 해결해본 값진 경험이 되었습니다.