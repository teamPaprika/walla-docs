---
name: walla-docs:preview
description: "walla-docs 사이트를 로컬에서 미리보기합니다. 개발 서버를 실행하고 확인할 URL을 안내합니다. 미리보기, 프리뷰, preview, 확인해보기 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:preview

로컬 개발 서버에서 문서 사이트를 미리보는 스킬입니다.

## 워크플로우

### 1단계: 개발 서버 상태 확인

개발 서버가 이미 실행 중인지 확인합니다:

```bash
lsof -i :3000 -sTCP:LISTEN
```

### 2단계: 서버 실행 (필요한 경우)

실행 중이 아니면:

```bash
pnpm dev
```

사용자에게 안내:
```
개발 서버를 시작했어요. 잠시만 기다려주세요...
```

### 3단계: URL 안내

서버가 준비되면 사용자에게 확인할 URL을 안내합니다:

```
미리보기가 준비됐어요! 브라우저에서 확인해보세요:

  홈: http://localhost:3000
  한국어 헬프센터: http://localhost:3000/ko/docs/help-center
  영어 헬프센터: http://localhost:3000/en/docs/help-center
```

사용자가 특정 페이지를 작업 중이었다면 해당 페이지의 URL을 직접 알려줍니다:
- 파일 경로 `content/docs/ko/help-center/create-forms/creating-project-ai.mdx`
- → URL: `http://localhost:3000/ko/docs/help-center/create-forms/creating-project-ai`

### 변환 규칙

파일 경로 → URL 변환:
```
content/docs/{lang}/{section}/{category}/{page}.mdx
→ http://localhost:3000/{lang}/docs/{section}/{category}/{page}
```

- `index.mdx` → 폴더 경로 자체 (예: `help-center/index.mdx` → `/help-center`)
- `.mdx` 확장자 제거

### 에러 대응

- **포트 3000이 사용 중**: 이미 다른 프로세스가 쓰고 있으면 안내
- **빌드 에러**: 에러 내용을 쉬운 말로 설명하고 수정 도움
  - MDX 문법 에러 → 어떤 파일 몇 번째 줄인지
  - import 에러 → 컴포넌트 이름 오타 확인
  - 이미지 경로 에러 → public/ 폴더에 파일 존재 여부

## 주의사항

- 개발 서버는 파일 저장 시 자동으로 새로고침됨 (Hot Reload)
- 서버가 이미 실행 중이면 다시 시작할 필요 없음
- 사용자에게 "저장하면 자동으로 반영돼요"라고 안내
