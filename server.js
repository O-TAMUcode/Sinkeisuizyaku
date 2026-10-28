'use strict';
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

// 画面(HTML)はこのファイルに埋め込み済み。publicフォルダなどの別ファイルは不要
const HTML = "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>化学式神経衰弱</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;800;900&display=swap\" rel=\"stylesheet\">\n<style>\n:root{\n  --navy:#1d3a8a;\n  --ink:#16224a;\n  --bg:#eef3fa;\n  --line:#c9d6ec;\n  --accent:#f5a31a;\n  --accent-d:#d98a08;\n  --ok:#1f9d5a;\n  --muted:#6a7799;\n  --safe-t:env(safe-area-inset-top,0px);\n  --safe-b:env(safe-area-inset-bottom,0px);\n}\n*{box-sizing:border-box}\nhtml,body{margin:0}\nbody{\n  min-height:100vh;min-height:100dvh;\n  font-family:\"M PLUS Rounded 1c\",\"Hiragino Maru Gothic ProN\",\"Yu Gothic\",sans-serif;\n  font-weight:500;color:var(--ink);background-color:var(--bg);\n  background-image:url(\"data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d9e3f3' fill-rule='evenodd'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/svg%3E\");\n  padding:calc(12px + var(--safe-t)) 14px calc(20px + var(--safe-b));\n}\n.wrap{max-width:980px;margin:0 auto}\nh1{margin:0;font-weight:900;color:var(--navy);letter-spacing:.02em}\nbutton{font:inherit}\n.hidden{display:none!important}\n\n/* ---- ロゴの輪 ---- */\n.hero{display:flex;flex-direction:column;align-items:center;gap:6px;margin:8px 0 18px}\n#ring{position:relative;width:176px;aspect-ratio:1;container-type:inline-size}\n.ring-atom{position:absolute;width:23%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;\n  display:grid;place-items:center;font-weight:900;font-size:8.4cqw;line-height:1;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);\n  box-shadow:0 1px 3px rgba(0,0,0,.25)}\n.ring-c{position:absolute;inset:0;display:grid;place-items:center;text-align:center;\n  font-weight:900;font-size:11cqw;line-height:1.15;color:var(--navy)}\n.hero h1{font-size:30px}\nbody[data-screen=\"lobby\"] .hero,body[data-screen=\"game\"] .hero{flex-direction:row;justify-content:flex-start;margin:0 0 10px}\nbody[data-screen=\"lobby\"] #ring,body[data-screen=\"game\"] #ring{display:none}\nbody[data-screen=\"lobby\"] .hero h1,body[data-screen=\"game\"] .hero h1{font-size:19px}\n\n/* ---- 共通パーツ ---- */\n.screen{display:none}\n.screen.active{display:block}\n.panel{max-width:440px;margin:0 auto;background:#fff;border:3px solid var(--navy);border-radius:20px;padding:22px 20px}\n.panel h2{margin:0 0 14px;font-size:20px;font-weight:900;color:var(--navy)}\nlabel{display:block;font-weight:800;margin-bottom:6px}\ninput[type=text]{width:100%;font:inherit;font-weight:800;font-size:18px;padding:12px 14px;border:3px solid var(--line);border-radius:12px;background:#fff;color:var(--ink)}\ninput[type=text]:focus{outline:none;border-color:var(--navy)}\n.btn{display:block;width:100%;font-weight:900;font-size:18px;padding:14px 20px;border-radius:999px;border:3px solid var(--navy);background:#fff;color:var(--navy);cursor:pointer;margin-top:12px}\n.btn.primary{background:var(--accent);box-shadow:0 4px 0 var(--accent-d)}\n.btn.primary:active{transform:translateY(3px);box-shadow:0 1px 0 var(--accent-d)}\n.btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;transform:none}\n.btn.small{display:inline-block;width:auto;font-size:14px;padding:8px 16px;margin:0;border-width:2px}\n.btn.link{border:0;background:none;color:var(--muted);text-decoration:underline;font-size:14px;font-weight:800;padding:8px}\n:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\n.err{color:#c62828;font-weight:800;min-height:1.4em;margin:10px 0 0;font-size:14px}\n.note{color:var(--muted);font-size:14px;margin:8px 0 0}\n.hello{margin:0 0 14px;font-weight:800}\n.hello b{color:var(--navy)}\n\n/* ---- ロビー ---- */\n.lobby-grid{display:grid;gap:14px;grid-template-columns:1fr}\n@media(min-width:760px){.lobby-grid{grid-template-columns:1fr 1fr;align-items:start}}\n.box{background:#fff;border:3px solid var(--line);border-radius:18px;padding:16px}\n.box h3{margin:0 0 10px;font-size:16px;font-weight:900;color:var(--navy)}\n.room-pw{font-size:26px;font-weight:900;color:var(--navy);word-break:break-all}\n.players{list-style:none;margin:0;padding:0;display:grid;gap:8px}\n.players li{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:var(--bg);border-radius:12px;font-weight:800}\n.tag{font-size:12px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--navy);color:#fff}\n.tag.off{background:var(--muted)}\n.tag.me{background:var(--accent);color:var(--ink)}\n.deck{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}\n.deck li{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px}\n.mini{width:30px;aspect-ratio:1;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:12px;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);box-shadow:0 1px 2px rgba(0,0,0,.25)}\n.rules{margin:0;padding-left:1.2em;display:grid;gap:6px;font-size:14px}\n.lobby-actions{max-width:440px;margin:16px auto 0}\n\n/* ---- ゲーム ---- */\n.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}\n.score{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px;flex:1}\n.chip{display:flex;align-items:baseline;gap:6px;padding:6px 12px;border-radius:999px;background:#fff;border:3px solid var(--line);font-weight:800;font-size:14px}\n.chip b{font-size:18px;font-weight:900}\n.chip.turn{border-color:var(--accent);background:#fff6df;box-shadow:0 0 0 3px rgba(245,163,26,.25)}\n.chip.off{opacity:.5}\n.status{margin:6px 0 10px;min-height:2.2em;font-weight:900;font-size:18px;color:var(--navy);display:flex;align-items:center;gap:10px;flex-wrap:wrap}\n.status.mine{color:#b86e00}\n.status.match{color:var(--ok)}\n.status small{font-size:13px;color:var(--muted);font-weight:800}\n\n.board{--cols:8;display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:clamp(3px,.9vw,8px);width:100%;margin:0 auto}\n@media(min-width:760px){\n  .board{--cols:10;max-width:min(100%,max(520px,calc((100vh - 230px)/1.16)));max-width:min(100%,max(520px,calc((100dvh - 230px)/1.16)))}\n}\n.card{container-type:inline-size;aspect-ratio:5/7;padding:0;border:0;background:none;cursor:pointer;perspective:700px;-webkit-tap-highlight-color:transparent}\n.card .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .45s ease}\n.card.up .inner{transform:rotateY(180deg)}\n.board:not(.locked) .card:not(.up):hover .inner{transform:translateY(-3px)}\n.board.locked .card{cursor:default}\n.card.gone{opacity:0;pointer-events:none;transition:opacity .4s .1s}\n.card.reveal{opacity:.5}\n.face{position:absolute;inset:0;border-radius:9cqw;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}\n.back{\n  background-color:var(--navy);\n  background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg%3E%3Ccircle cx='50' cy='18' r='7.5' fill='%23f59a23'/%3E%3Ccircle cx='68.8' cy='24.1' r='7.5' fill='%233cb371'/%3E%3Ccircle cx='80.4' cy='40.1' r='7.5' fill='%23222'/%3E%3Ccircle cx='80.4' cy='59.9' r='7.5' fill='%23f6e33b'/%3E%3Ccircle cx='68.8' cy='75.9' r='7.5' fill='%23b8b8b8'/%3E%3Ccircle cx='50' cy='82' r='7.5' fill='%23d6283a'/%3E%3Ccircle cx='31.2' cy='75.9' r='7.5' fill='%238e5bb5'/%3E%3Ccircle cx='19.6' cy='59.9' r='7.5' fill='%232a4ea6'/%3E%3Ccircle cx='19.6' cy='40.1' r='7.5' fill='%23e83e96'/%3E%3Ccircle cx='31.2' cy='24.1' r='7.5' fill='%233da5e8'/%3E%3C/g%3E%3C/svg%3E\");\n  background-size:92% auto;background-position:center;background-repeat:no-repeat;\n  border:3cqw solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}\n.front{transform:rotateY(180deg);background:var(--bg-c);color:var(--fg);display:flex;flex-direction:column;gap:4cqw;padding:7cqw 7cqw 8cqw;box-shadow:0 1px 3px rgba(0,0,0,.25);border:1px solid rgba(0,0,0,.08)}\n.front.blank{border:2px solid #c3cde3}\n.jp{font-size:13cqw;font-weight:800;line-height:1.1;text-align:center;white-space:nowrap}\n.jp.long{font-size:9.5cqw}\n.plate{flex:1;background:#fff;border-radius:5cqw;display:grid;place-items:center;min-height:0}\n.orb{width:68cqw;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:32cqw;line-height:1;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);box-shadow:inset 0 -4cqw 8cqw rgba(0,0,0,.14)}\n.orb.two{font-size:27cqw}\n.orb.rainbow{background:conic-gradient(#ef5350,#ffca28,#66bb6a,#26c6da,#5c6bc0,#ab47bc,#ef5350);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)}\n@container (max-width:52px){.jp{display:none}.front{padding:6cqw}.orb{width:80cqw}}\n.board.match .card.up .front{box-shadow:inset 0 0 0 4cqw var(--ok)}\n\n.result{max-width:520px;margin:16px auto 0;background:#fff;border:3px solid var(--navy);border-radius:20px;padding:18px}\n.result h2{margin:0 0 10px;font-size:20px;font-weight:900;color:var(--navy)}\n.rank{list-style:none;margin:0;padding:0;display:grid;gap:8px}\n.rank li{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;background:var(--bg);font-weight:800}\n.rank li.win{background:#fff0c9;border:2px solid var(--accent)}\n.rank .n{width:2.4em;font-weight:900;color:var(--navy)}\n.rank .s{margin-left:auto;font-weight:900;font-size:18px}\n\nsub{font-size:.7em;line-height:0}\n.bot-panel{margin-top:14px;padding-top:12px;border-top:2px dashed var(--line)}\n.bot-btns{display:flex;flex-wrap:wrap;gap:8px}\n.bot-btns .btn.small{font-size:14px}\n.levels{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:4px;font-size:13px;color:var(--muted)}\n.levels b{color:var(--ink)}\n.players li .btn.small{margin-left:auto;padding:4px 12px;font-size:12px}\n.choice{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px}\n.choice .btn{margin:0;width:auto;flex:1 1 220px;font-size:16px}\n.mini.s{width:24px;font-size:10px}\n.roles{margin:14px 0 0;background:#fff;border:3px solid var(--line);border-radius:18px;padding:10px 14px}\n.roles summary{cursor:pointer;font-weight:900;color:var(--navy);font-size:16px}\n.rgroup{display:grid;grid-template-columns:3.4em 1fr;gap:6px 10px;padding:8px 0;border-top:2px dashed var(--line);margin-top:8px}\n.rpts{font-weight:900;font-size:18px;color:var(--navy);padding-top:2px}\n.rlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px 14px}\n.rrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.rorbs{display:inline-flex;gap:2px;flex-wrap:wrap}\n.rlabel{font-weight:800;font-size:15px}\n.rlabel small{font-weight:500;color:var(--muted);font-size:12px}\n.board.miss .card.up{filter:grayscale(.5)}\n#toast{position:fixed;left:50%;bottom:calc(24px + var(--safe-b));transform:translateX(-50%);background:var(--ink);color:#fff;\n  padding:10px 18px;border-radius:999px;font-weight:800;font-size:14px;opacity:0;pointer-events:none;transition:opacity .25s;z-index:10;max-width:90vw;text-align:center}\n#toast.show{opacity:1}\n@media(prefers-reduced-motion:reduce){.card .inner{transition:none}.card.gone{transition:none}}\n</style>\n</head>\n<body data-screen=\"name\">\n<div class=\"wrap\">\n  <header class=\"hero\">\n    <div id=\"ring\"></div>\n    <h1>化学式神経衰弱</h1>\n  </header>\n\n  <!-- 名前 -->\n  <section id=\"s-name\" class=\"screen active\">\n    <form class=\"panel\" id=\"f-name\" autocomplete=\"off\">\n      <h2>あなたの名前を決めよう</h2>\n      <label for=\"in-name\">名前</label>\n      <input type=\"text\" id=\"in-name\" maxlength=\"12\" placeholder=\"12文字まで\" required>\n      <button class=\"btn primary\" type=\"submit\">決定</button>\n    </form>\n  </section>\n\n  <!-- メニュー -->\n  <section id=\"s-menu\" class=\"screen\">\n    <div class=\"panel\">\n      <p class=\"hello\"><b id=\"hello-name\"></b> さん</p>\n      <button class=\"btn primary\" id=\"b-create\" type=\"button\">部屋を作る</button>\n      <button class=\"btn\" id=\"b-join\" type=\"button\">部屋に入る</button>\n      <div style=\"text-align:center;margin-top:8px\"><button class=\"btn link\" id=\"b-rename\" type=\"button\">名前を変える</button></div>\n    </div>\n  </section>\n\n  <!-- パスワード -->\n  <section id=\"s-pw\" class=\"screen\">\n    <form class=\"panel\" id=\"f-pw\" autocomplete=\"off\">\n      <h2 id=\"pw-title\"></h2>\n      <label for=\"in-pw\">パスワード</label>\n      <input type=\"text\" id=\"in-pw\" maxlength=\"20\" required>\n      <p class=\"note\" id=\"pw-note\"></p>\n      <p class=\"err\" id=\"pw-err\" role=\"alert\"></p>\n      <button class=\"btn primary\" type=\"submit\" id=\"pw-submit\"></button>\n      <button class=\"btn\" type=\"button\" id=\"pw-back\">戻る</button>\n    </form>\n  </section>\n\n  <!-- ロビー -->\n  <section id=\"s-lobby\" class=\"screen\">\n    <div class=\"lobby-grid\">\n      <div class=\"box\">\n        <h3>部屋のパスワード</h3>\n        <div class=\"room-pw\" id=\"lobby-pw\"></div>\n        <p class=\"note\">このパスワードを友だちに伝えよう</p>\n        <h3 style=\"margin-top:16px\">参加者 <span id=\"lobby-count\"></span></h3>\n        <ul class=\"players\" id=\"lobby-players\"></ul>\n        <div class=\"bot-panel hidden\" id=\"bot-panel\">\n          <h3>AIを追加する（部屋主だけ）</h3>\n          <div class=\"bot-btns\">\n            <button class=\"btn small\" type=\"button\" data-bot=\"easy\">＋ かんたん</button>\n            <button class=\"btn small\" type=\"button\" data-bot=\"normal\">＋ ふつう</button>\n            <button class=\"btn small\" type=\"button\" data-bot=\"hard\">＋ むずかしい</button>\n            <button class=\"btn small\" type=\"button\" data-bot=\"scientist\">＋ 科学者</button>\n          </div>\n          <ul class=\"levels\">\n            <li><b>かんたん</b>：カードをよく忘れる。判断も適当。</li>\n            <li><b>ふつう</b>：そこそこ覚えている。</li>\n            <li><b>むずかしい</b>：ほとんど忘れず、得か損かを考えて選ぶ。</li>\n            <li><b>科学者</b>：全部覚えていて、確率を計算して選ぶ。</li>\n          </ul>\n        </div>\n      </div>\n      <div class=\"box\">\n        <h3>あそびかた</h3>\n        <ol class=\"rules\">\n          <li>順番に、カードを1枚ずつめくる。めくったカードで化学式（役）ができたら点数がもらえる。</li>\n          <li>役ができたら「ここでやめる」か「続ける」を選べる。続けてめくると、もっと大きい役になるかも。でも、どの役にもなれないカードが出たら、めくった分は全部もどって0点。</li>\n          <li>役が取れても、次の人の番になる。</li>\n          <li>オールマイティーは、どの原子の代わりにもなる。</li>\n          <li>役が1つも作れなくなったら終了。点数が多い人の勝ち。</li>\n        </ol>\n        <h3 style=\"margin-top:16px\">カードの枚数</h3>\n        <ul class=\"deck\" id=\"lobby-deck\"></ul>\n      </div>\n    </div>\n    <details class=\"roles\" id=\"roles-lobby\" open>\n      <summary>役の一覧（化学式点数表）</summary>\n      <div class=\"roles-body\"></div>\n    </details>\n    <div class=\"lobby-actions\">\n      <button class=\"btn primary\" id=\"b-start\" type=\"button\">ゲームを始める</button>\n      <p class=\"note\" id=\"start-note\" style=\"text-align:center\"></p>\n      <button class=\"btn\" id=\"b-leave-lobby\" type=\"button\">部屋を出る</button>\n    </div>\n  </section>\n\n  <!-- ゲーム -->\n  <section id=\"s-game\" class=\"screen\">\n    <div class=\"topbar\">\n      <ul class=\"score\" id=\"score\"></ul>\n      <button class=\"btn small\" id=\"b-leave-game\" type=\"button\">部屋を出る</button>\n    </div>\n    <div class=\"status\" id=\"status\"></div>\n    <div class=\"choice hidden\" id=\"choice\">\n      <button class=\"btn primary\" id=\"b-take\" type=\"button\"></button>\n      <button class=\"btn\" id=\"b-cont\" type=\"button\">続ける（次のカードをめくる）</button>\n    </div>\n    <div class=\"board locked\" id=\"board\"></div>\n    <details class=\"roles\" id=\"roles-game\">\n      <summary>役の一覧を見る</summary>\n      <div class=\"roles-body\"></div>\n    </details>\n    <div class=\"result hidden\" id=\"result\">\n      <h2>けっか</h2>\n      <ol class=\"rank\" id=\"rank\"></ol>\n      <button class=\"btn primary\" id=\"b-again\" type=\"button\">もう一度あそぶ</button>\n      <p class=\"note hidden\" id=\"again-note\" style=\"text-align:center\">部屋主がもう一度始めるのを待っています</p>\n      <button class=\"btn\" id=\"b-leave-result\" type=\"button\">部屋を出る</button>\n    </div>\n  </section>\n</div>\n<div id=\"toast\" role=\"status\"></div>\n\n<script src=\"/socket.io/socket.io.js\"></script>\n<script>\n(function(){\n'use strict';\n\n/* サーバー経由で開いていない（ファイルを直接開いた等）場合の案内 */\nif(typeof io === 'undefined'){\n  var m = document.createElement('div');\n  m.style.cssText = 'max-width:480px;margin:40px auto;padding:20px;background:#fff;border:3px solid #1d3a8a;border-radius:16px;font-weight:800;line-height:1.7';\n  m.innerHTML = 'サーバーにつながっていません。<br>このファイルを直接開かず、Renderで公開したURL（またはnpm startしたlocalhost）から開いてください。';\n  document.body.innerHTML = '';\n  document.body.appendChild(m);\n  return;\n}\n\n/* ---- 原子データ ---- */\nvar ATOM = {\n  H:    {sym:'H',  jp:'水素',      bg:'#3aa3e6', hi:'#b3e0fb', lo:'#2b8ad4', ink:'#17489a', fg:'#fff'},\n  O:    {sym:'O',  jp:'酸素',      bg:'#f0a030', hi:'#ffd69a', lo:'#e8841a', ink:'#9a4310', fg:'#fff'},\n  C:    {sym:'C',  jp:'炭素',      bg:'#26211f', hi:'#9a9a9a', lo:'#0f0d0d', ink:'#fff',    fg:'#fff'},\n  N:    {sym:'N',  jp:'窒素',      bg:'#1c3f94', hi:'#c0caf5', lo:'#3149a8', ink:'#142a7a', fg:'#fff'},\n  Cl:   {sym:'Cl', jp:'塩素',      bg:'#34a06a', hi:'#bdf0d1', lo:'#2f9c60', ink:'#13693a', fg:'#fff'},\n  Na:   {sym:'Na', jp:'ナトリウム', bg:'#e8509e', hi:'#fcc1de', lo:'#e0408f', ink:'#a90f5a', fg:'#fff'},\n  Ag:   {sym:'Ag', jp:'銀',        bg:'#b9bcc2', hi:'#f4f4f4', lo:'#8b8e94', ink:'#4b4e55', fg:'#222'},\n  Fe:   {sym:'Fe', jp:'鉄',        bg:'#8e63b5', hi:'#e0cbf3', lo:'#7a4aa5', ink:'#4a2279', fg:'#fff'},\n  Cu:   {sym:'Cu', jp:'銅',        bg:'#d6283a', hi:'#f8aab1', lo:'#c01f30', ink:'#7a0a18', fg:'#fff'},\n  S:    {sym:'S',  jp:'硫黄',      bg:'#f6e33b', hi:'#fffbb8', lo:'#f0d01a', ink:'#4d4708', fg:'#3a3600'},\n  BLANK:{sym:'★', jp:'オールマイティー', bg:'#ffffff', hi:'#ffffff', lo:'#e6ebf5', ink:'#fff',    fg:'#333', blank:true}\n};\nfunction atomVars(el, t){\n  var a = ATOM[t]; if(!a) return;\n  el.style.setProperty('--hi', a.hi);\n  el.style.setProperty('--lo', a.lo);\n  el.style.setProperty('--atom-ink', a.ink);\n}\n\n/* ---- ヘルパー ---- */\nfunction $(s){ return document.querySelector(s); }\nfunction h(tag, cls, text){\n  var e = document.createElement(tag);\n  if(cls) e.className = cls;\n  if(text !== undefined) e.textContent = text;\n  return e;\n}\nfunction store(key, val){\n  try{\n    if(val === undefined) return JSON.parse(localStorage.getItem(key));\n    if(val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));\n  }catch(e){ return null; }\n}\nvar toastTimer;\nfunction toast(msg){\n  var t = $('#toast'); t.textContent = msg; t.classList.add('show');\n  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2600);\n}\nfunction show(name){\n  document.body.dataset.screen = name;\n  ['name','menu','pw','lobby','game'].forEach(function(n){\n    $('#s-'+n).classList.toggle('active', n === name);\n  });\n}\n\n/* ---- ロゴの輪 ---- */\n(function buildRing(){\n  var ring = $('#ring');\n  ['O','Cl','C','S','Ag','Cu','Fe','N','Na','H'].forEach(function(t,i){\n    var a = i*36*Math.PI/180;\n    var d = h('span','ring-atom',ATOM[t].sym);\n    d.style.left = (50 + 38*Math.sin(a)) + '%';\n    d.style.top  = (50 - 38*Math.cos(a)) + '%';\n    atomVars(d,t);\n    ring.appendChild(d);\n  });\n  var c = h('div','ring-c'); c.innerHTML = 'Atom<br>Model<br>Cards';\n  ring.appendChild(c);\n})();\n\n/* ---- 状態 ---- */\nvar socket = io();\nvar myName = store('memo_name') || '';\nvar session = store('memo_session');   // {playerId, pw}\nvar mode = 'create';\nvar st = null;\nvar board = $('#board');\n\nfunction goStart(){ show(myName ? 'menu' : 'name'); $('#hello-name').textContent = myName; }\ngoStart();\n\n/* ---- 名前 ---- */\n$('#f-name').addEventListener('submit', function(e){\n  e.preventDefault();\n  var v = $('#in-name').value.trim();\n  if(!v) return;\n  myName = Array.from(v).slice(0,12).join('');\n  store('memo_name', myName);\n  goStart();\n});\n$('#b-rename').addEventListener('click', function(){\n  $('#in-name').value = myName; show('name'); $('#in-name').focus();\n});\n\n/* ---- メニュー ---- */\nfunction openPw(m){\n  mode = m;\n  $('#pw-title').textContent = m === 'create' ? '部屋を作る' : '部屋に入る';\n  $('#pw-note').textContent = m === 'create' ? '好きなパスワードを決めよう。友だちにはこれを伝える。' : '部屋を作った人に聞いたパスワードを入力しよう。';\n  $('#pw-submit').textContent = m === 'create' ? '部屋を作る' : '入室する';\n  $('#pw-err').textContent = '';\n  $('#in-pw').value = '';\n  show('pw'); $('#in-pw').focus();\n}\n$('#b-create').addEventListener('click', function(){ openPw('create'); });\n$('#b-join').addEventListener('click', function(){ openPw('join'); });\n$('#pw-back').addEventListener('click', goStart);\n\n$('#f-pw').addEventListener('submit', function(e){\n  e.preventDefault();\n  var pw = $('#in-pw').value.trim();\n  if(!pw) return;\n  $('#pw-submit').disabled = true;\n  socket.emit(mode, {name: myName, pw: pw}, function(res){\n    $('#pw-submit').disabled = false;\n    if(!res || !res.ok){ $('#pw-err').textContent = (res && res.error) || 'うまくいきませんでした'; return; }\n    session = {playerId: res.playerId, pw: res.pw};\n    store('memo_session', session);\n  });\n});\n\n/* ---- 退出 ---- */\nfunction leave(ask){\n  if(ask && !confirm('部屋を出ますか？')) return;\n  session = null; store('memo_session', null);\n  socket.emit('leave', null, function(){});\n  st = null; board.innerHTML = '';\n  goStart();\n}\n$('#b-leave-lobby').addEventListener('click', function(){ leave(false); });\n$('#b-leave-game').addEventListener('click', function(){ leave(st && st.phase === 'playing'); });\n$('#b-leave-result').addEventListener('click', function(){ leave(false); });\n$('#b-start').addEventListener('click', function(){ socket.emit('start'); });\n$('#b-again').addEventListener('click', function(){ socket.emit('again'); });\n\n/* ---- 通信 ---- */\nsocket.on('connect', function(){\n  if(session){\n    socket.emit('resume', session, function(res){\n      if(!res || !res.ok){\n        var inRoom = document.body.dataset.screen === 'lobby' || document.body.dataset.screen === 'game';\n        session = null; store('memo_session', null); st = null; board.innerHTML = '';\n        if(inRoom){ toast('部屋が見つかりませんでした'); goStart(); }\n      }\n    });\n  }\n});\nsocket.on('disconnect', function(){ toast('接続が切れました。つなぎ直しています…'); });\nsocket.on('closed', function(){\n  if(!session) return;\n  session = null; store('memo_session', null); st = null; board.innerHTML = '';\n  toast('部屋が閉じられました'); goStart();\n});\nsocket.on('state', function(s){\n  if(!session) return;\n  st = s;\n  render();\n});\n\n/* ---- 描画 ---- */\nfunction me(){ return st && st.players.find(function(p){ return p.id === session.playerId; }); }\n\nfunction render(){\n  renderRoles();\n  if(st.phase === 'lobby'){\n    board.innerHTML = '';\n    show('lobby'); renderLobby();\n  } else {\n    show('game'); renderGame();\n  }\n}\n\nfunction playerRow(p){\n  var li = h('li');\n  li.appendChild(h('span','',p.name));\n  if(p.id === st.hostId) li.appendChild(h('span','tag','部屋主'));\n  if(p.id === session.playerId) li.appendChild(h('span','tag me','あなた'));\n  if(p.bot) li.appendChild(h('span','tag','AI'));\n  if(!p.connected) li.appendChild(h('span','tag off','接続切れ'));\n  if(p.bot && st.hostId === session.playerId){\n    var rm = h('button','btn small','はずす'); rm.type = 'button';\n    rm.addEventListener('click', function(){ socket.emit('removeBot', p.id); });\n    li.appendChild(rm);\n  }\n  return li;\n}\n\nfunction renderLobby(){\n  $('#lobby-pw').textContent = st.pw;\n  var act = st.players.filter(function(p){ return p.connected; }).length;\n  $('#lobby-count').textContent = '（' + st.players.length + '/' + st.limits.max + '人）';\n  var ul = $('#lobby-players'); ul.innerHTML = '';\n  st.players.forEach(function(p){ ul.appendChild(playerRow(p)); });\n\n  var deck = $('#lobby-deck'); deck.innerHTML = '';\n  st.deck.forEach(function(d){\n    var a = ATOM[d.t]; if(!a) return;\n    var li = h('li');\n    var m = h('span','mini', a.sym); atomVars(m, d.t);\n    if(a.blank) m.style.background = 'conic-gradient(#ef5350,#ffca28,#66bb6a,#26c6da,#5c6bc0,#ab47bc,#ef5350)';\n    li.appendChild(m);\n    li.appendChild(h('span','', a.jp + ' ×' + d.n));\n    deck.appendChild(li);\n  });\n\n  var isHost = st.hostId === session.playerId;\n  $('#bot-panel').classList.toggle('hidden', !isHost || st.players.length >= st.limits.max);\n  var btn = $('#b-start');\n  btn.classList.toggle('hidden', !isHost);\n  btn.disabled = act < st.limits.min;\n  $('#start-note').textContent = isHost\n    ? (act < st.limits.min ? st.limits.min + '人以上そろうと始められます' : '')\n    : '部屋主が始めるのを待っています';\n}\n\nfunction buildBoard(n){\n  board.innerHTML = '';\n  for(var i=0;i<n;i++){\n    var b = h('button','card'); b.type = 'button'; b.dataset.i = i;\n    b.setAttribute('aria-label','カード ' + (i+1));\n    var inner = h('div','inner');\n    inner.appendChild(h('div','face back'));\n    inner.appendChild(h('div','face front'));\n    b.appendChild(inner);\n    board.appendChild(b);\n  }\n}\n\nfunction fillFront(front, t){\n  var a = ATOM[t]; if(!a) return;\n  front.innerHTML = '';\n  front.classList.toggle('blank', !!a.blank);\n  front.style.setProperty('--bg-c', a.bg);\n  front.style.setProperty('--fg', a.fg);\n  front.appendChild(h('div','jp' + (a.blank ? ' long' : ''), a.jp));\n  var plate = h('div','plate');\n  var orb = h('div','orb' + (a.sym.length > 1 ? ' two' : '') + (a.blank ? ' rainbow' : ''), a.sym);\n  atomVars(orb, t);\n  plate.appendChild(orb);\n  front.appendChild(plate);\n}\n\n/* 化学式（数字を下付きにする） */\nfunction fmt(f){\n  var span = h('span','f');\n  String(f).replace(/(\\d+)|(\\D+)/g, function(m, d, t){\n    if(d) span.appendChild(h('sub','',d)); else span.appendChild(document.createTextNode(t));\n    return '';\n  });\n  return span;\n}\n\n/* 役の一覧 */\nvar rolesKey = '';\nfunction renderRoles(){\n  var key = JSON.stringify(st.roles);\n  if(key === rolesKey) return;\n  rolesKey = key;\n  ['#roles-lobby','#roles-game'].forEach(function(sel){\n    var body = $(sel + ' .roles-body'); body.innerHTML = '';\n    var byPts = {};\n    st.roles.forEach(function(r){ (byPts[r.pts] = byPts[r.pts] || []).push(r); });\n    Object.keys(byPts).map(Number).sort(function(a,b){ return a-b; }).forEach(function(pts){\n      var g = h('div','rgroup');\n      g.appendChild(h('div','rpts', pts + '点'));\n      var list = h('div','rlist');\n      byPts[pts].forEach(function(r){\n        var row = h('div','rrow');\n        var orbs = h('span','rorbs');\n        Object.keys(r.atoms).forEach(function(a){\n          for(var i=0;i<r.atoms[a];i++){\n            var m = h('span','mini s', ATOM[a] ? ATOM[a].sym : a);\n            atomVars(m, a); orbs.appendChild(m);\n          }\n        });\n        row.appendChild(orbs);\n        var lab = h('span','rlabel');\n        lab.appendChild(fmt(r.f));\n        lab.appendChild(h('small','', ' ' + r.name));\n        row.appendChild(lab);\n        list.appendChild(row);\n      });\n      g.appendChild(list); body.appendChild(g);\n    });\n    body.appendChild(h('p','note','オールマイティーは、どの原子の代わりにもなれます。'));\n  });\n}\n\nfunction renderStatus(){\n  var el = $('#status'); el.innerHTML = '';\n  var cls = 'status';\n  var meId = session.playerId;\n  var turnP = st.players.find(function(p){ return p.id === st.turnId; });\n  var myTurn = st.turnId === meId;\n  function add(t){ el.appendChild(document.createTextNode(t)); }\n\n  if(st.phase === 'finished'){\n    add(st.message);\n  } else if(st.busy && st.last && st.last.kind === 'take'){\n    cls += ' match';\n    el.appendChild(fmt(st.last.f));\n    add('（' + st.last.name + '）成立！ +' + st.last.pts + '点');\n    if(turnP) el.appendChild(h('small','', turnP.name + 'さん'));\n  } else if(st.busy && st.last && st.last.kind === 'fail'){\n    add('ちがった… めくったカードはもどります');\n    if(st.last.lost){\n      add(' ／ ');\n      el.appendChild(fmt(st.last.lost.f));\n      add('（' + st.last.lost.pts + '点）は取りそこねた！');\n    }\n  } else if(st.stage === 'choice' && st.current){\n    if(myTurn){\n      cls += ' mine';\n      el.appendChild(fmt(st.current.f));\n      add('（' + st.current.name + '）' + st.current.pts + '点ができた！ やめる？ 続ける？');\n    } else {\n      add((turnP ? turnP.name : '') + 'さんが ');\n      el.appendChild(fmt(st.current.f));\n      add(' で迷っています…');\n    }\n  } else if(myTurn){\n    cls += ' mine';\n    add(st.flippedCount ? 'つぎのカードをめくろう' : 'あなたの番です。カードをめくろう');\n  } else {\n    add((turnP ? turnP.name : '') + 'さんの番です');\n  }\n  el.className = cls;\n  if(st.phase === 'playing') el.appendChild(h('small','', 'のこり ' + st.remaining + '枚'));\n}\n\nfunction renderGame(){\n  var meId = session.playerId;\n\n  // スコア\n  var sc = $('#score'); sc.innerHTML = '';\n  st.players.forEach(function(p){\n    var li = h('li','chip' + (p.id === st.turnId ? ' turn' : '') + ((!p.connected || p.left) ? ' off' : ''));\n    li.appendChild(h('span','', p.name + (p.id === meId ? '（あなた）' : '')));\n    li.appendChild(h('b','', String(p.score)));\n    li.appendChild(h('span','', p.left ? '点・退出' : (!p.connected ? '点・接続切れ' : '点')));\n    sc.appendChild(li);\n  });\n\n  var myTurn = st.phase === 'playing' && st.turnId === meId;\n  renderStatus();\n\n  // やめる／続ける\n  var choice = $('#choice');\n  var showChoice = myTurn && !st.busy && st.stage === 'choice' && !!st.current;\n  choice.classList.toggle('hidden', !showChoice);\n  if(showChoice){\n    $('#b-take').textContent = 'ここでやめる（' + st.current.f.replace(/\\d+/g, function(d){ return '₀₁₂₃₄₅₆₇₈₉'.charAt(Number(d)); }) + ' +' + st.current.pts + '点をもらう）';\n  }\n\n  // ボード\n  if(board.children.length !== st.cards.length) buildBoard(st.cards.length);\n  board.classList.toggle('locked', !(myTurn && !st.busy && st.stage === 'flip'));\n  board.classList.toggle('match', st.result === 'match');\n  board.classList.toggle('miss', st.result === 'miss');\n  st.cards.forEach(function(c, i){\n    var el = board.children[i];\n    var revealed = c.s === 0 && !!c.t;\n    el.classList.toggle('up', c.s === 1 || revealed);\n    el.classList.toggle('reveal', revealed);\n    el.classList.toggle('gone', c.s === 2);\n    el.disabled = c.s !== 0 || st.phase !== 'playing';\n    if(c.t && el.dataset.t !== c.t){\n      el.dataset.t = c.t;\n      fillFront(el.querySelector('.front'), c.t);\n    }\n    if(c.t) el.setAttribute('aria-label', ATOM[c.t] ? ATOM[c.t].jp : 'カード');\n    else el.setAttribute('aria-label', 'カード ' + (i+1));\n  });\n\n  // 結果\n  var res = $('#result');\n  res.classList.toggle('hidden', st.phase !== 'finished');\n  if(st.phase === 'finished'){\n    var rank = $('#rank'); rank.innerHTML = '';\n    var list = st.players.slice().sort(function(a,b){ return b.score - a.score; });\n    list.forEach(function(p){\n      var r = 1 + st.players.filter(function(q){ return q.score > p.score; }).length;\n      var li = h('li', r === 1 ? 'win' : '');\n      li.appendChild(h('span','n', r + '位'));\n      li.appendChild(h('span','', p.name + (p.id === meId ? '（あなた）' : '')));\n      li.appendChild(h('span','s', p.score + '点'));\n      rank.appendChild(li);\n    });\n    var isHost = st.hostId === meId;\n    $('#b-again').classList.toggle('hidden', !isHost);\n    $('#again-note').classList.toggle('hidden', isHost);\n    res.scrollIntoView({behavior:'smooth', block:'nearest'});\n  }\n}\n\ndocument.querySelectorAll('[data-bot]').forEach(function(b){\n  b.addEventListener('click', function(){\n    socket.emit('addBot', {level: b.dataset.bot}, function(res){\n      if(res && !res.ok && res.error) toast(res.error);\n    });\n  });\n});\n$('#b-take').addEventListener('click', function(){ socket.emit('take'); });\n$('#b-cont').addEventListener('click', function(){ socket.emit('continue'); });\n\nboard.addEventListener('click', function(e){\n  var b = e.target.closest('.card');\n  if(!b || !st || st.phase !== 'playing' || st.busy || st.stage !== 'flip' || st.turnId !== session.playerId) return;\n  var i = Number(b.dataset.i);\n  if(!st.cards[i] || st.cards[i].s !== 0) return;\n  socket.emit('flip', i);\n});\n\n})();\n</script>\n</body>\n</html>\n";
app.get('/', (_req, res) => res.type('html').send(HTML));
app.get('/healthz', (_req, res) => res.send('ok'));

