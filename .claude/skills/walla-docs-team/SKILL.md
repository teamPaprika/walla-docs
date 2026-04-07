---
name: walla-docs-team
description: walla-docs 헬프센터 문서 작업 전체를 에이전트 팀으로 처리하는 오케스트레이터. 새 페이지 만들기, 페이지 수정, 한↔영 번역, 컴포넌트 추가, 가이드 작성, 문서 배포, "문서 팀 돌려줘", "다시 실행", "재실행", "보완", "이전 결과 기반으로 수정" 등 walla-docs의 content/ 또는 .mdx 작업이 언급되면 반드시 이 스킬을 사용. 단순 한 줄 오타 수정처럼 작업이 명백히 1개 에이전트로 충분한 경우는 제외.
---

# walla-docs-team — 문서 팀 오케스트레이터

walla-docs 문서 작업을 5인 에이전트 팀(planner, writer, translator, qa, publisher)으로 처리한다.

## 실행 모드
**에이전트 팀 모드.** 모든 에이전트는 `model: "opus"`. 중간 산출물은 `_workspace/`에 저장.

## Phase 0: 컨텍스트 확인
1. `_workspace/` 존재 여부 확인
   - 없음 → **초기 실행**
   - 있음 + 사용자가 부분 수정 요청 → **부분 재실행** (해당 에이전트만 재호출)
   - 있음 + 새 주제 입력 → 기존을 `_workspace_prev/`로 이동 후 **새 실행**
2. 사용자 요청을 한 줄로 요약하고 진행 모드를 사용자에게 명시

## Phase 1: 팀 구성
TeamCreate로 다음 5명 팀 생성:
- docs-planner, docs-writer, docs-translator, docs-qa, docs-publisher

모두 `subagent_type`은 정의 파일 이름과 동일, `model: "opus"`.

## Phase 2: 작업 흐름 (파이프라인 + incremental QA)
```
planner → writer → translator → qa(점진) → publisher
                ↘─────────────↗
```

TaskCreate로 의존 관계 명시:
1. plan (planner)
2. write (writer, depends: plan)
3. translate (translator, depends: write) — 영어가 필요할 때만
4. qa (docs-qa, depends: write/translate) — 각 모듈 완성마다 점진 실행
5. publish (publisher, depends: qa OK + 사용자 확인)

## Phase 3: 데이터 전달
- **태스크 기반:** TaskUpdate로 진행 상황 공유
- **파일 기반:** `_workspace/0N_*.md`에 단계별 산출물
- **메시지 기반:** 모호함·완료 신호·수정 요청은 SendMessage

파일명: `01_plan.md`, `02_writer_output.md`, `03_translator_output.md`, `04_qa_report.md`, `05_publish_log.md`

## 에러 핸들링
- 에이전트 작업 1회 재시도 → 재실패 시 결과 누락 명시 후 다음 단계 진행
- qa가 발견한 문제는 출처 병기 후 해당 에이전트에 수정 요청
- 빌드 실패는 publish 차단 사유

## 사용 스킬 매핑
| 에이전트 | 사용 스킬 |
|---------|----------|
| docs-writer | walla-docs-new-page, walla-docs-add-component, documentation-writer |
| docs-translator | walla-docs-translate |
| docs-qa | (직접 검증 + Bash로 빌드) |
| docs-publisher | walla-docs-preview, walla-docs-deploy |

## 테스트 시나리오

**정상 흐름:**
"워크스페이스 알림 설정 가이드 페이지를 한/영 모두 만들어줘"
→ planner: 경로/구조 결정 → writer: ko mdx 생성 → translator: en mdx 생성 → qa: 짝 일치/링크 검증 → publisher: preview → 사용자 확인 → deploy

**에러 흐름:**
qa가 meta.json 누락 발견 → writer에게 SendMessage → writer 수정 → qa 재검증 → 통과 → publisher 진행

## 후속 작업
사용자가 "방금 만든 알림 페이지에 스크린샷 추가해줘" 같이 요청하면 Phase 0에서 부분 재실행 모드로 진입, writer만 재호출하고 qa는 변경분만 검증.
