from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
import json,io,hashlib
repo=Path(__file__).resolve().parents[1]
import os
os.chdir(repo)
out=Path('design-demos/birthday-sky-pitch');out.mkdir(exist_ok=True);reports=[]
def drag(client,page,x,y,dx,dy):
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for i in range(1,9):client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx*i/8,'y':y+dy*i/8}]});page.wait_for_timeout(20)
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(400)
with sync_playwright() as p:
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for width,height,mobile in [(390,844,True),(320,568,True),(1440,900,False)]:
  c=b.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=mobile,device_scale_factor=2);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3192/');page.locator('[data-model-state="ready"]').wait_for(timeout=120000)
  assert page.locator('.birthday-extra-stars>i').count()==28
  region=page.locator('.birthday-canvas');box=region.bounding_box();sky=page.locator('.birthday-extra-stars').bounding_box();clip={'x':sky['x']+sky['width']*.08-6,'y':sky['y']+sky['height']*.09-6,'width':12,'height':12}
  a=page.screenshot(clip=clip);page.wait_for_timeout(650);d=page.screenshot(clip=clip);assert ImageChops.difference(Image.open(io.BytesIO(a)),Image.open(io.BytesIO(d))).getbbox(),'extra sky star should twinkle before opening'
  page.screenshot(path=str(out/f'sealed-{width}.png'),full_page=True)
  button=page.get_by_role('button',name='轻点礼盒，打开看看');button.tap() if mobile else button.click();page.locator('.birthday-phase-gift').wait_for();page.wait_for_timeout(4000)
  if mobile:
   client=c.new_cdp_session(page)
   if height>=660:
    assert page.locator('canvas').evaluate('(e)=>e.style.touchAction')=='none'
    drag(client,page,box['width']*.45,box['height']*.4,0,150);assert abs(float(region.get_attribute('data-view-pitch')))==7
    drag(client,page,box['width']*.45,box['height']*.7,0,-180);assert abs(float(region.get_attribute('data-view-pitch')))==7
    assert page.evaluate('scrollY')==0
   else:
    assert page.locator('canvas').evaluate('(e)=>e.style.touchAction')=='pan-y';drag(client,page,box['width']*.4,box['height']*.7,0,-130);assert page.evaluate('scrollY')>0
  page.evaluate('scrollTo(0,0)');region.focus()
  region.evaluate("e=>{for(let i=0;i<18;i++)e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}))}")
  page.wait_for_timeout(150);assert float(region.get_attribute('data-view-pitch'))==-7
  region.evaluate("e=>{for(let i=0;i<25;i++)e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))}")
  page.wait_for_timeout(150);assert float(region.get_attribute('data-view-pitch'))==7
  region.evaluate('(e)=>e.blur()');page.screenshot(path=str(out/f'opened-{width}.png'),full_page=True)
  assert page.get_by_text('To 丫丫',exact=True).is_visible();assert page.locator('.birthday-extra-stars').evaluate("layer=>{const b=layer.getBoundingClientRect(),note=document.querySelector('.birthday-inline-letter').getBoundingClientRect();return [...layer.children].every(e=>{if(e.style.visibility==='hidden')return true;const r=e.getBoundingClientRect();return !(r.x>=note.left&&r.x<=note.right&&r.y>=note.top&&r.y<=note.bottom)})}");assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');assert not errors,errors
  reports.append({'viewport':[width,height],'extraStars':28,'sealedTwinkle':True,'pitchDegrees':7,'touchVerticalRotation':mobile and height>=660,'shortScreenScroll':mobile and height<660,'errors':errors});print(json.dumps(reports[-1]),flush=True);c.close()
 b.close()
assert hashlib.sha256(Path('public/birthday/birthday.glb').read_bytes()).hexdigest()=='1da4cb77d6b0a9a1f5a572f9525f49486d2c19c4e73413fc75e1a1e07ec1b68d'
(out/'qa-report.json').write_text(json.dumps({'checks':reports,'modelUnchanged':True,'physicalDeviceTested':False},ensure_ascii=False,indent=2))