// ---- 設定 -------------------------------------------------------------
const DECK = [
  ['H', 20], ['O', 15], ['C', 10],
  ['N', 5], ['Cl', 5], ['Na', 5], ['Ag', 5],
  ['Fe', 3], ['Cu', 3], ['S', 3],
  ['BLANK', 6], // 白紙 = オールマイティー
];
// ---- 役（化学式点数表）-------------------------------------------------
// 点数や原子の数を直したいときはここだけ書き換えればOK
const R = (f, name, pts, atoms) => ({
  f, name, pts, atoms,
  size: Object.values(atoms).reduce((a, b) => a + b, 0),
});
const ROLES = [
  R('H2', '水素分子', 1, { H: 2 }),
  R('O2', '酸素分子', 2, { O: 2 }),
  R('H2O', '水', 3, { H: 2, O: 1 }),
  R('HCl', '塩化水素', 3, { H: 1, Cl: 1 }),
  R('CO2', '二酸化炭素', 3, { C: 1, O: 2 }),
  R('N2', '窒素分子', 4, { N: 2 }),
  R('Cl2', '塩素分子', 4, { Cl: 2 }),
  R('CuO', '酸化銅', 4, { Cu: 1, O: 1 }),
  R('NaCl', '塩化ナトリウム', 4, { Na: 1, Cl: 1 }),
  R('AgCl', '塩化銀', 4, { Ag: 1, Cl: 1 }),
  R('FeO', '酸化鉄', 4, { Fe: 1, O: 1 }),
  R('NaOH', '水酸化ナトリウム', 4, { Na: 1, O: 1, H: 1 }),
  R('CuS', '硫化銅', 5, { Cu: 1, S: 1 }),
  R('FeS', '硫化鉄', 5, { Fe: 1, S: 1 }),
  R('H2S', '硫化水素', 5, { H: 2, S: 1 }),
  R('NH3', 'アンモニア', 5, { N: 1, H: 3 }),
  R('CH4', 'メタン', 6, { C: 1, H: 4 }),
  R('Ag2O', '酸化銀', 6, { Ag: 2, O: 1 }),
  R('CuCl2', '塩化銅', 10, { Cu: 1, Cl: 2 }),
  R('FeCl2', '塩化鉄', 10, { Fe: 1, Cl: 2 }),
  R('Ag2S', '硫化銀', 10, { Ag: 2, S: 1 }),
  R('NaHCO3', '炭酸水素ナトリウム', 14, { Na: 1, H: 1, C: 1, O: 3 }),
  R('Na2CO3', '炭酸ナトリウム', 18, { Na: 2, C: 1, O: 3 }),
  R('H2SO4', '硫酸', 20, { H: 2, S: 1, O: 4 }),
  R('C', 'ダイヤモンド', 30, { C: 7 }), // スペシャル得点
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;
const MAX_NAME = 12;
const MAX_PW = 20;
const TAKE_MS = 1800;  // 役が成立したときの表示時間
const MISS_MS = 1800;  // しっぱいの表示時間
const IDLE_MS = 10 * 60 * 1000; // 誰も接続していない部屋を消すまでの時間

const rooms = new Map();

// ---- ユーティリティ ---------------------------------------------------
const clean = (v, max) =>
  typeof v === 'string' ? Array.from(v.trim()).slice(0, max).join('') : '';
const newId = () => crypto.randomBytes(8).toString('hex');
const roomKey = (room) => 'room:' + room.pw;
const isActive = (p) => !!p && p.connected && !p.left;

function buildDeck() {
  const cards = [];
  for (const [type, n] of DECK) {
    for (let i = 0; i < n; i++) cards.push({ type, state: 0 }); // 0=裏 1=表 2=取られた
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// めくったカード(types)が、どの役になれるか調べる
// オールマイティー(BLANK)はどの原子の代わりにもなる
function analyze(types) {
  const cnt = {};
  for (const t of types) if (t !== 'BLANK') cnt[t] = (cnt[t] || 0) + 1;
  const n = types.length;
  let valid = null;       // いま成立している役（複数なら点数が高いもの）
  let possible = false;   // これから役になれる可能性があるか
  let extendable = false; // 今より大きい役になれる可能性があるか
  for (const r of ROLES) {
    if (r.size < n) continue;
    let ok = true;
    for (const a in cnt) if ((r.atoms[a] || 0) < cnt[a]) { ok = false; break; }
    if (!ok) continue;
    possible = true;
    if (r.size === n) { if (!valid || r.pts > valid.pts) valid = r; }
    else extendable = true;
  }
  return { valid, possible, extendable };
}

// 残りのカードでまだ作れる役があるか
function canFormAny(cards) {
  const have = {};
  let wild = 0;
  for (const c of cards) {
    if (c.state === 2) continue;
    if (c.type === 'BLANK') wild++; else have[c.type] = (have[c.type] || 0) + 1;
  }
  return ROLES.some((r) => {
    let need = 0;
    for (const a in r.atoms) need += Math.max(0, r.atoms[a] - (have[a] || 0));
    return need <= wild;
  });
}

// ---- AI（コンピューター）-------------------------------------------------
// remember: 1枚めくられたカードを覚える確率 / forget: 何か起きるたびに1枚忘れる確率
// plan: 覚えているカードで作れる役に気づく確率 / depth: 期待値を何手先まで読むか
const LEVELS = {
  easy:      { label: 'かんたん',  remember: 0.45, forget: 0.20, plan: 0.55, depth: 0, margin: 1,   delay: [1200, 1900] },
  normal:    { label: 'ふつう',    remember: 0.70, forget: 0.10, plan: 0.85, depth: 1, margin: 1.2, delay: [1000, 1600] },
  hard:      { label: 'むずかしい', remember: 0.92, forget: 0.03, plan: 1,    depth: 2, margin: 1,   delay: [900, 1400] },
  scientist: { label: '科学者',    remember: 1,    forget: 0,    plan: 1,    depth: 4, margin: 1,   delay: [800, 1200] },
};

// AIは、めくられたカード（みんなに見えている情報）だけを覚える
function observe(room, index) {
  const type = room.cards[index].type;
  for (const p of room.players) {
    if (!p.bot) continue;
    const L = LEVELS[p.level];
    if (Math.random() < L.remember) p.mem.set(index, type);
    if (L.forget && p.mem.size > 0 && Math.random() < L.forget) {
      const keys = [...p.mem.keys()];
      p.mem.delete(keys[Math.floor(Math.random() * keys.length)]);
    }
  }
}

// 覚えているカードだけで、確実に作れる一番大きい役を探す
function findPlan(room, bot) {
  const S = room.flipped.map((i) => room.cards[i].type);
  const cntS = {};
  let k = 0;
  for (const t of S) { if (t === 'BLANK') k++; else cntS[t] = (cntS[t] || 0) + 1; }
  const avail = {};
  const blanks = [];
  for (const [i, t] of bot.mem) {
    const c = room.cards[i];
    if (!c || c.state !== 0) continue;
    if (t === 'BLANK') blanks.push(i); else (avail[t] = avail[t] || []).push(i);
  }
  let best = null;
  for (const r of ROLES) {
    if (r.size <= S.length) continue;
    let ok = true;
    for (const a in cntS) if ((r.atoms[a] || 0) < cntS[a]) { ok = false; break; }
    if (!ok) continue;
    let deficit = 0;
    const atomIdx = [];
    for (const a in r.atoms) {
      const need = r.atoms[a] - (cntS[a] || 0);
      if (need <= 0) continue;
      const list = avail[a] || [];
      const use = Math.min(need, list.length);
      for (let j = 0; j < use; j++) atomIdx.push(list[j]);
      deficit += need - use;
    }
    const blanksNeeded = Math.max(0, deficit - k);
    if (blanksNeeded > blanks.length) continue;
    const slots = r.size - S.length;
    const idx = atomIdx.slice(0, slots - blanksNeeded).concat(blanks.slice(0, blanksNeeded));
    if (idx.length !== slots) continue;
    if (!best || r.pts > best.role.pts) best = { role: r, indices: idx };
  }
  return best;
}

// まだ正体が分からないカードの種類ごとの枚数（AIが知っている情報だけで数える）
function poolCounts(room, bot) {
  const total = {};
  for (const [t, n] of DECK) total[t] = n;
  for (const c of room.cards) if (c.state === 2) total[c.type]--;
  for (const i of room.flipped) total[room.cards[i].type]--;
  for (const [i, t] of bot.mem) if (room.cards[i] && room.cards[i].state === 0) total[t]--;
  let size = 0;
  for (const t in total) { if (total[t] < 0) total[t] = 0; size += total[t]; }
  return { total, size };
}

// 続けてめくったときの点数の期待値（やめるなら、いまの役の点数）
function valueAfter(types, pool, size, depth) {
  const a = analyze(types);
  if (!a.possible) return 0;
  if (a.valid && !a.extendable) return a.valid.pts;
  const stay = a.valid ? a.valid.pts : 0;
  if (depth <= 0 || size <= 0) return stay;
  let ev = 0;
  for (const t in pool) {
    if (pool[t] <= 0) continue;
    const p = pool[t] / size;
    pool[t]--;
    ev += p * valueAfter(types.concat(t), pool, size - 1, depth - 1);
    pool[t]++;
  }
  return Math.max(stay, ev);
}

function botPickCard(room, bot) {
  const L = LEVELS[bot.level];
  const down = [];
  room.cards.forEach((c, i) => { if (c.state === 0) down.push(i); });
  if (Math.random() < L.plan) {
    const plan = findPlan(room, bot);
    if (plan) return plan.indices[0];
  }
  const unknown = down.filter((i) => !bot.mem.has(i));
  const from = unknown.length ? unknown : down;
  return from[Math.floor(Math.random() * from.length)];
}

function botDecide(room, bot) {
  const L = LEVELS[bot.level];
  const cur = room.current;
  if (bot.level === 'easy') return Math.random() < 0.35 ? 'continue' : 'take';
  const plan = Math.random() < L.plan ? findPlan(room, bot) : null;
  if (plan && plan.role.pts > cur.pts) return 'continue';
  const { total, size } = poolCounts(room, bot);
  if (size <= 0) return 'take';
  const types = room.flipped.map((i) => room.cards[i].type);
  let ev = 0;
  for (const t in total) {
    if (total[t] <= 0) continue;
    const p = total[t] / size;
    total[t]--;
    ev += p * valueAfter(types.concat(t), total, size - 1, L.depth);
    total[t]++;
  }
  return ev > cur.pts * L.margin ? 'continue' : 'take';
}

function botAct(room) {
  room.botTimer = null;
  if (rooms.get(room.pw) !== room || room.phase !== 'playing' || room.busy) return;
  const bot = room.players[room.turnIdx];
  if (!bot || !bot.bot) return;
  try {
    if (room.stage === 'choice') {
      if (botDecide(room, bot) === 'take') {
        doTake(room);
      } else {
        room.lost = room.current;
        room.current = null;
        room.stage = 'flip';
        broadcast(room);
      }
      return;
    }
    flipCard(room, bot, botPickCard(room, bot));
  } catch (e) {
    console.error('bot error', e);
    passTurn(room);
    broadcast(room);
  }
}

function kickBot(room) {
  if (room.botTimer || room.phase !== 'playing' || room.busy) return;
  const cur = room.players[room.turnIdx];
  if (!cur || !cur.bot || !isActive(cur)) return;
  const [lo, hi] = LEVELS[cur.level].delay;
  room.botTimer = setTimeout(() => botAct(room), lo + Math.random() * (hi - lo));
}

function publicState(room) {
  const reveal = room.phase === 'finished';
  const cur = room.players[room.turnIdx];
  return {
    pw: room.pw,
    phase: room.phase,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id, name: p.name, score: p.score, connected: p.connected, left: p.left,
      bot: !!p.bot, level: p.bot ? LEVELS[p.level].label : null,
    })),
    turnId: room.phase === 'playing' && cur ? cur.id : null,
    cards: room.cards.map((c) => ({
      s: c.state,
      t: c.state === 1 || (reveal && c.state === 0) ? c.type : undefined,
    })),
    busy: room.busy,
    result: room.result,
    message: room.message,
    stage: room.stage,
    current: room.current ? { f: room.current.f, name: room.current.name, pts: room.current.pts } : null,
    last: room.last,
    flippedCount: room.flipped.length,
    roles: ROLES.map(({ f, name, pts, atoms }) => ({ f, name, pts, atoms })),
    remaining: room.cards.filter((c) => c.state !== 2).length,
    deck: DECK.map(([t, n]) => ({ t, n })),
    limits: { min: MIN_PLAYERS, max: MAX_PLAYERS },
  };
}

