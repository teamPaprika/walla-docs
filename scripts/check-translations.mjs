#!/usr/bin/env node
/**
 * 번역 드리프트 검사.
 *
 * 파일 누락뿐 아니라 "원본만 고쳐지고 번역이 뒤처진" 경우를 잡는 게 핵심이다.
 * 파일 존재 검사만으로는 절대 안 잡히는 종류의 드리프트다.
 *
 * 신선도 기준은 git 최종 커밋 시각. 아직 커밋되지 않은 파일(수정/미추적)은
 * 작업 중이라는 뜻이므로 파일시스템 mtime 을 대신 쓴다.
 *
 * ponytail: 원본 해시를 기록하는 매니페스트 대신 커밋 시각을 쓴다. 번역 파일만
 * 오탈자 수정으로 건드리면 실제로는 뒤처졌는데 최신으로 보일 수 있다.
 * 그 오탐이 잦아지면 원본 해시 매니페스트로 올린다.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const DOCS = 'content/docs';
const SOURCE = process.env.I18N_SOURCE ?? 'ko';
const warnOnly = process.argv.includes('--warn-only');
const accept = process.argv.includes('--accept');
const VERIFIED = path.join(DOCS, '.i18n-verified.json');

/** 지원 언어는 i18n.ts 한 곳에서만 관리한다. 여기서 다시 나열하지 않는다. */
function locales() {
  const src = readFileSync('src/lib/i18n.ts', 'utf8');
  const m = src.match(/languages:\s*\[([^\]]+)\]/);
  if (!m) throw new Error('src/lib/i18n.ts 에서 languages 배열을 찾지 못했습니다.');
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

async function walk(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, base)));
    else if (/\.(mdx|json)$/.test(e.name)) out.push(path.relative(base, p));
  }
  return out;
}

/**
 * 커밋되지 않은 변경이 있는 경로 집합 (수정 + 미추적).
 * -uall 이 없으면 새 디렉터리가 통째로 한 줄로 보고돼 개별 파일이 누락된다.
 */
const dirty = new Set(
  execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', DOCS], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim().replace(/^"|"$/g, '')),
);

/**
 * "커밋 시각은 어긋났지만 내용은 확인해보니 같더라" 를 기록한다.
 * 원본의 현재 blob 해시를 저장해 두고, 원본이 다시 바뀌면 해시가 달라져
 * 자동으로 다시 경고가 뜬다. 이게 없으면 오탐 때문에 CI 가 상시 빨간불이 되고,
 * 그러면 아무도 안 보는 알람이 된다.
 */
const verified = existsSync(VERIFIED)
  ? JSON.parse(readFileSync(VERIFIED, 'utf8'))
  : {};

function blobHash(file) {
  try {
    return execFileSync('git', ['hash-object', file], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const commitCache = new Map();
function lastTouched(file) {
  if (dirty.has(file)) return Math.floor(statSync(file).mtimeMs / 1000);
  if (!commitCache.has(file)) {
    let t = 0;
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%ct', '--', file], {
        encoding: 'utf8',
      }).trim();
      t = out ? Number(out) : 0;
    } catch {}
    commitCache.set(file, t);
  }
  return commitCache.get(file);
}

/**
 * meta.json 의 pages 비교용. `---라벨---` 은 번역되는 섹션 구분선이므로 제외하고,
 * 실제 페이지 슬러그만 남긴다(파일명 기반이라 언어와 무관하게 같아야 한다).
 *
 * 순서가 아니라 구성원만 본다 — 잡으려는 건 "새 페이지를 번역 쪽 목차에
 * 안 넣은" 경우이고, 사이드바 정렬 순서는 로케일마다 다를 수 있다.
 */
function slugsOf(file) {
  try {
    const pages = JSON.parse(readFileSync(file, 'utf8')).pages;
    if (!Array.isArray(pages)) return null;
    return JSON.stringify(pages.filter((p) => !/^---.*---$/.test(p)).sort());
  } catch {
    return null;
  }
}

/**
 * 의도적으로 번역하지 않기로 한 경로. 이게 없으면 CI 를 warn-only 로 둘 수밖에
 * 없고, 그러면 아무도 안 보는 경고가 된다. 예외를 명시해야 진짜 드리프트에서
 * 빌드를 세울 수 있다.
 */
function ignoreRules() {
  const f = path.join(DOCS, '.i18n-ignore');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}
const rules = ignoreRules();
const ignored = (key) =>
  rules.some((r) => (r.endsWith('*') ? key.startsWith(r.slice(0, -1)) : key === r));

const langs = locales().filter((l) => l !== SOURCE);
const sourceFiles = (await walk(path.join(DOCS, SOURCE))).sort();

const missing = [];
const stale = [];
const metaMismatch = [];

for (const rel of sourceFiles) {
  const srcPath = path.join(DOCS, SOURCE, rel);
  const srcAt = lastTouched(srcPath);

  for (const lang of langs) {
    const key = `${lang}/${rel}`;
    if (ignored(key)) continue;
    const dstPath = path.join(DOCS, lang, rel);

    if (!existsSync(dstPath)) {
      missing.push(key);
      continue;
    }
    if (srcAt && srcAt > lastTouched(dstPath)) {
      if (verified[key] !== blobHash(srcPath)) stale.push(key);
    }

    if (rel.endsWith('meta.json')) {
      const a = slugsOf(srcPath);
      const b = slugsOf(dstPath);
      if (a !== null && a !== b) metaMismatch.push(key);
    }
  }
}

const section = (title, items) => {
  if (!items.length) return;
  console.log(`\n${title} (${items.length})`);
  for (const i of items) console.log(`  ${i}`);
};

console.log(`번역 드리프트 검사 — 원본: ${SOURCE}, 대상: ${langs.join(', ')}`);
section('❌ 번역 파일 없음', missing);
section('⚠️  원본이 더 최신 (번역 갱신 필요)', stale);
section('❌ meta.json 페이지 목록 불일치', metaMismatch);

if (accept) {
  // 사람이 두 파일을 직접 비교해 같다고 판단한 뒤에만 실행할 것.
  for (const key of stale) {
    const rel = key.slice(key.indexOf('/') + 1);
    verified[key] = blobHash(path.join(DOCS, SOURCE, rel));
  }
  writeFileSync(VERIFIED, JSON.stringify(verified, null, 2) + '\n');
  console.log(`\n✅ ${stale.length}건을 확인 완료로 기록했습니다 (${VERIFIED}).`);
  console.log('   원본이 다시 수정되면 자동으로 경고가 되살아납니다.');
  process.exit(0);
}

const total = missing.length + stale.length + metaMismatch.length;
if (total === 0) {
  console.log('\n✅ 드리프트 없음');
  process.exit(0);
}
console.log(`\n총 ${total}건. Claude Code 에서 /walla-docs:translate 로 갱신하세요.`);
process.exit(warnOnly ? 0 : 1);
