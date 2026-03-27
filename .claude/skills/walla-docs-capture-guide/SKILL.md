---
name: walla-docs:capture-guide
description: "app.walla.my에 직접 접속해서 화면을 탐색하고, 스크린샷/GIF를 캡처하며 문서 가이드를 자동 생성합니다. 가이드 만들기, 스크린샷 찍기, 화면 캡처, 사용법 문서 만들기 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:capture-guide

app.walla.my에 직접 접속해서 화면을 탐색하고, 스크린샷/GIF를 캡처하며 가이드 문서를 자동 생성하는 스킬입니다.

## 사전 준비

이 스킬은 Chrome 브라우저 자동화 도구(claude-in-chrome)를 사용합니다.
실행 전 반드시:
1. Chrome에서 Claude 브라우저 확장이 설치 & 연결되어 있어야 함
2. app.walla.my에 로그인된 상태여야 함 (로그인은 사용자가 직접 수행)

## 워크플로우

### 1단계: 주제 확인

사용자에게 어떤 가이드를 만들고 싶은지 물어봅니다:

```
어떤 기능의 가이드를 만들까요?
예: "설문 만들기", "로직 설정하기", "결과 분석하기" 등
```

### 2단계: 브라우저 탐색 준비

Chrome 도구를 로드하고 탭 상태를 확인합니다:

1. `ToolSearch`로 필요한 chrome 도구 로드:
   - `mcp__claude-in-chrome__tabs_context_mcp` (탭 확인)
   - `mcp__claude-in-chrome__tabs_create_mcp` (새 탭)
   - `mcp__claude-in-chrome__navigate` (페이지 이동)
   - `mcp__claude-in-chrome__read_page` (페이지 내용 읽기)
   - `mcp__claude-in-chrome__computer` (클릭, 스크롤 등)
   - `mcp__claude-in-chrome__get_page_text` (텍스트 추출)
   - `mcp__claude-in-chrome__gif_creator` (GIF 녹화)
   - `mcp__claude-in-chrome__upload_image` (스크린샷 저장)

2. 탭 컨텍스트 확인 후 새 탭에서 app.walla.my 접속

### 3단계: 화면 탐색 & 캡처

기능에 따라 단계별로 탐색합니다:

1. **해당 기능 페이지로 이동**
2. **각 단계마다**:
   - 화면을 읽고 현재 상태 파악
   - 스크린샷 캡처 (주요 화면)
   - 필요하면 GIF 녹화 (인터랙션이 있는 단계)
   - 다음 단계로 진행 (클릭, 입력 등)
3. **캡처한 이미지는 `public/images/guides/{가이드-slug}/` 폴더에 저장**

파일명 규칙:
```
public/images/guides/{guide-slug}/
├── step-01-dashboard.png
├── step-02-create-form.png
├── step-03-add-field.gif
└── step-04-preview.png
```

### 4단계: 가이드 문서 생성

캡처한 스크린샷과 함께 MDX 문서를 작성합니다:

```mdx
---
title: AI로 설문 만들기
description: AI를 활용해 설문을 빠르고 간편하게 생성하는 방법
---

import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

## AI로 설문 만들기

<Steps>
  <Step>
    #### 워크스페이스에서 새 설문 만들기

    워크스페이스 화면에서 `+` 버튼을 클릭합니다.

    ![새 설문 만들기](/images/guides/create-survey-ai/step-01-dashboard.png)
  </Step>
  <Step>
    #### AI 설문 만들기 선택

    [AI로 설문 만들기]를 선택합니다.

    ![AI 설문 만들기](/images/guides/create-survey-ai/step-02-select-ai.png)
  </Step>
</Steps>

<Callout type="idea" title="팁">
프롬프트를 구체적으로 작성할수록 더 정확한 설문이 생성됩니다.
</Callout>
```

### 5단계: 다국어 버전 생성

`src/lib/i18n.ts`에서 지원 언어를 확인하고, 모든 언어 버전을 생성합니다:
- 이미지 경로는 모든 언어에서 동일 (이미지는 공유)
- 텍스트만 해당 언어로 번역
- meta.json도 모든 언어에서 업데이트

### 6단계: 결과 확인

사용자에게 생성된 문서를 보여줍니다:
```
가이드를 만들었어요!

  캡처한 이미지: 5장 (스크린샷 4장, GIF 1개)
  생성된 페이지: ko, en 각 1개

  미리보기: http://localhost:3000/ko/docs/help-center/create-forms/creating-project-ai
```

## 캡처 가이드라인

### 스크린샷
- 핵심 UI 영역만 포커스 (전체 화면보다 관련 부분만)
- 클릭할 버튼이나 메뉴를 강조할 수 있도록 캡처
- 민감한 정보(이메일, 이름 등)가 보이면 사용자에게 알림

### GIF
- 복잡한 인터랙션(드래그앤드롭, 멀티스텝 동작)에만 사용
- 짧게 유지 (3~5초)
- 시작 전/후에 여분의 프레임 추가

### 이미지 저장
- 경로: `public/images/guides/{guide-slug}/`
- 파일명: `step-{번호}-{설명}.{png|gif}`
- MDX에서 참조: `![설명](/images/guides/{guide-slug}/step-01-설명.png)`

## 탐색 시 주의사항

- **로그인은 사용자가 직접** 수행 (비밀번호 입력 금지)
- **데이터 수정 금지**: 읽기/탐색만 수행. 설문 생성, 삭제, 수정 등은 하지 않음
  - 단, 사용자가 명시적으로 "테스트 설문 만들어도 돼"라고 하면 가능
- **alert/confirm 다이얼로그 주의**: 삭제 버튼 등 모달을 트리거하는 요소 클릭 금지
- **개인정보 주의**: 스크린샷에 민감한 정보가 포함되면 사용자에게 알림
- 탐색이 막히거나 예상과 다른 화면이 나오면 사용자에게 확인