function broadcast(room) {
  room.updated = Date.now();
  io.to(roomKey(room)).emit('state', publicState(room));
  kickBot(room);
}

function deleteRoom(room) {
  clearTimeout(room.timer);
  clearTimeout(room.botTimer);
  rooms.delete(room.pw);
  io.to(roomKey(room)).emit('closed');
}

function ensureHost(room) {
  const host = room.players.find((p) => p.id === room.hostId);
  if (isActive(host)) return;
  const next = room.players.find((p) => isActive(p) && !p.bot)
    || room.players.find((p) => !p.bot && !p.left);
  if (next) room.hostId = next.id;
}

function resetTurn(room) {
  room.stage = 'flip';   // 'flip' = めくる番 / 'choice' = やめる？続ける？
  room.current = null;
  room.lost = null;
  room.last = null;
}

// 次の人へ。めくっているカードは裏に戻す
function passTurn(room) {
  for (const i of room.flipped) if (room.cards[i].state === 1) room.cards[i].state = 0;
  room.flipped = [];
  resetTurn(room);
  const n = room.players.length;
  for (let k = 1; k <= n; k++) {
    const idx = (room.turnIdx + k) % n;
    if (isActive(room.players[idx])) { room.turnIdx = idx; break; }
  }
  const cur = room.players[room.turnIdx];
  room.message = cur ? `${cur.name}さんの番です` : '';
}

