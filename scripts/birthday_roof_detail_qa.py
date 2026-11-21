from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib
repo=Path(__file__).resolve().parents[1]
import os
os.chdir(repo)
out=Path('design-demos/birthday-roof-detail');out.mkdir(exist_ok=True);reports=[]
def pinch(client,page,cx,cy,start,end):
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cx-start/2,'y':cy,'id':1},{'x':cx+start/2,'y':cy,'id':2}]})
 assert float(page.locator('canvas').get_attribute('data-pixel-ratio'))<=1.25
 for i in range(1,9):
  gap=start+(end-start)*i/8;client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':cx-gap/2,'y':cy,'id':1},{'x':cx+gap/2,'y':cy,'id':2}]});page.wait_for_timeout(25)
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(500)
with sync_playwright() as p:
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for width,height in [(390,844),(320,568),(844,390),(1440,900)]:
  mobile=width<1000;c=b.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=mobile,device_scale_factor=3 if mobile else 2);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3192/');page.locator('[data-model-state="ready"]').wait_for(timeout=120000);button=page.get_by_role('button',name='轻点礼盒，打开看看');button.tap() if mobile else button.click();page.locator('.birthday-phase-gift').wait_for();page.wait_for_timeout(4000)
  ratio=float(page.locator('canvas').get_attribute('data-pixel-ratio'));assert ratio>1.25,(width,ratio)
  region=page.locator('.birthday-canvas');box=region.bounding_box()
  if mobile:
   client=c.new_cdp_session(page);pinch(client,page,box['width']/2,box['height']/2,70,200);zoom=float(region.get_attribute('data-view-zoom'));assert 1.25<zoom<=1.68,(width,zoom)
   assert float(page.locator('canvas').get_attribute('data-pixel-ratio'))==ratio
   assert page.get_by_text('轻拖换个角度 · 双指放大看细节',exact=True).is_visible()
   page.screenshot(path=str(out/f'zoomed-{width}x{height}.png'),full_page=True)
   pinch(client,page,box['width']/2,box['height']/2,200,50);assert float(region.get_attribute('data-view-zoom'))==1
  else:
   region.focus();page.keyboard.press('Equal');page.wait_for_timeout(300);assert float(region.get_attribute('data-view-zoom'))>1
   page.mouse.move(box['width']/2,box['height']/2);page.mouse.wheel(0,-1000);page.wait_for_timeout(400);assert float(region.get_attribute('data-view-zoom'))>1.25
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');assert not errors,errors
  reports.append({'viewport':[width,height],'mobile':mobile,'idlePixelRatio':ratio,'detailZoom':True,'qualityRestored':True,'noPageErrors':True});print(json.dumps(reports[-1]),flush=True);c.close()
 b.close()
sha=hashlib.sha256(Path('public/birthday/birthday.glb').read_bytes()).hexdigest();assert sha=='1da4cb77d6b0a9a1f5a572f9525f49486d2c19c4e73413fc75e1a1e07ec1b68d'
(out/'qa-report.json').write_text(json.dumps({'checks':reports,'modelUnchanged':True,'modelSHA256':sha,'physicalDeviceTested':False},ensure_ascii=False,indent=2))
