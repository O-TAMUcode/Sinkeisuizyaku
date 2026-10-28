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
const HTML = "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>化学式神経衰弱</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;800;900&display=swap\" rel=\"stylesheet\">\n<style>\n:root{\n  --navy:#1d3a8a;\n  --ink:#16224a;\n  --bg:#eef3fa;\n  --line:#c9d6ec;\n  --accent:#f5a31a;\n  --accent-d:#d98a08;\n  --ok:#1f9d5a;\n  --muted:#6a7799;\n  --safe-t:env(safe-area-inset-top,0px);\n  --safe-b:env(safe-area-inset-bottom,0px);\n}\n*{box-sizing:border-box}\nhtml,body{margin:0}\nbody{\n  min-height:100vh;min-height:100dvh;\n  font-family:\"M PLUS Rounded 1c\",\"Hiragino Maru Gothic ProN\",\"Yu Gothic\",sans-serif;\n  font-weight:500;color:var(--ink);background-color:var(--bg);\n  background-image:url(\"data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d9e3f3' fill-rule='evenodd'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/svg%3E\");\n  padding:calc(12px + var(--safe-t)) 14px calc(20px + var(--safe-b));\n}\n.wrap{max-width:980px;margin:0 auto}\nh1{margin:0;font-weight:900;color:var(--navy);letter-spacing:.02em}\nbutton{font:inherit}\n.hidden{display:none!important}\n\n/* ---- ロゴの輪 ---- */\n.hero{display:flex;flex-direction:column;align-items:center;gap:6px;margin:8px 0 18px}\n#ring{position:relative;width:176px;aspect-ratio:1;container-type:inline-size}\n.ring-atom{position:absolute;width:23%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;\n  display:grid;place-items:center;font-weight:900;font-size:8.4cqw;line-height:1;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);\n  box-shadow:0 1px 3px rgba(0,0,0,.25)}\n.ring-c{position:absolute;inset:0;display:grid;place-items:center;text-align:center;\n  font-weight:900;font-size:11cqw;line-height:1.15;color:var(--navy)}\n.hero h1{font-size:30px}\nbody[data-screen=\"lobby\"] .hero,body[data-screen=\"game\"] .hero{flex-direction:row;justify-content:flex-start;margin:0 0 10px}\nbody[data-screen=\"lobby\"] #ring,body[data-screen=\"game\"] #ring{display:none}\nbody[data-screen=\"lobby\"] .hero h1,body[data-screen=\"game\"] .hero h1{font-size:19px}\n\n/* ---- 共通パーツ ---- */\n.screen{display:none}\n.screen.active{display:block}\n.panel{max-width:440px;margin:0 auto;background:#fff;border:3px solid var(--navy);border-radius:20px;padding:22px 20px}\n.panel h2{margin:0 0 14px;font-size:20px;font-weight:900;color:var(--navy)}\nlabel{display:block;font-weight:800;margin-bottom:6px}\ninput[type=text]{width:100%;font:inherit;font-weight:800;font-size:18px;padding:12px 14px;border:3px solid var(--line);border-radius:12px;background:#fff;color:var(--ink)}\ninput[type=text]:focus{outline:none;border-color:var(--navy)}\n.btn{display:block;width:100%;font-weight:900;font-size:18px;padding:14px 20px;border-radius:999px;border:3px solid var(--navy);background:#fff;color:var(--navy);cursor:pointer;margin-top:12px}\n.btn.primary{background:var(--accent);box-shadow:0 4px 0 var(--accent-d)}\n.btn.primary:active{transform:translateY(3px);box-shadow:0 1px 0 var(--accent-d)}\n.btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;transform:none}\n.btn.small{display:inline-block;width:auto;font-size:14px;padding:8px 16px;margin:0;border-width:2px}\n.btn.link{border:0;background:none;color:var(--muted);text-decoration:underline;font-size:14px;font-weight:800;padding:8px}\n:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\n.err{color:#c62828;font-weight:800;min-height:1.4em;margin:10px 0 0;font-size:14px}\n.note{color:var(--muted);font-size:14px;margin:8px 0 0}\n.hello{margin:0 0 14px;font-weight:800}\n.hello b{color:var(--navy)}\n\n/* ---- ロビー ---- */\n.lobby-grid{display:grid;gap:14px;grid-template-columns:1fr}\n@media(min-width:760px){.lobby-grid{grid-template-columns:1fr 1fr;align-items:start}}\n.box{background:#fff;border:3px solid var(--line);border-radius:18px;padding:16px}\n.box h3{margin:0 0 10px;font-size:16px;font-weight:900;color:var(--navy)}\n.room-pw{font-size:26px;font-weight:900;color:var(--navy);word-break:break-all}\n.players{list-style:none;margin:0;padding:0;display:grid;gap:8px}\n.players li{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:var(--bg);border-radius:12px;font-weight:800}\n.tag{font-size:12px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--navy);color:#fff}\n.tag.off{background:var(--muted)}\n.tag.me{background:var(--accent);color:var(--ink)}\n.deck{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}\n.deck li{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px}\n.mini{width:30px;aspect-ratio:1;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:12px;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);box-shadow:0 1px 2px rgba(0,0,0,.25)}\n.rules{margin:0;padding-left:1.2em;display:grid;gap:6px;font-size:14px}\n.lobby-actions{max-width:440px;margin:16px auto 0}\n\n/* ---- ゲーム ---- */\n.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}\n.score{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px;flex:1}\n.chip{display:flex;align-items:baseline;gap:6px;padding:6px 12px;border-radius:999px;background:#fff;border:3px solid var(--line);font-weight:800;font-size:14px}\n.chip b{font-size:18px;font-weight:900}\n.chip.turn{border-color:var(--accent);background:#fff6df;box-shadow:0 0 0 3px rgba(245,163,26,.25)}\n.chip.off{opacity:.5}\n.status{margin:6px 0 10px;min-height:2.2em;font-weight:900;font-size:18px;color:var(--navy);display:flex;align-items:center;gap:10px;flex-wrap:wrap}\n.status.mine{color:#b86e00}\n.status.match{color:var(--ok)}\n.status small{font-size:13px;color:var(--muted);font-weight:800}\n\n.board{--cols:8;display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:clamp(3px,.9vw,8px);width:100%;margin:0 auto}\n@media(min-width:760px){\n  .board{--cols:10;max-width:min(100%,max(520px,calc((100vh - 230px)/1.16)));max-width:min(100%,max(520px,calc((100dvh - 230px)/1.16)))}\n}\n.card{container-type:inline-size;aspect-ratio:5/7;padding:0;border:0;background:none;cursor:pointer;perspective:700px;-webkit-tap-highlight-color:transparent}\n.card .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .45s ease}\n.card.up .inner{transform:rotateY(180deg)}\n.board:not(.locked) .card:not(.up):hover .inner{transform:translateY(-3px)}\n.board.locked .card{cursor:default}\n.card.gone{opacity:0;pointer-events:none;transition:opacity .4s .1s}\n.card.reveal{opacity:.5}\n.face{position:absolute;inset:0;border-radius:9cqw;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}\n.back{\n  background-color:var(--navy);\n  background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg%3E%3Ccircle cx='50' cy='18' r='7.5' fill='%23f59a23'/%3E%3Ccircle cx='68.8' cy='24.1' r='7.5' fill='%233cb371'/%3E%3Ccircle cx='80.4' cy='40.1' r='7.5' fill='%23222'/%3E%3Ccircle cx='80.4' cy='59.9' r='7.5' fill='%23f6e33b'/%3E%3Ccircle cx='68.8' cy='75.9' r='7.5' fill='%23b8b8b8'/%3E%3Ccircle cx='50' cy='82' r='7.5' fill='%23d6283a'/%3E%3Ccircle cx='31.2' cy='75.9' r='7.5' fill='%238e5bb5'/%3E%3Ccircle cx='19.6' cy='59.9' r='7.5' fill='%232a4ea6'/%3E%3Ccircle cx='19.6' cy='40.1' r='7.5' fill='%23e83e96'/%3E%3Ccircle cx='31.2' cy='24.1' r='7.5' fill='%233da5e8'/%3E%3C/g%3E%3C/svg%3E\");\n  background-size:92% auto;background-position:center;background-repeat:no-repeat;\n  border:3cqw solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}\n.front{transform:rotateY(180deg);background:var(--bg-c);color:var(--fg);display:flex;flex-direction:column;gap:4cqw;padding:7cqw 7cqw 8cqw;box-shadow:0 1px 3px rgba(0,0,0,.25);border:1px solid rgba(0,0,0,.08)}\n.front.blank{border:2px solid #c3cde3}\n.jp{font-size:13cqw;font-weight:800;line-height:1.1;text-align:center;white-space:nowrap}\n.jp.long{font-size:9.5cqw}\n.plate{flex:1;background:#fff;border-radius:5cqw;display:grid;place-items:center;min-height:0}\n.orb{width:68cqw;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:32cqw;line-height:1;\n  background:radial-gradient(circle at 34% 30%,var(--hi),var(--lo));color:var(--atom-ink);box-shadow:inset 0 -4cqw 8cqw rgba(0,0,0,.14)}\n.orb.two{font-size:27cqw}\n.orb.rainbow{background:conic-gradient(#ef5350,#ffca28,#66bb6a,#26c6da,#5c6bc0,#ab47bc,#ef5350);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)}\n@container (max-width:52px){.jp{display:none}.front{padding:6cqw}.orb{width:80cqw}}\n.board.match .card.up .front{box-shadow:inset 0 0 0 4cqw var(--ok)}\n\n.result{max-width:520px;margin:16px auto 0;background:#fff;border:3px solid var(--navy);border-radius:20px;padding:18px}\n.result h2{margin:0 0 10px;font-size:20px;font-weight:900;color:var(--navy)}\n.rank{list-style:none;margin:0;padding:0;display:grid;gap:8px}\n.rank li{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;background:var(--bg);font-weight:800}\n.rank li.win{background:#fff0c9;border:2px solid var(--accent)}\n.rank .n{width:2.4em;font-weight:900;color:var(--navy)}\n.rank .s{margin-left:auto;font-weight:900;font-size:18px}\n\n#toast{position:fixed;left:50%;bottom:calc(24px + var(--safe-b));transform:translateX(-50%);background:var(--ink);color:#fff;\n  padding:10px 18px;border-radius:999px;font-weight:800;font-size:14px;opacity:0;pointer-events:none;transition:opacity .25s;z-index:10;max-width:90vw;text-align:center}\n#toast.show{opacity:1}\n@media(prefers-reduced-motion:reduce){.card .inner{transition:none}.card.gone{transition:none}}\n</style>\n</head>\n<body data-screen=\"name\">\n<div class=\"wrap\">\n  <header class=\"hero\">\n    <div id=\"ring\"></div>\n    <h1>化学式神経衰弱</h1>\n  </header>\n\n  <!-- 名前 -->\n  <section id=\"s-name\" class=\"screen active\">\n    <form class=\"panel\" id=\"f-name\" autocomplete=\"off\">\n      <h2>あなたの名前を決めよう</h2>\n      <label for=\"in-name\">名前</label>\n      <input type=\"text\" id=\"in-name\" maxlength=\"12\" placeholder=\"12文字まで\" required>\n      <button class=\"btn primary\" type=\"submit\">決定</button>\n    </form>\n  </section>\n\n  <!-- メニュー -->\n  <section id=\"s-menu\" class=\"screen\">\n    <div class=\"panel\">\n      <p class=\"hello\"><b id=\"hello-name\"></b> さん</p>\n      <button class=\"btn primary\" id=\"b-create\" type=\"button\">部屋を作る</button>\n      <button class=\"btn\" id=\"b-join\" type=\"button\">部屋に入る</button>\n      <div style=\"text-align:center;margin-top:8px\"><button class=\"btn link\" id=\"b-rename\" type=\"button\">名前を変える</button></div>\n    </div>\n  </section>\n\n  <!-- パスワード -->\n  <section id=\"s-pw\" class=\"screen\">\n    <form class=\"panel\" id=\"f-pw\" autocomplete=\"off\">\n      <h2 id=\"pw-title\"></h2>\n      <label for=\"in-pw\">パスワード</label>\n      <input type=\"text\" id=\"in-pw\" maxlength=\"20\" required>\n      <p class=\"note\" id=\"pw-note\"></p>\n      <p class=\"err\" id=\"pw-err\" role=\"alert\"></p>\n      <button class=\"btn primary\" type=\"submit\" id=\"pw-submit\"></button>\n      <button class=\"btn\" type=\"button\" id=\"pw-back\">戻る</button>\n    </form>\n  </section>\n\n  <!-- ロビー -->\n  <section id=\"s-lobby\" class=\"screen\">\n    <div class=\"lobby-grid\">\n      <div class=\"box\">\n        <h3>部屋のパスワード</h3>\n        <div class=\"room-pw\" id=\"lobby-pw\"></div>\n        <p class=\"note\">このパスワードを友だちに伝えよう</p>\n        <h3 style=\"margin-top:16px\">参加者 <span id=\"lobby-count\"></span></h3>\n        <ul class=\"players\" id=\"lobby-players\"></ul>\n      </div>\n      <div class=\"box\">\n        <h3>あそびかた</h3>\n        <ol class=\"rules\">\n          <li>順番に2枚めくる。同じ原子ならペア成立で、もう一度めくれる。</li>\n          <li>オールマイティーはどの原子ともペアになる（オールマイティーどうしもOK）。</li>\n          <li>ペアが作れなくなったら終了。ペアが多い人の勝ち。</li>\n        </ol>\n        <h3 style=\"margin-top:16px\">カードの枚数</h3>\n        <ul class=\"deck\" id=\"lobby-deck\"></ul>\n      </div>\n    </div>\n    <div class=\"lobby-actions\">\n      <button class=\"btn primary\" id=\"b-start\" type=\"button\">ゲームを始める</button>\n      <p class=\"note\" id=\"start-note\" style=\"text-align:center\"></p>\n      <button class=\"btn\" id=\"b-leave-lobby\" type=\"button\">部屋を出る</button>\n    </div>\n  </section>\n\n  <!-- ゲーム -->\n  <section id=\"s-game\" class=\"screen\">\n    <div class=\"topbar\">\n      <ul class=\"score\" id=\"score\"></ul>\n      <button class=\"btn small\" id=\"b-leave-game\" type=\"button\">部屋を出る</button>\n    </div>\n    <div class=\"status\" id=\"status\"></div>\n    <div class=\"board locked\" id=\"board\"></div>\n    <div class=\"result hidden\" id=\"result\">\n      <h2>けっか</h2>\n      <ol class=\"rank\" id=\"rank\"></ol>\n      <button class=\"btn primary\" id=\"b-again\" type=\"button\">もう一度あそぶ</button>\n      <p class=\"note hidden\" id=\"again-note\" style=\"text-align:center\">部屋主がもう一度始めるのを待っています</p>\n      <button class=\"btn\" id=\"b-leave-result\" type=\"button\">部屋を出る</button>\n    </div>\n  </section>\n</div>\n<div id=\"toast\" role=\"status\"></div>\n\n<script src=\"/socket.io/socket.io.js\"></script>\n<script>\n(function(){\n'use strict';\n\n/* サーバー経由で開いていない（ファイルを直接開いた等）場合の案内 */\nif(typeof io === 'undefined'){\n  var m = document.createElement('div');\n  m.style.cssText = 'max-width:480px;margin:40px auto;padding:20px;background:#fff;border:3px solid #1d3a8a;border-radius:16px;font-weight:800;line-height:1.7';\n  m.innerHTML = 'サーバーにつながっていません。<br>このファイルを直接開かず、Renderで公開したURL（またはnpm startしたlocalhost）から開いてください。';\n  document.body.innerHTML = '';\n  document.body.appendChild(m);\n  return;\n}\n\n/* ---- 原子データ ---- */\nvar ATOM = {\n  H:    {sym:'H',  jp:'水素',      bg:'#3aa3e6', hi:'#b3e0fb', lo:'#2b8ad4', ink:'#17489a', fg:'#fff'},\n  O:    {sym:'O',  jp:'酸素',      bg:'#f0a030', hi:'#ffd69a', lo:'#e8841a', ink:'#9a4310', fg:'#fff'},\n  C:    {sym:'C',  jp:'炭素',      bg:'#26211f', hi:'#9a9a9a', lo:'#0f0d0d', ink:'#fff',    fg:'#fff'},\n  N:    {sym:'N',  jp:'窒素',      bg:'#1c3f94', hi:'#c0caf5', lo:'#3149a8', ink:'#142a7a', fg:'#fff'},\n  Cl:   {sym:'Cl', jp:'塩素',      bg:'#34a06a', hi:'#bdf0d1', lo:'#2f9c60', ink:'#13693a', fg:'#fff'},\n  Na:   {sym:'Na', jp:'ナトリウム', bg:'#e8509e', hi:'#fcc1de', lo:'#e0408f', ink:'#a90f5a', fg:'#fff'},\n  Ag:   {sym:'Ag', jp:'銀',        bg:'#b9bcc2', hi:'#f4f4f4', lo:'#8b8e94', ink:'#4b4e55', fg:'#222'},\n  Fe:   {sym:'Fe', jp:'鉄',        bg:'#8e63b5', hi:'#e0cbf3', lo:'#7a4aa5', ink:'#4a2279', fg:'#fff'},\n  Cu:   {sym:'Cu', jp:'銅',        bg:'#d6283a', hi:'#f8aab1', lo:'#c01f30', ink:'#7a0a18', fg:'#fff'},\n  S:    {sym:'S',  jp:'硫黄',      bg:'#f6e33b', hi:'#fffbb8', lo:'#f0d01a', ink:'#4d4708', fg:'#3a3600'},\n  BLANK:{sym:'★', jp:'オールマイティー', bg:'#ffffff', hi:'#ffffff', lo:'#e6ebf5', ink:'#fff',    fg:'#333', blank:true}\n};\nfunction atomVars(el, t){\n  var a = ATOM[t]; if(!a) return;\n  el.style.setProperty('--hi', a.hi);\n  el.style.setProperty('--lo', a.lo);\n  el.style.setProperty('--atom-ink', a.ink);\n}\n\n/* ---- ヘルパー ---- */\nfunction $(s){ return document.querySelector(s); }\nfunction h(tag, cls, text){\n  var e = document.createElement(tag);\n  if(cls) e.className = cls;\n  if(text !== undefined) e.textContent = text;\n  return e;\n}\nfunction store(key, val){\n  try{\n    if(val === undefined) return JSON.parse(localStorage.getItem(key));\n    if(val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));\n  }catch(e){ return null; }\n}\nvar toastTimer;\nfunction toast(msg){\n  var t = $('#toast'); t.textContent = msg; t.classList.add('show');\n  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2600);\n}\nfunction show(name){\n  document.body.dataset.screen = name;\n  ['name','menu','pw','lobby','game'].forEach(function(n){\n    $('#s-'+n).classList.toggle('active', n === name);\n  });\n}\n\n/* ---- ロゴの輪 ---- */\n(function buildRing(){\n  var ring = $('#ring');\n  ['O','Cl','C','S','Ag','Cu','Fe','N','Na','H'].forEach(function(t,i){\n    var a = i*36*Math.PI/180;\n    var d = h('span','ring-atom',ATOM[t].sym);\n    d.style.left = (50 + 38*Math.sin(a)) + '%';\n    d.style.top  = (50 - 38*Math.cos(a)) + '%';\n    atomVars(d,t);\n    ring.appendChild(d);\n  });\n  var c = h('div','ring-c'); c.innerHTML = 'Atom<br>Model<br>Cards';\n  ring.appendChild(c);\n})();\n\n/* ---- 状態 ---- */\nvar socket = io();\nvar myName = store('memo_name') || '';\nvar session = store('memo_session');   // {playerId, pw}\nvar mode = 'create';\nvar st = null;\nvar board = $('#board');\n\nfunction goStart(){ show(myName ? 'menu' : 'name'); $('#hello-name').textContent = myName; }\ngoStart();\n\n/* ---- 名前 ---- */\n$('#f-name').addEventListener('submit', function(e){\n  e.preventDefault();\n  var v = $('#in-name').value.trim();\n  if(!v) return;\n  myName = Array.from(v).slice(0,12).join('');\n  store('memo_name', myName);\n  goStart();\n});\n$('#b-rename').addEventListener('click', function(){\n  $('#in-name').value = myName; show('name'); $('#in-name').focus();\n});\n\n/* ---- メニュー ---- */\nfunction openPw(m){\n  mode = m;\n  $('#pw-title').textContent = m === 'create' ? '部屋を作る' : '部屋に入る';\n  $('#pw-note').textContent = m === 'create' ? '好きなパスワードを決めよう。友だちにはこれを伝える。' : '部屋を作った人に聞いたパスワードを入力しよう。';\n  $('#pw-submit').textContent = m === 'create' ? '部屋を作る' : '入室する';\n  $('#pw-err').textContent = '';\n  $('#in-pw').value = '';\n  show('pw'); $('#in-pw').focus();\n}\n$('#b-create').addEventListener('click', function(){ openPw('create'); });\n$('#b-join').addEventListener('click', function(){ openPw('join'); });\n$('#pw-back').addEventListener('click', goStart);\n\n$('#f-pw').addEventListener('submit', function(e){\n  e.preventDefault();\n  var pw = $('#in-pw').value.trim();\n  if(!pw) return;\n  $('#pw-submit').disabled = true;\n  socket.emit(mode, {name: myName, pw: pw}, function(res){\n    $('#pw-submit').disabled = false;\n    if(!res || !res.ok){ $('#pw-err').textContent = (res && res.error) || 'うまくいきませんでした'; return; }\n    session = {playerId: res.playerId, pw: res.pw};\n    store('memo_session', session);\n  });\n});\n\n/* ---- 退出 ---- */\nfunction leave(ask){\n  if(ask && !confirm('部屋を出ますか？')) return;\n  session = null; store('memo_session', null);\n  socket.emit('leave', null, function(){});\n  st = null; board.innerHTML = '';\n  goStart();\n}\n$('#b-leave-lobby').addEventListener('click', function(){ leave(false); });\n$('#b-leave-game').addEventListener('click', function(){ leave(st && st.phase === 'playing'); });\n$('#b-leave-result').addEventListener('click', function(){ leave(false); });\n$('#b-start').addEventListener('click', function(){ socket.emit('start'); });\n$('#b-again').addEventListener('click', function(){ socket.emit('again'); });\n\n/* ---- 通信 ---- */\nsocket.on('connect', function(){\n  if(session){\n    socket.emit('resume', session, function(res){\n      if(!res || !res.ok){\n        var inRoom = document.body.dataset.screen === 'lobby' || document.body.dataset.screen === 'game';\n        session = null; store('memo_session', null); st = null; board.innerHTML = '';\n        if(inRoom){ toast('部屋が見つかりませんでした'); goStart(); }\n      }\n    });\n  }\n});\nsocket.on('disconnect', function(){ toast('接続が切れました。つなぎ直しています…'); });\nsocket.on('closed', function(){\n  if(!session) return;\n  session = null; store('memo_session', null); st = null; board.innerHTML = '';\n  toast('部屋が閉じられました'); goStart();\n});\nsocket.on('state', function(s){\n  if(!session) return;\n  st = s;\n  render();\n});\n\n/* ---- 描画 ---- */\nfunction me(){ return st && st.players.find(function(p){ return p.id === session.playerId; }); }\n\nfunction render(){\n  if(st.phase === 'lobby'){\n    board.innerHTML = '';\n    show('lobby'); renderLobby();\n  } else {\n    show('game'); renderGame();\n  }\n}\n\nfunction playerRow(p){\n  var li = h('li');\n  li.appendChild(h('span','',p.name));\n  if(p.id === st.hostId) li.appendChild(h('span','tag','部屋主'));\n  if(p.id === session.playerId) li.appendChild(h('span','tag me','あなた'));\n  if(!p.connected) li.appendChild(h('span','tag off','接続切れ'));\n  return li;\n}\n\nfunction renderLobby(){\n  $('#lobby-pw').textContent = st.pw;\n  var act = st.players.filter(function(p){ return p.connected; }).length;\n  $('#lobby-count').textContent = '（' + st.players.length + '/' + st.limits.max + '人）';\n  var ul = $('#lobby-players'); ul.innerHTML = '';\n  st.players.forEach(function(p){ ul.appendChild(playerRow(p)); });\n\n  var deck = $('#lobby-deck'); deck.innerHTML = '';\n  st.deck.forEach(function(d){\n    var a = ATOM[d.t]; if(!a) return;\n    var li = h('li');\n    var m = h('span','mini', a.sym); atomVars(m, d.t);\n    if(a.blank) m.style.background = 'conic-gradient(#ef5350,#ffca28,#66bb6a,#26c6da,#5c6bc0,#ab47bc,#ef5350)';\n    li.appendChild(m);\n    li.appendChild(h('span','', a.jp + ' ×' + d.n));\n    deck.appendChild(li);\n  });\n\n  var isHost = st.hostId === session.playerId;\n  var btn = $('#b-start');\n  btn.classList.toggle('hidden', !isHost);\n  btn.disabled = act < st.limits.min;\n  $('#start-note').textContent = isHost\n    ? (act < st.limits.min ? st.limits.min + '人以上そろうと始められます' : '')\n    : '部屋主が始めるのを待っています';\n}\n\nfunction buildBoard(n){\n  board.innerHTML = '';\n  for(var i=0;i<n;i++){\n    var b = h('button','card'); b.type = 'button'; b.dataset.i = i;\n    b.setAttribute('aria-label','カード ' + (i+1));\n    var inner = h('div','inner');\n    inner.appendChild(h('div','face back'));\n    inner.appendChild(h('div','face front'));\n    b.appendChild(inner);\n    board.appendChild(b);\n  }\n}\n\nfunction fillFront(front, t){\n  var a = ATOM[t]; if(!a) return;\n  front.innerHTML = '';\n  front.classList.toggle('blank', !!a.blank);\n  front.style.setProperty('--bg-c', a.bg);\n  front.style.setProperty('--fg', a.fg);\n  front.appendChild(h('div','jp' + (a.blank ? ' long' : ''), a.jp));\n  var plate = h('div','plate');\n  var orb = h('div','orb' + (a.sym.length > 1 ? ' two' : '') + (a.blank ? ' rainbow' : ''), a.sym);\n  atomVars(orb, t);\n  plate.appendChild(orb);\n  front.appendChild(plate);\n}\n\nfunction renderGame(){\n  var meId = session.playerId;\n\n  // スコア\n  var sc = $('#score'); sc.innerHTML = '';\n  st.players.forEach(function(p){\n    var li = h('li','chip' + (p.id === st.turnId ? ' turn' : '') + ((!p.connected || p.left) ? ' off' : ''));\n    li.appendChild(h('span','', p.name + (p.id === meId ? '（あなた）' : '')));\n    li.appendChild(h('b','', String(p.score)));\n    li.appendChild(h('span','', p.left ? '組・退出' : (!p.connected ? '組・接続切れ' : '組')));\n    sc.appendChild(li);\n  });\n\n  // ステータス\n  var stEl = $('#status'); stEl.innerHTML = '';\n  var cls = 'status';\n  var text = st.message;\n  var myTurn = st.phase === 'playing' && st.turnId === meId;\n  if(st.phase === 'playing' && !st.busy && myTurn){\n    text = 'あなたの番です。カードを2枚めくろう'; cls += ' mine';\n  } else if(st.result === 'match'){ cls += ' match'; }\n  stEl.className = cls;\n  stEl.appendChild(h('span','', text));\n  if(st.phase === 'playing') stEl.appendChild(h('small','', 'のこり ' + st.remaining + '枚'));\n\n  // ボード\n  if(board.children.length !== st.cards.length) buildBoard(st.cards.length);\n  board.classList.toggle('locked', !(myTurn && !st.busy));\n  board.classList.toggle('match', st.result === 'match');\n  st.cards.forEach(function(c, i){\n    var el = board.children[i];\n    var revealed = c.s === 0 && !!c.t;\n    el.classList.toggle('up', c.s === 1 || revealed);\n    el.classList.toggle('reveal', revealed);\n    el.classList.toggle('gone', c.s === 2);\n    el.disabled = c.s !== 0 || st.phase !== 'playing';\n    if(c.t && el.dataset.t !== c.t){\n      el.dataset.t = c.t;\n      fillFront(el.querySelector('.front'), c.t);\n    }\n    if(c.t) el.setAttribute('aria-label', ATOM[c.t] ? ATOM[c.t].jp : 'カード');\n    else el.setAttribute('aria-label', 'カード ' + (i+1));\n  });\n\n  // 結果\n  var res = $('#result');\n  res.classList.toggle('hidden', st.phase !== 'finished');\n  if(st.phase === 'finished'){\n    var rank = $('#rank'); rank.innerHTML = '';\n    var list = st.players.slice().sort(function(a,b){ return b.score - a.score; });\n    list.forEach(function(p){\n      var r = 1 + st.players.filter(function(q){ return q.score > p.score; }).length;\n      var li = h('li', r === 1 ? 'win' : '');\n      li.appendChild(h('span','n', r + '位'));\n      li.appendChild(h('span','', p.name + (p.id === meId ? '（あなた）' : '')));\n      li.appendChild(h('span','s', p.score + '組'));\n      rank.appendChild(li);\n    });\n    var isHost = st.hostId === meId;\n    $('#b-again').classList.toggle('hidden', !isHost);\n    $('#again-note').classList.toggle('hidden', isHost);\n    res.scrollIntoView({behavior:'smooth', block:'nearest'});\n  }\n}\n\nboard.addEventListener('click', function(e){\n  var b = e.target.closest('.card');\n  if(!b || !st || st.phase !== 'playing' || st.busy || st.turnId !== session.playerId) return;\n  var i = Number(b.dataset.i);\n  if(!st.cards[i] || st.cards[i].s !== 0) return;\n  socket.emit('flip', i);\n});\n\n})();\n</script>\n</body>\n</html>\n";
app.get('/', (_req, res) => res.type('html').send(HTML));
app.get('/healthz', (_req, res) => res.send('ok'));