function finishGame(room) {
  room.phase = 'finished';
  room.busy = false;
  room.result = null;
  room.flipped = [];
  resetTurn(room);
  const best = Math.max(...room.players.map((p) => p.score));
  const winners = room.players.filter((p) => p.score === best).map((p) => p.name);
  room.message = winners.length > 1
    ? `おしまい！ 同点：${winners.join('、')}（${best}点）`
    : `おしまい！ ${winners[0]}さんの勝ち（${best}点）`;
}

// 役を取る（点をもらって、ターンは次の人へ）
function doTake(room) {
  const cur = room.players[room.turnIdx];
  const a = analyze(room.flipped.map((i) => room.cards[i].type));
  const role = a.valid;
  if (!cur || !role) return;
  room.busy = true;
  room.result = 'match';
  room.stage = 'flip';
  room.current = null;
  room.last = { kind: 'take', f: role.f, name: role.name, pts: role.pts };
  broadcast(room);
  room.timer = setTimeout(() => {
    if (rooms.get(room.pw) !== room) return;
    for (const i of room.flipped) {
      room.cards[i].state = 2;
      for (const p of room.players) if (p.bot) p.mem.delete(i);
    }
    room.flipped = [];
    room.busy = false;
    room.result = null;
    cur.score += role.pts;
    if (!canFormAny(room.cards)) finishGame(room); else passTurn(room);
    broadcast(room);
  }, TAKE_MS);
}

