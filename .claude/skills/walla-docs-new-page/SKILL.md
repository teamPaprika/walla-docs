---
name: walla-docs:new-page
description: "walla-docs 프로젝트에 새 문서 페이지를 생성합니다. 비개발자도 쉽게 사용할 수 있도록 대화형으로 안내합니다. 새 페이지 만들기, 문서 추가, 페이지 생성 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:new-page

walla-docs 프로젝트에 새 문서 페이지를 생성하는 스킬입니다.

## 프로젝트 구조

```
content/docs/
├── {lang}/                # 언어별 폴더 (en, ko, ...)
│   ├── help-center/       # 헬프센터
│   └── developer-docs/    # 개발자 문서
```

- **지원 언어는 `src/lib/i18n.ts`의 `languages` 배열에서 확인** (현재 en, ko이지만 추가될 수 있음)
- 실행 시 반드시 `src/lib/i18n.ts`를 읽어서 현재 지원 언어 목록을 파악할 것
- 섹션: `help-center`, `developer-docs`
- 각 섹션 하위에 카테고리 폴더가 있고, 그 안에 `.mdx` 파일이 페이지
- 각 폴더에 `meta.json`이 있어 페이지 순서를 관리

## 워크플로우

사용자에게 다음을 **대화형으로** 물어보세요. 한꺼번에 다 묻지 말고 자연스럽게 진행합니다.

### 1단계: 기본 정보 수집

물어볼 것:
- **어떤 페이지를 만들고 싶은지** (제목과 간단한 설명)
- **어디에 넣을 건지** (헬프센터? 개발자 문서? 어떤 카테고리?)
  - 카테고리 목록을 보여주며 선택하게 합니다
  - 기존 카테고리에 없으면 새 카테고리도 만들 수 있다고 안내

사용자가 모호하게 답하면 기존 구조를 보여주면서 도와주세요:
```
헬프센터 카테고리:
- getting-started (시작하기)
- team-workspace (팀/워크스페이스)
- create-forms (설문 만들기)
- manage-forms (설문 관리하기)
- share-forms (설문 공유하기)
- custom-design (커스텀 디자인)
- result-analysis (결과 분석)
- integrate-forms (설문 연동하기)
- security (보안)
- reward (리워드)
```

### 2단계: 파일 생성

1. **파일명 결정**: 제목을 kebab-case로 변환 (예: "AI로 설문 만들기" → `creating-project-ai.mdx`)
2. **모든 언어에 생성**: `src/lib/i18n.ts`에서 읽은 모든 언어 폴더에 동일 구조로 생성
3. **frontmatter 작성**:

```mdx
---
title: 페이지 제목
description: 한 줄 설명
---

## 첫 번째 섹션

내용을 여기에 작성하세요.
```

4. **meta.json 업데이트**: 해당 카테고리의 `meta.json`에 새 파일명(확장자 제외) 추가
   - ko와 en 양쪽 모두 업데이트
   - 사용자에게 페이지 순서(어디에 넣을지) 확인

### 3단계: 새 카테고리 생성 (필요한 경우)

새 카테고리가 필요하면:
1. 모든 언어 폴더에 `content/docs/{lang}/{section}/{new-category}/` 폴더 생성
2. 각 언어 폴더에 `meta.json` 생성:
   ```json
   {
     "title": "카테고리 제목",
     "pages": ["new-page-slug"]
   }
   ```
4. 상위 `meta.json`에 새 카테고리 추가

### 4단계: 확인

- 생성한 파일 경로를 보여줍니다
- `pnpm dev`가 실행 중이면 바로 확인할 수 있다고 안내합니다
- 컴포넌트를 추가하고 싶으면 `/walla-docs:add-component`를 사용하라고 안내합니다

## 주의사항

- 파일명은 항상 **영문 kebab-case** (한글 X)
- frontmatter의 title/description은 해당 언어로 작성
- en 버전은 영어, ko 버전은 한국어로 frontmatter 작성
- 모든 언어의 파일 구조(파일명, 폴더 구조)는 반드시 동일해야 함
- meta.json의 pages 배열에서 파일 순서가 사이드바 순서를 결정함
