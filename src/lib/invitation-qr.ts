export async function drawInvitationQr(ctx: CanvasRenderingContext2D, url: string, y: number, size = 220, language = 'en') {
  const { default: QRCode } = await import('qrcode');
  const options = { errorCorrectionLevel: 'M' as 'M' | 'L' };
  let code;
  try { code = QRCode.create(url, options); }
  catch { options.errorCorrectionLevel = 'L'; code = QRCode.create(url, options); }
  // Use whole-pixel modules and a four-module quiet zone in the downloadable PNG.
  const width = Math.max(1, Math.floor(size / (code.modules.size + 8))) * (code.modules.size + 8);
  const image = new Image();
  image.src = await QRCode.toDataURL(url, {
    ...options, margin: 4, width,
    color: { dark: '#101520', light: '#f2f2ef' },
  });
  await image.decode();
  ctx.drawImage(image, Math.round((ctx.canvas.width - width) / 2), y);
  ctx.fillStyle = '#b6b8c0';
  ctx.font = '400 21px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(language === 'zh' ? '扫描二维码启封礼物 · 无需登录钱包' : 'Scan to open your gift · No wallet login required', ctx.canvas.width / 2, y + width + 38);
}
