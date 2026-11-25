'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crosshair,
  MousePointerClick,
  RotateCcw,
} from 'lucide-react';
import {
  TOURS,
  type TourData,
  type TourHotspot,
  type TourStep,
} from '@/data/tours';

export type { TourData, TourHotspot, TourStep };
export type TourLocale = 'ko' | 'en' | 'ja' | 'zh-TW' | 'es' | 'pt-BR';

interface TourChromeStrings {
  badge: string;
  reset: string;
  prev: string;
  next: string;
  replay: string;
  stepPicker: string;
  stepLabel: (index: number, title: string) => string;
}

const CHROME_STRINGS: Record<TourLocale, TourChromeStrings> = {
  ko: {
    badge: '인터랙티브 가이드',
    reset: '처음으로',
    prev: '이전',
    next: '다음',
    replay: '다시 보기',
    stepPicker: '단계 선택',
    stepLabel: (index, title) => `${index}단계: ${title}`,
  },
  en: {
    badge: 'Interactive Guide',
    reset: 'Reset',
    prev: 'Previous',
    next: 'Next',
    replay: 'Replay',
    stepPicker: 'Select step',
    stepLabel: (index, title) => `Step ${index}: ${title}`,
  },
  ja: {
    badge: 'インタラクティブガイド',
    reset: '最初から',
    prev: '前へ',
    next: '次へ',
    replay: 'もう一度見る',
    stepPicker: 'ステップ選択',
    stepLabel: (index, title) => `ステップ ${index}: ${title}`,
  },
  'zh-TW': {
    badge: '互動式指南',
    reset: '回到開頭',
    prev: '上一步',
    next: '下一步',
    replay: '重新觀看',
    stepPicker: '選擇步驟',
    stepLabel: (index, title) => `第 ${index} 步：${title}`,
  },
  es: {
    badge: 'Guía interactiva',
    reset: 'Reiniciar',
    prev: 'Anterior',
    next: 'Siguiente',
    replay: 'Ver de nuevo',
    stepPicker: 'Seleccionar paso',
    stepLabel: (index, title) => `Paso ${index}: ${title}`,
  },
  'pt-BR': {
    badge: 'Guia interativo',
    reset: 'Reiniciar',
    prev: 'Anterior',
    next: 'Próximo',
    replay: 'Ver novamente',
    stepPicker: 'Selecionar etapa',
    stepLabel: (index, title) => `Etapa ${index}: ${title}`,
  },
};

interface DragPoint {
  x: number;
  y: number;
}

function roundPct(value: number): number {
  const clamped = Math.max(0, Math.min(100, value));
  return Number(clamped.toFixed(2));
}

function rectFromPoints(a: DragPoint, b: DragPoint): TourHotspot {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x, b.x);
  const bottom = Math.max(a.y, b.y);
  return {
    x: roundPct(left),
    y: roundPct(top),
    width: roundPct(right - left),
    height: roundPct(bottom - top),
  };
}