// ---- 設定 -------------------------------------------------------------
const DECK = [
  ['H', 20], ['O', 15], ['C', 10],
  ['N', 5], ['Cl', 5], ['Na', 5], ['Ag', 5],
  ['Fe', 3], ['Cu', 3], ['S', 3],
  ['BLANK', 6], // 白紙 = オールマイティー
];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;
const MAX_NAME = 12;
const MAX_PW = 20;
const MATCH_MS = 1200; // ペア成立の表示時間
const MISS_MS = 1600;  // はずれの表示時間
const IDLE_MS = 10 * 60 * 1000; // 誰も接続していない部屋を消すまでの時間

const rooms = new Map();

// ---- ユーティリティ ---------------------------------------------------
const clean = (v, max) =>
  typeof v === 'string' ? Array.from(v.trim()).slice(0, max).join('') : '';
const newId = () => crypto.randomBytes(8).toString('hex');
const roomKey = (room) => 'room:' + room.pw;
const isActive = (p) => !!p && p.connected && !p.left;
const isMatch = (a, b) => a === 'BLANK' || b === 'BLANK' || a === b;

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

// まだペアを作れる組み合わせが残っているか
function hasMove(cards) {
  const rem = cards.filter((c) => c.state !== 2);
  if (rem.length < 2) return false;
  if (rem.some((c) => c.type === 'BLANK')) return true;
  const seen = new Set();
  for (const c of rem) {
    if (seen.has(c.type)) return true;
    seen.add(c.type);
  }
  return false;
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
    })),
    turnId: room.phase === 'playing' && cur ? cur.id : null,
    cards: room.cards.map((c) => ({
      s: c.state,
      t: c.state === 1 || (reveal && c.state === 0) ? c.type : undefined,
    })),
    busy: room.busy,
    result: room.result,
    message: room.message,
    remaining: room.cards.filter((c) => c.state !== 2).length,
    deck: DECK.map(([t, n]) => ({ t, n })),
    limits: { min: MIN_PLAYERS, max: MAX_PLAYERS },
  };
}

