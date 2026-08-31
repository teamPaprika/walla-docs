---
name: walla-docs:translate
description: "walla-docs 문서를 번역하고 언어 간 일관성을 검증합니다. 한국어 원본을 지원 언어 전체로 번역하고, 드리프트(누락·뒤처짐) 검사와 목차 동기화를 수행합니다. 번역, translate, 번역 검증, 언어 동기화 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:translate

문서 번역 및 언어 간 일관성 검증 스킬입니다.

## 프로젝트 구조

```
content/docs/
├── {lang}/    # 언어별 폴더
```

- **번역 원본은 `ko`** 입니다. 한국어를 먼저 쓰고 나머지 언어로 옮깁니다.
- **지원 언어는 `src/lib/i18n.ts`의 `languages` 배열이 정본**입니다. 이 문서에 언어를 나열하지 말고, 실행할 때마다 그 파일을 읽어 현재 목록을 파악하세요.
- 모든 언어는 **완전히 동일한 폴더 구조와 파일명**을 가져야 합니다.
- 단, `content/docs/.i18n-ignore` 에 적힌 경로는 의도적으로 번역하지 않습니다 (영어 폴백 사용).

## 모드

사용자 요청에 따라 적절한 모드를 실행합니다:

### 모드 1: 페이지 번역

사용자가 특정 페이지의 번역을 요청하면:

1. 원본 페이지를 읽습니다
2. 대상 언어 버전이 있는지 확인합니다
3. 번역을 생성하거나 기존 번역을 업데이트합니다

### 모드 2: 드리프트 검사 (검증)

사용자가 번역 검증·동기화 확인을 요청하면 **직접 파일을 비교하지 말고 스크립트를 돌립니다.**

```bash
pnpm i18n:check
```

세 종류를 잡아냅니다:

| 항목 | 의미 |
|---|---|
| ❌ 번역 파일 없음 | ko 에 있는데 해당 언어에 없는 파일 |
| ⚠️ 원본이 더 최신 | 파일은 있으나 ko 가 나중에 수정됨 → **번역이 뒤처진 상태** |
| ❌ meta.json 페이지 목록 불일치 | 새 페이지를 번역 쪽 목차에 안 넣은 경우 |

**"원본이 더 최신"이 이 검사의 핵심입니다.** 파일 존재만 확인하면 한국어 문서에
섹션이 추가돼도 번역은 그대로 남아 조용히 낡습니다. 실제로 그렇게 EN 문서에서
섹션이 통째로 빠져 있던 사례가 있었습니다.

판정 기준은 파일별 git 최종 커밋 시각입니다(미커밋 파일은 mtime). 그래서
**번역을 갱신했으면 원본과 같은 커밋이나 그 이후에 커밋해야** 검사가 깨끗해집니다.

"원본이 더 최신"으로 뜬 파일은 ko 와 나란히 놓고 **무엇이 달라졌는지 확인한 뒤
해당 부분만** 반영하세요. 통째로 다시 번역하면 기존 번역 품질이 유실됩니다.

### 오탐 처리

내용은 이미 같은데 커밋 시각만 어긋나서 뜨는 경우가 있습니다(원본에 오탈자 수정
같은 사소한 커밋이 들어간 경우). **두 파일을 직접 비교해 같다고 확인한 뒤에만**
아래를 실행하세요:

```bash
pnpm i18n:accept
```

현재 뜬 항목을 "확인 완료"로 기록합니다(`content/docs/.i18n-verified.json`).
원본이 다시 수정되면 해시가 달라져 경고가 자동으로 되살아납니다.
확인도 안 하고 실행하면 진짜 드리프트를 덮어버리니 주의하세요.

### 모드 3: 전체 번역 동기화

`pnpm i18n:check` 결과의 누락·뒤처짐 항목을 모두 해소합니다. 언어가 여러 개이므로
**한 원본 파일을 한 번만 읽고 여러 언어를 동시에 작성**하는 편이 효율적입니다.

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

| 한국어 | 영어 | 繁體中文 | 日本語 | Español |
|--------|------|------|------|------|
| 설문 | Survey / Form | 問卷 / 表單 | フォーム | formulario |
| 워크스페이스 | Workspace | 工作區 | ワークスペース | espacio de trabajo |
| 설문 항목 / 필드 | Field | 欄位 | フィールド | campo |
| 응답 | Response | 回覆 | 回答 | respuesta |
| 객관식 | Multiple Choice | 選擇題 | 選択式 | opción múltiple |
| 주관식 | Open-ended / Text | 問答題 | 記述式 | respuesta abierta |
| 로직 | Logic | 邏輯 | ロジック | lógica |
| 분기 | Branching | 分支 | 分岐 | ramificación |
| 리워드 | Reward | 獎勵 | リワード | recompensa |
| 기프티콘 | Gift Card / Gifticon | 禮物卡 | ギフト券 | tarjeta regalo |
| 결과 분석 | Result Analysis | 結果分析 | 結果分析 | análisis de resultados |
| 교차 분석 | Cross Tabulation | 交叉分析 | クロス集計 | tabulación cruzada |

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

0. **`pnpm i18n:check` 가 통과하는가** (누락·뒤처짐·목차 불일치 0건)
0. **`pnpm build` 가 통과하는가** — frontmatter 의 `title`/`description` 값에
   콜론+공백(`: `)이 들어가면 YAML 파싱이 깨져 빌드가 실패합니다. 그런 값은
   반드시 따옴표로 감싸세요.
1. **파일 존재**: 모든 지원 언어에 동일한 파일이 존재하는가
2. **meta.json 일치**: 양쪽 meta.json의 pages 배열이 동일한가
3. **컴포넌트 구조**: 양쪽 페이지의 컴포넌트 종류와 순서가 동일한가
4. **링크 경로**: href의 언어 접두어가 대상 언어와 맞는가 (`/ko/...` → `/ja/...` 등)
5. **frontmatter**: title과 description이 해당 언어로 작성되었는가

## 주의사항

- 번역 시 원본의 **구조와 포맷을 정확히 보존**
- 코드 예제는 번역하지 않음 (변수명, 함수명 등 유지)
- 브랜드명(왈라, Walla)은 번역하지 않음
- 한국어 문서에서 영어 전문용어를 괄호로 병기하는 패턴이 있으면 유지
  - 예: "교차 분석 (Cross Tabulation)"
- UI 텍스트(버튼명 등)는 실제 앱 UI 언어에 맞춰 작성
