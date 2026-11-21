import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 repo=Path(__file__).resolve().parents[1]
 import os
 os.chdir(repo)
 async with async_playwright() as p:
  browser=await p.chromium.launch(args=['--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  page=await context.new_page();await page.add_init_script("""window.__giftDrawCalls=0;for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type)for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=type.prototype[name];if(original)type.prototype[name]=function(...args){window.__giftDrawCalls++;return original.apply(this,args)}}""");release=asyncio.Event();requests=[]
  async def hold(route):
   requests.append(route.request.url);await release.wait();await route.continue_()
  await page.route('**/birthday.glb*',hold)
  await page.goto('http://127.0.0.1:3192/',wait_until='domcontentloaded')
  await page.locator('.birthday-preload-note').wait_for();await page.get_by_role('button',name='轻点礼盒，打开看看').tap();await page.wait_for_timeout(1800)
  assert await page.locator('.birthday-wait-dots').is_visible();release.set();await page.locator('[data-model-state="ready"]').wait_for(timeout=120000);await page.locator('.birthday-phase-gift').wait_for();await page.wait_for_timeout(4000)
  halos=page.locator('.birthday-touch-star-glows>span');assert await halos.count()==34
  visible=page.locator('.birthday-touch-star-glows>span[style*="display: block"]').first
  before=await visible.evaluate('(e)=>getComputedStyle(e,"::before").opacity');await page.wait_for_timeout(500);after=await visible.evaluate('(e)=>getComputedStyle(e,"::before").opacity');assert before!=after,(before,after)
  assert len(requests)==1,('model downloaded twice',requests)
  draws=await page.evaluate('window.__giftDrawCalls');await page.wait_for_timeout(800);assert await page.evaluate('window.__giftDrawCalls')==draws,'Static world should not redraw to twinkle stars'
  region=await page.locator('.birthday-canvas').bounding_box();client=await context.new_cdp_session(page);x=region['width']*.45;y=region['height']*.5
  await client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for i in range(1,5):await client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+i*18,'y':y+2}]});await page.wait_for_timeout(20)
  await client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await page.wait_for_timeout(100);assert abs(float(await page.locator('.birthday-canvas').get_attribute('data-view-angle')))>1
  await page.screenshot(path='design-demos/birthday-mobile/final-mobile-390.png',full_page=True)
  await context.close()
  context=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=await context.new_page();await page.route('**/birthday.glb*',lambda route:route.abort())
  await page.goto('http://127.0.0.1:3192/');await page.locator('[data-model-state="error"]').wait_for(timeout=30000);await page.get_by_role('button',name='轻点礼盒，打开看看').tap();await page.locator('.birthday-phase-gift').wait_for();await page.locator('.birthday-fallback').wait_for();await page.wait_for_timeout(3500)
  assert await page.get_by_text('To 丫丫',exact=True).is_visible();await page.screenshot(path='design-demos/birthday-mobile/network-fallback.png',full_page=True)
  await browser.close()
  result={'slowLoadingFeedback':True,'singleModelRequest':True,'mobileHalosAnimate':True,'noIdleWorldRedraw':True,'finalTouchDrag':True,'networkFailureFallback':True,'physicalDeviceTested':False,'webkit':'installed engine failed to launch (Bus error), not verified'}
  Path('design-demos/birthday-mobile/loading-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result))
asyncio.run(main())
