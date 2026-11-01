from playwright.sync_api import sync_playwright
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'design-demos/round-7-implementation'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for width,height in [(1440,1000),(768,1024),(390,844),(320,740)]:
  page=b.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:3190'); page.evaluate('document.fonts.ready');page.wait_for_timeout(400)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('home',width)
  assert page.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.complete&&i.naturalWidth>0)')
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/home-{width}.png'),full_page=True)
  page.locator('.art-card').first.click()
  page.get_by_role('button',name='定制这份礼物').click()
  page.locator('#message').fill('愿你在更大的世界里，一直保持好奇。')
  page.get_by_role('button',name='下一步',exact=True).click()
  page.get_by_role('button',name='预览收礼体验').click()
  assert page.locator('#recipient-error').is_visible()
  page.locator('#recipient').fill('curiosity.ai')
  page.get_by_role('button',name='预览收礼体验').click()
  page.wait_for_url('**/receive')
  assert 'curiosity.ai' in page.locator('.unbox-copy').inner_text()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('receive',width)
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/sealed-{width}.png'))
  page.get_by_role('button',name='点击打开').click()
  page.get_by_role('button',name='查看礼物',exact=True).wait_for()
  page.get_by_role('button',name='查看礼物',exact=True).click()
  assert page.get_by_text('演示预览 · 未上链',exact=True).is_visible()
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/detail-{width}.png'),full_page=True)
  page.get_by_role('button',name='读一读 TA 的留言').click()
  assert page.locator('.letter p').inner_text()=='愿你在更大的世界里，一直保持好奇。'
  page.get_by_role('button',name='收藏这份心意').click()
  assert page.get_by_role('button',name='已收藏这份心意').is_visible()
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/letter-{width}.png'),full_page=True)
  assert not errors,errors
  results.append({'width':width,'flow':'pass','overflow':False,'consoleErrors':errors})
  page.close()
 b.close()
(root/'qa-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps(results))
