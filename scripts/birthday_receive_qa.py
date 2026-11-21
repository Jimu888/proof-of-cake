from playwright.sync_api import sync_playwright
from pathlib import Path
import json,io,math,struct
from PIL import Image,ImageChops
repo=Path(__file__).resolve().parents[1]
root=repo/'design-demos/birthday-motion';(root/'screenshots').mkdir(parents=True,exist_ok=True);result=[]
raw=(repo/'public/birthday/birthday.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+n]);meta=json.loads((repo/'public/birthday/scene.json').read_text())
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(a):return [v/math.sqrt(dot(a,a)) for v in a]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def star_clip(box):
 cam=meta['camera'];forward=norm(sub(meta['target'],cam));right=norm(cross(forward,[0,1,0]));up=cross(right,forward);aspect=box['width']/box['height'];tan=math.tan(math.radians(meta['fov']*1.08)/2)/min(aspect,1)
 for node in gltf['nodes']:
  if 'Birthday Star' not in node.get('name',''):continue
  accessor=gltf['accessors'][gltf['meshes'][node['mesh']]['primitives'][0]['attributes']['POSITION']];pos=[(a+b)/2 for a,b in zip(accessor['min'],accessor['max'])];v=sub(pos,cam);z=dot(v,forward);x=(1+dot(v,right)/(z*tan*aspect))*box['width']/2;y=(1-dot(v,up)/(z*tan))*box['height']/2
  if 18<x<box['width']*.2 and 25<y<box['height']*.75:return {'x':box['x']+x-16,'y':box['y']+y-16,'width':32,'height':32}
 raise AssertionError('No isolated star found')
with sync_playwright() as p:
 b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
 for url,width,height in [('http://127.0.0.1:3190/receive',1440,1000),('http://127.0.0.1:3190/receive',390,844),('http://127.0.0.1:3191/',390,844)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url);page.evaluate('document.fonts.ready');page.locator('[data-model-state="ready"]').wait_for(timeout=120000);page.wait_for_timeout(400)
  assert not page.get_by_text('有一个小世界，想送给你。',exact=True).count();assert not page.get_by_text('惊喜，正在展开。',exact=True).count();assert not page.locator('.birthday-minimal-title').count()
  clip=star_clip(page.locator('canvas').bounding_box());a=page.screenshot(clip=clip);page.wait_for_timeout(650);c=page.screenshot(clip=clip);assert ImageChops.difference(Image.open(io.BytesIO(a)),Image.open(io.BytesIO(c))).getbbox() is not None,'star area should animate before opening'
  label='static' if '3191' in url else 'next';page.screenshot(path=str(root/f'screenshots/sealed-{width}-{label}.png'))
  if width==1440:page.mouse.move(width*.2,height*.2);page.wait_for_timeout(70);assert float(page.locator('.birthday-cursor-aura').evaluate('(e)=>e.style.opacity'))==1
  page.get_by_role('button',name='轻点礼盒，打开看看').click();page.locator('.birthday-phase-gift').wait_for(timeout=10000);page.wait_for_timeout(3700)
  assert page.get_by_text('To 丫丫',exact=True).is_visible();assert page.locator('.birthday-letter-signature').inner_text()=='— jimu.ai';assert page.locator('main').get_by_role('button').count()==0;assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  hint=page.locator('.birthday-drag-hint').bounding_box();assert abs((hint['x']+hint['width']/2)-width/2)<2
  for sel in ['.birthday-inline-letter','.birthday-drag-hint']:
   q=page.locator(sel).bounding_box();assert q['y']>=0 and q['y']+q['height']<=height+1,(width,sel,q)
  region=page.locator('.birthday-canvas');region.focus()
  for _ in range(10):page.keyboard.press('ArrowUp')
  page.wait_for_timeout(150);assert float(region.get_attribute('data-view-pitch'))==-7
  for _ in range(20):page.keyboard.press('ArrowDown')
  page.wait_for_timeout(150);assert float(region.get_attribute('data-view-pitch'))==7
  region.evaluate('(e)=>e.blur()');page.screenshot(path=str(root/f'screenshots/world-{width}-{label}.png'),full_page=True)
  assert not errors,errors
  result.append({'url':url,'width':width,'starsAnimateBeforeOpening':True,'pitchRange7Degrees':True,'noUnwantedCopy':True,'centeredHint':True,'letterWithTo':True,'errors':errors});page.close()
 for mode in ['dissolve','push']:
  page=b.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce');page.goto('http://127.0.0.1:3191/?reveal='+mode);page.locator('[data-model-state="ready"]').wait_for(timeout=120000);page.get_by_role('button',name='轻点礼盒，打开看看').click();page.locator('.birthday-phase-gift').wait_for();page.wait_for_timeout(200);assert page.get_by_text('To 丫丫',exact=True).is_visible();result.append({'alternative':mode,'opens':True});page.close()
 b.close()
(root/'qa-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
