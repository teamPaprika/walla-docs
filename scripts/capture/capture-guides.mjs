import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  VIEWPORT,
  capturePng,
  hideDevChrome,
  toPercentBox,
} from './styles.mjs';

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(
  process.env.PLAYWRIGHT_REQUIRE_FROM || path.join(DOCS_ROOT, 'package.json')
);
const { chromium } = require('@playwright/test');

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:20700';
const FORM_URL = process.env.FORM_URL || 'http://localhost:20701';
const TEAM_ID = 'WJvquncIlRkGe8vXnQOa';
const WORKSPACE_ID = 'GR1N7IzjnY3jm4rteqfq';
const WORKSPACE_URL = `${DASHBOARD_URL}/team/${TEAM_ID}/workspace/${WORKSPACE_ID}`;

const GUIDES_IMG_DIR = path.join(DOCS_ROOT, 'public/images/guides');
const TOURS_DATA_DIR = path.join(DOCS_ROOT, 'src/data/tours');

const MAIN_FORM_TITLE = '2026 지역별 고객 만족도 조사';
const DRAFT_FORM_TITLE = '신규 서비스 베타 테스터 모집';
const DEFAULT_MAIN_ID = 'TXBMqzbvPUju5vv6sS3m';
const DEFAULT_DRAFT_ID = 'NeAALweoKKAhjjEcOcvZ';

function parseModes() {
  const arg = process.argv.find((a) => a.startsWith('--mode='));
  if (!arg) return new Set(['setup', 'workspace', 'settings', 'tours']);
  const raw = arg.slice('--mode='.length).split(',').map((s) => s.trim()).filter(Boolean);
  if (raw.includes('all')) return new Set(['setup', 'workspace', 'settings', 'tours']);
  return new Set(raw);
}