export function InteractiveTour({
  tourId,
  locale = 'ko',
}: {
  tourId: string;
  locale?: TourLocale;
}) {
  const tour = TOURS[tourId];
  const strings = CHROME_STRINGS[locale] ?? CHROME_STRINGS.ko;
  const [stepIndex, setStepIndex] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [dragStart, setDragStart] = useState<DragPoint | null>(null);
  const [dragBox, setDragBox] = useState<TourHotspot | null>(null);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debugTour') === '1');
  }, []);

  if (!tour || tour.steps.length === 0) {
    return null;
  }

  const total = tour.steps.length;
  const current = tour.steps[Math.min(stepIndex, total - 1)];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  const goPrev = () => {
    setDragBox(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    setDragBox(null);
    setStepIndex((i) => Math.min(total - 1, i + 1));
  };
  const reset = () => {
    setDragBox(null);
    setStepIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  const toStagePoint = (event: PointerEvent<HTMLDivElement>): DragPoint | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!debugMode || event.button !== 0) return;
    const pt = toStagePoint(event);
    if (!pt) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart(pt);
    setDragBox({ x: roundPct(pt.x), y: roundPct(pt.y), width: 0, height: 0 });
    setCopied(false);
  };

  const handleStagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!debugMode || !dragStart) return;
    const pt = toStagePoint(event);
    if (!pt) return;
    setDragBox(rectFromPoints(dragStart, pt));
  };

  const handleStagePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!debugMode || !dragStart) return;
    const pt = toStagePoint(event);
    if (pt) {
      const nextBox = rectFromPoints(dragStart, pt);
      if (nextBox.width >= 0.3 && nextBox.height >= 0.3) {
        setDragBox(nextBox);
      } else {
        setDragBox(null);
      }
    }
    setDragStart(null);
  };

  const inspectedHotspot = dragBox ?? current.hotspot ?? null;
  const hotspotJson = inspectedHotspot ? JSON.stringify(inspectedHotspot) : '';

  const copyHotspotJson = async () => {
    if (!hotspotJson || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(hotspotJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts; JSON text remains selectable.
    }
  };

  const hotspotBottom = current.hotspot ? current.hotspot.y + current.hotspot.height : 0;
  const placeCalloutBelow = current.hotspot ? hotspotBottom < 82 : true;
  const hotspotCenterX = current.hotspot ? current.hotspot.x + current.hotspot.width / 2 : 50;
  const horizontalCalloutClass =
    hotspotCenterX < 20
      ? 'left-0'
      : hotspotCenterX > 80
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={tour.title}
      className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card text-fd-card-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007EFF]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FE8AB633] px-2 py-0.5 text-[11px] font-semibold text-[#FE8AB6]">
            <MousePointerClick className="size-3" />
            {strings.badge}
          </span>
          <span className="text-sm font-semibold text-fd-foreground">{tour.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fd-muted-foreground">
            {stepIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={reset}
            disabled={isFirst}
            className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-background px-2 py-1 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <RotateCcw className="size-3" />
            {strings.reset}
          </button>
        </div>
      </div>

      {debugMode && (
        <div
          data-tour-debug-bar="true"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-[#007EFF]/30 bg-[#007EFF]/8 px-4 py-2 text-xs"
        >
          <div className="flex items-center gap-2 text-fd-foreground">
            <Crosshair className="size-3.5 text-[#007EFF]" />
            <span className="font-semibold">Hotspot Debug (`?debugTour=1`)</span>
            <span className="text-fd-muted-foreground">
              이미지 위를 드래그하면 `hotspot` JSON이 계산됩니다.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code
              data-tour-debug-json="true"
              className="rounded border border-fd-border bg-fd-background px-2 py-0.5 font-mono text-[11px] text-fd-foreground select-all"
            >
              {hotspotJson || '{"x":0,"y":0,"width":0,"height":0}'}
            </code>
            <button
              type="button"
              onClick={copyHotspotJson}
              disabled={!hotspotJson}
              className="inline-flex items-center gap-1 rounded-md bg-[#007EFF] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#006ae0] disabled:opacity-40 cursor-pointer"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? '복사됨' : 'JSON 복사'}
            </button>
          </div>
        </div>
      )}

      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        className={`relative aspect-[1728/992] w-full overflow-hidden bg-fd-muted/30 select-none ${
          debugMode ? 'cursor-crosshair' : ''
        }`}
      >
        <img
          src={current.image}
          alt={current.alt}
          className="!m-0 block h-full w-full object-cover"
          draggable={false}
        />
        {current.hotspot && !debugMode && (
          <button
            type="button"
            onClick={isLast ? reset : goNext}
            aria-label={current.actionLabel ?? current.title}
            style={{
              left: `${current.hotspot.x}%`,
              top: `${current.hotspot.y}%`,
              width: `${current.hotspot.width}%`,
              height: `${current.hotspot.height}%`,
            }}
            className="group absolute rounded-lg border-2 border-[#f472b6] bg-[#f472b6]/15 shadow-[0_0_0_3px_rgba(244,114,182,0.22)] transition hover:bg-[#f472b6]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007EFF] cursor-pointer"
          >
            <span className="absolute -right-1.5 -top-1.5 flex size-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f472b6] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-[#ec4899]" />
            </span>
            {current.actionLabel && (
              <span
                className={`pointer-events-none absolute ${horizontalCalloutClass} z-10 whitespace-nowrap rounded-md bg-[#1A2C5C] px-2.5 py-1 text-xs font-medium text-white shadow-md transition group-hover:scale-105 ${
                  placeCalloutBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                }`}
              >
                {current.actionLabel}
              </span>
            )}
          </button>
        )}
        {debugMode && inspectedHotspot && (
          <div
            data-tour-debug-box="true"
            style={{
              left: `${inspectedHotspot.x}%`,
              top: `${inspectedHotspot.y}%`,
              width: `${inspectedHotspot.width}%`,
              height: `${inspectedHotspot.height}%`,
            }}
            className="pointer-events-none absolute rounded-lg border-2 border-dashed border-[#007EFF] bg-[#007EFF]/15"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-fd-border bg-fd-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-semibold text-fd-foreground">
            {stepIndex + 1}. {current.title}
          </div>
          <p className="text-xs leading-relaxed text-fd-muted-foreground">{current.description}</p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-1.5" role="tablist" aria-label={strings.stepPicker}>
            {tour.steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={idx === stepIndex}
                aria-label={strings.stepLabel(idx + 1, step.title)}
                onClick={() => {
                  setDragBox(null);
                  setStepIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === stepIndex
                    ? 'w-5 bg-[#f472b6]'
                    : 'w-2 bg-fd-border hover:bg-fd-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-background px-2.5 py-1.5 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              <ChevronLeft className="size-3.5" />
              {strings.prev}
            </button>
            <button
              type="button"
              onClick={isLast ? reset : goNext}
              className="inline-flex items-center gap-1 rounded-md bg-[#007EFF] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#006ae0] cursor-pointer"
            >
              {isLast ? strings.replay : strings.next}
              {!isLast && <ChevronRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
