from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]/'design-demos/round-2'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(permissions=['clipboard-read','clipboard-write'])
 for name in ['existence','only-you','specimen-garden']:
  errors=[];page=ctx.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda msg:errors.append(msg.text) if msg.type=='error' else None)
  for width,height in [(320,812),(375,812),(768,1024),(1280,800),(1440,900),(1920,1080)]:
   page.set_viewport_size({'width':width,'height':height});page.goto(f'http://127.0.0.1:3188/round-2/{name}.html');page.evaluate('document.fonts.ready');page.wait_for_timeout(1150)
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(name,width)
   assert page.locator('#main-recipient').is_visible()
   if width==1280:
    box=page.locator('[data-prepare]').bounding_box();assert box['y']+box['height']<=800,(name,'desktop CTA outside fold',box)
   if width in [375,1440]:
    suffix='desktop' if width==1440 else 'mobile';page.screenshot(path=str(ROOT/f'screenshots/{name}-{suffix}.png'),full_page=True)
    # Core task works both on mobile and desktop, independent of the artistic layout.
    page.locator('#main-recipient').fill('Satoshi.ai');page.locator('[data-prepare]').click()
    assert page.locator('#recipient').input_value()=='Satoshi.ai'
    page.locator('#recipient').fill('bad<>');page.get_by_role('button',name='预览这份心意',exact=True).click()
    assert page.locator('#recipient').get_attribute('aria-invalid')=='true'
    page.locator('#recipient').fill('Satoshi.ai');page.locator('#blessing').select_option('wild');page.get_by_role('button',name='预览这份心意',exact=True).click()
    assert page.locator('#dialog-heading').inner_text()=='给 satoshi.ai。'
    assert '尚未铸造或送达' in page.locator('.receipt').inner_text()
    if width==1440:page.screenshot(path=str(ROOT/f'screenshots/{name}-gift.png'))
    page.get_by_role('button',name='复制预览链接',exact=True).click();link=page.evaluate('navigator.clipboard.readText()');assert 'to=satoshi.ai' in link
    page.keyboard.press('Escape');assert not page.locator('dialog').is_visible()
    if name=='specimen-garden':
     page.locator('[data-select="1"]').click();assert page.locator('[data-title]').inner_text()=='Wild wish'
    elif name=='only-you':
     before=page.locator('[data-feature-image]').get_attribute('src');page.locator('[data-next]').click();assert page.locator('[data-feature-image]').get_attribute('src')!=before
    else:
     page.locator('[data-choose-open]').click();page.locator('[data-choose="2"]').click();assert page.locator('[data-title]').inner_text()=='Little sun'
   results.append({'page':name,'width':width,'overflow':False,'fonts':page.evaluate('document.fonts.status')})
  if name=='specimen-garden':
   page.set_viewport_size({'width':1440,'height':900});page.reload();el=page.locator('[data-draggable]').first;box=el.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+60,box['y']+box['height']/2+35,steps=10);page.mouse.up();assert el.get_attribute('style') is not None
  page.goto(f'http://127.0.0.1:3188/round-2/{name}.html?gift=0&to=satoshi.ai&wish=orbit');assert page.locator('dialog').is_visible();page.keyboard.press('Escape')
  page.emulate_media(reduced_motion='reduce');assert page.locator('.app').is_visible()
  assert not errors,(name,errors)
  page.close()
 b.close()
(ROOT/'qa-report.json').write_text(json.dumps({'viewports':results,'checks':['invalid input','normalized recipient','gift preview','clipboard share','direct preview URL','artwork switching','specimen drag','reduced motion','desktop action visible at 1280x800'],'consoleErrors':[],'scope':'Static design prototypes only; no real identity, payment or NFT.'},ensure_ascii=False,indent=2)+'\n')
print('Round 2 passed: three prototypes, six screen sizes, desktop fold, input/preview/share/switch/drag and reduced motion; no console errors.')
