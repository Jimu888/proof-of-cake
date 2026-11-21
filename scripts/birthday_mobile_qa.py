from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'design-demos/birthday-mobile';root.mkdir(exist_ok=True);reports=[]
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for width,height in [(320,568),(360,640),(390,844),(430,932),(667,375),(844,390),(768,1024),(1440,900)]:
  mobile=width<1000;context=browser.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=mobile,device_scale_factor=2 if mobile else 1)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3192/');page.locator('[data-model-state="ready"]').wait_for(timeout=120000)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,height,'overflow')
  page.get_by_role('button',name='轻点礼盒，打开看看').tap() if mobile else page.get_by_role('button',name='轻点礼盒，打开看看').click()
  page.locator('.birthday-phase-gift').wait_for();page.wait_for_timeout(3500)
  letter=page.locator('.birthday-inline-letter');box=letter.bounding_box();stage=page.locator('.birthday-stage').bounding_box();assert box['y']>=0 and box['y']+box['height']<=stage['height']+1,(width,height,box,stage)
  if mobile:
   idle_ratio=float(page.locator('canvas').get_attribute('data-pixel-ratio'));assert idle_ratio>1.25
   region=page.locator('.birthday-canvas').bounding_box();client=context.new_cdp_session(page);x=region['x']+region['width']*.45;y=region['y']+region['height']*.5
   client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});assert float(page.locator('canvas').get_attribute('data-pixel-ratio'))<=1.25
   for i in range(1,9):client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+i*12,'y':y+2}]});page.wait_for_timeout(20)
   client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(150)
   angle=float(page.locator('.birthday-canvas').get_attribute('data-view-angle'));assert abs(angle)>1,(width,height,'touch drag did not rotate',angle)
   if height<660 and width<height:
    page.evaluate('scrollTo(0,0)');client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y+70}]})
    for i in range(1,9):client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+70-i*16}]});page.wait_for_timeout(30)
    client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(150)
    assert page.evaluate('scrollY')>0,(width,height,'vertical scroll trapped')
  assert not errors,errors
  page.evaluate('scrollTo(0,document.documentElement.scrollHeight)');page.screenshot(path=str(root/f'mobile-{width}x{height}.png'),full_page=True)
  reports.append({'viewport':[width,height],'mobile':mobile,'touchDrag':mobile,'noOverflow':True,'readableLetter':True,'errors':errors});print(json.dumps(reports[-1]),flush=True);context.close()
 browser.close()
(root/'qa-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
