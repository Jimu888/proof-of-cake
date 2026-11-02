from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'design-demos/birthday-release'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for base,width,height in [('http://127.0.0.1:3190/receive',1440,1000),('http://127.0.0.1:3190/receive',390,844),('http://127.0.0.1:3191/',390,844)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');errors=[];failed=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 else None)
  page.goto(base);page.evaluate('document.fonts.ready');page.screenshot(path=str(root/(f'screenshots/sealed-{width}-'+('static' if '3191' in base else 'next')+'.png')))
  page.get_by_role('button',name='打开你的礼物').click();page.locator('[data-model-state="ready"]').wait_for(timeout=120000);page.wait_for_timeout(2500)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert page.locator('canvas').is_visible()
  canvas=page.locator('canvas');before=canvas.screenshot();r=canvas.bounding_box();page.mouse.move(r['x']+r['width']*.45,r['y']+r['height']*.5);page.mouse.down();page.mouse.move(r['x']+r['width']*.65,r['y']+r['height']*.5,steps=12);page.mouse.up();page.wait_for_timeout(300);assert before!=canvas.screenshot()
  page.get_by_role('button',name='复位',exact=True).click();page.wait_for_timeout(400)
  label='static' if '3191' in base else 'next';
  if width==1440:canvas.screenshot(path=str(root.parents[1]/'public/birthday/poster.png'))
  page.screenshot(path=str(root/f'screenshots/world-{width}-{label}.png'),full_page=True)
  page.get_by_role('button',name='有几句话',exact=False).click();assert page.get_by_role('dialog').is_visible();page.keyboard.press('Escape');assert not page.get_by_role('dialog').is_visible()

  assert not errors,errors;assert not failed,failed
  results.append({'url':base,'width':width,'modelLoaded':True,'dragChangesRender':True,'noteDialog':True,'errors':errors,'failedRequests':failed});page.close()
 b.close()
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader']);page=b.new_page();page.goto('http://127.0.0.1:3191/');page.get_by_role('button',name='打开你的礼物').click();page.locator('[data-model-state="ready"]').wait_for(timeout=120000);page.get_by_role('button',name='全屏欣赏',exact=False).click();page.wait_for_timeout(300);assert page.evaluate('!!document.fullscreenElement') or page.locator('.is-expanded').count();results.append({'fullscreen':'passed in isolated browser'});b.close()
(root/'qa-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results))
