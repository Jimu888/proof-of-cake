import Cocoa
import WebKit

final class DraggableWebView: WKWebView {
    private var dragOrigin: NSPoint = .zero
    private var windowOrigin: NSPoint = .zero
    private var didDrag = false

    override func mouseDown(with event: NSEvent) {
        didDrag = false
        dragOrigin = NSEvent.mouseLocation
        windowOrigin = window?.frame.origin ?? .zero
        super.mouseDown(with: event)
    }

    override func mouseDragged(with event: NSEvent) {
        guard let win = window else { return }
        let cur = NSEvent.mouseLocation
        let dx = cur.x - dragOrigin.x
        let dy = cur.y - dragOrigin.y
        if abs(dx) > 2 || abs(dy) > 2 { didDrag = true }
        win.setFrameOrigin(NSPoint(x: windowOrigin.x + dx, y: windowOrigin.y + dy))
    }

    override func mouseUp(with event: NSEvent) {
        if !didDrag {
            super.mouseUp(with: event)
        }
    }
}

final class WidgetAppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
    private var window: NSWindow!
    private var webView: DraggableWebView!
    private var mode = "snow"
    private var floating = false
    private let openUrl = URL(string: "http://127.0.0.1:3194")!

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)

        let width: CGFloat = 348
        let height: CGFloat = 158
        let screen = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let origin = NSPoint(x: screen.maxX - width - 38, y: screen.minY + 46)

        window = NSWindow(
            contentRect: NSRect(origin: origin, size: NSSize(width: width, height: height)),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = true
        window.level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)) + 1)
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
        window.isMovableByWindowBackground = true

        // True native macOS frosted glass backing (matches Apple Desktop Widgets)
        let effect = NSVisualEffectView(frame: NSRect(x: 0, y: 0, width: width, height: height))
        effect.material = .hudWindow
        effect.blendingMode = .behindWindow
        effect.state = .active
        effect.wantsLayer = true
        effect.layer?.cornerRadius = 24
        effect.layer?.masksToBounds = true
        effect.layer?.borderWidth = 0.8
        effect.layer?.borderColor = NSColor(white: 1.0, alpha: 0.16).cgColor

        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "mement")
        webView = DraggableWebView(frame: effect.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")

        effect.addSubview(webView)
        window.contentView = effect
        loadWidgetHTML()
        window.orderFrontRegardless()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let action = message.body as? String else { return }
        switch action {
        case "cycle":
            mode = (mode == "snow") ? "bond" : (mode == "bond" ? "capsule" : "snow")
            loadWidgetHTML()
        case "pin":
            floating.toggle()
            window.level = floating
                ? .floating
                : NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)) + 1)
            loadWidgetHTML()
        case "open":
            NSWorkspace.shared.open(openUrl)
        case "quit":
            NSApp.terminate(nil)
        default:
            break
        }
    }

    private func loadWidgetHTML() {
        let isSnow = mode == "snow"
        let isCapsule = mode == "capsule"
        let eyebrow = isCapsule ? "时间胶囊 · 距启封" : (isSnow ? "圣诞初雪约定 · 已相伴" : "区块红线约定 · 已相伴")
        let daysNum = "178"
        let badge = isCapsule ? "1.0 BTC" : (isSnow ? "1 + 1 BNB" : "2.0 BNB")
        let dateNote = isCapsule ? "2027.05.23 启封" : "2027.01.16 启封"
        let parties = isCapsule ? "jimu.ai → 2027" : "oooo.ai × jimu.ai"
        let tint = isSnow
            ? "radial-gradient(circle at 18% 50%, rgba(110, 231, 216, 0.16), transparent 54%), radial-gradient(circle at 92% 14%, rgba(255, 138, 184, 0.16), transparent 48%)"
            : (isCapsule
                ? "radial-gradient(circle at 18% 50%, rgba(255, 214, 130, 0.15), transparent 54%), radial-gradient(circle at 92% 14%, rgba(242, 116, 58, 0.15), transparent 48%)"
                : "radial-gradient(circle at 18% 50%, rgba(242, 116, 58, 0.18), transparent 54%), radial-gradient(circle at 92% 14%, rgba(214, 92, 128, 0.16), transparent 48%)")
        let pinLabel = floating ? "置顶中" : "桌面层"

        let html = """
        <!doctype html>
        <html>
        <head>
        <meta charset="utf-8"/>
        <style>
          * { box-sizing: border-box; user-select: none; -webkit-user-select: none; }
          html, body {
            margin: 0; width: 100%; height: 100%; overflow: hidden;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .card {
            position: relative;
            width: 100%; height: 100%;
            display: grid;
            grid-template-columns: 118px minmax(0, 1fr);
            gap: 14px;
            align-items: center;
            padding: 15px 17px 15px 15px;
            background: \(tint), linear-gradient(155deg, rgba(16, 24, 33, 0.56), rgba(10, 15, 22, 0.68));
            color: #F5F7FA;
            cursor: grab;
          }
          .niche {
            position: relative;
            width: 118px; height: 128px;
            border-radius: 17px;
            border: 1px solid rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 50% 18%, rgba(255,255,255,0.09), transparent 55%),
              linear-gradient(180deg, rgba(14, 24, 32, 0.62), rgba(10, 14, 20, 0.78));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -10px 20px rgba(0,0,0,0.34);
            overflow: hidden;
            cursor: pointer;
          }
          .lamp {
            position: absolute; top: 7px; left: 24%; right: 24%; height: 1.5px; border-radius: 99px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
            box-shadow: 0 0 8px rgba(255,255,255,0.55);
            z-index: 2;
          }
          canvas { display: block; width: 100%; height: 100%; }
          .meta {
            display: flex; flex-direction: column; justify-content: space-between;
            height: 122px; min-width: 0;
          }
          .top {
            display: flex; align-items: center; justify-content: space-between; gap: 6px;
          }
          .brand {
            display: inline-flex; align-items: center; gap: 5px;
            font: 600 9px/1 ui-monospace, SFMono-Regular, monospace;
            letter-spacing: 0.16em; color: rgba(226, 234, 242, 0.66);
          }
          .brand i {
            width: 5px; height: 5px; border-radius: 50%;
            background: #F2743A; box-shadow: 0 0 7px #F2743A;
            animation: live 2.4s ease-in-out infinite;
          }
          @keyframes live { 0%,100% { opacity: 0.65; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.15); } }
          .badge {
            padding: 3px 7px; border-radius: 99px;
            background: rgba(242, 116, 58, 0.15);
            border: 1px solid rgba(242, 116, 58, 0.34);
            font: 600 9.5px/1 ui-monospace, SFMono-Regular, monospace;
            color: #FF9C6D;
            letter-spacing: 0.02em;
          }
          .center { display: grid; gap: 2px; margin-top: 2px; }
          .eyebrow {
            font: 500 10.5px/1.2 -apple-system, "PingFang SC", sans-serif;
            color: rgba(212, 222, 232, 0.72);
            letter-spacing: 0.02em;
          }
          .hero {
            display: flex; align-items: baseline; gap: 5px;
          }
          .hero .num {
            font: 600 35px/1.02 -apple-system, "SF Pro Rounded", sans-serif;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.03em;
            color: #FFFFFF;
          }
          .hero .unit {
            font: 500 13px/1 -apple-system, "PingFang SC", sans-serif;
            color: rgba(235, 240, 245, 0.82);
          }
          .bottom { display: grid; gap: 6px; }
          .bar-row { display: grid; gap: 4px; }
          .bar {
            height: 2.5px; border-radius: 99px;
            background: rgba(255,255,255,0.12); overflow: hidden;
          }
          .bar i {
            display: block; width: 49%; height: 100%; border-radius: 99px;
            background: linear-gradient(90deg, #F2743A, #FFD08A);
            box-shadow: 0 0 8px rgba(242,116,58,0.6);
          }
          .foot {
            display: flex; align-items: center; justify-content: space-between; gap: 6px;
            font: 400 10px/1.1 ui-monospace, SFMono-Regular, monospace;
            color: rgba(220, 229, 238, 0.74);
          }
          .foot .date { color: rgba(188, 200, 212, 0.56); font-size: 9.5px; }
          .tools {
            position: absolute; top: 10px; right: 12px;
            display: flex; gap: 4px;
            opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
            z-index: 5;
          }
          .card:hover .tools { opacity: 1; pointer-events: auto; }
          .card:hover .badge { opacity: 0; }
          .tools button {
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(14, 20, 28, 0.88);
            color: #E2E8EE;
            border-radius: 99px;
            padding: 3px 7px;
            font-size: 9.5px;
            cursor: pointer;
          }
          .tools button:hover { border-color: #F2743A; color: #FFF; }
        </style>
        </head>
        <body>
          <div class="card">
            <div class="niche" title="点击打开 Mement" onclick="window.webkit.messageHandlers.mement.postMessage('open')">
              <span class="lamp"></span>
              <canvas id="art"></canvas>
            </div>
            <div class="meta">
              <div class="top">
                <span class="brand"><i></i>MEMENT</span>
                <span class="badge">\(badge)</span>
              </div>
              <div class="center">
                <span class="eyebrow">\(eyebrow)</span>
                <div class="hero"><span class="num">\(daysNum)</span><span class="unit">天</span></div>
              </div>
              <div class="bottom">
                <div class="bar-row">
                  <div class="bar"><i></i></div>
                </div>
                <div class="foot">
                  <span>\(parties)</span>
                  <span class="date">\(dateNote)</span>
                </div>
              </div>
            </div>
            <div class="tools">
              <button onclick="event.stopPropagation(); window.webkit.messageHandlers.mement.postMessage('cycle')">切换</button>
              <button onclick="event.stopPropagation(); window.webkit.messageHandlers.mement.postMessage('pin')">\(pinLabel)</button>
              <button onclick="event.stopPropagation(); window.webkit.messageHandlers.mement.postMessage('quit')">×</button>
            </div>
          </div>

          <script>
            const MODE = "\(mode)";
            const canvas = document.getElementById('art');
            const ctx = canvas.getContext('2d');
            const dpr = Math.min(window.devicePixelRatio || 2, 2);
            const W = 118, H = 128;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.scale(dpr, dpr);

            function drawStar(x, y, r, color, alpha) {
              ctx.save();
              ctx.translate(x, y);
              ctx.globalAlpha = alpha;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.moveTo(0, -r);
              ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
              ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
              ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
              ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }

            const bokeh = Array.from({ length: 14 }, (_, i) => ({
              a: (i / 14) * Math.PI * 2 + i * 0.37,
              d: 26 + (i % 4) * 9.5,
              r: 1.0 + (i % 3) * 0.65,
              p: i * 1.13,
              sp: 1.1 + (i % 3) * 0.5,
              k: i % 3
            }));

            function renderSnow(t) {
              ctx.clearRect(0, 0, W, H);
              const cx = W / 2, cy = H / 2 + 2 + Math.sin(t * 1.35) * 2.6;

              // Pedestal subtle reflection pool at bottom
              const pool = ctx.createRadialGradient(cx, H - 14, 2, cx, H - 14, 34);
              pool.addColorStop(0, 'rgba(255, 216, 130, 0.28)');
              pool.addColorStop(0.5, 'rgba(110, 231, 216, 0.12)');
              pool.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = pool;
              ctx.beginPath();
              ctx.ellipse(cx, H - 14, 34, 7, 0, 0, Math.PI * 2);
              ctx.fill();

              // Festive twinkling bokeh
              for (const b of bokeh) {
                const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * b.sp + b.p));
                const bx = cx + Math.cos(b.a + t * 0.08) * b.d;
                const by = cy + Math.sin(b.a + t * 0.08) * b.d + Math.sin(t + b.p) * 2;
                if (b.k === 0) {
                  drawStar(bx, by, b.r * 2.4, '#FFD882', 0.6 * pulse);
                } else {
                  ctx.save();
                  ctx.globalAlpha = 0.36 * pulse;
                  ctx.fillStyle = b.k === 1 ? '#6EE7D8' : '#FF8AB8';
                  ctx.beginPath();
                  ctx.arc(bx, by, b.r, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              }

              // Soft aurora halo
              const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48);
              halo.addColorStop(0, 'rgba(255, 216, 130, 0.26)');
              halo.addColorStop(0.45, 'rgba(110, 231, 216, 0.16)');
              halo.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(cx, cy, 48, 0, Math.PI * 2);
              ctx.fill();

              // 12-point faceted snowflake with smooth rotation + 3D tilt breathing
              ctx.save();
              ctx.translate(cx, cy);
              ctx.scale(0.93 + 0.07 * Math.cos(t * 0.85), 1);
              ctx.rotate(t * 0.22);
              ctx.strokeStyle = '#E8FFF9';
              ctx.fillStyle = '#7CEAD8';
              ctx.shadowColor = '#7CEAD8';
              ctx.shadowBlur = 8;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Inner hex rosette
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3 - Math.PI / 2;
                const x = Math.cos(a) * 10.5, y = Math.sin(a) * 10.5;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.globalAlpha = 0.22;
              ctx.fill();
              ctx.globalAlpha = 0.9;
              ctx.lineWidth = 0.9;
              ctx.stroke();

              // 6 primary dendritic fern arms
              for (let i = 0; i < 6; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 3);
                ctx.lineWidth = 1.15;
                ctx.beginPath();
                ctx.moveTo(0, -6); ctx.lineTo(0, -40);
                // 3 tiers of feathery branches
                ctx.moveTo(0, -15); ctx.lineTo(-9, -23); ctx.moveTo(0, -15); ctx.lineTo(9, -23);
                ctx.moveTo(0, -24); ctx.lineTo(-11, -33); ctx.moveTo(0, -24); ctx.lineTo(11, -33);
                ctx.moveTo(0, -32); ctx.lineTo(-6, -38); ctx.moveTo(0, -32); ctx.lineTo(6, -38);
                ctx.stroke();

                // Secondary fine frost needles
                ctx.lineWidth = 0.65;
                ctx.globalAlpha = 0.72;
                ctx.beginPath();
                ctx.moveTo(-5, -19.5); ctx.lineTo(-10, -20.5);
                ctx.moveTo(5, -19.5); ctx.lineTo(10, -20.5);
                ctx.moveTo(-6, -29); ctx.lineTo(-12, -29.5);
                ctx.moveTo(6, -29); ctx.lineTo(12, -29.5);
                ctx.stroke();

                // Diamond crystal tip
                ctx.globalAlpha = 0.92;
                ctx.beginPath();
                ctx.moveTo(0, -44); ctx.lineTo(2.4, -40); ctx.lineTo(0, -36); ctx.lineTo(-2.4, -40); ctx.closePath();
                ctx.fill();
                ctx.restore();

                // 6 interstitial 30-deg crystal lances
                ctx.save();
                ctx.rotate(i * Math.PI / 3 + Math.PI / 6);
                ctx.globalAlpha = 0.65;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(0, -8); ctx.lineTo(0, -21);
                ctx.moveTo(0, -14); ctx.lineTo(-3.5, -18);
                ctx.moveTo(0, -14); ctx.lineTo(3.5, -18);
                ctx.stroke();
                ctx.restore();
              }

              // Warm champagne-gold Christmas starlight heart
              const pulse = 0.78 + 0.22 * Math.sin(t * 2.4);
              ctx.shadowColor = '#FFD882';
              ctx.shadowBlur = 10;
              drawStar(0, 0, 7.2 * pulse, '#FFD882', 0.95);
              drawStar(0, 0, 3.6, '#FFFFFF', 0.98);
              ctx.restore();
            }

            function renderBond(t) {
              ctx.clearRect(0, 0, W, H);
              const pts = [];
              const cx = W / 2, cy = H / 2 + 4;
              const beat = 1 + 0.045 * Math.sin(t * 2.1);

              // Left silk tail
              for (let i = 0; i <= 14; i++) {
                const u = i / 14;
                const x = 6 + u * 44;
                const wave = Math.sin(u * 4.5 - t * 2.4) * 3.2 * (1 - u * 0.4);
                pts.push([x, cy + 12 + wave]);
              }
              // Smooth parametric calligraphic heart
              for (let i = 0; i <= 36; i++) {
                const a = Math.PI + (i / 36) * Math.PI * 2;
                const hx = 16 * Math.pow(Math.sin(a), 3) * 1.38 * beat;
                const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 1.38 * beat;
                pts.push([cx + hx, cy - 2 + hy]);
              }
              // Right silk tail
              for (let i = 0; i <= 14; i++) {
                const u = i / 14;
                const x = 68 + u * 44;
                const wave = Math.sin(u * 4.5 - t * 2.4 + 1.2) * 3.2 * (0.6 + u * 0.4);
                pts.push([x, cy + 12 + wave]);
              }

              // Soft crimson halo
              const halo = ctx.createRadialGradient(cx, cy - 2, 4, cx, cy - 2, 44);
              halo.addColorStop(0, 'rgba(242, 116, 58, 0.24)');
              halo.addColorStop(0.55, 'rgba(218, 72, 108, 0.12)');
              halo.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(cx, cy - 2, 44, 0, Math.PI * 2);
              ctx.fill();

              // Gossamer echo thread
              ctx.save();
              ctx.beginPath();
              pts.forEach(([x, y], idx) => idx === 0 ? ctx.moveTo(x, y + 3) : ctx.lineTo(x, y + 3));
              ctx.strokeStyle = 'rgba(255, 138, 168, 0.28)';
              ctx.lineWidth = 1;
              ctx.stroke();

              // Main glowing crimson-orange silk thread
              ctx.beginPath();
              pts.forEach(([x, y], idx) => idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
              const grad = ctx.createLinearGradient(8, 0, W - 8, 0);
              grad.addColorStop(0, '#D9465F');
              grad.addColorStop(0.5, '#F2743A');
              grad.addColorStop(1, '#FF8AA8');
              ctx.strokeStyle = grad;
              ctx.lineWidth = 2.0;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.shadowColor = '#F2743A';
              ctx.shadowBlur = 9;
              ctx.stroke();

              // Gliding light pulse bead traveling continuously along the heart thread
              const idx = Math.floor(((t * 0.24) % 1) * (pts.length - 1));
              const [px, py] = pts[idx];
              ctx.shadowColor = '#FFD49B';
              ctx.shadowBlur = 12;
              ctx.fillStyle = '#FFF4E0';
              ctx.beginPath();
              ctx.arc(px, py, 2.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            function renderCapsule(t) {
              ctx.clearRect(0, 0, W, H);
              const cx = W / 2, cy = H / 2 + 2;

              const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, 46);
              halo.addColorStop(0, 'rgba(242, 116, 58, 0.28)');
              halo.addColorStop(0.55, 'rgba(255, 216, 130, 0.12)');
              halo.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(cx, cy, 46, 0, Math.PI * 2);
              ctx.fill();

              // Outer rotating dashed orbital ring
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(t * 0.22);
              ctx.strokeStyle = 'rgba(255, 224, 170, 0.36)';
              ctx.lineWidth = 1.1;
              ctx.setLineDash([3, 5]);
              ctx.beginPath();
              ctx.arc(0, 0, 36, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              // Orbiting glowing bead
              ctx.fillStyle = '#FFD882';
              ctx.shadowColor = '#FFD882';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(36, 0, 2.6, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              // Inner solid Signal Orange seal ring
              ctx.save();
              ctx.translate(cx, cy);
              ctx.strokeStyle = '#F2743A';
              ctx.lineWidth = 1.6;
              ctx.shadowColor = '#F2743A';
              ctx.shadowBlur = 9;
              ctx.beginPath();
              ctx.arc(0, 0, 24, 0, Math.PI * 2);
              ctx.stroke();

              // Breathing golden core
              const s = 0.85 + 0.15 * Math.sin(t * 2.1);
              drawStar(0, 0, 10 * s, '#FFD882', 0.92);
              drawStar(0, 0, 4.5, '#FFFFFF', 0.95);
              ctx.restore();
            }

            let start = performance.now();
            function tick(now) {
              const t = (now - start) / 1000;
              if (MODE === 'snow') renderSnow(t);
              else if (MODE === 'bond') renderBond(t);
              else renderCapsule(t);
              requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          </script>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}

let app = NSApplication.shared
let delegate = WidgetAppDelegate()
app.delegate = delegate
app.run()
