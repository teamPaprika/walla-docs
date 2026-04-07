# walla-docs

Next.js + Fumadocs 기반 한/영 헬프센터 문서 사이트.

## 하네스: walla-docs 문서 팀

**목표:** 문서 작성·번역·검증·배포 전 과정을 에이전트 팀으로 자동 조율한다.

**에이전트 팀:**
| 에이전트 | 역할 |
|---------|------|
| docs-planner | 요청 분석 및 작업 분해 |
| docs-writer | MDX 페이지 작성·컴포넌트 추가 |
| docs-translator | 한↔영 번역 및 구조 동기화 |
| docs-qa | 링크/구조/번역 일관성 점진 검증 |
| docs-publisher | preview + 사용자 확인 + deploy |

**스킬:**
| 스킬 | 용도 | 사용 에이전트 |
|------|------|-------------|
| walla-docs-team | 오케스트레이터 (팀 조율) | (리더) |
| walla-docs-new-page | 새 페이지 생성 | docs-writer |
| walla-docs-add-component | MDX 컴포넌트 삽입 | docs-writer |
| documentation-writer | 일반 문서 품질 가이드 | docs-writer |
| walla-docs-translate | 한↔영 번역/검증 | docs-translator |
| walla-docs-preview | 로컬 미리보기 | docs-publisher |
| walla-docs-deploy | 배포 | docs-publisher |
| walla-docs-capture-guide | 화면 캡처 가이드 생성 | docs-writer (필요 시) |

**실행 규칙:**
- `content/` 또는 `.mdx` 문서 작업 요청 시 `walla-docs-team` 스킬을 통해 에이전트 팀으로 처리
- 단순 오타 수정·1줄 수정처럼 명백히 작은 작업은 팀 없이 직접 처리 가능
- 모든 에이전트는 `model: "opus"` 사용
- 중간 산출물: `_workspace/` 디렉토리 (커밋 금지)
- 배포는 사용자 명시 확인 후에만 실행

**디렉토리 구조:**
```
.claude/
├── agents/
│   ├── docs-planner.md
│   ├── docs-writer.md
│   ├── docs-translator.md
│   ├── docs-qa.md
│   └── docs-publisher.md
└── skills/
    ├── walla-docs-team/SKILL.md      ← 오케스트레이터
    ├── walla-docs-new-page/
    ├── walla-docs-add-component/
    ├── walla-docs-preview/
    ├── walla-docs-deploy/
    ├── walla-docs-translate/
    ├── walla-docs-capture-guide/
    └── documentation-writer/
```

**주요 참조:**
- `I18N.md` — 번역 용어 가이드
- `content/docs/{ko,en}/` — 문서 원본
- `source.config.ts` — Fumadocs 설정

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-07 | 초기 하네스 구성 (5 에이전트 + walla-docs-team 오케스트레이터) | 전체 | 기존 7개 스킬을 조율할 팀 부재 |
