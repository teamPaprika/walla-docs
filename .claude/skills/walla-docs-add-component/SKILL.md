---
name: walla-docs:add-component
description: "walla-docs 문서 페이지에 MDX 컴포넌트를 추가합니다. Callout, Card, Tabs, Steps, Accordion 등을 대화형으로 안내하며 삽입합니다. 컴포넌트 추가, 알림 박스, 탭, 카드, 단계, 아코디언 등의 요청에 사용합니다."
user_invocable: true
---

# walla-docs:add-component

문서 페이지에 MDX 컴포넌트를 추가하는 스킬입니다.

## 워크플로우

### 1단계: 대상 페이지 확인

사용자에게 어떤 페이지에 컴포넌트를 추가할지 물어봅니다.
- 파일 경로를 알면 바로 진행
- 모르면 카테고리 → 페이지 순서로 찾아줍니다

### 2단계: 컴포넌트 선택

어떤 컴포넌트를 넣고 싶은지 물어봅니다. 사용자가 모르면 아래 목록을 보여줍니다:

```
사용 가능한 컴포넌트:

1. Callout (알림 박스) - 정보, 경고, 에러, 팁 등을 강조
2. Cards (카드 그리드) - 링크 카드를 격자로 배치
3. Steps (단계) - 순서대로 따라할 수 있는 단계 안내
4. Tabs (탭) - 여러 내용을 탭으로 전환
5. Accordion (접기/펼치기) - FAQ처럼 접었다 펼 수 있는 섹션
6. Files (파일 트리) - 폴더/파일 구조를 시각적으로 표시
7. TypeTable (속성 테이블) - API 파라미터 같은 타입 정보 표시

어떤 걸 추가할까요? (번호나 이름으로 선택)
```

### 3단계: 내용 입력 & 삽입

사용자에게 내용을 물어보고 컴포넌트를 생성합니다. 각 컴포넌트의 사용법은 아래 참조.

## 컴포넌트 레퍼런스

### Callout (알림 박스)

```mdx
import { Callout } from 'fumadocs-ui/components/callout';

<Callout type="info" title="제목">
내용을 여기에 작성합니다.
</Callout>
```

**type 종류:**
- `info` (기본) - 참고 정보 (파란색)
- `warn` - 주의사항 (노란색)
- `error` - 오류/위험 경고 (빨간색)
- `idea` - 팁/아이디어 (초록색)

**커스텀 옵션:**
- `icon="🎉"` - 아이콘 변경
- `className="..."` - 스타일 커스텀
- `style={{ '--callout-color': '#FE8AB6' }}` - 색상 변경

### Cards (카드 그리드)

```mdx
<Cards>
  <Card title="카드 제목" href="/ko/docs/..." />
  <Card title="설명 포함" description="부가 설명" href="/ko/docs/..." />
  <Card title="스타일 변경" className="border-0 bg-fd-muted" href="/ko/docs/..." />
</Cards>
```

- `href`가 있으면 클릭 가능한 링크 카드
- `icon`으로 아이콘 추가 가능
- `className`으로 스타일 커스텀 가능
- Cards는 기본 MDX 컴포넌트이므로 import 불필요

### Steps (단계 안내)

```mdx
import { Step, Steps } from 'fumadocs-ui/components/steps';

<Steps>
  <Step>
    #### 1단계: 제목
    설명 내용
  </Step>
  <Step>
    #### 2단계: 제목
    설명 내용
  </Step>
</Steps>
```

### Tabs (탭)

```mdx
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

<Tabs items={['탭1', '탭2', '탭3']}>
  <Tab value="탭1">
    첫 번째 탭 내용
  </Tab>
  <Tab value="탭2">
    두 번째 탭 내용
  </Tab>
  <Tab value="탭3">
    세 번째 탭 내용
  </Tab>
</Tabs>
```

### Accordion (접기/펼치기)

```mdx
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';

<Accordions>
  <Accordion title="질문 1">
    답변 내용
  </Accordion>
  <Accordion title="질문 2">
    답변 내용
  </Accordion>
</Accordions>
```

### Files (파일 트리)

```mdx
import { File, Folder, Files } from 'fumadocs-ui/components/files';

<Files>
  <Folder name="폴더명" defaultOpen>
    <File name="파일명.txt" />
    <Folder name="하위폴더">
      <File name="파일.md" />
    </Folder>
  </Folder>
</Files>
```

### TypeTable (속성 테이블)

```mdx
import { TypeTable } from 'fumadocs-ui/components/type-table';

<TypeTable
  type={{
    속성명: { type: 'string', description: '설명', default: '"기본값"' },
    필수속성: { type: 'boolean', description: '설명', default: 'false' },
  }}
/>
```

## 삽입 규칙

1. **import문 위치**: 파일 내에서 해당 컴포넌트의 import가 이미 있는지 확인. 없으면 frontmatter(`---`) 아래, 본문 시작 전에 추가
2. **Cards/Card는 import 불필요**: 기본 MDX 컴포넌트로 자동 등록되어 있음
3. **중복 import 금지**: 이미 import된 컴포넌트를 다시 import하지 않음
4. **언어 버전 동기화**: 한 언어에 추가하면 `src/lib/i18n.ts`의 `languages` 배열에 있는 모든 다른 언어에도 동일한 구조로 추가 (내용은 해당 언어로 번역)

## 주의사항

- 컴포넌트 내부의 마크다운은 **빈 줄로 구분**해야 렌더링됨
- Callout 등 컴포넌트 안에서 `#` 제목을 쓸 때는 `####` (h4) 이하 권장
- 이미지는 `public/` 폴더에 넣고 절대 경로(`/images/...`)로 참조
- MDX에서 `<`와 `>`는 JSX로 해석되므로, 수학 부등호는 `\<` `\>`로 이스케이프