// しっぱい（めくったカードは全部もどる。ターンは次の人へ）
function doFail(room) {
  room.busy = true;
  room.result = 'miss';
  room.stage = 'flip';
  room.current = null;
  room.last = {
    kind: 'fail',
    lost: room.lost ? { f: room.lost.f, name: room.lost.name, pts: room.lost.pts } : null,
  };
  broadcast(room);
  room.timer = setTimeout(() => {
    if (rooms.get(room.pw) !== room) return;
    room.busy = false;
    room.result = null;
    passTurn(room);
    broadcast(room);
  }, MISS_MS);
}

function flipCard(room, player, index) {
  if (room.phase !== 'playing' || room.busy || room.stage !== 'flip') return;
  const cur = room.players[room.turnIdx];
  if (!cur || cur.id !== player.id) return;
  if (!Number.isInteger(index) || index < 0 || index >= room.cards.length) return;
  const card = room.cards[index];
  if (card.state !== 0) return;

  card.state = 1;
  room.flipped.push(index);
  observe(room, index);

  const a = analyze(room.flipped.map((i) => room.cards[i].type));
  const downLeft = room.cards.some((c) => c.state === 0);

  if (a.valid && a.extendable && downLeft) {
    // 役ができた。やめる？続ける？
    room.stage = 'choice';
    room.current = a.valid;
    broadcast(room);
    return;
  }
  if (a.valid) { doTake(room); return; }           // これ以上大きくならない → 自動で取る
  if (a.possible && downLeft) { broadcast(room); return; } // まだ役になれる → 続けてめくる
  doFail(room);
}

