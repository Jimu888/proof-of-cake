import {build} from 'esbuild';
import {mkdir,cp,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'delivery/birthday-demo');
try{process.loadEnvFile(resolve(root,'.env.local'));}catch(e){if(e.code!=='ENOENT')throw e;}
const fields=['TITLE','RECIPIENT','SENDER','MESSAGE'];
const define={'process.env.NODE_ENV':JSON.stringify('production')};
for(const f of fields)define['process.env.NEXT_PUBLIC_BIRTHDAY_'+f]=JSON.stringify(process.env['NEXT_PUBLIC_BIRTHDAY_'+f]||'');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await build({entryPoints:[resolve(root,'scripts/birthday-export-entry.tsx')],outdir:out,bundle:true,minify:true,splitting:true,format:'esm',target:['safari16','chrome110'],jsx:'automatic',external:['/cryptogift/*'],define,entryNames:'app',chunkNames:'chunks/[name]-[hash]',legalComments:'eof'});
const css=await readFile(resolve(out,'app.css'),'utf8');await writeFile(resolve(out,'app.css'),css.replaceAll('/cryptogift/','./assets/shell/'));
await cp(resolve(root,'public/birthday'),resolve(out,'assets/model'),{recursive:true});
await mkdir(resolve(out,'assets/shell'),{recursive:true});
for(const f of ['gift.png','gift-open.png','hero.png','hanken.ttf','teko.ttf'])await cp(resolve(root,'public/cryptogift',f),resolve(out,'assets/shell',f));
await writeFile(resolve(out,'index.html'),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#080908"><meta name="robots" content="noindex,nofollow"><title>一份送给你的生日礼物 · Mement</title><meta name="description" content="为一个特别的日子，留住一个小世界。"><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><noscript>请开启 JavaScript 以打开这份三维生日礼物。</noscript><script type="module" src="./app.js"></script></body></html>');
await writeFile(resolve(out,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, nofollow\n/assets/*\n  Cache-Control: public, max-age=3600\n');
await writeFile(resolve(out,'LICENSES.txt'),await readFile(resolve(root,'node_modules/three/LICENSE'),'utf8')+'\n\n'+await readFile(resolve(root,'node_modules/react/LICENSE'),'utf8')+'\n\n'+await readFile(resolve(root,'public/cryptogift/FONT-LICENSES.txt'),'utf8'));
console.log('Independent birthday demo prepared: '+out);console.log('Model bytes: '+(await stat(resolve(out,'assets/model/birthday.glb'))).size);