function broadcast(room) {
  room.updated = Date.now();
  io.to(roomKey(room)).emit('state', publicState(room));
}

function deleteRoom(room) {
  clearTimeout(room.timer);
  rooms.delete(room.pw);
  io.to(roomKey(room)).emit('closed');
}

function ensureHost(room) {
  const host = room.players.find((p) => p.id === room.hostId);
  if (isActive(host)) return;
  const next = room.players.find(isActive) || room.players.find((p) => !p.left);
  if (next) room.hostId = next.id;
}

// 次の人へ。めくっているカードは裏に戻す
function passTurn(room) {
  for (const i of room.flipped) if (room.cards[i].state === 1) room.cards[i].state = 0;
  room.flipped = [];
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
  const best = Math.max(...room.players.map((p) => p.score));
  const winners = room.players.filter((p) => p.score === best).map((p) => p.name);
  room.message = winners.length > 1
    ? `おしまい！ 同点：${winners.join('、')}`
    : `おしまい！ ${winners[0]}さんの勝ち`;
}

function flipCard(room, player, index) {
  if (room.phase !== 'playing' || room.busy) return;
  const cur = room.players[room.turnIdx];
  if (!cur || cur.id !== player.id) return;
  if (!Number.isInteger(index) || index < 0 || index >= room.cards.length) return;
  const card = room.cards[index];
  if (card.state !== 0) return;

  card.state = 1;
  room.flipped.push(index);

  if (room.flipped.length === 1) {
    room.message = `${cur.name}さんがもう1枚めくります`;
    broadcast(room);
    return;
  }

  room.busy = true;
  const [a, b] = room.flipped;
  const ok = isMatch(room.cards[a].type, room.cards[b].type);
  room.result = ok ? 'match' : 'miss';
  room.message = ok ? 'ペア成立！' : 'ちがった…';
  broadcast(room);

  room.timer = setTimeout(() => {
    if (rooms.get(room.pw) !== room) return;
    room.busy = false;
    room.result = null;
    if (ok) {
      room.cards[a].state = 2;
      room.cards[b].state = 2;
      room.flipped = [];
      cur.score += 1;
      if (!hasMove(room.cards)) {
        finishGame(room);
      } else if (isActive(cur)) {
        room.message = `${cur.name}さん、もう一度どうぞ`;
      } else {
        passTurn(room);
      }
    } else {
      passTurn(room);
    }
    broadcast(room);
  }, ok ? MATCH_MS : MISS_MS);
}

function startGame(room) {
  room.cards = buildDeck();
  room.players.forEach((p) => { p.score = 0; });
  const act = room.players.filter(isActive);
  const first = act[crypto.randomInt(act.length)];
  room.turnIdx = room.players.indexOf(first);
  room.phase = 'playing';
  room.flipped = [];
  room.busy = false;
  room.result = null;
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
  if (room.players.every((p) => p.left) || room.players.length === 0) {
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
    room.players.forEach((p) => { p.score = 0; });
    room.cards = [];
    room.phase = 'lobby';
    room.message = '';
    ensureHost(room);
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
    if (room.players.every((p) => !p.connected) && now - room.updated > IDLE_MS) deleteRoom(room);
  }
}, 60 * 1000);

server.listen(PORT, () => console.log(`listening on ${PORT}`));
