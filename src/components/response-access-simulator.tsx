'use client';

import { useMemo, useState } from 'react';
import { Check, Eye, EyeOff, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';

export type SimulatorLocale = 'ko' | 'en' | 'ja' | 'zh-TW' | 'es' | 'pt-BR';
type WorkspaceViewMode = 'ALL' | 'PROJECT' | 'NONE';
type ProjectRuleMode = 'NONE' | 'ALL' | 'FILTERED';
type Region = '서울' | '경기' | '부산';
type ScoreFilter = 'all' | 'gte4' | 'eq5';

interface SampleRow {
  id: string;
  submittedAt: string;
  region: Region;
  score: number;
  comment: string;
  phoneMasked: string;
}

const SAMPLE_ROWS: SampleRow[] = [
  { id: 'R-101', submittedAt: '11.24 14:20', region: '서울', score: 5, comment: '응답 속도가 빨라서 좋았어요', phoneMasked: '010-****-1101' },
  { id: 'R-102', submittedAt: '11.24 15:05', region: '경기', score: 5, comment: '모바일에서도 깔끔합니다', phoneMasked: '010-****-2204' },
  { id: 'R-103', submittedAt: '11.24 16:40', region: '서울', score: 4, comment: '분기 설정이 직관적이에요', phoneMasked: '010-****-3309' },
  { id: 'R-104', submittedAt: '11.25 09:12', region: '서울', score: 2, comment: '안내 문구가 조금 길어요', phoneMasked: '010-****-4412' },
  { id: 'R-105', submittedAt: '11.25 10:30', region: '부산', score: 4, comment: 'PDF 저장 기능이 유용해요', phoneMasked: '010-****-5518' },
  { id: 'R-106', submittedAt: '11.25 11:15', region: '서울', score: 5, comment: '팀 공유가 간편해졌습니다', phoneMasked: '010-****-6620' },
];

interface LocaleStrings {
  badge: string;
  title: string;
  subtitle: string;
  reset: string;
  step1Label: string;
  step2Label: string;
  workspaceModes: Record<WorkspaceViewMode, { label: string; desc: string }>;
  projectModes: Record<ProjectRuleMode, string>;
  projectLockedAll: string;
  projectLockedNone: string;
  conditionTitle: string;
  andHint: string;
  regionLabel: string;
  scoreLabel: string;
  scoreOptions: Record<ScoreFilter, string>;
  regions: Record<Region, string>;
  resultsTitle: string;
  visibleCount: (visible: number, total: number) => string;
  restrictedBanner: string;
  deniedBanner: string;
  allBanner: string;
  columns: { id: string; region: string; score: string; comment: string; phone: string };
  showBlockedToggle: string;
  surfacesTitle: string;
  surfaces: {
    sheet: string;
    stats: string;
    actions: string;
    analytics: string;
  };
  surfaceValues: {
    allRows: string;
    filteredRows: (n: number) => string;
    noRows: string;
    analyticsOn: string;
    analyticsOff: string;
  };
  comments: Record<string, string>;
}

const DICT: Record<SimulatorLocale, LocaleStrings> = {
  ko: {
    badge: '인터랙티브 시뮬레이터',
    title: '역할별 응답 접근 규칙 시뮬레이터',
    subtitle: '워크스페이스 역할(예: 서울 리서처)과 프로젝트 응답 접근 규칙을 조합해 실제로 보이는 응답과 결과 화면 제한을 확인해 보세요.',
    reset: '기본 예시로 초기화',
    step1Label: '1. 워크스페이스 역할 설정 — 모든 응답 보기',
    step2Label: '2. 설문 설정 → 프로젝트 권한 → 응답 접근',
    workspaceModes: {
      ALL: { label: '모든 응답 보기', desc: '모든 프로젝트의 전체 응답 열람' },
      PROJECT: { label: '프로젝트별 설정에 따름', desc: '각 설문의 응답 접근 규칙을 따름' },
      NONE: { label: '허용 안 함', desc: '모든 프로젝트에서 응답 열람 차단' },
    },
    projectModes: {
      NONE: '허용 안 함',
      ALL: '모든 응답',
      FILTERED: '조건에 맞는 응답',
    },
    projectLockedAll: '워크스페이스 역할 설정에 따라 모든 응답을 볼 수 있습니다.',
    projectLockedNone: '워크스페이스 역할 설정에 따라 응답을 볼 수 없습니다.',
    conditionTitle: '조건 설정 (모든 조건을 만족하는 응답만 허용)',
    andHint: 'AND 결합',
    regionLabel: '거주 지역 (다음 중 하나 이상 포함)',
    scoreLabel: '전반적인 만족도',
    scoreOptions: {
      all: '제한 없음',
      gte4: '4 이상 (4, 5)',
      eq5: '5만 허용',
    },
    regions: { 서울: '서울', 경기: '경기', 부산: '부산' },
    resultsTitle: '서울 리서처에게 실제로 보이는 응답 시트',
    visibleCount: (v, t) => `${v} / ${t}건 접근 가능`,
    restrictedBanner: '접근할 수 있는 응답만 표시합니다.',
    deniedBanner: '접근할 수 있는 응답이 없습니다. (기본 차단 / 허용 안 함)',
    allBanner: '제한 없이 모든 응답에 접근할 수 있습니다.',
    columns: { id: '응답 ID', region: '거주 지역', score: '만족도', comment: '추가 의견', phone: '연락처 (마스킹)' },
    showBlockedToggle: '차단된 행도 흐리게 비교하기',
    surfacesTitle: '결과 메뉴·기능별 적용 범위',
    surfaces: {
      sheet: '응답 시트 / 개별 응답',
      stats: '통계 / 교차 분석',
      actions: '다운로드 / 삭제 / 마스킹 해제',
      analytics: '애널리틱스 (방문·행동 분석)',
    },
    surfaceValues: {
      allRows: '전체 6건 표시',
      filteredRows: n => `허용된 ${n}건 기준으로만 동작`,
      noRows: '표시·실행 가능한 응답 없음',
      analyticsOn: '제공됨',
      analyticsOff: '미지원 (응답 통계 이용)',
    },
    comments: {
      'R-101': '응답 속도가 빨라서 좋았어요',
      'R-102': '모바일에서도 깔끔합니다',
      'R-103': '분기 설정이 직관적이에요',
      'R-104': '안내 문구가 조금 길어요',
      'R-105': 'PDF 저장 기능이 유용해요',
      'R-106': '팀 공유가 간편해졌습니다',
    },
  },
  en: {
    badge: 'Interactive Simulator',
    title: 'Response Access Rule Simulator',
    subtitle: 'Combine workspace Role settings and project Response access rules to preview visible rows and surface restrictions.',
    reset: 'Reset example',
    step1Label: '1. Workspace Role — View all responses',
    step2Label: '2. Form Settings → Project permissions → Response access',
    workspaceModes: {
      ALL: { label: 'View all responses', desc: 'Can view every response across all projects' },
      PROJECT: { label: 'Follow project settings', desc: 'Follows each project’s response access rule' },
      NONE: { label: 'Cannot view responses', desc: 'Blocked from viewing responses in all projects' },
    },
    projectModes: {
      NONE: 'Do not allow',
      ALL: 'All responses',
      FILTERED: 'Matching responses',
    },
    projectLockedAll: 'All responses are visible according to the workspace role settings.',
    projectLockedNone: 'Responses cannot be viewed according to the workspace role settings.',
    conditionTitle: 'Conditions (responses must match all conditions)',
    andHint: 'AND',
    regionLabel: 'Region (has any of)',
    scoreLabel: 'Satisfaction score',
    scoreOptions: {
      all: 'Any',
      gte4: '4 or higher (4, 5)',
      eq5: '5 only',
    },
    regions: { 서울: 'Seoul', 경기: 'Gyeonggi', 부산: 'Busan' },
    resultsTitle: 'Response sheet visible to Seoul Researcher',
    visibleCount: (v, t) => `${v} / ${t} accessible`,
    restrictedBanner: 'Only responses you can access are shown.',
    deniedBanner: 'No accessible responses (fail-closed / denied).',
    allBanner: 'All responses are accessible without restriction.',
    columns: { id: 'ID', region: 'Region', score: 'Score', comment: 'Comment', phone: 'Phone (Masked)' },
    showBlockedToggle: 'Dim blocked rows for comparison',
    surfacesTitle: 'Effect across result screens & actions',
    surfaces: {
      sheet: 'Response Sheet / Individual',
      stats: 'Statistics / Crosstab',
      actions: 'Download / Delete / Unmask',
      analytics: 'Analytics (Event tracking)',
    },
    surfaceValues: {
      allRows: 'All 6 rows',
      filteredRows: n => `Scoped to ${n} allowed rows`,
      noRows: 'No rows accessible',
      analyticsOn: 'Available',
      analyticsOff: 'Unavailable (use Response statistics)',
    },
    comments: {
      'R-101': 'Fast response experience',
      'R-102': 'Clean layout on mobile',
      'R-103': 'Intuitive branching setup',
      'R-104': 'Intro text is slightly long',
      'R-105': 'PDF export is helpful',
      'R-106': 'Easy to share with team',
    },
  },
  ja: {
    badge: 'インタラクティブシミュレーター',
    title: 'ロール別回答アクセスルールシミュレーター',
    subtitle: 'ワークスペースロール設定とプロジェクトの回答アクセスルールを組み合わせて、表示される回答と制限を確認できます。',
    reset: '初期状態に戻す',
    step1Label: '1. ワークスペースロール設定 — すべての回答を閲覧',
    step2Label: '2. フォーム設定 → プロジェクトの権限 → 回答アクセス',
    workspaceModes: {
      ALL: { label: 'すべての回答を閲覧', desc: '全プロジェクトの回答を閲覧可能' },
      PROJECT: { label: 'プロジェクトの設定に従う', desc: '各プロジェクトの回答ルールに従う' },
      NONE: { label: '回答の閲覧を許可しない', desc: '全プロジェクトで回答閲覧を制限' },
    },
    projectModes: {
      NONE: '許可しない',
      ALL: 'すべての回答',
      FILTERED: '条件に一致する回答',
    },
    projectLockedAll: 'ワークスペースのロール設定により、すべての回答を閲覧できます。',
    projectLockedNone: 'ワークスペースのロール設定により、回答を閲覧できません。',
    conditionTitle: '条件設定（すべての条件を満たす回答のみ許可）',
    andHint: 'AND 結合',
    regionLabel: '居住地域（次のいずれかを含む）',
    scoreLabel: '総合満足度',
    scoreOptions: { all: '指定なし', gte4: '4以上 (4, 5)', eq5: '5のみ' },
    regions: { 서울: 'ソウル', 경기: '京畿', 부산: '釜山' },
    resultsTitle: 'ロールに表示される回答シート',
    visibleCount: (v, t) => `${v} / ${t}件にアクセス可能`,
    restrictedBanner: 'アクセスできる回答のみを表示しています。',
    deniedBanner: 'アクセスできる回答がありません。',
    allBanner: '制限なくすべての回答にアクセスできます。',
    columns: { id: '回答 ID', region: '地域', score: '満足度', comment: 'コメント', phone: '連絡先（マスク）' },
    showBlockedToggle: '制限された行も薄く表示して比較',
    surfacesTitle: '結果画面・操作への適用範囲',
    surfaces: {
      sheet: '回答シート / 個別回答',
      stats: '回答統計 / クロス集計',
      actions: 'ダウンロード / 削除 / マスク解除',
      analytics: 'アナリティクス',
    },
    surfaceValues: {
      allRows: '全6件を表示',
      filteredRows: n => `許可された${n}件のみで集計・操作`,
      noRows: '閲覧・操作可能な回答なし',
      analyticsOn: '利用可能',
      analyticsOff: '利用不可（回答統計を利用）',
    },
    comments: {
      'R-101': '回答がスムーズでした',
      'R-102': 'モバイルでも見やすいです',
      'R-103': '分岐設定が直感的です',
      'R-104': '案内文が少し長いです',
      'R-105': 'PDF保存が便利です',
      'R-106': 'チーム共有が簡単になりました',
    },
  },
  'zh-TW': {
    badge: '互動模擬器',
    title: '依角色設定回應存取規則模擬器',
    subtitle: '搭配工作區角色設定與專案回應存取規則，即時預覽可見的回應與功能限制。',
    reset: '重設範例',
    step1Label: '1. 工作區角色設定 — 檢視所有回應',
    step2Label: '2. 表單設定 → 專案權限 → 回應存取',
    workspaceModes: {
      ALL: { label: '檢視所有回應', desc: '可查看所有專案的全部回應' },
      PROJECT: { label: '依照專案設定', desc: '依各專案的回應存取規則決定' },
      NONE: { label: '禁止檢視回應', desc: '封鎖所有專案的回應檢視' },
    },
    projectModes: { NONE: '不允許', ALL: '所有回應', FILTERED: '符合條件的回應' },
    projectLockedAll: '根據工作區角色設定，可檢視所有回應。',
    projectLockedNone: '根據工作區角色設定，無法檢視回應。',
    conditionTitle: '條件設定（僅允許同時符合所有條件的回應）',
    andHint: 'AND 條件',
    regionLabel: '居住地區（包含任一）',
    scoreLabel: '整體滿意度',
    scoreOptions: { all: '不限', gte4: '4 分以上 (4, 5)', eq5: '僅 5 分' },
    regions: { 서울: '首爾', 경기: '京畿', 부산: '釜山' },
    resultsTitle: '此角色實際可見的回應工作表',
    visibleCount: (v, t) => `可存取 ${v} / ${t} 筆`,
    restrictedBanner: '僅顯示您可存取的回應。',
    deniedBanner: '沒有可存取的回應。',
    allBanner: '可不受限制地存取所有回應。',
    columns: { id: '回應 ID', region: '地區', score: '滿意度', comment: '意見', phone: '聯絡電話（遮罩）' },
    showBlockedToggle: '淡化顯示被封鎖的列以供比較',
    surfacesTitle: '各結果頁面與操作適用範圍',
    surfaces: {
      sheet: '回應工作表 / 個別回應',
      stats: '回應統計 / 交叉分析',
      actions: '下載 / 刪除 / 解除遮罩',
      analytics: '數據分析',
    },
    surfaceValues: {
      allRows: '顯示全部 6 筆',
      filteredRows: n => `僅針對允許的 ${n} 筆執行`,
      noRows: '無可存取的回應',
      analyticsOn: '可使用',
      analyticsOff: '不支援（請使用回應統計）',
    },
    comments: {
      'R-101': '填寫流暢快速',
      'R-102': '手機版介面清晰',
      'R-103': '邏輯設定很直覺',
      'R-104': '說明文字稍長',
      'R-105': 'PDF 下載很實用',
      'R-106': '團隊分享更方便',
    },
  },
  es: {
    badge: 'Simulador interactivo',
    title: 'Simulador de reglas de acceso a respuestas',
    subtitle: 'Combina el rol del espacio de trabajo y las reglas del proyecto para ver qué respuestas y funciones quedan habilitadas.',
    reset: 'Restablecer',
    step1Label: '1. Rol del espacio de trabajo — Ver todas las respuestas',
    step2Label: '2. Configuración → Permisos del proyecto → Acceso a respuestas',
    workspaceModes: {
      ALL: { label: 'Ver todas las respuestas', desc: 'Acceso completo en todos los proyectos' },
      PROJECT: { label: 'Seguir configuración del proyecto', desc: 'Depende de las reglas de cada proyecto' },
      NONE: { label: 'No puede ver respuestas', desc: 'Bloqueado en todos los proyectos' },
    },
    projectModes: { NONE: 'No permitir', ALL: 'Todas las respuestas', FILTERED: 'Respuestas coincidentes' },
    projectLockedAll: 'Acceso completo según el rol del espacio de trabajo.',
    projectLockedNone: 'Sin acceso según el rol del espacio de trabajo.',
    conditionTitle: 'Condiciones (deben cumplirse todas)',
    andHint: 'AND',
    regionLabel: 'Región (incluye alguna de)',
    scoreLabel: 'Satisfacción',
    scoreOptions: { all: 'Todas', gte4: '4 o más (4, 5)', eq5: 'Solo 5' },
    regions: { 서울: 'Seúl', 경기: 'Gyeonggi', 부산: 'Busan' },
    resultsTitle: 'Hoja de respuestas visible para el rol',
    visibleCount: (v, t) => `${v} / ${t} accesibles`,
    restrictedBanner: 'Solo se muestran las respuestas a las que tienes acceso.',
    deniedBanner: 'No hay respuestas accesibles.',
    allBanner: 'Todas las respuestas son accesibles sin restricciones.',
    columns: { id: 'ID', region: 'Región', score: 'Nota', comment: 'Comentario', phone: 'Teléfono (enmascarado)' },
    showBlockedToggle: 'Mostrar filas bloqueadas atenuadas',
    surfacesTitle: 'Impacto en pantallas y acciones',
    surfaces: {
      sheet: 'Hoja / Individual',
      stats: 'Estadísticas / Tabla cruzada',
      actions: 'Descargar / Eliminar / Desenmascarar',
      analytics: 'Análisis de eventos',
    },
    surfaceValues: {
      allRows: 'Las 6 filas',
      filteredRows: n => `Limitado a ${n} filas permitidas`,
      noRows: 'Sin filas accesibles',
      analyticsOn: 'Disponible',
      analyticsOff: 'No disponible (usa Estadísticas)',
    },
    comments: {
      'R-101': 'Experiencia rápida y clara',
      'R-102': 'Muy cómodo en móvil',
      'R-103': 'Lógica fácil de configurar',
      'R-104': 'Texto inicial algo largo',
      'R-105': 'Exportación PDF útil',
      'R-106': 'Fácil de compartir',
    },
  },
  'pt-BR': {
    badge: 'Simulador interativo',
    title: 'Simulador de regras de acesso às respostas',
    subtitle: 'Combine a função do espaço de trabalho com as regras do projeto para visualizar as respostas liberadas e as restrições.',
    reset: 'Redefinir exemplo',
    step1Label: '1. Função do espaço de trabalho — Visualizar todas as respostas',
    step2Label: '2. Configurações → Permissões do projeto → Acesso às respostas',
    workspaceModes: {
      ALL: { label: 'Visualizar todas as respostas', desc: 'Acesso total em todos os projetos' },
      PROJECT: { label: 'Seguir configurações do projeto', desc: 'Segue a regra de cada formulário' },
      NONE: { label: 'Sem acesso às respostas', desc: 'Bloqueado em todos os projetos' },
    },
    projectModes: { NONE: 'Não permitir', ALL: 'Todas as respostas', FILTERED: 'Respostas correspondentes' },
    projectLockedAll: 'Todas as respostas visíveis conforme a função do espaço de trabalho.',
    projectLockedNone: 'Sem visualização conforme a função do espaço de trabalho.',
    conditionTitle: 'Condições (todas devem ser atendidas)',
    andHint: 'AND',
    regionLabel: 'Região (contém qualquer uma)',
    scoreLabel: 'Satisfação',
    scoreOptions: { all: 'Qualquer', gte4: '4 ou mais (4, 5)', eq5: 'Apenas 5' },
    regions: { 서울: 'Seul', 경기: 'Gyeonggi', 부산: 'Busan' },
    resultsTitle: 'Planilha de respostas visível para a função',
    visibleCount: (v, t) => `${v} / ${t} acessíveis`,
    restrictedBanner: 'Apenas as respostas às quais você tem acesso são exibidas.',
    deniedBanner: 'Nenhuma resposta acessível.',
    allBanner: 'Todas as respostas estão acessíveis sem restrição.',
    columns: { id: 'ID', region: 'Região', score: 'Nota', comment: 'Comentário', phone: 'Telefone (mascarado)' },
    showBlockedToggle: 'Exibir linhas bloqueadas esmaecidas',
    surfacesTitle: 'Efeito nas telas e ações',
    surfaces: {
      sheet: 'Planilha / Resposta individual',
      stats: 'Estatísticas / Tabulação cruzada',
      actions: 'Baixar / Excluir / Revelar máscara',
      analytics: 'Análises de comportamento',
    },
    surfaceValues: {
      allRows: 'Todas as 6 linhas',
      filteredRows: n => `Restrito às ${n} linhas permitidas`,
      noRows: 'Nenhuma linha acessível',
      analyticsOn: 'Disponível',
      analyticsOff: 'Indisponível (use Estatísticas)',
    },
    comments: {
      'R-101': 'Experiência rápida e objetiva',
      'R-102': 'Ótimo layout no celular',
      'R-103': 'Lógica intuitiva',
      'R-104': 'Texto inicial um pouco longo',
      'R-105': 'Exportação em PDF útil',
      'R-106': 'Fácil de compartilhar',
    },
  },
};

export function ResponseAccessSimulator({ locale = 'ko' }: { locale?: SimulatorLocale }) {
  const t = DICT[locale] ?? DICT.ko;
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceViewMode>('PROJECT');
  const [projectMode, setProjectMode] = useState<ProjectRuleMode>('FILTERED');
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(['서울']);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('gte4');
  const [showBlocked, setShowBlocked] = useState(true);

  const toggleRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const resetAll = () => {
    setWorkspaceMode('PROJECT');
    setProjectMode('FILTERED');
    setSelectedRegions(['서울']);
    setScoreFilter('gte4');
    setShowBlocked(true);
  };

  const { effectiveScope, visibleIds } = useMemo(() => {
    if (workspaceMode === 'ALL') {
      return { effectiveScope: 'ALL' as const, visibleIds: new Set(SAMPLE_ROWS.map((r) => r.id)) };
    }
    if (workspaceMode === 'NONE' || projectMode === 'NONE') {
      return { effectiveScope: 'NONE' as const, visibleIds: new Set<string>() };
    }
    if (projectMode === 'ALL') {
      return { effectiveScope: 'ALL' as const, visibleIds: new Set(SAMPLE_ROWS.map((r) => r.id)) };
    }
    const matching = SAMPLE_ROWS.filter((row) => {
      const regionMatch = selectedRegions.length > 0 && selectedRegions.includes(row.region);
      const scoreMatch =
        scoreFilter === 'all' ? true : scoreFilter === 'gte4' ? row.score >= 4 : row.score === 5;
      return regionMatch && scoreMatch;
    });
    return { effectiveScope: 'FILTERED' as const, visibleIds: new Set(matching.map((r) => r.id)) };
  }, [workspaceMode, projectMode, selectedRegions, scoreFilter]);

  const visibleCount = visibleIds.size;
  const displayRows = showBlocked
    ? SAMPLE_ROWS
    : SAMPLE_ROWS.filter((row) => visibleIds.has(row.id));

  const analyticsAllowed = effectiveScope === 'ALL';

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card text-fd-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/50 px-4 py-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#FE8AB633] px-2 py-0.5 text-[11px] font-semibold text-[#FE8AB6]">
              {t.badge}
            </span>
            <span className="text-sm font-semibold text-fd-foreground">{t.title}</span>
          </div>
          <p className="text-xs text-fd-muted-foreground">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-background px-2.5 py-1 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          {t.reset}
        </button>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-fd-foreground">{t.step1Label}</div>
            <div className="grid gap-1.5">
              {(['ALL', 'PROJECT', 'NONE'] as const).map((mode) => {
                const active = workspaceMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkspaceMode(mode)}
                    className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition cursor-pointer ${
                      active
                        ? 'border-[#007EFF] bg-[#007EFF]/10'
                        : 'border-fd-border bg-fd-background hover:bg-fd-muted/60'
                    }`}
                  >
                    <span className="text-xs font-semibold text-fd-foreground">
                      {t.workspaceModes[mode].label}
                    </span>
                    <span className="text-[11px] text-fd-muted-foreground">
                      {t.workspaceModes[mode].desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-fd-border bg-fd-muted/30 p-3">
            <div className="text-xs font-semibold text-fd-foreground">{t.step2Label}</div>
            {workspaceMode !== 'PROJECT' ? (
              <p className="text-xs text-fd-muted-foreground">
                {workspaceMode === 'ALL' ? t.projectLockedAll : t.projectLockedNone}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['NONE', 'ALL', 'FILTERED'] as const).map((mode) => {
                    const active = projectMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setProjectMode(mode)}
                        className={`rounded-md border px-2 py-1.5 text-center text-[11px] font-medium transition cursor-pointer ${
                          active
                            ? 'border-[#FE8AB6] bg-[#FE8AB6]/15 text-fd-foreground font-semibold'
                            : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:bg-fd-muted/60'
                        }`}
                      >
                        {t.projectModes[mode]}
                      </button>
                    );
                  })}
                </div>

                {projectMode === 'FILTERED' && (
                  <div className="space-y-3 rounded-md border border-fd-border bg-fd-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-fd-muted-foreground">
                        {t.conditionTitle}
                      </span>
                      <span className="rounded bg-fd-muted px-1.5 py-0.5 text-[10px] font-semibold text-fd-foreground">
                        {t.andHint}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-fd-foreground">
                        {t.regionLabel}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['서울', '경기', '부산'] as const).map((region) => {
                          const checked = selectedRegions.includes(region);
                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => toggleRegion(region)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition cursor-pointer ${
                                checked
                                  ? 'border-[#007EFF] bg-[#007EFF]/12 font-medium text-fd-foreground'
                                  : 'border-fd-border bg-fd-muted/30 text-fd-muted-foreground'
                              }`}
                            >
                              {checked && <Check className="size-3 text-[#007EFF]" />}
                              {t.regions[region]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-fd-foreground">
                        {t.scoreLabel}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['all', 'gte4', 'eq5'] as const).map((opt) => {
                          const active = scoreFilter === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setScoreFilter(opt)}
                              className={`rounded-md border px-2 py-1 text-xs transition cursor-pointer ${
                                active
                                  ? 'border-[#007EFF] bg-[#007EFF]/12 font-medium text-fd-foreground'
                                  : 'border-fd-border bg-fd-muted/30 text-fd-muted-foreground'
                              }`}
                            >
                              {t.scoreOptions[opt]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fd-foreground">{t.resultsTitle}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  visibleCount > 0
                    ? 'bg-[#17CFB433] text-[#0f9d87] dark:text-[#17CFB4]'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
                }`}
              >
                {t.visibleCount(visibleCount, SAMPLE_ROWS.length)}
              </span>
            </div>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-fd-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBlocked}
                onChange={(e) => setShowBlocked(e.target.checked)}
                className="accent-[#007EFF]"
              />
              {t.showBlockedToggle}
            </label>
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              effectiveScope === 'ALL'
                ? 'border-fd-border bg-fd-muted/40 text-fd-foreground'
                : effectiveScope === 'FILTERED' && visibleCount > 0
                  ? 'border-[#007EFF]/30 bg-[#007EFF]/8 text-fd-foreground'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
            }`}
          >
            {effectiveScope === 'NONE' || visibleCount === 0 ? (
              <EyeOff className="size-3.5 shrink-0" />
            ) : (
              <Eye className="size-3.5 shrink-0" />
            )}
            <span>
              {effectiveScope === 'ALL'
                ? t.allBanner
                : effectiveScope === 'FILTERED' && visibleCount > 0
                  ? t.restrictedBanner
                  : t.deniedBanner}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-fd-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-fd-muted/50 text-[11px] text-fd-muted-foreground">
                <tr>
                  <th className="px-2.5 py-2 font-medium">{t.columns.id}</th>
                  <th className="px-2.5 py-2 font-medium">{t.columns.region}</th>
                  <th className="px-2.5 py-2 font-medium">{t.columns.score}</th>
                  <th className="px-2.5 py-2 font-medium">{t.columns.comment}</th>
                  <th className="px-2.5 py-2 font-medium">{t.columns.phone}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fd-border">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-fd-muted-foreground">
                      {t.deniedBanner}
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row) => {
                    const allowed = visibleIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={
                          allowed
                            ? 'bg-fd-background'
                            : 'bg-fd-muted/20 opacity-35 line-through decoration-fd-muted-foreground/50'
                        }
                      >
                        <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px]">
                          {row.id}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-1.5">{t.regions[row.region]}</td>
                        <td className="whitespace-nowrap px-2.5 py-1.5">{row.score}</td>
                        <td className="px-2.5 py-1.5">{t.comments[row.id]}</td>
                        <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] text-fd-muted-foreground">
                          {row.phoneMasked}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 rounded-lg border border-fd-border bg-fd-muted/25 p-3">
            <div className="text-[11px] font-semibold text-fd-foreground">{t.surfacesTitle}</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {(['sheet', 'stats', 'actions'] as const).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 rounded border border-fd-border bg-fd-background px-2.5 py-1.5 text-[11px]"
                >
                  <span className="text-fd-muted-foreground">{t.surfaces[key]}</span>
                  <span className="font-medium text-fd-foreground">
                    {effectiveScope === 'ALL'
                      ? t.surfaceValues.allRows
                      : effectiveScope === 'NONE' || visibleCount === 0
                        ? t.surfaceValues.noRows
                        : t.surfaceValues.filteredRows(visibleCount)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 rounded border border-fd-border bg-fd-background px-2.5 py-1.5 text-[11px]">
                <span className="text-fd-muted-foreground">{t.surfaces.analytics}</span>
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    analyticsAllowed
                      ? 'text-[#0f9d87] dark:text-[#17CFB4]'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {analyticsAllowed ? (
                    <ShieldCheck className="size-3.5" />
                  ) : (
                    <ShieldAlert className="size-3.5" />
                  )}
                  {analyticsAllowed
                    ? t.surfaceValues.analyticsOn
                    : t.surfaceValues.analyticsOff}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