async function signIn(page, email, password = 'walla-dev') {
  const res = await page.context().request.post(`${DASHBOARD_URL}/api/auth/sign-in/email`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Sign-in failed for ${email}: ${res.status()} ${await res.text()}`);
  }
}

async function gotoWorkspace(page) {
  await page.goto(WORKSPACE_URL, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || '';
        return (
          text.includes('프로젝트 만들기') ||
          text.includes('2026 지역별 고객 만족도 조사') ||
          text.includes('신규 서비스 베타 테스터 모집')
        );
      },
      { timeout: 35000 }
    )
    .catch(() => {});
  await page.waitForTimeout(1500);
  await hideDevChrome(page);
}

async function resolveFormIds(page) {
  await gotoWorkspace(page);
  // Check if default IDs load cleanly in editor
  const checkForm = async (id) => {
    const r = await page.evaluate(async ({ teamId, wsId, formId }) => {
      try {
        const resp = await fetch(`/api/team/${teamId}/workspace/${wsId}/project/${formId}/formMetadata`).catch(() => null);
        return resp ? resp.status : 0;
      } catch {
        return 0;
      }
    }, { teamId: TEAM_ID, wsId: WORKSPACE_ID, formId: id });
    return r;
  };
  await checkForm(DEFAULT_MAIN_ID);
  return { mainFormId: DEFAULT_MAIN_ID, draftFormId: DEFAULT_DRAFT_ID };
}

async function waitForEditorSave(page) {
  await page.waitForTimeout(1200);
  await page.getByText('저장 중...').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function openProjectEditor(page, formId) {
  await page.goto(
    `${DASHBOARD_URL}/team/${TEAM_ID}/workspace/${WORKSPACE_ID}/project/${formId}/edit`,
    { waitUntil: 'domcontentloaded' }
  );
  await page
    .locator('[data-tour="editor-settings"]')
    .waitFor({ state: 'visible', timeout: 35000 });
  // Wait for Yjs document loading overlay to disappear completely before capturing or clicking settings
  await page
    .getByText('편집 데이터를 불러오는 중...')
    .waitFor({ state: 'hidden', timeout: 45000 })
    .catch(() => {});
  await page.waitForTimeout(2000);
  await hideDevChrome(page);
}

const DIALOG_SEL = '[role="dialog"]:not([data-nextjs-dialog="true"])';

async function openFormSettings(page, tabName) {
  const settingsBtn = page.locator('[data-tour="editor-settings"]').first();
  await settingsBtn.waitFor({ state: 'visible', timeout: 15000 });
  await settingsBtn.click();
  const dialog = page.locator(DIALOG_SEL).first();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await dialog.getByRole('button', { name: '접근', exact: true }).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500);
  if (tabName) {
    const navBtn = dialog.getByRole('button', { name: tabName, exact: true }).first();
    await navBtn.click();
    await page.waitForTimeout(500);
  }
  await hideDevChrome(page);
  return dialog;
}

async function findRowAndSwitchByLabel(container, labelRegex) {
  const label = container.getByText(labelRegex).first();
  await label.scrollIntoViewIfNeeded().catch(() => {});
  // Walk ancestors up to find the nearest row containing a switch or checkbox
  for (let depth = 1; depth <= 5; depth++) {
    const row = label.locator(`xpath=ancestor::div[${depth}]`);
    const sw = row.locator('[role="switch"], button[role="checkbox"], input[type="checkbox"]').first();
    if ((await sw.count()) > 0 && (await sw.isVisible().catch(() => false))) {
      return { row, sw };
    }
  }
  return { row: label.locator('xpath=ancestor::div[2]'), sw: null };
}

async function ensureSwitchState(container, labelRegex, desired) {
  const { row, sw } = await findRowAndSwitchByLabel(container, labelRegex);
  if (!sw) return { row, sw: null, changed: false };
  const checked =
    (await sw.getAttribute('aria-checked')) === 'true' ||
    (await sw.getAttribute('data-checked')) !== null ||
    (await sw.isChecked().catch(() => false));
  if (checked !== desired) {
    await sw.click();
    await container.page().waitForTimeout(450);
    return { row, sw, changed: true };
  }
  return { row, sw, changed: false };
}

async function populateAndPublishMainForm(browser, page, mainFormId) {
  await openProjectEditor(page, mainFormId);

  const publishBtn = page.locator('[data-tour="editor-publish"]').first();
  if (await publishBtn.isVisible().catch(() => false)) {
    const txt = (await publishBtn.innerText()).trim();
    if (txt.includes('게시하기')) {
      await publishBtn.click();
      await page.waitForTimeout(800);
      const confirmPub = page.locator(DIALOG_SEL).getByRole('button', { name: /게시하기|게시/ }).last();
      if (await confirmPub.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmPub.click();
        await page.waitForTimeout(1500);
      }
      await waitForEditorSave(page);
    }
  }

  // Check current response rows in /sheet (or text showing 8개 응답)
  await page.goto(
    `${DASHBOARD_URL}/team/${TEAM_ID}/workspace/${WORKSPACE_ID}/project/${mainFormId}/sheet`,
    { waitUntil: 'domcontentloaded' }
  );
  await page.waitForTimeout(4500);
  await hideDevChrome(page);
  const sheetDump = await page.evaluate(() => ({
    url: location.href,
    rows: document.querySelectorAll('tbody tr, [role="row"]').length,
    text: (document.body.innerText || '').slice(0, 700),
  }));
  console.log('Sheet snapshot before response seeding:', JSON.stringify(sheetDump, null, 2));

  if (sheetDump.rows < 8 && !sheetDump.text.includes('서울')) {
    const samples = [
      { region: '서울', rating: '5', opinion: '응답 분석과 워크스페이스 협업 기능이 매우 깔끔합니다.', phone: '010-1234-5601' },
      { region: '서울', rating: '5', opinion: '조건부 접근 권한 설정이 직관적이어서 만족합니다.', phone: '010-1234-5602' },
      { region: '서울', rating: '4', opinion: '설문 작성과 공유 링크 관리가 빠르고 편리합니다.', phone: '010-1234-5603' },
      { region: '서울', rating: '4', opinion: '마스킹 처리가 잘 되어 있어 보안 관리가 안심됩니다.', phone: '010-1234-5604' },
      { region: '서울', rating: '3', opinion: '세부 필터 조합을 좀 더 빠르게 찾고 싶습니다.', phone: '010-2345-6701' },
      { region: '서울', rating: '2', opinion: '권한 변경 시 알림 안내가 추가되면 좋겠습니다.', phone: '010-2345-6702' },
      { region: '경기', rating: '5', opinion: '팀 내 여러 부서와 설문 운영하기에 적합합니다.', phone: '010-3456-7801' },
      { region: '부산', rating: '4', opinion: '모바일에서도 설문 응답 화면이 잘 작동합니다.', phone: '010-4567-8901' },
    ];

    for (let idx = 0; idx < samples.length; idx++) {
      const s = samples[idx];
      const fCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' });
      const fPage = await fCtx.newPage();
      await fPage.goto(`${FORM_URL}/v/${mainFormId}`, { waitUntil: 'domcontentloaded' });

      // Wait up to 45s on first cold render after publish for form controls to attach
      await fPage
        .locator('button:has-text("응답 제출")')
        .waitFor({ state: 'visible', timeout: 45000 });
      await fPage.waitForTimeout(400);

      // Field 1: 거주 지역
      const regionEl = fPage.locator('label').filter({ hasText: new RegExp(`^${s.region}$`) }).or(fPage.getByText(s.region, { exact: true })).first();
      await regionEl.scrollIntoViewIfNeeded().catch(() => {});
      await regionEl.click();
      await fPage.waitForTimeout(200);

      // Field 2: 전반적인 만족도 (선형배율 1~5)
      const ratingEl = fPage
        .locator('button')
        .filter({ hasText: new RegExp(`^${s.rating}$`) })
        .or(fPage.getByText(s.rating, { exact: true }))
        .first();
      await ratingEl.scrollIntoViewIfNeeded().catch(() => {});
      await ratingEl.click();
      await fPage.waitForTimeout(200);

      // Field 3 & 4: 연락처 (tel) + 추가 의견 (text)
      const telInput = fPage.locator('input[type="tel"]:visible').first();
      if (await telInput.isVisible().catch(() => false)) {
        await telInput.scrollIntoViewIfNeeded().catch(() => {});
        await telInput.fill(s.phone);
        await fPage.waitForTimeout(150);
      }
      const textInput = fPage.locator('input[type="text"]:visible, textarea:visible').first();
      if (await textInput.isVisible().catch(() => false)) {
        await textInput.scrollIntoViewIfNeeded().catch(() => {});
        await textInput.fill(s.opinion);
        await fPage.waitForTimeout(200);
      }

      const submitBtn = fPage.getByRole('button', { name: '응답 제출' }).or(fPage.getByRole('button', { name: /제출|완료|Submit/ })).last();
      await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
      await submitBtn.click();
      await fPage
        .getByText(/응답이 성공적으로 제출되었습니다/)
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(async () => {
          console.log(`Warning on ${idx + 1}: body=`, await fPage.evaluate(() => document.body.innerText.slice(0, 300)));
        });
      console.log(`Submitted demo response ${idx + 1}/${samples.length}`);
      await fCtx.close();
    }
  }
}

async function openWorkspaceSettings(page, tabName) {
  const settingsBtn = page.locator('button[aria-label="워크스페이스 설정"]').last();
  await settingsBtn.waitFor({ state: 'visible', timeout: 15000 });
  await settingsBtn.click();
  const dialog = page.locator(DIALOG_SEL).first();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(600);
  if (tabName) {
    await dialog.getByRole('button', { name: tabName, exact: true }).first().click();
    await page.waitForTimeout(600);
  }
  await hideDevChrome(page);
  return dialog;
}

async function setupSeoulResearcherRole(page) {
  await gotoWorkspace(page);
  const dialog = await openWorkspaceSettings(page, '역할 및 권한');
  await dialog
    .getByText(/서울 리서처|관리자|소유자/)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(800);

  const hasRole = await dialog.getByText('서울 리서처').first().isVisible().catch(() => false);
  if (!hasRole) {
    console.log('Creating custom role: 서울 리서처');
    await dialog.getByRole('button', { name: '역할 추가' }).first().click();
    await page.waitForTimeout(500);

    const roleInput = dialog
      .locator('input[type="text"]:visible:not([aria-hidden="true"]), input:visible:not([type="checkbox"]):not([aria-hidden="true"])')
      .first();
    await roleInput.waitFor({ state: 'visible', timeout: 8000 });
    await roleInput.fill('서울 리서처');
    await dialog.getByRole('button', { name: '역할 만들기' }).first().click();
    await page.waitForTimeout(1200);
  }

  // Ensure 서울 리서처 detail view is open
  const editRoleBtn = dialog.getByRole('button', { name: /서울 리서처/ }).or(dialog.getByText('서울 리서처')).first();
  if (await editRoleBtn.isVisible().catch(() => false)) {
    await editRoleBtn.click();
    await page.waitForTimeout(600);
  }

  // Switch to 권한 설정 tab if tabbed
  const permsTab = dialog.getByRole('button', { name: '권한 설정' }).or(dialog.getByRole('tab', { name: '권한 설정' })).first();
  if (await permsTab.isVisible().catch(() => false)) {
    await permsTab.click();
    await page.waitForTimeout(400);
  }

  // Turn ON 프로젝트 생성
  const createSw = dialog.getByRole('switch', { name: '프로젝트 생성' }).first();
  if (await createSw.isVisible().catch(() => false)) {
    if ((await createSw.getAttribute('aria-checked')) !== 'true') {
      await createSw.click();
      await page.waitForTimeout(400);
    }
  } else {
    await ensureSwitchState(dialog, /프로젝트 생성/, true);
  }

  // Set 프로젝트 편집, 응답 다운로드, 모든 응답 보기 to 프로젝트별 설정에 따름
  // In WorkspacePermissionDialog, turning a scoped switch OFF reveals radio/button choices:
  // "허용 안 함" vs "프로젝트별 설정에 따름"
  const setScopedMode = async (permLabel, targetModeText) => {
    const sw = dialog.getByRole('switch', { name: permLabel }).first();
    if (await sw.isVisible().catch(() => false)) {
      if ((await sw.getAttribute('aria-checked')) === 'true') {
        await sw.click();
        await page.waitForTimeout(400);
      }
      const row = sw.locator('xpath=ancestor::div[2]');
      const opt = row.getByRole('radio', { name: targetModeText }).or(row.getByRole('button', { name: targetModeText })).or(row.getByText(targetModeText, { exact: true })).first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(450);
        return;
      }
    }
    const labelEl = dialog.getByText(permLabel, { exact: true }).first();
    if (!(await labelEl.isVisible().catch(() => false))) return;
    await labelEl.scrollIntoViewIfNeeded().catch(() => {});
    const row = labelEl.locator('xpath=ancestor::div[3]');
    const scopedChoice = row
      .getByRole('radio', { name: targetModeText })
      .or(row.getByRole('button', { name: targetModeText }))
      .or(row.getByText(targetModeText, { exact: true }))
      .first();
    if (await scopedChoice.isVisible().catch(() => false)) {
      await scopedChoice.click();
      await page.waitForTimeout(450);
    }
  };

  await setScopedMode('프로젝트 편집', '프로젝트별 설정에 따름');
  await setScopedMode('응답 다운로드', '프로젝트별 설정에 따름');
  await setScopedMode('모든 응답 보기', '프로젝트별 설정에 따름');

  // Assign 정하윤 in 멤버 / 멤버 관리 tab of role
  const membersSubTab = dialog
    .getByRole('tab', { name: /멤버/ })
    .or(dialog.getByRole('button', { name: /멤버/ }).filter({ hasNotText: '멤버 관리' }))
    .first();
  if (await membersSubTab.isVisible().catch(() => false)) {
    await membersSubTab.click();
    await page.waitForTimeout(500);
    const hasHayoon = await dialog.getByText('정하윤').first().isVisible().catch(() => false);
    if (!hasHayoon) {
      const addMemberBtn = dialog.getByRole('button', { name: /멤버 추가/ }).first();
      if (await addMemberBtn.isVisible().catch(() => false)) {
        await addMemberBtn.click();
        await page.waitForTimeout(500);
        const hayoonItem = dialog.getByText(/정하윤/).first();
        if (await hayoonItem.isVisible().catch(() => false)) {
          await hayoonItem.click();
          await page.waitForTimeout(300);
          await dialog.getByRole('button', { name: /추가하기/ }).last().click();
          await page.waitForTimeout(800);
        }
      }
    }
  }
}

async function runSetup(browser) {
  console.log('=== PHASE 1: SETUP ===');
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();

  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      console.log(`API ${res.status()} ${res.url()}`);
    }
  });

  await signIn(page, 'minsu@example.com');
  const ids = await resolveFormIds(page);
  await populateAndPublishMainForm(browser, page, ids.mainFormId);
  await setupSeoulResearcherRole(page);

  await context.close();
  return ids;
}

async function runWorkspaceCaptures(browser) {
  console.log('=== PHASE 2: WORKSPACE CAPTURES ===');
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();
  await signIn(page, 'minsu@example.com');
  await gotoWorkspace(page);

  const outDir = path.join(GUIDES_IMG_DIR, 'team-workspace');

  // 1. workspace-settings-button.png
  const settingsBtn = page.locator('button[aria-label="워크스페이스 설정"]').last();
  await capturePng(page, path.join(outDir, 'workspace-settings-button.png'), {
    highlight: settingsBtn,
    waitMs: 500,
  });

  // 2. 멤버 관리 tab -> workspace-member-invite.png
  const dialog = await openWorkspaceSettings(page, '멤버 관리');
  await capturePng(page, path.join(outDir, 'workspace-member-invite.png'), {
    modalBlur: true,
    waitMs: 500,
  });

  // 3-4. 초대 -> 초대하기 -> workspace-add-member-select.png & workspace-member-added.png
  await dialog.getByRole('button', { name: '초대', exact: true }).first().click();
  await page.waitForTimeout(400);
  const invitePeopleTab = dialog.getByRole('tab', { name: '초대하기' }).or(dialog.getByRole('button', { name: '초대하기' })).first();
  if (await invitePeopleTab.isVisible().catch(() => false)) {
    await invitePeopleTab.click();
  }

  // Wait for candidate list ("로딩 중..." -> "한지민") before selecting
  const jiminRow = dialog.getByText(/한지민/).first();
  const hasJimin = await jiminRow.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  if (hasJimin) {
    await jiminRow.click();
    await page.waitForTimeout(350);
  }
  const addActionBtn = dialog.getByRole('button', { name: /추가하기|명 추가/ }).last();
  if (await addActionBtn.isVisible().catch(() => false)) {
    await capturePng(page, path.join(outDir, 'workspace-add-member-select.png'), {
      modalBlur: true,
      highlight: addActionBtn,
      waitMs: 350,
    });
    const disabled = (await addActionBtn.getAttribute('aria-disabled')) === 'true' || (await addActionBtn.isDisabled());
    if (!disabled) {
      await addActionBtn.click();
      await page.waitForTimeout(1200);
    }
  }
  await dialog.getByRole('button', { name: '멤버 관리', exact: true }).first().click();
  await dialog.getByText(/한지민/).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  await capturePng(page, path.join(outDir, 'workspace-member-added.png'), {
    modalBlur: true,
    waitMs: 400,
  });

  // 5-10. 초대 -> 초대 링크 subtab
  await dialog.getByRole('button', { name: '초대', exact: true }).first().click();
  await page.waitForTimeout(500);
  const inviteLinkTab = dialog.getByRole('tab', { name: '초대 링크' }).or(dialog.getByRole('button', { name: '초대 링크' })).first();
  if (await inviteLinkTab.isVisible().catch(() => false)) {
    await inviteLinkTab.click();
  }
  await dialog.getByRole('button', { name: '초대 링크 생성' }).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(700);

  // Clean up any pre-existing active link so we start from empty table
  for (let attempt = 0; attempt < 5; attempt++) {
    const trash = dialog.locator('button[aria-label="삭제"]').first();
    if (!(await trash.isVisible({ timeout: 1200 }).catch(() => false))) break;
    await trash.click();
    const portal = page.locator('[data-slot="alert-dialog-portal"], [role="alertdialog"]').last();
    await portal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const confirmBtn = portal.locator('button').last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
    await portal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(700);
  }

  const createLinkBtn = dialog.getByRole('button', { name: '초대 링크 생성' }).first();
  await capturePng(page, path.join(outDir, 'workspace-invite-link-create-button.png'), {
    modalBlur: true,
    highlight: createLinkBtn,
    waitMs: 350,
  });

  await createLinkBtn.click();
  await dialog.locator('button[aria-label*="링크 복사"]').first().waitFor({ state: 'visible', timeout: 12000 });
  await page.waitForTimeout(500);
  await capturePng(page, path.join(outDir, 'workspace-invite-link-created.png'), {
    modalBlur: true,
    domainRewrite: true,
    waitMs: 400,
  });

  const expiryBtn = dialog.locator('button[aria-label*="유효 기간 변경"]').first();
  if (await expiryBtn.isVisible().catch(() => false)) {
    await expiryBtn.click();
    await page.waitForTimeout(450);
    await capturePng(page, path.join(outDir, 'workspace-invite-link-change-expiry.png'), {
      modalBlur: true,
      domainRewrite: true,
      waitMs: 350,
    });
    await dialog.getByText('생성된 초대 링크').first().click();
    await page.waitForTimeout(300);
  }

  const trashBtn = dialog.locator('button[aria-label="삭제"]').first();
  if (await trashBtn.isVisible().catch(() => false)) {
    await capturePng(page, path.join(outDir, 'workspace-invite-link-delete-button.png'), {
      modalBlur: true,
      highlight: trashBtn,
      domainRewrite: true,
      waitMs: 300,
    });
    await trashBtn.click();
    const confirmPortal = page.locator('[data-slot="alert-dialog-portal"], [role="alertdialog"]').last();
    await confirmPortal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(350);
    await capturePng(page, path.join(outDir, 'workspace-invite-link-delete-confirm.png'), {
      modalBlur: true,
      domainRewrite: true,
      waitMs: 300,
    });
    const confirmDeleteBtn = confirmPortal.locator('button').last();
    if (await confirmDeleteBtn.isVisible().catch(() => false)) {
      await confirmDeleteBtn.click();
      await dialog.getByText('생성된 초대링크가 없습니다.').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(500);
      await capturePng(page, path.join(outDir, 'workspace-invite-link-deleted.png'), {
        modalBlur: true,
        waitMs: 300,
      });
    }
  }

  // 11-12. 역할 및 권한 -> 서울 리서처 -> 권한 설정 & 멤버 목록
  await dialog.getByRole('button', { name: '역할 및 권한', exact: true }).first().click();
  const seoulRole = dialog.locator('button:visible, [role="button"]:visible, a:visible').filter({ hasText: '서울 리서처' }).first();
  await seoulRole.waitFor({ state: 'visible', timeout: 10000 });
  await seoulRole.click();
  await dialog.locator('span:not(.invisible):visible, p:visible, button:visible').filter({ hasText: '프로젝트별 설정에 따름' }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(600);
  const permsSubTab = dialog.getByRole('tab', { name: '권한 설정' }).or(dialog.getByRole('button', { name: '권한 설정' })).first();
  if (await permsSubTab.isVisible().catch(() => false)) {
    await permsSubTab.click();
    await page.waitForTimeout(300);
  }
  await capturePng(page, path.join(outDir, 'workspace-roles-permissions.png'), {
    modalBlur: true,
    waitMs: 400,
  });

  const roleMembersTab = dialog
    .getByRole('tab', { name: /멤버 목록/ })
    .or(dialog.getByRole('button', { name: /멤버 목록/ }))
    .first();
  if (await roleMembersTab.isVisible().catch(() => false)) {
    await roleMembersTab.click();
    await dialog.locator('span:visible, p:visible, td:visible').filter({ hasText: '정하윤' }).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await capturePng(page, path.join(outDir, 'workspace-role-members.png'), {
      modalBlur: true,
      waitMs: 400,
    });
  }

  await context.close();
}

async function runSettingsCaptures(browser, ids) {
  console.log('=== PHASE 3: FORM SETTINGS CAPTURES ===');
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();
  await signIn(page, 'minsu@example.com');

  const outDir = path.join(GUIDES_IMG_DIR, 'manage-forms');

  // 1. project-move.png from workspace card menu
  await gotoWorkspace(page);
  const titleEl = page.getByText(MAIN_FORM_TITLE, { exact: true }).first();
  // Find the nearest card ancestor containing a button (menu '...' trigger)
  let menuOpened = false;
  for (let depth = 1; depth <= 5; depth++) {
    const ancestor = titleEl.locator(`xpath=ancestor::div[${depth}]`);
    const btn = ancestor.locator('button:visible').first();
    if ((await btn.count()) > 0 && (await btn.boundingBox().then((b) => b && b.width < 48).catch(() => false))) {
      await btn.click();
      await page.waitForTimeout(450);
      if (await page.getByRole('menuitem', { name: /워크스페이스 이동/ }).first().isVisible().catch(() => false)) {
        menuOpened = true;
        break;
      }
      await page.keyboard.press('Escape');
    }
  }
  if (menuOpened) {
    const moveItem = page.getByRole('menuitem', { name: /워크스페이스 이동/ }).first();
    await capturePng(page, path.join(outDir, 'project-move.png'), {
      highlight: moveItem,
      waitMs: 300,
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } else {
    console.log('Warning: could not open card menu for project-move.png');
  }

  // 2. Main form editor -> top-right gear button
  await openProjectEditor(page, ids.mainFormId);
  const gearBtn = page.locator('[data-tour="editor-settings"]').first();
  await capturePng(page, path.join(outDir, 'duplicate-response-settings.png'), {
    highlight: gearBtn,
    waitMs: 400,
  });
  await capturePng(page, path.join(outDir, 'survey-export-open-settings.png'), {
    highlight: gearBtn,
    waitMs: 200,
  });

  // 3. 접근 tab captures
  const dialog = await openFormSettings(page, '접근');

  const recv = await findRowAndSwitchByLabel(dialog, /응답 받기/);
  await capturePng(page, path.join(outDir, 'response-receiving-toggle.png'), {
    modalBlur: true,
    highlight: recv.row,
    waitMs: 300,
  });

  const limitRes = await ensureSwitchState(dialog, /응답 수 제한/, true);
  const limitInput = dialog.getByPlaceholder(/최대 응답 수/).first();
  if (await limitInput.isVisible().catch(() => false)) {
    await limitInput.fill('100');
    await page.waitForTimeout(300);
  }
  await capturePng(page, path.join(outDir, 'response-limit-setting.png'), {
    modalBlur: true,
    highlight: limitRes.row,
    waitMs: 300,
  });
  if (limitRes.changed) await ensureSwitchState(dialog, /응답 수 제한/, false);

  const schedRes = await ensureSwitchState(dialog, /응답 기간|시작 일정/, true);
  const scheduleBox = dialog.getByText(/응답 기간/).first().locator('xpath=ancestor::div[2]');
  await capturePng(page, path.join(outDir, 'schedule-settings.png'), {
    modalBlur: true,
    highlight: scheduleBox,
    waitMs: 400,
  });
  if (schedRes.changed) await ensureSwitchState(dialog, /응답 기간|시작 일정/, false);

  // 4. 응답자 tab captures
  const respNavBtn = dialog.getByRole('button', { name: '응답자', exact: true }).first();
  await respNavBtn.click();
  await page.waitForTimeout(500);
  await capturePng(page, path.join(outDir, 'logged-in-response-tab.png'), {
    modalBlur: true,
    highlight: respNavBtn,
    waitMs: 300,
  });

  const pwRes = await ensureSwitchState(dialog, /비밀번호 보호/, true);
  await capturePng(page, path.join(outDir, 'logged-in-password-protection.png'), {
    modalBlur: true,
    highlight: pwRes.row,
    waitMs: 300,
  });
  if (pwRes.changed) await ensureSwitchState(dialog, /비밀번호 보호/, false);

  const authRes = await ensureSwitchState(dialog, /사용자 인증/, true);
  await capturePng(page, path.join(outDir, 'logged-in-user-authentication.png'), {
    modalBlur: true,
    highlight: authRes.row,
    waitMs: 300,
  });

  const allowRes = await findRowAndSwitchByLabel(dialog, /특정 이메일/);
  if (allowRes.sw) {
    await ensureSwitchState(dialog, /특정 이메일/, true);
    const allowInput = dialog.getByPlaceholder(/example\.com/).first();
    if (await allowInput.isVisible().catch(() => false)) {
      await allowInput.fill('@walla.my');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    await capturePng(page, path.join(outDir, 'logged-in-specific-respondents.png'), {
      modalBlur: true,
      highlight: allowRes.row,
      waitMs: 300,
    });
    await ensureSwitchState(dialog, /특정 이메일/, false);
  }

  const msgRes = await findRowAndSwitchByLabel(dialog, /인증 화면 안내/);
  if (msgRes.sw) {
    await ensureSwitchState(dialog, /인증 화면 안내/, true);
    await capturePng(page, path.join(outDir, 'logged-in-auth-screen-message.png'), {
      modalBlur: true,
      highlight: msgRes.row,
      waitMs: 300,
    });
    await ensureSwitchState(dialog, /인증 화면 안내/, false);
  }

  const onceRes = await ensureSwitchState(dialog, /인증된 사용자당 1회/, true);
  await capturePng(page, path.join(outDir, 'logged-in-once-per-user.png'), {
    modalBlur: true,
    highlight: onceRes.row,
    waitMs: 300,
  });
  await capturePng(page, path.join(outDir, 'duplicate-response-authenticated-user.png'), {
    modalBlur: true,
    highlight: onceRes.row,
    waitMs: 250,
  });
  await ensureSwitchState(dialog, /인증된 사용자당 1회/, false);
  if (authRes.changed) await ensureSwitchState(dialog, /사용자 인증/, false);

  const browserDupRes = await ensureSwitchState(dialog, /브라우저 중복 응답 방지/, true);
  await capturePng(page, path.join(outDir, 'duplicate-response-browser.png'), {
    modalBlur: true,
    highlight: browserDupRes.row,
    waitMs: 300,
  });
  if (browserDupRes.changed) await ensureSwitchState(dialog, /브라우저 중복 응답 방지/, false);

  const tempBrowserRes = await ensureSwitchState(dialog, /브라우저에 저장/, true);
  await capturePng(page, path.join(outDir, 'temporary-save-browser.png'), {
    modalBlur: true,
    highlight: tempBrowserRes.row,
    waitMs: 300,
  });
  if (tempBrowserRes.changed) await ensureSwitchState(dialog, /브라우저에 저장/, false);

  const tempLoginRes = await ensureSwitchState(dialog, /로그인하여 저장/, true);
  await capturePng(page, path.join(outDir, 'temporary-save-login.png'), {
    modalBlur: true,
    highlight: tempLoginRes.row,
    waitMs: 300,
  });
  if (tempLoginRes.changed) await ensureSwitchState(dialog, /로그인하여 저장/, false);
  await ensureSwitchState(dialog, /사용자 인증/, false);

  // 5. 설문 내보내기 tab captures
  const exportNavBtn = dialog.getByRole('button', { name: '설문 내보내기', exact: true }).first();
  await exportNavBtn.click();
  await dialog.getByText(/편집 내용이 동기화되기를/).first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await capturePng(page, path.join(outDir, 'survey-export-select-menu.png'), {
    modalBlur: true,
    highlight: exportNavBtn,
    waitMs: 300,
  });

  const exportOptionArea = dialog.getByText(/문항 번호 표시/).first().locator('xpath=ancestor::div[3]');
  await capturePng(page, path.join(outDir, 'survey-export-options.png'), {
    modalBlur: true,
    highlight: exportOptionArea,
    waitMs: 300,
  });

  const exportWordBtn = dialog.getByRole('button', { name: /Word로 내보내기/ }).first();
  await capturePng(page, path.join(outDir, 'survey-export-download-word.png'), {
    modalBlur: true,
    highlight: exportWordBtn,
    waitMs: 300,
  });

  // 6. 임베드 tab captures on draftFormId so mainFormId stays public
  await openProjectEditor(page, ids.draftFormId);
  const draftDialog = await openFormSettings(page, '임베드');
  const embedNavBtn = draftDialog.getByRole('button', { name: '임베드', exact: true }).first();
  await capturePng(page, path.join(outDir, 'embed-only-step-1.png'), {
    modalBlur: true,
    highlight: embedNavBtn,
    waitMs: 300,
  });

  await ensureSwitchState(draftDialog, /임베드 전용 접근/, true);
  await page.waitForTimeout(400);

  const allowedSitesBtn = draftDialog.getByText(/허용한 사이트에서만/).first();
  if (await allowedSitesBtn.isVisible().catch(() => false)) {
    await allowedSitesBtn.click();
    await page.waitForTimeout(300);
    await capturePng(page, path.join(outDir, 'embed-only-mode-allowed-sites.png'), {
      modalBlur: true,
      highlight: allowedSitesBtn.locator('xpath=ancestor::div[2]'),
      waitMs: 300,
    });
  }

  const originSection = draftDialog.getByPlaceholder(/https:\/\//).first();
  if (await originSection.isVisible().catch(() => false)) {
    await originSection.fill('https://portal.example.com');
    await capturePng(page, path.join(outDir, 'embed-only-origin.png'), {
      modalBlur: true,
      highlight: originSection.locator('xpath=ancestor::div[2]'),
      waitMs: 300,
    });
  }

  const signedBtn = draftDialog.getByText(/호스트 서명 토큰/).first();
  if (await signedBtn.isVisible().catch(() => false)) {
    await signedBtn.click();
    await page.waitForTimeout(350);
    await capturePng(page, path.join(outDir, 'embed-only-mode-signed-token.png'), {
      modalBlur: true,
      highlight: signedBtn.locator('xpath=ancestor::div[2]'),
      waitMs: 300,
    });
  }

  const secretArea = draftDialog.getByText(/서명 시크릿|시크릿 키/).first();
  if (await secretArea.isVisible().catch(() => false)) {
    await capturePng(page, path.join(outDir, 'embed-only-secret.png'), {
      modalBlur: true,
      highlight: secretArea.locator('xpath=ancestor::div[2]'),
      waitMs: 300,
    });
  }

  const memberIdBtn = draftDialog.getByText(/회원 식별/).first();
  if (await memberIdBtn.isVisible().catch(() => false)) {
    await memberIdBtn.click();
    await page.waitForTimeout(350);
    await capturePng(page, path.join(outDir, 'embed-only-mode-member-id.png'), {
      modalBlur: true,
      highlight: memberIdBtn.locator('xpath=ancestor::div[2]'),
      waitMs: 300,
    });
  }

  // Restore draft embed-only back OFF
  await ensureSwitchState(draftDialog, /임베드 전용 접근/, false);
  await context.close();
}

async function runTourCaptures(browser, ids) {
  console.log('=== PHASE 4: INTERACTIVE TOURS CAPTURES ===');
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();
  await signIn(page, 'minsu@example.com');

  // --- TOUR 1: project-permissions ---
  const ppDir = path.join(GUIDES_IMG_DIR, 'tours/project-permissions');
  await openProjectEditor(page, ids.mainFormId);

  const gearBtn = page.locator('[data-tour="editor-settings"]').first();
  const ppStep1Hotspot = await toPercentBox(await gearBtn.boundingBox());
  await capturePng(page, path.join(ppDir, 'step-01.png'), { waitMs: 350 });

  const dialog = await openFormSettings(page);
  const ppTabBtn = dialog.getByRole('button', { name: '프로젝트 권한', exact: true }).first();
  await ppTabBtn.waitFor({ state: 'visible', timeout: 8000 });
  const ppStep2Hotspot = await toPercentBox(await ppTabBtn.boundingBox());
  await capturePng(page, path.join(ppDir, 'step-02.png'), { modalBlur: true, waitMs: 350 });

  await ppTabBtn.click();
  await dialog.getByText(/불러오는 중/).first().waitFor({ state: 'hidden', timeout: 25000 }).catch(() => {});
  await dialog.getByText('허용 안 함').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);

  // Enable 프로젝트 편집 & 응답 다운로드 in 이 프로젝트의 역할 권한
  await ensureSwitchState(dialog, /프로젝트 편집/, true);
  await ensureSwitchState(dialog, /응답 다운로드/, true);
  const capSection = dialog.getByText('이 프로젝트의 역할 권한').first().locator('xpath=ancestor::div[2]');
  const ppStep3Hotspot = await toPercentBox(await capSection.boundingBox());
  await capturePng(page, path.join(ppDir, 'step-03.png'), { modalBlur: true, waitMs: 350 });
  const capSaveBtn = capSection.getByRole('button', { name: '저장하기' }).first();
  if (await capSaveBtn.isVisible().catch(() => false) && !(await capSaveBtn.isDisabled())) {
    await capSaveBtn.click();
    await page.waitForTimeout(800);
  }

  const respAccessSection = dialog.getByText('응답 접근', { exact: true }).first().locator('xpath=ancestor::div[2]');
  await respAccessSection.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  const ppStep4Hotspot = await toPercentBox(await respAccessSection.boundingBox());
  await capturePng(page, path.join(ppDir, 'step-04.png'), { modalBlur: true, waitMs: 350 });

  // Configure 조건에 맞는 응답 (거주 지역 -> 서울) for 서울 리서처 on mainFormId
  const matchingBtn = dialog.getByRole('button', { name: '조건에 맞는 응답' }).or(dialog.getByText('조건에 맞는 응답', { exact: true })).first();
  await matchingBtn.waitFor({ state: 'visible', timeout: 10000 });
  await matchingBtn.click();
  await page.waitForTimeout(600);

  // Add condition row if '조건 1' / '필드' is not yet visible
  const hasFieldLabel = await dialog.getByText('필드', { exact: true }).first().isVisible().catch(() => false);
  if (!hasFieldLabel) {
    const condBtn = dialog.getByRole('button', { name: '조건 추가' }).first();
    await condBtn.waitFor({ state: 'visible', timeout: 5000 });
    await condBtn.scrollIntoViewIfNeeded().catch(() => {});
    await condBtn.click();
    await dialog.getByText('필드', { exact: true }).first().waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(450);
  }

  // Note: field selector may be a <select> or a <button> trigger without role="combobox"
  const fieldCtrl = dialog
    .locator('select:visible, button:visible, [role="combobox"]:visible')
    .filter({ hasText: /제출 시각|거주 지역|연락처|추가 의견|전반적인 만족도/ })
    .first();
  if (await fieldCtrl.isVisible().catch(() => false)) {
    const tagName = await fieldCtrl.evaluate((e) => e.tagName);
    if (tagName === 'SELECT') {
      await fieldCtrl.selectOption({ label: '거주 지역' }).catch(() => {});
    } else {
      await fieldCtrl.click();
      await page.waitForTimeout(350);
      await page
        .locator('[role="option"]:visible, [role="menuitem"]:visible, button:visible, div[role="button"]:visible')
        .filter({ hasText: /거주 지역/ })
        .last()
        .click();
    }
    await page.waitForTimeout(550);
  }

  // '서울' is rendered directly as a checkbox <label> under 값 (no combobox trigger!)
  const seoulVal = dialog.locator('label:visible').filter({ hasText: /^서울$/ }).first();
  await seoulVal.waitFor({ state: 'visible', timeout: 5000 });
  await seoulVal.click();
  await page.waitForTimeout(450);
  const saveBtn = dialog.getByRole('button', { name: '저장하기' }).last();
  await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
  const ppStep5Hotspot = (await saveBtn.isVisible().catch(() => false))
    ? await toPercentBox(await saveBtn.boundingBox())
    : ppStep4Hotspot;
  await capturePng(page, path.join(ppDir, 'step-05.png'), { modalBlur: true, waitMs: 400 });
  if (await saveBtn.isVisible().catch(() => false) && !(await saveBtn.isDisabled())) {
    await saveBtn.click();
    await dialog.getByText(/정책을 저장했습니다|변경사항을 저장했습니다/).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
  } else {
    console.log('Warning: 응답 접근 저장하기 button still disabled:', await dialog.innerText());
  }

    await fs.mkdir(TOURS_DATA_DIR, { recursive: true });
    await fs.writeFile(
      path.join(TOURS_DATA_DIR, 'project-permissions.json'),
      JSON.stringify(
        {
          id: 'project-permissions',
          title: '프로젝트 권한 설정 둘러보기',
          steps: [
            {
              id: 'open-settings',
              title: '설문 설정 열기',
              description: '프로젝트 편집 화면 우측 상단의 톱니바퀴(설문 설정) 아이콘을 클릭합니다.',
              image: '/images/guides/tours/project-permissions/step-01.png',
              alt: '프로젝트 편집 화면 우측 상단의 설문 설정 아이콘',
              actionLabel: '설문 설정 열기',
              hotspot: ppStep1Hotspot,
            },
            {
              id: 'select-tab',
              title: '프로젝트 권한 탭 선택',
              description: 'Enterprise 플랜 팀에서 관리 권한이 있는 멤버에게 왼쪽 메뉴의 ‘프로젝트 권한’ 탭이 표시됩니다.',
              image: '/images/guides/tours/project-permissions/step-02.png',
              alt: '설문 설정 모달 왼쪽 메뉴의 프로젝트 권한 탭',
              actionLabel: '프로젝트 권한 열기',
              hotspot: ppStep2Hotspot,
            },
            {
              id: 'role-capabilities',
              title: '이 프로젝트의 역할 권한 지정',
              description: '워크스페이스 역할 설정에서 ‘프로젝트별 설정에 따름’으로 둔 7가지 작업 권한을 이 설문에 한해 켤 수 있습니다.',
              image: '/images/guides/tours/project-permissions/step-03.png',
              alt: '이 프로젝트의 역할 권한 카드에서 서울 리서처 역할 권한을 설정하는 화면',
              actionLabel: '다음: 응답 접근',
              hotspot: ppStep3Hotspot,
            },
            {
              id: 'response-access-rules',
              title: '역할별 응답 접근 범위 선택',
              description: '응답 접근 섹션에서 역할별로 ‘모든 응답’ 또는 ‘조건에 맞는 응답’을 선택할 수 있습니다.',
              image: '/images/guides/tours/project-permissions/step-04.png',
              alt: '응답 접근 섹션에서 서울 리서처 역할의 접근 범위를 선택하는 화면',
              actionLabel: '조건 규칙 설정',
              hotspot: ppStep4Hotspot,
            },
            {
              id: 'save-policy',
              title: '조건 규칙 추가 및 저장',
              description: '‘거주 지역 같음 서울’ 같은 조건을 추가하고 저장하기를 누르면 설문 게시 상태와 무관하게 즉시 적용됩니다.',
              image: '/images/guides/tours/project-permissions/step-05.png',
              alt: '조건에 맞는 응답 규칙을 지정하고 저장하기 버튼이 활성화된 화면',
              actionLabel: '저장 완료',
              hotspot: ppStep5Hotspot,
            },
          ],
        },
        null,
        2
      )
    );

  // --- TOUR 2: response-access ---
  const raDir = path.join(GUIDES_IMG_DIR, 'tours/response-access');

  // Step 1: Workspace roles -> 서울 리서처 -> 모든 응답 보기 = 프로젝트별 설정에 따름
  await gotoWorkspace(page);
  const wsDialog = await openWorkspaceSettings(page, '역할 및 권한');
  const wsSeoulRole = wsDialog.locator('button:visible, [role="button"]:visible, a:visible').filter({ hasText: '서울 리서처' }).first();
  await wsSeoulRole.waitFor({ state: 'visible', timeout: 10000 });
  await wsSeoulRole.click();
  await wsDialog.locator('span:not(.invisible):visible, p:visible, button:visible').filter({ hasText: '프로젝트별 설정에 따름' }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(600);
  const viewAllRow = wsDialog.getByText('모든 응답 보기', { exact: true }).first().locator('xpath=ancestor::div[2]');
  await viewAllRow.scrollIntoViewIfNeeded().catch(() => {});
  const raStep1Hotspot = await toPercentBox(await viewAllRow.boundingBox());
  await capturePng(page, path.join(raDir, 'step-01.png'), { modalBlur: true, waitMs: 350 });

  // Step 2 & 3: Project settings -> 응답 접근 (copy steps 4 & 5 framing cleanly)
  await fs.copyFile(path.join(ppDir, 'step-04.png'), path.join(raDir, 'step-02.png'));
  await fs.copyFile(path.join(ppDir, 'step-05.png'), path.join(raDir, 'step-03.png'));

  // Step 4 & 5: Sign in as hayoon@example.com (정하윤, 서울 리서처)
  const hayoonCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const hayoonPage = await hayoonCtx.newPage();
  await signIn(hayoonPage, 'hayoon@example.com');

  await hayoonPage.goto(
    `${DASHBOARD_URL}/team/${TEAM_ID}/workspace/${WORKSPACE_ID}/project/${ids.mainFormId}/sheet`,
    { waitUntil: 'domcontentloaded' }
  );
  const bannerEl = hayoonPage.getByText(/접근할 수 있는 응답만 표시합니다/).first();
  await bannerEl.waitFor({ state: 'visible', timeout: 30000 });
  await hayoonPage.getByText(/6개의 응답/).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await hayoonPage.waitForTimeout(3000);
  await hideDevChrome(hayoonPage);
  const raStep4Hotspot = await toPercentBox(await bannerEl.boundingBox());
  await capturePng(hayoonPage, path.join(raDir, 'step-04.png'), { waitMs: 500 });

  await hayoonPage.goto(
    `${DASHBOARD_URL}/team/${TEAM_ID}/workspace/${WORKSPACE_ID}/project/${ids.mainFormId}/analytics`,
    { waitUntil: 'domcontentloaded' }
  );
  const analyticsAlert = hayoonPage.getByText(/방문·행동 분석을 제공하지 않습니다/).first();
  await analyticsAlert.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await hayoonPage.waitForTimeout(1500);
  await hideDevChrome(hayoonPage);
  const raStep5Hotspot = (await analyticsAlert.isVisible().catch(() => false))
    ? await toPercentBox(await analyticsAlert.boundingBox())
    : { x: 24, y: 20, width: 52, height: 12 };
  await capturePng(hayoonPage, path.join(raDir, 'step-05.png'), { waitMs: 500 });

  await hayoonCtx.close();

  await fs.writeFile(
    path.join(TOURS_DATA_DIR, 'response-access.json'),
    JSON.stringify(
      {
        id: 'response-access',
        title: '응답 접근 제어 적용 흐름 둘러보기',
        steps: [
          {
            id: 'workspace-scope',
            title: '워크스페이스 역할에서 ‘프로젝트별 설정에 따름’ 선택',
            description: '워크스페이스 설정 → 역할 및 권한에서 ‘서울 리서처’ 역할의 ‘모든 응답 보기’를 프로젝트별 설정에 따름으로 지정합니다.',
            image: '/images/guides/tours/response-access/step-01.png',
            alt: '워크스페이스 역할 및 권한에서 모든 응답 보기를 프로젝트별 설정에 따름으로 선택한 화면',
            actionLabel: '프로젝트 설정으로 이동',
            hotspot: raStep1Hotspot,
          },
          {
            id: 'project-mode',
            title: '설문 설정 → 프로젝트 권한에서 ‘조건에 맞는 응답’ 선택',
            description: '프로젝트별 허용 전까지는 응답이 차단되며, 프로젝트 권한 탭의 응답 접근에서 조건부 조회를 켤 수 있습니다.',
            image: '/images/guides/tours/response-access/step-02.png',
            alt: '설문 설정 프로젝트 권한 탭의 응답 접근 섹션',
            actionLabel: '조건 입력',
            hotspot: ppStep4Hotspot,
          },
          {
            id: 'rule-save',
            title: '조건 규칙 설정 및 즉시 적용',
            description: '‘거주 지역 = 서울’ 조건을 추가하고 저장하면 해당 역할 멤버의 응답 시트·개별 응답·통계·다운로드에 즉시 적용됩니다.',
            image: '/images/guides/tours/response-access/step-03.png',
            alt: '거주 지역 서울 조건 규칙을 저장하는 화면',
            actionLabel: '리서처 화면 확인',
            hotspot: ppStep5Hotspot,
          },
          {
            id: 'restricted-sheet',
            title: '제한된 멤버의 응답 시트 화면',
            description: '‘서울 리서처’ 역할로 로그인한 정하윤 계정의 응답 시트에는 ‘접근할 수 있는 응답만 표시합니다.’ 안내와 함께 서울 지역 응답만 표시됩니다.',
            image: '/images/guides/tours/response-access/step-04.png',
            alt: '서울 리서처 계정으로 접속한 응답 시트에 접근할 수 있는 응답만 표시합니다 배너가 노출된 화면',
            actionLabel: '방문·행동 분석 확인',
            hotspot: raStep4Hotspot,
          },
          {
            id: 'analytics-notice',
            title: '방문·행동 분석 제한 안내',
            description: '응답 접근이 제한된 멤버에게는 방문·행동 분석 대신 응답 통계에서 접근 가능한 응답을 분석하도록 안내 문구가 표시됩니다.',
            image: '/images/guides/tours/response-access/step-05.png',
            alt: '응답 접근이 제한된 멤버의 방문·행동 분석 화면 안내 배너',
            actionLabel: '처음으로',
            hotspot: raStep5Hotspot,
          },
        ],
      },
      null,
      2
    )
  );

  await context.close();
}

async function fixMainFormFieldTitlesAndPublish(browser, ids) {
  console.log('=== POLISH: FIX MAIN FORM TITLES & PROJECT-MOVE ===');
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();
  await signIn(page, 'minsu@example.com');

  // 1. project-move.png — click the '...' button aligned horizontally right of card title
  await gotoWorkspace(page);
  const titleEl = page.getByText(MAIN_FORM_TITLE, { exact: true }).first();
  const tBox = await titleEl.boundingBox();
  let menuOpened = false;
  if (tBox) {
    // Find visible buttons near the card title row (same y-band, x > tBox.x)
    const buttons = page.locator('button:visible');
    const bCnt = await buttons.count();
    for (let i = 0; i < bCnt; i++) {
      const btn = buttons.nth(i);
      const b = await btn.boundingBox().catch(() => null);
      if (b && Math.abs(b.y - tBox.y) < 20 && b.x > tBox.x && b.x < tBox.x + 300 && b.width < 48) {
        await btn.click();
        await page.waitForTimeout(450);
        if (await page.getByRole('menuitem', { name: /워크스페이스 이동/ }).first().isVisible().catch(() => false)) {
          menuOpened = true;
          break;
        }
        await page.keyboard.press('Escape');
      }
    }
  }
  if (menuOpened) {
    const moveItem = page.getByRole('menuitem', { name: /워크스페이스 이동/ }).first();
    await capturePng(page, path.join(GUIDES_IMG_DIR, 'manage-forms/project-move.png'), {
      highlight: moveItem,
      waitMs: 300,
    });
    await page.keyboard.press('Escape');
  } else {
    console.log('Warning: still could not open card menu for project-move.png');
  }

  // 2. Rename all 4 fields cleanly on both canvas (.tiptap.nth(i)) AND right-sidebar '필드 제목' input
  await openProjectEditor(page, ids.mainFormId);

  const fieldSpecs = [
    { index: 0, title: '거주 지역', masking: false },
    { index: 1, title: '연락처', masking: true },
    { index: 2, title: '추가 의견', masking: false },
    { index: 3, title: '전반적인 만족도', masking: false },
  ];

  for (const spec of fieldSpecs) {
    const tiptap = page.locator('.tiptap').nth(spec.index);
    await tiptap.scrollIntoViewIfNeeded().catch(() => {});
    await tiptap.click();
    await page.waitForTimeout(350);
    await tiptap.fill(spec.title);
    await page.waitForTimeout(350);

    const titleLabel = page.getByText('필드 제목', { exact: true }).first();
    if (await titleLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      const titleInput = titleLabel.locator('xpath=following::input[1]');
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.click();
        await titleInput.fill(spec.title);
        await titleInput.press('Enter');
        await page.waitForTimeout(300);
      }
    }
    if (spec.masking) {
      const { sw } = await findRowAndSwitchByLabel(page, /^데이터 마스킹/);
      if (sw && (await sw.getAttribute('aria-checked')) !== 'true') {
        await sw.click();
        await page.waitForTimeout(350);
        // Data masking toggle opens a confirmation alert-dialog
        const maskPortal = page.locator('[data-slot="alert-dialog-portal"]:visible, [role="alertdialog"]:visible').last();
        if (await maskPortal.isVisible({ timeout: 2500 }).catch(() => false)) {
          await maskPortal.locator('button').last().click();
          await maskPortal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(350);
        }
      }
    }
  }
  await waitForEditorSave(page);

  const publishBtn = page.locator('[data-tour="editor-publish"]').first();
  if (await publishBtn.isVisible().catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(800);
    const confirmPub = page.locator(DIALOG_SEL).getByRole('button', { name: /게시하기|게시/ }).last();
    if (await confirmPub.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPub.click();
      await page.waitForTimeout(1500);
    }
    await waitForEditorSave(page);
  }

  // Close share-link popover opened by publish & dismiss toast before clean capture
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.locator('.tiptap').first().scrollIntoViewIfNeeded().catch(() => {});
  await page.locator('.tiptap').first().click().catch(() => {});
  await page.getByText('프로젝트가 게시되었습니다').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);

  const gearBtn = page.locator('[data-tour="editor-settings"]').first();
  await capturePng(page, path.join(GUIDES_IMG_DIR, 'manage-forms/duplicate-response-settings.png'), {
    highlight: gearBtn,
    waitMs: 350,
  });
  await capturePng(page, path.join(GUIDES_IMG_DIR, 'manage-forms/survey-export-open-settings.png'), {
    highlight: gearBtn,
    waitMs: 200,
  });
  await context.close();
}

async function main() {
  const modes = parseModes();
  const browser = await chromium.launch({ headless: true });
  try {
    let ids = { mainFormId: DEFAULT_MAIN_ID, draftFormId: DEFAULT_DRAFT_ID };
    if (modes.has('setup')) {
      ids = await runSetup(browser);
      console.log('Setup IDs:', ids);
    }
    if (modes.has('polish')) {
      await fixMainFormFieldTitlesAndPublish(browser, ids);
    }
    if (modes.has('workspace')) {
      await runWorkspaceCaptures(browser);
    }
    if (modes.has('settings')) {
      await runSettingsCaptures(browser, ids);
    }
    if (modes.has('tours')) {
      await runTourCaptures(browser, ids);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
