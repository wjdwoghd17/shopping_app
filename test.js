const { chromium } = require('playwright');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let passed = 0, failed = 0;
  const results = [];

  function ok(label, val) {
    const icon = val ? '✅' : '❌';
    results.push(`${icon} ${label}`);
    if (val) passed++; else failed++;
  }

  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');

  const emptyMsg = await page.locator('.empty').isVisible();
  ok('초기 상태: 빈 메시지 표시', emptyMsg);

  await page.fill('#itemInput', '사과');
  await page.click('#addBtn');
  const items1 = await page.locator('.item').count();
  ok('아이템 추가 (버튼): 목록에 1개 표시', items1 === 1);

  const text1 = await page.locator('.item-text').first().textContent();
  ok('추가된 텍스트 일치: "사과"', text1?.trim() === '사과');

  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');
  await page.fill('#itemInput', '우유');
  await page.press('#itemInput', 'Enter');
  const items3 = await page.locator('.item').count();
  ok('Enter 키로 추가: 총 3개', items3 === 3);

  await page.fill('#itemInput', '   ');
  await page.click('#addBtn');
  const itemsAfterBlank = await page.locator('.item').count();
  ok('빈 입력 무시: 여전히 3개', itemsAfterBlank === 3);

  const summary = await page.locator('#summary').textContent();
  ok('요약 카운트 표시 (전체 3개)', summary?.includes('3'));

  const firstCb = page.locator('.item input[type="checkbox"]').first();
  await firstCb.check();
  const isDone = await page.locator('.item.done').count();
  ok('체크 시 .done 클래스 적용', isDone === 1);

  const summaryAfterCheck = await page.locator('#summary').textContent();
  ok('체크 후 요약 "완료 1개" 포함', summaryAfterCheck?.includes('완료 1'));

  const clearVisible = await page.locator('#clearBtn').isVisible();
  ok('완료 항목 있으면 "완료 항목 모두 삭제" 버튼 표시', clearVisible);

  await firstCb.uncheck();
  const doneAfterUncheck = await page.locator('.item.done').count();
  ok('체크 해제 시 .done 제거', doneAfterUncheck === 0);

  await page.locator('.del-btn').first().click();
  const itemsAfterDel = await page.locator('.item').count();
  ok('개별 삭제 후 2개 남음', itemsAfterDel === 2);

  await page.locator('.item input[type="checkbox"]').first().check();
  await page.locator('#clearBtn').click();
  const itemsAfterClear = await page.locator('.item').count();
  ok('완료 항목 일괄 삭제 후 1개 남음', itemsAfterClear === 1);

  await page.reload();
  const itemsAfterReload = await page.locator('.item').count();
  ok('페이지 새로고침 후 localStorage 유지 (1개)', itemsAfterReload === 1);

  await page.locator('.del-btn').first().click();
  const emptyAfterAll = await page.locator('.empty').isVisible();
  ok('모든 항목 삭제 시 빈 메시지 복귀', emptyAfterAll);

  console.log('\n=== Playwright 테스트 결과 ===\n');
  results.forEach(r => console.log(r));
  console.log(`\n총 ${passed + failed}개 중 통과: ${passed}, 실패: ${failed}`);
  if (failed === 0) console.log('\n✅ 모든 테스트 통과!');
  else console.log('\n❌ 일부 테스트 실패');

  await new Promise(r => setTimeout(r, 1500));
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
