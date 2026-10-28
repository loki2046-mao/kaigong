import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const sizes = [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 568 }];
const names = ['Loki', '龘𠮷曌', '十六个字的玩家姓名测试完整展示用', ''];
const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const size of sizes) {
  const page = await browser.newPage({ viewport: size });
  await page.goto('http://127.0.0.1:8766/camp.html');
  for (const name of names) for (let chapter = 0; chapter < 12; chapter += 1) {
    await page.evaluate(async ({ name, chapter }) => {
      const { renderDecree } = await import('/ceremony-ui.mjs');
      renderDecree(document.querySelector('#chapter-decree'), { name }, chapter);
      (await import('/report-pages.mjs')).prepareReport();
      const dialog = document.querySelector('#result-dialog');
      if (!dialog.open) dialog.showModal();
      await document.fonts.ready;
    }, { name, chapter });
    await page.waitForFunction(() => !document.querySelector('.decree-loading'));
    const state = await page.evaluate(() => {
      const dialog = document.querySelector('#result-dialog');
      const paper = document.querySelector('.decree-sheet');
      const body = document.querySelector('.decree-body');
      return {
        dialogX: dialog.scrollWidth - dialog.clientWidth,
        paperX: paper.scrollWidth - paper.clientWidth,
        paperY: paper.scrollHeight - paper.clientHeight,
        bodyX: body.scrollWidth - body.clientWidth,
        bodyY: body.scrollHeight - body.clientHeight,
        font: document.fonts.check('20px DecreeScript', paper.textContent),
        writing: getComputedStyle(body).writingMode,
      };
    });
    assert.ok(state.dialogX <= 2 && state.paperX <= 2 && state.paperY <= 2, JSON.stringify({ size, name, chapter, state }));
    assert.ok(state.bodyX <= 2 && state.bodyY <= 2, JSON.stringify({ size, name, chapter, state }));
    assert.equal(state.font, true, JSON.stringify({ size, name, chapter, state }));
    assert.equal(state.writing, 'vertical-rl', JSON.stringify({ size, name, chapter, state }));
  }
  console.log('48 gaoshen cases passed', size);
  await page.close();
}
await browser.close();
