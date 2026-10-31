from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1] / 'design-demos'
report=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 ctx=b.new_context(permissions=['clipboard-read','clipboard-write'])
 for i in range(1,4):
  errors=[]
  page=ctx.new_page(); page.on('pageerror',lambda e: errors.append(str(e)))
  page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
  for width,height in [(1440,900),(768,1024),(375,812)]:
   page.set_viewport_size({'width':width,'height':height})
   page.goto(f'http://127.0.0.1:3188/dir-{i}.html')
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(i,width,'overflow')
   suffix='desktop' if width==1440 else 'tablet' if width==768 else 'mobile'
   page.screenshot(path=str(root/f'screenshots/dir-{i}-{suffix}.png'),full_page=True)
   if width==1440:page.screenshot(path=str(root/f'screenshots/dir-{i}-first.png'))
   page.locator('[data-gift]:visible').first.click()
   page.locator('#recipient').fill('bad!')
   page.get_by_role('button',name='预览这份礼物',exact=True).click()
   assert page.locator('#recipient').get_attribute('aria-invalid')=='true'
   page.locator('#recipient').fill('Satoshi.ai')
   page.locator('#blessing').select_option('encounter')
   page.get_by_role('button',name='预览这份礼物',exact=True).click()
   assert page.locator('#gift-heading').inner_text()=='satoshi.ai，生日快乐。'
   assert page.locator('blockquote').inner_text()=='很高兴在这个世界遇见你。'
   assert '尚未铸造' in page.locator('.receipt').inner_text()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   if width==1440:page.screenshot(path=str(root/f'screenshots/dir-{i}-gift-preview.png'))
   page.keyboard.press('Escape');assert not page.locator('dialog').is_visible()
   page.get_by_role('button',name='星座',exact=True).click()
   assert page.locator('[data-category]:visible').count()==1
   page.locator('[data-wallet]:visible').click()
   assert 'jimu.ai' in page.locator('[data-wallet]:visible').inner_text()
   report.append({'direction':i,'width':width,'overflow':False,'gift_preview':'pass','invalid_input':'pass','filter':'pass','demo_identity':'pass'})
  # Validate a direct shared preview using only whitelisted IDs and normalized recipient.
  page.goto(f'http://127.0.0.1:3188/dir-{i}.html?preview=2&to=satoshi.ai&blessing=memory')
  assert page.locator('dialog').is_visible()
  assert page.locator('#gift-heading').inner_text()=='satoshi.ai，生日快乐。'
  page.get_by_role('button',name='复制预览链接',exact=True).click()
  copied=page.evaluate('navigator.clipboard.readText()')
  assert 'preview=2' in copied and 'to=satoshi.ai' in copied
  page.keyboard.press('Escape')
  page.locator('[data-shelf]:visible').first.click()
  assert '还没有收藏' in page.locator('.receipt').inner_text()
  assert not errors,errors
  page.close()
 for path in ['index.html','thumbs.html']:
  page=ctx.new_page()
  for width,height in [(1440,1000),(375,812)]:
   page.set_viewport_size({'width':width,'height':height});page.goto(f'http://127.0.0.1:3188/{path}')
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(path,width)
   page.screenshot(path=str(root/f'screenshots/{path.split(".")[0]}-{width}.png'),full_page=True)
  page.close()
 b.close()
(root/'qa-report.json').write_text(json.dumps({'checks':report,'shared_preview':'pass','clipboard_share':'pass','empty_collection':'pass','console_errors':[],'viewports':[1440,768,375],'scope':'Static prototype only. No wallet, payment, database or NFT integration.'},ensure_ascii=False,indent=2)+'\n')
print('Passed: 3 directions × 3 viewports, input validation, gift preview, filters, demo identity, direct share, clipboard, empty collection; no page errors or horizontal overflow.')