function startGame(room) {
  room.cards = buildDeck();
  room.players.forEach((p) => { p.score = 0; if (p.bot) p.mem = new Map(); });
  const act = room.players.filter(isActive);
  const first = act[crypto.randomInt(act.length)];
  room.turnIdx = room.players.indexOf(first);
  room.phase = 'playing';
  room.flipped = [];
  room.busy = false;
  room.result = null;
  resetTurn(room);
  room.message = `${first.name}さんから始めます`;
}

function leaveRoom(room, player) {
  if (room.phase === 'lobby') {
    room.players = room.players.filter((p) => p !== player);
  } else {
    player.left = true;
    player.connected = false;
  }
  player.sid = null;
  if (!room.players.some((p) => !p.bot && !p.left)) {
    deleteRoom(room);
    return false;
  }
  ensureHost(room);
  const cur = room.players[room.turnIdx];
  if (room.phase === 'playing' && cur === player && !room.busy) passTurn(room);
  return true;
}

function ctxOf(socket) {
  const { pw, playerId } = socket.data || {};
  if (!pw) return null;
  const room = rooms.get(pw);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId && !p.left);
  if (!player) return null;
  return { room, player };
}

function attach(socket, room, player) {
  if (player.sid && player.sid !== socket.id) {
    const old = io.sockets.sockets.get(player.sid);
    if (old) { old.data = {}; old.leave(roomKey(room)); }
  }
  player.sid = socket.id;
  player.connected = true;
  socket.data = { pw: room.pw, playerId: player.id };
  socket.join(roomKey(room));
}

