---
name: walla-docs:translate
description: "walla-docs 문서를 번역하고 언어 간 일관성을 검증합니다. 한국어↔영어 번역, 번역 누락 검사, 페이지 구조 동기화를 수행합니다. 번역, translate, 번역 검증, 언어 동기화 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:translate

문서 번역 및 언어 간 일관성 검증 스킬입니다.

## 프로젝트 구조

```
content/docs/
├── {lang}/    # 언어별 폴더
```

- **지원 언어는 `src/lib/i18n.ts`의 `languages` 배열에서 확인** (현재 en, ko이지만 추가될 수 있음)
- 실행 시 반드시 `src/lib/i18n.ts`를 읽어서 현재 지원 언어 목록을 파악할 것
- 모든 언어는 **완전히 동일한 폴더 구조와 파일명**을 가져야 합니다.

## 모드

사용자 요청에 따라 적절한 모드를 실행합니다:

### 모드 1: 페이지 번역

사용자가 특정 페이지의 번역을 요청하면:

1. 원본 페이지를 읽습니다
2. 대상 언어 버전이 있는지 확인합니다
3. 번역을 생성하거나 기존 번역을 업데이트합니다

### 모드 2: 번역 누락 검사 (검증)

사용자가 번역 검증, 동기화 확인을 요청하면:

1. `src/lib/i18n.ts`에서 지원 언어 목록을 읽습니다
2. 모든 언어 폴더 간 파일 목록을 비교합니다
3. 누락된 파일을 찾습니다
4. meta.json의 pages 배열이 모든 언어에서 동일한지 확인합니다
5. 결과를 보고합니다:

```
번역 검증 결과 (지원 언어: en, ko):

✅ 모든 언어에 존재하는 페이지: 45개
❌ ko에만 있는 페이지: 없음
❌ en에만 있는 페이지: 2개
  - developer-docs/new-feature.mdx
  - help-center/create-forms/new-guide.mdx

❌ meta.json 불일치: 1개
  - help-center/create-forms/meta.json
    ko: 27개 항목, en: 25개 항목

번역이 필요한 파일을 번역할까요?
```

### 모드 3: 전체 번역 동기화

누락된 모든 페이지를 한꺼번에 번역합니다.

## 병렬 처리 (중요)

**번역할 파일이 4개 이상이면 반드시 Agent 도구로 서브에이전트를 사용해 병렬 번역합니다.**

실행 방법:
1. 번역할 파일 목록을 파악합니다
2. 파일이 4개 이상이면, **한 번의 메시지에 여러 Agent 호출을 포함**하여 병렬로 실행합니다
3. 각 서브에이전트에게 아래 정보를 전달합니다:
   - 번역할 원본 파일 경로
   - 생성할 대상 언어 파일 경로
   - 이 스킬의 번역 규칙 (용어 사전, 품질 기준 등)
4. 모든 서브에이전트 완료 후 검증 체크리스트를 실행합니다

예시 (6개 파일을 ko→en 번역):
```
Agent 1: create-forms/creating-project-ai.mdx 번역
Agent 2: create-forms/creating-new-project.mdx 번역
Agent 3: manage-forms/managing-projects.mdx 번역
Agent 4: share-forms/sharing-your-survey.mdx 번역
Agent 5: custom-design/changing-your-survey-theme.mdx 번역
Agent 6: security/auto-delete-responses.mdx 번역
→ 6개 Agent를 단일 메시지에서 동시에 호출
```

서브에이전트 프롬프트에 반드시 포함할 것:
- 원본 파일을 Read 도구로 읽을 것
- 이 스킬의 **용어 사전**과 **번역 규칙**을 그대로 따를 것
- 번역 결과를 Write 도구로 파일에 직접 쓸 것
- URL 경로의 언어 접두어를 올바르게 변경할 것

**3개 이하의 파일은 서브에이전트 없이 순차적으로 직접 번역합니다.**

## 번역 규칙

### 품질 기준

1. **자연스러운 번역**: 직역하지 않고 해당 언어 화자가 자연스럽게 읽을 수 있도록
2. **일관된 용어**: 프로젝트 내 같은 개념은 같은 용어 사용

### 용어 사전

| 한국어 | 영어 |
|--------|------|
| 설문 | Survey / Form |
| 워크스페이스 | Workspace |
| 설문 항목 / 필드 | Field |
| 응답 | Response |
| 객관식 | Multiple Choice |
| 주관식 | Open-ended / Text |
| 로직 | Logic |
| 분기 | Branching |
| 리워드 | Reward |
| 기프티콘 | Gift Card / Gifticon |
| 결과 분석 | Result Analysis |
| 교차 분석 | Cross Tabulation |

### frontmatter 번역

```yaml
# 한국어 (ko)
---
title: AI로 설문 만들기
description: AI를 활용해 설문을 빠르고 간편하게 생성할 수 있어요.
---

# 영어 (en)
---
title: Create a Survey with AI
description: Quickly and easily create surveys using AI.
---
```

### 컴포넌트 내용 번역

- 컴포넌트 **구조는 동일**하게 유지 (같은 종류, 같은 순서)
- 컴포넌트 **내부 텍스트만** 번역
- import문은 동일

```mdx
<!-- 한국어 -->
<Callout type="info" title="참고">
설문을 공유하기 전에 미리보기를 확인하세요.
</Callout>

<!-- 영어 -->
<Callout type="info" title="Note">
Preview your survey before sharing it.
</Callout>
```

### 마크다운 번역

- 제목(`#`), 목록(`-`), 강조(`**`) 등 마크다운 서식은 유지
- 코드 블록 내부의 코드는 번역하지 않음 (주석만 번역)
- URL 경로에서 언어 접두어만 변경 (`/ko/docs/...` ↔ `/en/docs/...`)
- 이미지 경로는 동일하게 유지 (이미지 자체는 번역하지 않음)

### meta.json 번역

```json
// 한국어
{ "title": "설문 만들기" }

// 영어
{ "title": "Creating Forms" }
```

- `pages` 배열은 **완전히 동일** (파일명은 영문이므로)
- `title`만 번역
- 구분선(`---제목---`)도 번역

## 검증 체크리스트

번역 완료 후 반드시 확인:

1. **파일 존재**: en/과 ko/에 동일한 파일이 모두 존재하는가
2. **meta.json 일치**: 양쪽 meta.json의 pages 배열이 동일한가
3. **컴포넌트 구조**: 양쪽 페이지의 컴포넌트 종류와 순서가 동일한가
4. **링크 경로**: href의 언어 접두어가 올바른가 (`/ko/...` vs `/en/...`)
5. **frontmatter**: title과 description이 해당 언어로 작성되었는가

## 주의사항

- 번역 시 원본의 **구조와 포맷을 정확히 보존**
- 코드 예제는 번역하지 않음 (변수명, 함수명 등 유지)
- 브랜드명(왈라, Walla)은 번역하지 않음
- 한국어 문서에서 영어 전문용어를 괄호로 병기하는 패턴이 있으면 유지
  - 예: "교차 분석 (Cross Tabulation)"
- UI 텍스트(버튼명 등)는 실제 앱 UI 언어에 맞춰 작성
