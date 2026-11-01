from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'design-demos/round-8-refinement'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for width,height in [(1440,1000),(768,1024),(390,844),(320,740)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:3190/');page.evaluate('document.fonts.ready');page.wait_for_timeout(300)
  assert page.locator('.featured-work').count()==2
  assert page.locator('.tabs').count()==0
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
  page.locator('.creator-details summary').click();assert page.get_by_text('创作者获得主要销售收入。具体比例',exact=False).is_visible()
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/home-{width}.png'),full_page=True)
  page.get_by_role('button',name='旋转礼盒 · 3D',exact=True).click()
  page.locator('[data-renderer="ready"]').wait_for(timeout=25000);page.wait_for_timeout(500)
  canvas=page.locator('canvas');before=canvas.screenshot();bounds=canvas.bounding_box();page.mouse.move(bounds['x']+bounds['width']*.4,bounds['y']+bounds['height']*.5);page.mouse.down();page.mouse.move(bounds['x']+bounds['width']*.7,bounds['y']+bounds['height']*.52,steps=15);page.mouse.up();page.wait_for_timeout(150);assert before!=canvas.screenshot(),'drag should change render'
  page.get_by_role('button',name='复位',exact=True).click()
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/three-{width}.png'))
  page.get_by_role('button',name='返回渲染图',exact=True).click();assert page.locator('canvas').count()==0
  page.locator('.featured-art').first.click();page.get_by_role('button',name='定制这份礼物').click();page.get_by_role('button',name='下一步',exact=True).click();page.locator('#recipient').fill('curiosity.ai');page.get_by_role('button',name='预览收礼体验').click();page.wait_for_url('**/receive');page.get_by_role('button',name='试试三维礼盒',exact=False).click();page.locator('[data-renderer="ready"]').wait_for(timeout=25000);page.get_by_role('button',name='点击打开').click();page.wait_for_timeout(600)
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/open-3d-{width}.png'))
  page.get_by_role('button',name='查看礼物',exact=True).click();assert page.locator('.detail-copy').is_visible()
  page.goto('http://127.0.0.1:3190/brand-lab');page.evaluate('document.fonts.ready');assert page.locator('.logo-direction').count()==5
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('brand',width)
  if width in [1440,390]:page.screenshot(path=str(root/f'screenshots/brands-{width}.png'),full_page=True)
  assert not errors,errors
  results.append({'width':width,'twoWorks':True,'noFilters':True,'threeDrag':True,'threeOpening':True,'logoDirections':5,'runtimeErrors':errors});page.close()
 b.close()
 b=p.chromium.launch(args=['--disable-webgl']);page=b.new_page();page.goto('http://127.0.0.1:3190/');page.get_by_role('button',name='旋转礼盒 · 3D',exact=True).click();page.locator('[data-renderer="fallback"]').wait_for();assert page.locator('.sculpture-fallback img').is_visible();b.close()
results.append({'webglUnavailable':'image fallback passed'})
(root/'qa-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results))