// ---- Socket -----------------------------------------------------------
io.on('connection', (socket) => {
  socket.data = {};

  socket.on('create', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    if (ctxOf(socket)) return cb({ ok: false, error: 'すでに部屋に入っています' });
    const name = clean(data && data.name, MAX_NAME);
    const pw = clean(data && data.pw, MAX_PW);
    if (!name) return cb({ ok: false, error: '名前を入力してください' });
    if (!pw) return cb({ ok: false, error: 'パスワードを入力してください' });
    if (rooms.has(pw)) return cb({ ok: false, error: 'そのパスワードの部屋はすでにあります' });
    const player = { id: newId(), name, sid: null, score: 0, connected: true, left: false };
    const room = {
      pw, phase: 'lobby', hostId: player.id, players: [player],
      cards: [], turnIdx: 0, flipped: [], busy: false, result: null,
      stage: 'flip', current: null, last: null, lost: null, botTimer: null,
      message: '', timer: null, updated: Date.now(),
    };
    rooms.set(pw, room);
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('join', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    if (ctxOf(socket)) return cb({ ok: false, error: 'すでに部屋に入っています' });
    const name = clean(data && data.name, MAX_NAME);
    const pw = clean(data && data.pw, MAX_PW);
    if (!name) return cb({ ok: false, error: '名前を入力してください' });
    if (!pw) return cb({ ok: false, error: 'パスワードを入力してください' });
    const room = rooms.get(pw);
    if (!room) return cb({ ok: false, error: 'その部屋は見つかりません' });
    if (room.phase !== 'lobby') return cb({ ok: false, error: 'ゲーム中の部屋には入れません' });
    if (room.players.length >= MAX_PLAYERS) return cb({ ok: false, error: `満員です（最大${MAX_PLAYERS}人）` });
    if (room.players.some((p) => p.name === name)) return cb({ ok: false, error: '同じ名前の人がいます。名前を変えてください' });
    const player = { id: newId(), name, sid: null, score: 0, connected: true, left: false };
    room.players.push(player);
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('resume', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const pw = clean(data && data.pw, MAX_PW);
    const room = rooms.get(pw);
    const player = room && room.players.find((p) => p.id === (data && data.playerId) && !p.left);
    if (!player) return cb({ ok: false });
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('leave', (_data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const ctx = ctxOf(socket);
    if (!ctx) return cb({ ok: true });
    const { room, player } = ctx;
    socket.leave(roomKey(room));
    socket.data = {};
    if (leaveRoom(room, player)) broadcast(room);
    cb({ ok: true });
  });

  socket.on('start', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    if (room.phase !== 'lobby' || room.hostId !== player.id) return;
    if (room.players.filter(isActive).length < MIN_PLAYERS) return;
    startGame(room);
    broadcast(room);
  });

  socket.on('again', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    if (room.phase !== 'finished' || room.hostId !== player.id) return;
    room.players = room.players.filter((p) => !p.left);
    room.players.forEach((p) => { p.score = 0; if (p.bot) p.mem = new Map(); });
    room.cards = [];
    resetTurn(room);
    room.phase = 'lobby';
    room.message = '';
    ensureHost(room);
    broadcast(room);
  });

  socket.on('addBot', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const ctx = ctxOf(socket);
    if (!ctx) return cb({ ok: false });
    const { room, player } = ctx;
    if (room.phase !== 'lobby' || room.hostId !== player.id) return cb({ ok: false });
    const level = data && data.level;
    if (!LEVELS[level]) return cb({ ok: false });
    if (room.players.length >= MAX_PLAYERS) return cb({ ok: false, error: `満員です（最大${MAX_PLAYERS}人）` });
    const base = LEVELS[level].label + 'AI';
    let name = base;
    for (let n = 2; room.players.some((p) => p.name === name); n++) name = base + n;
    room.players.push({
      id: newId(), name, bot: true, level, mem: new Map(),
      sid: null, score: 0, connected: true, left: false,
    });
    broadcast(room);
    cb({ ok: true });
  });

  socket.on('removeBot', (id) => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    if (room.phase !== 'lobby' || room.hostId !== player.id) return;
    const before = room.players.length;
    room.players = room.players.filter((p) => !(p.bot && p.id === id));
    if (room.players.length !== before) broadcast(room);
  });

  socket.on('take', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    const cur = room.players[room.turnIdx];
    if (room.phase !== 'playing' || room.busy || room.stage !== 'choice') return;
    if (!cur || cur.id !== player.id) return;
    doTake(room);
  });

  socket.on('continue', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    const cur = room.players[room.turnIdx];
    if (room.phase !== 'playing' || room.busy || room.stage !== 'choice') return;
    if (!cur || cur.id !== player.id) return;
    room.lost = room.current;   // これ以降しっぱいすると、この役は取れなくなる
    room.current = null;
    room.stage = 'flip';
    broadcast(room);
  });

  socket.on('flip', (index) => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    flipCard(ctx.room, ctx.player, index);
  });

  socket.on('disconnect', () => {
    const { pw, playerId } = socket.data || {};
    const room = pw && rooms.get(pw);
    const player = room && room.players.find((p) => p.id === playerId);
    if (!player || player.sid !== socket.id) return;
    player.connected = false;
    player.sid = null;
    ensureHost(room);
    const cur = room.players[room.turnIdx];
    if (room.phase === 'playing' && cur === player && !room.busy) passTurn(room);
    broadcast(room);
  });
});

// 誰も接続していない部屋を掃除
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.players.filter((p) => !p.bot).every((p) => !p.connected) && now - room.updated > IDLE_MS) deleteRoom(room);
  }
}, 60 * 1000);

server.listen(PORT, () => console.log(`listening on ${PORT}`));
