import React, { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════
   医学的タイミング根拠
   CoQ10・VitD・ルテイン : 脂溶性→朝食後30-40分（脂質で吸収3-4倍）
   B群               : 水溶性→食後すぐ（代謝回路を朝からON）
   VitC              : 水溶性4-6h排泄→午前＋就寝前の2回分割
   鉄                : VitCと同時→吸収率2-3倍UP
   Mg                : GABA受容体→就寝90分前が副交感切替の最適
   L-テアニン         : 30-60分で血中濃度ピーク→撮影・集中作業60分前
   L-カルニチン       : 代謝回路組込に2-2.5h→開演/撮影開始2.5h前
   CoQ10追加          : カルニチンと協働→開演2h前に追加
   VitC本番前         : コルチゾール抑制→開演1h前
   ── 翌日起床計算 ──
   終演+30min         : VitC②（クールダウン中）
   終演+60min         : Mg（帰宅後すぐ摂取）
   終演+150min        : 就寝目標（Mg摂取から90分後）
   就寝+15min         : 入眠潜時
   入眠+450min(5×90) : 翌日起床・最低ライン
   入眠+540min(6×90) : 翌日起床・理想ライン
═══════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;color:#f0ead6;font-family:'Noto Sans JP',sans-serif;min-height:100vh}
:root{
  --gold:#c9a84c;--gold-l:#e8c97a;--gold-d:#7a6028;
  --red:#c04a3a;--red-l:#e07060;
  --blue:#4a70c0;--green:#4a9060;--purple:#8060c0;
  --teal:#3a9090;--orange:#c07040;
  --bg:#0a0a0f;--bg2:#111118;--bg3:#1a1a24;--bg4:#222230;
  --txt:#f0ead6;--dim:#8a8070;--border:rgba(201,168,76,.2);
}
.light-mode{
  --bg:#f4f1ec;--bg2:#ffffff;--bg3:#edeae3;--bg4:#e4e0d6;
  --txt:#1a1614;--dim:#4a3e30;--border:rgba(140,100,40,.25);
  --gold:#8a6418;--gold-l:#6a4c10;--gold-d:#c9a84c;
  --red:#901e0e;--red-l:#a82a18;
  --blue:#1a4a8a;--green:#1a6a3a;--purple:#5a3a8a;
  --teal:#0a6868;--orange:#8a4a18;
}
/* ライトモード：未選択カードのテキストを見やすく */
.light-mode .job-btn .jn,
.light-mode .dm-btn .dn,
.light-mode .care-btn .cn { color:#3a3028; }
.light-mode .job-btn .js,
.light-mode .dm-btn .ds,
.light-mode .care-btn .cs { color:#6a5a48; opacity:1; }
.light-mode .job-label,
.light-mode .dm-wrap > div:first-child { color:#5a4a38; }
.light-mode .hdr-logo { color:#8a6418; opacity:1; }
.light-mode .hdr-title { color:#1a1614; }
.light-mode .hdr-title span { color:#8a6418; }
.light-mode .hdr-presents { color:#4a3e30; }
.light-mode .hdr-presents-name { color:#6a4c10; }
.light-mode .night-wrap { background:#edeae3; border-color:rgba(140,100,40,.2); }
.light-mode .night-lbl { color:#1a1614; }
.light-mode .night-sub { color:#4a3e30; }
.light-mode input[type="time"] { color:#1a1614; background:#fff; border-color:rgba(140,100,40,.25); }
.light-mode .irow-lbl { color:#4a3e30; }
.light-mode .irow-lbl.on { color:#1a1614; }
.light-mode body{background:#f7f5f2}
.light-mode .tl-item{background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.05)}
.light-mode .icard{background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.05)}
.light-mode .cl-pill-card{background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.05)}
.light-mode .badge{box-shadow:0 2px 10px rgba(0,0,0,.1)}
.light-mode .hdr{background:#fff;box-shadow:0 1px 12px rgba(0,0,0,.08)}
.light-mode .tabs{background:#fff;box-shadow:0 -1px 8px rgba(0,0,0,.06)}
.light-mode .macro-card.prot{background:#fff5f3;border:1px solid rgba(180,60,40,.12)}
.light-mode .macro-card.carb{background:#fffcf0;border:1px solid rgba(180,140,40,.12)}
.light-mode .macro-card.fat{background:#f3f7ff;border:1px solid rgba(60,100,180,.1)}

/* ─── ドラムロール時間ピッカー ─── */
.tp-wrap{position:relative;display:inline-flex;align-items:center;gap:2px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:2px 4px;cursor:pointer;user-select:none}
.tp-col{position:relative;height:36px;overflow:hidden;width:28px}
.tp-scroll{display:flex;flex-direction:column;transition:transform .15s ease}
.tp-item{height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--txt);font-variant-numeric:tabular-nums}
.tp-item.dim{color:var(--dim);font-size:13px;font-weight:400}
.tp-sep{font-size:16px;font-weight:700;color:var(--txt);padding:0 1px;line-height:36px}
.tp-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.45)}
.tp-sheet{background:var(--bg2);border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:16px 0 32px}
.tp-sheet-hdr{display:flex;justify-content:space-between;align-items:center;padding:0 20px 12px;border-bottom:1px solid var(--border)}
.tp-sheet-title{font-size:13px;font-weight:700;color:var(--txt)}
.tp-sheet-done{font-size:13px;font-weight:700;color:var(--gold);cursor:pointer;padding:4px 8px}
.tp-drum-wrap{display:flex;align-items:center;justify-content:center;gap:0;padding:16px 0;position:relative}
.tp-drum-col{width:80px;height:200px;overflow:hidden;position:relative;cursor:grab}
.tp-drum-col:active{cursor:grabbing}
.tp-drum-inner{display:flex;flex-direction:column;will-change:transform}
.tp-drum-item{height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--txt);transition:color .1s}
.tp-drum-item.selected{color:var(--gold-l);font-size:22px}
.tp-drum-item.dim1{color:var(--dim);font-size:18px;opacity:.7}
.tp-drum-item.dim2{color:var(--dim);font-size:15px;opacity:.4}
.tp-drum-sep{font-size:24px;font-weight:700;color:var(--txt);line-height:200px;padding:0 4px}
.tp-drum-line{position:absolute;left:0;right:0;top:80px;height:40px;border-top:2px solid var(--gold-d);border-bottom:2px solid var(--gold-d);pointer-events:none;border-radius:4px;background:rgba(201,168,76,.05)}

.light-mode .nextday-wrap{background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid rgba(0,0,0,.05)}
/* スケジュール管理 */
.sched-mgr{margin:0 18px 0;background:var(--bg3);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.sched-row{display:flex;align-items:center;gap:8px;padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.05)}
.sched-row:last-child{border-bottom:none}
.sched-date{font-size:11px;font-weight:700;color:var(--txt);min-width:72px}
.sched-date.today{color:var(--gold-l)}
.sched-shows{display:flex;flex-wrap:wrap;gap:4px;flex:1}
.sched-pill{font-size:9px;padding:2px 7px;border-radius:20px;background:rgba(192,74,58,.1);color:var(--red-l);border:1px solid rgba(192,74,58,.2)}
.sched-del{font-size:12px;color:var(--dim);cursor:pointer;padding:2px 6px;opacity:.6}
.tl-item.rehearsal_pre{border-left-color:#4a9060}
.tl-item.rehearsal_post{border-left-color:#4a9060}
.sched-del:hover{opacity:1}
.sched-add-btn{width:100%;padding:10px;font-size:11px;font-weight:700;color:var(--gold);background:transparent;border:none;cursor:pointer;font-family:"Noto Sans JP",sans-serif;letter-spacing:.05em}
/* ホーム画面追加バナー */
.home-banner{margin:10px 18px 0;padding:13px 15px;background:linear-gradient(135deg,rgba(74,112,192,.1),rgba(74,112,192,.05));border:1px solid rgba(74,112,192,.25);border-radius:12px;display:flex;gap:10px;align-items:flex-start}
.home-banner-icon{font-size:22px;flex-shrink:0}
.home-banner-body{flex:1}
.home-banner-title{font-size:12px;font-weight:700;color:var(--txt);margin-bottom:3px}
.home-banner-desc{font-size:10px;color:var(--dim);line-height:1.7}
.home-banner-close{font-size:14px;color:var(--dim);cursor:pointer;padding:2px;flex-shrink:0;opacity:.6}
.light-mode .care-btn,.light-mode .dm-btn,.light-mode .job-btn{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.care-btn.wing{border-color:rgba(74,144,192,.4)!important}
.care-btn.wing.active{background:rgba(74,144,192,.12);border-color:rgba(74,144,192,.5)}
.light-mode .tip-box,.light-mode .buy-section{background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.06)}
/* light mode theme toggle */
.theme-toggle{position:fixed;top:12px;right:16px;z-index:999;width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--bg3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.app{width:100%;min-height:100vh;background:var(--bg2)}
.curtain{width:100%;height:5px;background:linear-gradient(90deg,var(--gold-d),var(--gold),var(--gold-d))}

/* HEADER */
.hdr{padding:16px 20px 13px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.hdr-logo{font-size:10px;letter-spacing:.4em;color:var(--gold);opacity:.8;margin-bottom:3px}
.hdr-presents{font-size:9px;letter-spacing:.15em;color:var(--dim);margin-bottom:5px;display:flex;align-items:center;gap:5px}
.hdr-presents-name{color:var(--gold-l);font-weight:700;font-size:10px;letter-spacing:.08em}
.hdr-title{font-family:'Noto Sans JP',sans-serif;font-size:19px;font-weight:700;letter-spacing:.06em}
.hdr-title span{color:var(--gold)}

/* JOB TYPE */
.job-wrap{padding:12px 18px 0}
.job-label{font-size:10px;letter-spacing:.15em;color:var(--dim);margin-bottom:8px}
.job-row{display:flex;gap:8px}
.job-btn{flex:1;padding:11px 6px;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:var(--bg3);cursor:pointer;text-align:center;transition:all .25s;font-family:'Noto Sans JP',sans-serif}
.job-btn:active{transform:scale(.97)}
.job-btn .ji{font-size:18px;display:block;margin-bottom:4px}
.job-btn .jn{font-size:12px;font-weight:700;display:block;color:var(--dim)}
.job-btn .js{font-size:9px;display:block;margin-top:2px;color:var(--dim);opacity:.6}
.job-btn.stage.active{border-color:var(--gold-d);background:rgba(201,168,76,.09)}
.job-btn.stage.active .jn{color:var(--gold-l)}
.job-btn.video.active{border-color:var(--teal);background:rgba(58,144,144,.1)}
.job-btn.video.active .jn{color:#60c0c0}
.job-btn.music.active{border-color:var(--purple);background:rgba(128,96,192,.1)}
.job-btn.music.active .jn{color:#b090e0}

/* DAY MODE */
.dm-wrap{padding:10px 18px 0}
.dm-row{display:flex;gap:7px}
.dm-btn{flex:1;padding:11px 4px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:var(--bg3);cursor:pointer;text-align:center;transition:all .2s;font-family:'Noto Sans JP',sans-serif}
.dm-btn .di{font-size:16px;display:block;margin-bottom:3px}
.dm-btn .dn{font-size:11px;font-weight:700;display:block;color:var(--dim)}
.dm-btn .ds{font-size:9px;display:block;margin-top:1px;color:var(--dim);opacity:.6}
.dm-btn.cond.active{border-color:#4a9060;background:rgba(74,144,96,.12)}
.dm-btn.cond.active .dn{color:#6abf80}
.dm-btn.both.active{border-color:var(--gold-d);background:rgba(201,168,76,.08)}
.dm-btn.both.active .dn{color:var(--gold-l)}
.dm-btn.boost.active{border-color:var(--red);background:rgba(192,74,58,.1)}
.dm-btn.boost.active .dn{color:var(--red-l)}

/* CARE LEVEL */
.care-wrap{padding:10px 18px 0}
.care-row{display:flex;gap:8px}
.care-btn{flex:1;padding:12px 8px;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:var(--bg3);cursor:pointer;text-align:center;transition:all .2s;font-family:'Noto Sans JP',sans-serif}
.care-btn .ci{font-size:18px;display:block;margin-bottom:4px}
.care-btn .cn{font-size:12px;font-weight:700;display:block;color:var(--dim);letter-spacing:.03em}
.care-btn .cs{font-size:9px;display:block;margin-top:2px;color:var(--dim);opacity:.6;line-height:1.4}
.care-btn.full.active{border-color:var(--gold-d);background:rgba(201,168,76,.09)}
.care-btn.full.active .cn{color:var(--gold-l)}
.care-btn.essential.active{border-color:var(--blue);background:rgba(74,112,192,.1)}
.care-btn.essential.active .cn{color:#8090d0}

/* NIGHT TOGGLE */
.night-wrap{margin:10px 18px 0;padding:11px 14px;background:var(--bg3);border-radius:10px;border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:12px}
.night-wrap.on{border-color:rgba(128,96,192,.4);background:rgba(128,96,192,.08)}
.night-info{flex:1}
.night-title{font-size:12px;color:var(--txt);font-weight:500}
.night-sub{font-size:10px;color:var(--dim);margin-top:2px}
.toggle{width:36px;height:20px;border-radius:10px;background:var(--bg4);border:1px solid rgba(255,255,255,.1);cursor:pointer;position:relative;flex-shrink:0;transition:all .2s}
.toggle.on{background:var(--purple);border-color:var(--purple)}
.toggle::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:all .2s}
.toggle.on::after{left:20px}

/* CONCEPT BADGE */
.badge{margin:14px 18px 0;padding:18px 20px;border-radius:16px;display:flex;align-items:center;gap:14px}
.badge.cond{background:linear-gradient(135deg,rgba(74,144,96,.18) 0%,rgba(74,144,96,.06) 100%);border-left:4px solid #4a9a60;border-top:1px solid rgba(74,144,96,.3);border-right:1px solid rgba(74,144,96,.3);border-bottom:1px solid rgba(74,144,96,.3);box-shadow:0 4px 24px rgba(74,144,96,.2),inset 0 1px 0 rgba(255,255,255,.1)}
.badge.both{background:linear-gradient(135deg,rgba(201,168,76,.18) 0%,rgba(201,168,76,.06) 100%);border-left:4px solid var(--gold);border-top:1px solid rgba(201,168,76,.3);border-right:1px solid rgba(201,168,76,.3);border-bottom:1px solid rgba(201,168,76,.3);box-shadow:0 4px 24px rgba(201,168,76,.2),inset 0 1px 0 rgba(255,255,255,.1)}
.badge.boost{background:linear-gradient(135deg,rgba(192,74,58,.18) 0%,rgba(192,74,58,.06) 100%);border-left:4px solid var(--red-l);border-top:1px solid rgba(192,74,58,.3);border-right:1px solid rgba(192,74,58,.3);border-bottom:1px solid rgba(192,74,58,.3);box-shadow:0 4px 24px rgba(192,74,58,.2),inset 0 1px 0 rgba(255,255,255,.1)}
.badge.video{background:linear-gradient(135deg,rgba(58,144,144,.18) 0%,rgba(58,144,144,.06) 100%);border-left:4px solid #3a9898;border-top:1px solid rgba(58,144,144,.3);border-right:1px solid rgba(58,144,144,.3);border-bottom:1px solid rgba(58,144,144,.3);box-shadow:0 4px 24px rgba(58,144,144,.2)}
.badge.music{background:linear-gradient(135deg,rgba(128,96,192,.18) 0%,rgba(128,96,192,.06) 100%);border-left:4px solid #9070c0;border-top:1px solid rgba(128,96,192,.3);border-right:1px solid rgba(128,96,192,.3);border-bottom:1px solid rgba(128,96,192,.3);box-shadow:0 4px 24px rgba(128,96,192,.2)}
.bc{font-family:'Shippori Mincho',serif;font-size:20px;font-weight:800;letter-spacing:.06em;line-height:1.3}
.bs{font-size:11px;color:var(--txt);opacity:.75;margin-top:4px;letter-spacing:.06em;line-height:1.6}
.badge.cond .bc{color:#5abf70;text-shadow:0 0 20px rgba(74,144,96,.4)}
.badge.both .bc{color:var(--gold-l);text-shadow:0 0 20px rgba(201,168,76,.4)}
.badge.boost .bc{color:var(--red-l);text-shadow:0 0 20px rgba(192,74,58,.4)}
.badge.video .bc{color:#4ab8b8;text-shadow:0 0 20px rgba(58,144,144,.4)}
.badge.music .bc{color:#a880d8;text-shadow:0 0 20px rgba(128,96,192,.4)}
/* ライトモード badge */
.light-mode .badge.cond{background:linear-gradient(135deg,rgba(26,106,58,.14) 0%,rgba(26,106,58,.04) 100%);border-left-color:#1a6a3a;border-top-color:rgba(26,106,58,.25);border-right-color:rgba(26,106,58,.25);border-bottom-color:rgba(26,106,58,.25);box-shadow:0 4px 20px rgba(26,106,58,.15)}
.light-mode .badge.cond .bc{color:#1a5a30;text-shadow:none}
.light-mode .badge.both .bc{color:#6a4c10;text-shadow:none}
.light-mode .badge.boost{background:linear-gradient(135deg,rgba(144,30,14,.12) 0%,rgba(144,30,14,.04) 100%);border-left-color:#901e0e;box-shadow:0 4px 20px rgba(144,30,14,.15)}
.light-mode .badge.boost .bc{color:#901e0e;text-shadow:none}
.light-mode .bc{font-size:19px}

/* TABS */
.tabs{display:flex;background:var(--bg);border-bottom:1px solid var(--border);margin-top:12px}
.tab{flex:1;padding:10px 2px;border:none;background:transparent;font-family:'Noto Sans JP',sans-serif;font-size:10px;color:var(--dim);cursor:pointer;letter-spacing:.04em;border-bottom:2px solid transparent;transition:all .2s}
.tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.ti{display:block;font-size:13px;margin-bottom:2px}

/* PAGE */
.page{padding:14px 18px}

/* INPUT CARD */
.icard{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:11px}
.icard-t{font-family:'Shippori Mincho',serif;font-size:13px;font-weight:600;color:var(--gold-l);margin-bottom:12px;letter-spacing:.05em}
.irow{display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:9px;padding:10px 12px;border:1px solid rgba(255,255,255,.05);margin-bottom:7px}
.irow:last-child{margin-bottom:0}
.irow.active-row{border-color:rgba(201,168,76,.25)}
.irow.end-row{border-color:rgba(74,144,96,.2);background:rgba(74,144,96,.04)}
.irow.call-row{border-color:rgba(192,74,58,.2)}
.irow.night-row{border-color:rgba(128,96,192,.25)}
.irow-lbl{font-size:11px;color:var(--dim);flex:1;letter-spacing:.03em;line-height:1.4}
.irow-lbl.on{color:var(--txt)}
.time-in{background:transparent;border:none;outline:none;font-family:'Shippori Mincho',serif;font-size:19px;font-weight:600;color:var(--txt);color-scheme:dark;text-align:right}
.time-in:disabled{color:var(--dim);opacity:.3}
.time-in::-webkit-calendar-picker-indicator{filter:invert(.6)}
.row-toggle{width:32px;height:18px;border-radius:9px;background:var(--bg4);border:1px solid rgba(255,255,255,.1);cursor:pointer;position:relative;flex-shrink:0;transition:all .2s}
.row-toggle.on{background:var(--gold);border-color:var(--gold)}
.row-toggle.green-on{background:var(--green);border-color:var(--green)}
.row-toggle::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:all .2s}
.row-toggle.on::after,.row-toggle.green-on::after{left:16px}
.show-block{background:var(--bg);border-radius:9px;border:1px solid rgba(255,255,255,.05);overflow:hidden;margin-bottom:7px}
.show-block.active{border-color:rgba(201,168,76,.2)}
.show-start{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04)}
.show-end{display:flex;align-items:center;gap:10px;padding:8px 12px 8px 40px}
.show-end.active{background:rgba(74,144,96,.04)}
.end-label{font-size:10px;color:var(--dim);flex:1;letter-spacing:.02em}
.end-label.on{color:#6abf80}
.gen-btn{width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--gold-d),var(--gold));font-family:'Noto Sans JP',sans-serif;font-size:13px;font-weight:700;color:#0a0a0f;letter-spacing:.1em;cursor:pointer;transition:all .2s}
.gen-btn:active{transform:scale(.98)}

/* TIMELINE */
.tl-hdr{font-size:9px;letter-spacing:.2em;color:var(--dim);text-align:center;margin:16px 0 10px}
.tl-item{display:flex;gap:9px}
.tl-left{width:44px;flex-shrink:0;text-align:right;padding-top:2px}
.tl-t{font-family:'Shippori Mincho',serif;font-size:14px;font-weight:700;color:var(--txt);line-height:1}
.tl-ap{font-size:9px;color:var(--dim);margin-top:1px}
.tl-mid{display:flex;flex-direction:column;align-items:center;width:18px;flex-shrink:0}
.tl-dot{width:10px;height:10px;border-radius:50%;border:2px solid;margin-top:3px;flex-shrink:0}
.tl-dot.morning{background:rgba(201,168,76,.2);border-color:var(--gold);box-shadow:0 0 6px rgba(201,168,76,.5)}
.tl-dot.vitc_am{background:rgba(74,144,96,.15);border-color:#6abf80}
.tl-dot.iron{background:rgba(192,120,60,.15);border-color:var(--orange)}
.tl-dot.preboost{background:rgba(192,74,58,.15);border-color:var(--red-l);box-shadow:0 0 5px rgba(192,74,58,.4)}
.tl-dot.preC{background:rgba(192,130,60,.1);border-color:#c09060}
.tl-dot.focus{background:rgba(58,144,144,.15);border-color:var(--teal)}
.tl-dot.show{background:rgba(192,74,58,.2);border-color:var(--red);box-shadow:0 0 6px rgba(192,74,58,.5)}
.tl-dot.showend{background:rgba(74,144,96,.15);border-color:var(--green);box-shadow:0 0 5px rgba(74,144,96,.4)}
.tl-dot.call{background:rgba(192,74,58,.1);border-color:#e09070}
.tl-dot.evening{background:rgba(74,112,192,.2);border-color:var(--blue);box-shadow:0 0 5px rgba(74,112,192,.4)}
.tl-dot.mg{background:rgba(128,96,192,.15);border-color:var(--purple)}
.tl-dot.sleep{background:rgba(74,144,96,.1);border-color:var(--green)}
.tl-line{width:1px;flex:1;min-height:11px;background:rgba(255,255,255,.06);margin:2px 0}
.tl-card{flex:1;background:var(--bg3);border:1px solid rgba(255,255,255,.05);border-radius:9px;padding:9px 12px;margin-bottom:6px;cursor:pointer;user-select:none;transition:all .15s}
.tl-card:active{transform:scale(.99)}
.tl-card.checked{border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.04)}
.tl-card.show-c{border-color:rgba(192,74,58,.2);background:rgba(192,74,58,.04);cursor:default}
.tl-card.showend-c{border-color:rgba(74,144,96,.2);background:rgba(74,144,96,.04);cursor:default}
.tl-card.call-c{border-color:rgba(192,74,58,.15);background:rgba(192,74,58,.03);cursor:default}
.tl-card.sleep-c{border-color:rgba(74,144,96,.15);background:rgba(74,144,96,.03);cursor:default}
.tl-ch{display:flex;align-items:center;justify-content:space-between;gap:0;margin-bottom:4px}
.tl-lbl{font-size:11px;font-weight:600;flex:1;letter-spacing:.04em}
.tl-lbl.morning{color:var(--gold)}
.tl-lbl.vitc_am{color:#6abf80}
.tl-lbl.iron{color:var(--orange)}
.tl-lbl.preboost{color:var(--red-l)}
.tl-lbl.preC{color:#c09060}
.tl-lbl.focus{color:#60c0c0}
.tl-lbl.show{color:#e06050}
.tl-lbl.showend{color:#6abf80}
.tl-lbl.call{color:#e09070}
.tl-lbl.evening{color:#8090d0}
.tl-lbl.mg{color:#a080d0}
.tl-lbl.sleep{color:var(--green)}
.tl-lbl.rehearsal_pre{color:#4a9a60}
.tl-lbl.rehearsal_post{color:#4a9a60}
.tl-ck{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--dim);display:flex;align-items:center;justify-content:center;font-size:9px;transition:all .2s;flex-shrink:0}
.tl-card.checked .tl-ck{background:var(--gold);border-color:var(--gold);color:#0a0a0f}
.tl-pills{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px}
.tl-pill{font-size:9px;padding:2px 7px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:var(--txt)}
.tl-pill.waka{background:rgba(201,168,76,.12);border-color:rgba(201,168,76,.35);color:var(--gold-l)}
.tl-pill.grey{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08);color:var(--dim)}
.tl-pill.boost{background:rgba(192,74,58,.1);border-color:rgba(192,74,58,.25);color:var(--red-l)}
.tl-pill.video{background:rgba(58,144,144,.1);border-color:rgba(58,144,144,.25);color:#60c0c0}
.tl-reason{font-size:10px;color:var(--dim);line-height:1.6}
.tl-med{font-size:9px;color:var(--dim);opacity:.65;margin-top:4px;line-height:1.55;border-top:1px solid rgba(255,255,255,.05);padding-top:4px}
.med-btn{font-size:16px;padding:4px 8px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:var(--dim);cursor:pointer;flex-shrink:0;line-height:1;transition:all .2s}
.med-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2)}

/* ── 翌日セクション ── */
.nextday-wrap{margin-top:6px;margin-bottom:6px;border:1px solid rgba(74,144,96,.2);border-radius:12px;overflow:hidden}
.nextday-header{background:rgba(74,144,96,.08);padding:11px 14px;display:flex;align-items:center;gap:9px;border-bottom:1px solid rgba(74,144,96,.15)}
.nextday-title{font-family:'Shippori Mincho',serif;font-size:13px;font-weight:600;color:#6abf80;flex:1}
.nextday-sub{font-size:10px;color:var(--dim);margin-top:2px}
.nextday-cards{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.nd-card{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:9px;background:var(--bg)}
.nd-card.min{border:1px solid rgba(74,112,192,.2);background:rgba(74,112,192,.04)}
.nd-card.opt{border:1px solid rgba(74,144,96,.25);background:rgba(74,144,96,.06)}
.nd-time{font-family:'Shippori Mincho',serif;font-size:22px;font-weight:700;color:var(--txt);line-height:1;min-width:56px}
.nd-time-ap{font-size:9px;color:var(--dim)}
.nd-info{flex:1}
.nd-label{font-size:12px;font-weight:600;margin-bottom:3px}
.nd-card.min .nd-label{color:#8090d0}
.nd-card.opt .nd-label{color:#6abf80}
.nd-note{font-size:10px;color:var(--dim);line-height:1.5}
.nd-badge{font-size:9px;padding:3px 8px;border-radius:20px;flex-shrink:0;white-space:nowrap}
.nd-card.min .nd-badge{background:rgba(74,112,192,.1);color:#8090d0;border:1px solid rgba(74,112,192,.2)}
.nd-card.opt .nd-badge{background:rgba(74,144,96,.1);color:#6abf80;border:1px solid rgba(74,144,96,.2)}
.sleep-summary{padding:10px 14px;background:rgba(128,96,192,.06);border-top:1px solid rgba(74,144,96,.1)}
.sleep-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.sleep-row:last-child{margin-bottom:0}
.sleep-key{font-size:10px;color:var(--dim);letter-spacing:.04em}
.sleep-val{font-family:'Shippori Mincho',serif;font-size:14px;font-weight:600;color:var(--txt)}


/* ── PROFILE & DOSE ── */
.profile-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px}
.profile-title{font-family:'Shippori Mincho',serif;font-size:13px;font-weight:600;color:var(--gold-l);margin-bottom:12px;letter-spacing:.05em}
.profile-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.profile-row:last-child{margin-bottom:0}
.profile-label{font-size:11px;color:var(--dim);flex:1}
.gender-btns{display:flex;gap:6px}
.gender-btn{padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:var(--bg4);font-family:'Noto Sans JP',sans-serif;font-size:11px;color:var(--dim);cursor:pointer;transition:all .2s}
.gender-btn.active{border-color:var(--gold-d);background:rgba(201,168,76,.12);color:var(--gold-l);font-weight:700}
.dose-banner{background:rgba(201,168,76,.05);border:1px solid var(--border);border-radius:10px;padding:10px 13px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.dose-badge-wrap{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.dose-badge{font-size:10px;padding:3px 8px;border-radius:20px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.2);color:var(--gold-l);font-weight:600}
.dose-badge.boost-dose{background:rgba(192,74,58,.1);border-color:rgba(192,74,58,.25);color:var(--red-l)}
.dose-note{font-size:9px;color:var(--dim);margin-top:3px;opacity:.7;line-height:1.5}
/* CHECKLIST */
.streak{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.05));border-radius:12px;border:1px solid rgba(201,168,76,.25)}
.streak-fire{font-size:28px;line-height:1}
.streak-num{font-family:'Shippori Mincho',serif;font-size:30px;font-weight:800;color:var(--gold-l);line-height:1}
.streak-unit{font-size:10px;color:var(--dim);margin-top:2px}
.streak-msg{font-size:11px;color:var(--txt);font-weight:700;margin-bottom:2px}
.streak-best{font-size:9px;color:var(--dim)}
.streak-share{margin-left:auto;font-size:10px;font-weight:700;padding:6px 12px;border-radius:20px;border:1px solid rgba(201,168,76,.4);background:rgba(201,168,76,.1);color:var(--gold-l);cursor:pointer;white-space:nowrap;font-family:'Noto Sans JP',sans-serif}
.prog{margin-bottom:12px;padding:11px 13px;background:var(--bg);border-radius:10px;border:1px solid var(--border)}
.prog-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.prog-t{font-size:9px;letter-spacing:.15em;color:var(--dim)}
.prog-n{font-family:'Shippori Mincho',serif;font-size:18px;font-weight:700;color:var(--gold)}
.prog-n span{font-size:11px;color:var(--dim);font-family:'Noto Sans JP',sans-serif;font-weight:400}
.prog-bar{height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden}
.prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--gold-d),var(--gold-l));transition:width .4s}
.cl-sec{margin-top:12px}
.cl-sh{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.cl-dot{width:6px;height:6px;border-radius:50%}
.cl-dot.gold{background:var(--gold);box-shadow:0 0 4px var(--gold)}
.cl-dot.blue{background:var(--blue);box-shadow:0 0 4px var(--blue)}
.cl-dot.red{background:var(--red);box-shadow:0 0 4px var(--red)}
.cl-dot.green{background:var(--green)}
.cl-dot.purple{background:var(--purple)}
.cl-dot.teal{background:var(--teal)}
.cl-dot.orange{background:var(--orange)}
.cl-sn{font-family:'Shippori Mincho',serif;font-size:14px;font-weight:700}
.cl-se{font-size:9px;color:var(--dim);letter-spacing:.1em}
.pill-list{display:flex;flex-direction:column;gap:6px}
.pill-card{background:var(--bg3);border:1px solid rgba(255,255,255,.05);border-radius:9px;padding:9px 11px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;transition:all .2s}
.pill-card:active{transform:scale(.98)}
.pill-card.checked{border-color:var(--gold-d);background:rgba(201,168,76,.05)}
.pill-card.checked .pn{color:var(--gold-l)}
.cc{width:20px;height:20px;border-radius:50%;border:2px solid var(--dim);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:9px}
.pill-card.checked .cc{background:var(--gold);border-color:var(--gold);color:#0a0a0f}
.pi{flex:1}
.pn{font-size:12px;font-weight:500;color:var(--txt)}
.pnote{font-size:10px;color:var(--dim);margin-top:1px}
.ptag{font-size:9px;padding:2px 7px;border-radius:20px;flex-shrink:0}
.ptag.base{background:rgba(74,144,96,.1);color:#6abf80;border:1px solid rgba(74,144,96,.25)}
.ptag.boost{background:rgba(192,74,58,.1);color:var(--red-l);border:1px solid rgba(192,74,58,.3)}
.ptag.video{background:rgba(58,144,144,.1);color:#60c0c0;border:1px solid rgba(58,144,144,.3)}
.divider{height:1px;background:var(--border);margin:9px 0 3px}
.reset-btn{display:block;margin-top:14px;padding:10px;background:transparent;border:1px solid var(--border);border-radius:9px;color:var(--dim);font-family:'Noto Sans JP',sans-serif;font-size:11px;letter-spacing:.1em;cursor:pointer;width:100%}
.empty{text-align:center;padding:30px 18px;border:1px dashed var(--border);border-radius:12px;margin-top:8px}
.empty-icon{font-size:26px;margin-bottom:8px}
.empty-t{font-family:'Shippori Mincho',serif;font-size:13px;color:var(--dim);margin-bottom:4px}
.empty-s{font-size:10px;color:var(--dim);opacity:.6;line-height:1.8}
.bot{height:30px}
.credit{text-align:center;padding:18px 0 28px;border-top:1px solid var(--border);margin-top:8px}
.credit-name{font-family:'Shippori Mincho',serif;font-size:16px;font-weight:700;color:var(--gold-l);letter-spacing:.1em;margin-bottom:4px}
.credit-sub{font-size:10px;color:var(--dim);letter-spacing:.12em;line-height:1.8}
/* ── FOOD TAB ── */
.wt-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px}
.wt-title{font-family:'Shippori Mincho',serif;font-size:13px;font-weight:600;color:var(--gold-l);margin-bottom:12px}
.wt-row{display:flex;align-items:center;gap:10px}
.wt-label{font-size:12px;color:var(--dim);flex:1}
.wt-input{background:var(--bg);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 12px;font-family:'Shippori Mincho',serif;font-size:20px;font-weight:700;color:var(--txt);width:90px;text-align:right;outline:none}
.wt-unit{font-size:12px;color:var(--dim);margin-left:4px}
.macro-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px}
.macro-card{background:var(--bg3);border-radius:11px;padding:12px 10px;text-align:center;border:1px solid rgba(255,255,255,.05)}
.macro-card.prot{border-color:rgba(192,74,58,.25);background:rgba(192,74,58,.06)}
.macro-card.carb{border-color:rgba(201,168,76,.2);background:rgba(201,168,76,.05)}
.macro-card.fat{border-color:rgba(74,112,192,.2);background:rgba(74,112,192,.05)}
.macro-icon{font-size:18px;margin-bottom:5px}
.macro-name{font-size:9px;color:var(--dim);letter-spacing:.08em;margin-bottom:4px}
.macro-val{font-family:'Shippori Mincho',serif;font-size:20px;font-weight:700;line-height:1}
.macro-card.prot .macro-val{color:var(--red-l)}
.macro-card.carb .macro-val{color:var(--gold-l)}
.macro-card.fat .macro-val{color:#8090d0}
.macro-unit{font-size:10px;color:var(--dim);margin-top:2px}
.macro-range{font-size:9px;color:var(--dim);opacity:.6;margin-top:2px}
.meal-section{margin-bottom:14px}
.meal-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.meal-dot{width:7px;height:7px;border-radius:50%}
.meal-dot.am{background:var(--gold);box-shadow:0 0 5px var(--gold)}
.meal-dot.pre{background:var(--red);box-shadow:0 0 5px var(--red)}
.meal-dot.post{background:var(--green);box-shadow:0 0 5px var(--green)}
.meal-dot.pm{background:var(--blue);box-shadow:0 0 5px var(--blue)}
.meal-dot.snack{background:var(--purple)}
.meal-name{font-family:'Shippori Mincho',serif;font-size:14px;font-weight:700}
.meal-time{font-size:10px;color:var(--dim);letter-spacing:.06em;margin-left:2px}
.food-list{display:flex;flex-direction:column;gap:7px}
.food-card{background:var(--bg3);border:1px solid rgba(255,255,255,.05);border-radius:9px;padding:9px 12px;display:flex;align-items:flex-start;gap:9px}
.food-emoji{font-size:17px;flex-shrink:0;margin-top:1px}
.food-info{flex:1}
.food-name{font-size:12px;font-weight:600;color:var(--txt);margin-bottom:2px}
.food-ex{font-size:10px;color:var(--dim);line-height:1.5}
.food-macros{display:flex;gap:5px;margin-top:4px;flex-wrap:wrap}
.fm-tag{font-size:9px;padding:2px 6px;border-radius:20px}
.fm-p{background:rgba(192,74,58,.1);color:var(--red-l);border:1px solid rgba(192,74,58,.2)}
.fm-c{background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.2)}
.fm-f{background:rgba(74,112,192,.1);color:#8090d0;border:1px solid rgba(74,112,192,.2)}
.fm-cal{background:rgba(255,255,255,.05);color:var(--dim);border:1px solid rgba(255,255,255,.08)}
.food-tip{font-size:10px;color:var(--dim);margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,.05);line-height:1.5}
.mode-note{padding:10px 13px;border-radius:9px;margin-bottom:12px;font-size:11px;line-height:1.7}
.mode-note.boost{background:rgba(192,74,58,.06);border:1px solid rgba(192,74,58,.2);color:var(--red-l)}
.mode-note.cond{background:rgba(74,144,96,.06);border:1px solid rgba(74,144,96,.2);color:#6abf80}
.mode-note.both{background:rgba(201,168,76,.06);border:1px solid var(--border);color:var(--gold-l)}
.lunch-toggle-row{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--bg3);border-radius:10px;border:1px solid rgba(255,255,255,.05);margin-bottom:12px}
.lunch-toggle-row.on{border-color:rgba(74,144,96,.25);background:rgba(74,144,96,.06)}
.lunch-info{flex:1}
.lunch-info-title{font-size:12px;font-weight:600;color:var(--txt)}
.lunch-info-sub{font-size:10px;color:var(--dim);margin-top:2px}
.bento-tip{background:rgba(74,144,96,.06);border:1px solid rgba(74,144,96,.2);border-radius:9px;padding:10px 13px;margin-bottom:4px}
.bento-tip-title{font-size:12px;font-weight:600;color:#6abf80;margin-bottom:4px}
.bento-tip-body{font-size:11px;color:var(--dim);line-height:1.7}
.pattern-nav{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.pattern-dots{display:flex;gap:5px;flex:1;justify-content:center}
.pattern-dot{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(255,255,255,.12);background:var(--bg4);font-size:10px;font-weight:700;color:var(--dim);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:"Shippori Mincho",serif}
.pattern-dot.active{background:var(--gold);border-color:var(--gold);color:#0a0a0f}
.pattern-arrow{width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:var(--bg3);color:var(--dim);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
.pattern-arrow:active{background:var(--bg4)}
.bento-tips-list{display:flex;flex-direction:column;gap:6px}
.bento-tip-row{display:flex;gap:8px;align-items:flex-start;font-size:11px;color:var(--dim);line-height:1.6}
.bento-caution{font-size:10px;color:var(--orange);margin-top:8px;padding:6px 10px;background:rgba(192,112,64,.08);border-radius:7px;border:1px solid rgba(192,112,64,.2)}
`;

/* ─── サプリ定義 ─── */
const P = {
  b:    {id:"b",   name:"ビタミンB群",            note:"エネルギー産生を助けるビタミンB群",        tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ ビタミンB群",                       waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-1222%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  coq:  {id:"coq", name:"CoQ10（酸化型）",         note:"エネルギー産生に関わる補酵素",              tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ CoQ10（酸化型）｜50mg（1粒）・100mg（2粒）",          waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0478%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  d:    {id:"d",   name:"ビタミンD＆オメガ-3",     note:"筋肉・骨・関節の健康維持をサポート",         tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ ビタミンD＆オメガ-3｜1,000IU（1粒）",               waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0591%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  lut:  {id:"lut", name:"ルテイン",note:"目の健康維持をサポート",          tag:"video", buy:"ワカサプリ通販",  brands:"ワカサプリ ルテイン｜1粒", waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0508%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  c1:   {id:"c1",  name:"ビタミンC",                note:"体のコンディション維持をサポート",              tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ ビタミンC｜2,000mg（1包）",           waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0584%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  iron: {id:"iron",name:"ヘム鉄",                  note:"鉄分の補給に。日々のコンディションサポート",       tag:"video", buy:"ワカサプリ通販",  brands:"ワカサプリ ヘム鉄｜鉄9mg（3粒）",                             waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0652%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  lc:   {id:"lc",  name:"L-カルニチン",            note:"エネルギー産生に関わるアミノ酸",     tag:"boost", buy:"ワカサプリ通販",  brands:"ワカサプリ L-カルニチン｜700mg（2粒）",                       waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-1130%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  coqB: {id:"coqB",name:"CoQ10（追加）",           note:"L-カルニチンと組み合わせて摂取",   tag:"boost", buy:"ワカサプリ通販",  brands:"ワカサプリ CoQ10（酸化型）｜50mg（1粒）・100mg（2粒）",          waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-1130%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  lte:  {id:"lte", name:"GABA",                    note:"ストレスや疲労感が気になる方のサポートに",   tag:"video", buy:"ワカサプリ通販",  brands:"ワカサプリ GABA｜100mg（1粒）",                  waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-1123%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  cB:   {id:"cB",  name:"ビタミンC（本番前）",      note:"体のコンディション維持をサポート",             tag:"boost", buy:"ワカサプリ通販",  brands:"ワカサプリ ビタミンC｜2,000mg（1包）",           waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0584%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  c2:   {id:"c2",  name:"ビタミンC（就寝前）",      note:"就寝前の栄養補給に",            tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ ビタミンC｜2,000mg（1包）",           waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0584%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  mg:   {id:"mg",  name:"マグネシウム",             note:"日々の健康維持に。不足しがちなミネラル",            tag:"base",  buy:"ワカサプリ通販",  brands:"ワカサプリ マグネシウム｜175mg（1粒）",                       waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0638%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  mgx:  {id:"mgx", name:"マグネシウム（増量）",     note:"マグネシウムの補給に",           tag:"music", buy:"ワカサプリ通販",  brands:"ワカサプリ マグネシウム｜175mg（1粒）",                       waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0638%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  om3:  {id:"om3", name:"植物性オメガ-3",           note:"関節・神経の健康維持をサポート",           tag:"music", buy:"ワカサプリ通販",  brands:"ワカサプリ 植物性オメガ-3",                    waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0546%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  b6:   {id:"b6",  name:"ミネラルフォーミュラ",     note:"9種のミネラルをバランスよく補給",      tag:"music", buy:"ワカサプリ通販",  brands:"ワカサプリ ミネラルフォーミュラ",               waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0614%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  bcaa: {id:"bcaa",name:"BCAA（必須アミノ酸）",     note:"稽古・トレーニング時のアミノ酸補給に",     tag:"rehearsal",buy:"ドラッグストア・スポーツ用品店",brands:"ザバス・マイプロテイン・DNS等",              waka:null, wakaFlag:false},
  glut: {id:"glut",name:"グルタミン",               note:"稽古後のコンディション維持に",       tag:"rehearsal",buy:"ドラッグストア・スポーツ用品店",brands:"ザバス・マイプロテイン・DNS等",              waka:null, wakaFlag:false},
  pro:  {id:"pro", name:"大豆プロテイン",            note:"植物性たんぱく質の補給に",             tag:"rehearsal",buy:"ワカサプリ通販",brands:"ワカサプリ 大豆プロテイン",                    waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0751%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  lac:  {id:"lac", name:"乳酸菌（EC-12）",           note:"腸内環境の維持をサポート",         tag:"rehearsal",buy:"ワカサプリ通販",brands:"ワカサプリ 乳酸菌（EC-12）",                  waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0669%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  zinc: {id:"zinc",name:"亜鉛＆銅",                    note:"亜鉛と銅をバランスよく補給",       tag:"base",     buy:"ワカサプリ通販",brands:"ワカサプリ 亜鉛＆銅",                          waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-0645%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  gsh:  {id:"gsh", name:"グルタチオン",                 note:"体のコンディション維持に役立つ成分",   tag:"base",     buy:"ドラッグストア・Amazon",brands:"NOW Foods・Jarrow・ライフエクステンション等",   waka:null, wakaFlag:false},
  gaba: {id:"gaba",name:"GABA（ギャバ）",               note:"ストレスや疲労感が気になる方のサポートに", tag:"base", buy:"ワカサプリ通販",brands:"ワカサプリ GABA｜100mg（1粒）",waka:"https://hb.afl.rakuten.co.jp/ichiba/490b14e5.c46cd283.490b14e6.3e8700b7/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fwakasapri%2Fjan-1123%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9", wakaFlag:true},
  cr:   {id:"cr",  name:"クレアチン",                   note:"トレーニング時のエネルギー補給に", tag:"rehearsal",buy:"スポーツ用品店・Amazon",brands:"マイプロテイン・DNS・ザバス等",              waka:null, wakaFlag:false},
};


/* ─── 「ここだけは！」必須サプリ定義
   設計方針：
   ・最低限の効果を出せる2〜3種に絞る
   ・コンディショニング：エネルギー基盤＋回復
   ・本番日：エネルギー基盤＋ブースト＋回復
   ・音楽家：Mgを必ず増量版に
   ・映像：ルテインを朝に追加
─── */
const ESSENTIAL = {
  // ── 稽古日 ──  VitC（午前）+ Mg + B群
  stage_cond:  ["c1","c2","mg"],       // VitC×2（2,000mg）+ Mg
  music_cond:  ["c1","c2","mgx"],      // VitC×2（2,000mg）+ Mg増量
  video_cond:  ["c1","c2","iron"],     // VitC×2（2,000mg）+ ヘム鉄
  // ── 本番＋コンディション ──
  stage_both:  ["c1","c2","lc"],       // VitC×2（2,000mg）+ L-カルニチン
  music_both:  ["c1","c2","lc"],       // VitC×2（2,000mg）+ L-カルニチン
  video_both:  ["c1","c2","iron"],     // VitC×2（2,000mg）+ ヘム鉄
  // ── 本番ブースト（cB追加で4,000mg） ──
  stage_boost: ["c1","c2","lc","cB"],  // VitC×3（4,000mg）+ L-カルニチン
  music_boost: ["c1","c2","lte","cB"], // VitC×3（4,000mg）+ GABA
  video_boost: ["c1","c2","iron","cB"],// VitC×3（4,000mg）+ ヘム鉄
};

function getEssentialIds(jobType, dayMode) {
  const key = `${jobType}_${dayMode}`;
  return ESSENTIAL[key] || ESSENTIAL[`stage_${dayMode}`] || [];
}


/* ─── アクティブなサプリIDを取得（タイムラインと完全一致）─── */
function getActivePillIds(jobType, dayMode, careLevel) {
  const isBoost = dayMode==="boost"||dayMode==="both";
  const isVideo = jobType==="video";
  const isMusic = jobType==="music";
  const isFull  = careLevel==="full";
  const essIds  = getEssentialIds(jobType, dayMode);
  const fp = (ids) => isFull ? ids : ids.filter(id => essIds.includes(id));

  const all = new Set();

  // 朝食後①（脂溶性）
  fp(["coq","d","gsh", ...(isVideo?["lut"]:[]), ...(isMusic?["om3"]:[])]).forEach(id=>all.add(id));
  // 朝食後②
  fp(["b","zinc", ...(isMusic?["b6"]:[])]).forEach(id=>all.add(id));
  // Omega3（音楽）
  if(isMusic) fp(["om3"]).forEach(id=>all.add(id));
  // VitC午前 + 映像用ヘム鉄・ルテイン
  fp(["c1", ...(isVideo?["iron","lut"]:[])]).forEach(id=>all.add(id));

  if(isBoost) {
    // L-テアニン（音楽・映像）
    if(isVideo||isMusic) fp(["lte"]).forEach(id=>all.add(id));
    // ブースト①
    fp(["lc","coqB"]).forEach(id=>all.add(id));
    // ブースト②
    fp(["cB"]).forEach(id=>all.add(id));
  }

  // 夜VitC
  fp(["c2"]).forEach(id=>all.add(id));
  // Mg + アシュワガンダ + メラトニン
  fp([isMusic?"mgx":"mg","gaba"]).forEach(id=>all.add(id));

  return all;
}

/* ─── 時刻ユーティリティ ─── */
const toMin = s => { if(!s)return null;const[h,m]=s.split(":").map(Number);return h*60+m; };
const addM  = (s,d) => {const t=((toMin(s)+d)%1440+1440)%1440;return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;};
const disp  = t => {const[h,m]=t.split(":").map(Number);return{time:`${h%12===0?12:h%12}:${String(m).padStart(2,"0")}`,ampm:h<12?"AM":"PM"};};
const minsToHM = m => `${Math.floor(m/60)}時間${m%60>0?`${m%60}分`:""}`;

/* ─── 翌日起床計算 ─── */
function calcNextDay(sleepTime) {
  // 入眠潜時15分 + 5サイクル(450min) / 6サイクル(540min)
  const onset = 15;
  const min5  = addM(sleepTime, onset + 450); // 7h45m
  const min6  = addM(sleepTime, onset + 540); // 9h15m
  const sleep5h = minsToHM(onset + 450);
  const sleep6h = minsToHM(onset + 540);
  return { min5, min6, sleep5h, sleep6h };
}

/* ─── スケジュール生成 ─── */
function buildSchedule({jobType, dayMode, nightMode, wakeup, callTime, shows, weight="60", height="165", age="30", gender="female", careLevel="full", rehearsalStart=null, rehearsalEnd=null, isWingMode=false}) {
  const active = shows.filter(s=>s.enabled&&s.time);
  const items = [];
  const isBoost = dayMode==="boost"||dayMode==="both";
  const isVideo = jobType==="video";
  const isMusic = jobType==="music";
  const isFull = careLevel==="full" || careLevel==="wing";
  const essIds = getEssentialIds(jobType, dayMode);
  // フィルター関数：フルケアなら全部、ここだけは！なら必須のみ
  const filterPills = (pills) => isFull ? pills : pills.filter(p => essIds.includes(p.id));
  // 個人最適量を計算してスケジュールに注入
  const dose = calcDose(weight, gender, dayMode, height, age);
  const doseMap = {
    c1:`${dose.vcAm}mg（${dose.vcAm/2000}包）`, c2:`${dose.vcPm}mg（${dose.vcPm/2000}包）`, cB:`${dose.vcPre}mg`,
    d:`${dose.vd}IU（1粒）`, b:`${dose.b1}mg（1粒）`, mg:`${dose.mg}mg（${dose.mg/175}粒）`,
    coq:`${dose.coq}mg（${dose.coq/50}粒）`, coqB:`${dose.coqB}mg（${dose.coqB/50}粒）`, lc:`${dose.lc}mg（2粒）`,
    lut:`${dose.lut}mg（1粒）`, lte:`100mg（1粒）`, iron:`${dose.iron}mg（3粒）`,
    b6:`${dose.b6}mg（1粒）`, om3:`${dose.om3}mg`, mgx:`${dose.mgMusic}mg（${Math.round(dose.mgMusic/175)}粒）`,
    gsh:"250mg", zinc:"1粒", gaba:"100mg（1粒）",
    bcaa:"5〜10g", glut:"5g", cr:"5g", pro:"20g", lac:"1包",
  };

  // 朝食時間を基準点として定義（起床+30分）
  // 全サプリ・食事の時間はここから計算 → コンビニ飯タブと完全連動
  const breakfastTime = addM(wakeup, 30);

  // ── 覚醒モード：カフェインタイムライン ──
  const isWing = isWingMode || careLevel==="wing";
  if(isWing) {
    // コーヒー1杯：起床90分後（コルチゾール低下後）
    const coffee1 = addM(wakeup, 90);
    items.push({
      id:"caf1", type:"vitc_am", time:coffee1, checkable:true,
      label:"☕ コーヒー（朝）",
      pills:[],
      caffeine:true,
      reason:"起床後90分を目安に。朝のルーティンに取り入れやすいタイミングです。",
      med:"カフェインは一般的に覚醒感をサポートする成分として知られています。起床後90分を目安に摂ることがおすすめ。コーヒー1杯のカフェイン量は約80〜100mg。",
      drinkInfo:{name:"コーヒー（ブラック）",mg:80,note:"起床後90分〜"}
    });

    // 本番・稽古前：レッドブル（開演/稽古60分前）
    const targets = isBoost ? active : (rehearsalStart?[{time:rehearsalStart}]:[]);
    targets.forEach((t,i)=>{
      const label = isBoost ? `第${i+1}${isVideo?"撮影":isMusic?"ライブ":"公演"} 栄養ドリンク` : "稽古前 栄養ドリンク";
      const preTime = addM(t.time, -60);
      items.push({
        id:`caf_rb_${i}`, type:"preboost", time:preTime, checkable:true,
        label:`⚡ ${label}`,
        pills:[],
        caffeine:true,
        reason:`${isBoost?`${isVideo?"撮影":isMusic?"ライブ":"開演"} ${t.time} の`:"稽古開始 "+t.time+" の"}60分前。カフェインの血中濃度ピークまで45〜60分。GABAと組み合わせると緊張を抑えながら覚醒・集中力が最大化される。`,
        med:"栄養ドリンクはカフェイン（リポビタンD約50mg・レッドブル約80mg）のほかタウリン・B群も含む場合があります。1日のカフェイン摂取量の目安は400mg以内が一般的です。",
        drinkInfo:{name:"栄養ドリンク（リポビタンD・ユンケル・レッドブル等）",mg:50,note:"タウリン・B群も配合。GABAと同時がベスト"}
      });
    });

  }

  // 朝食後①: CoQ10 + VitD (+ ルテイン if 映像) → 朝食後35分
  items.push({
    id:"mfat", type:"morning", time:addM(breakfastTime,30), checkable:true,
    label:"朝食後サプリ ①（脂溶性）",
    pills:filterPills([P.coq, P.d, P.gsh, ...(isVideo?[P.lut]:[])]),
    reason:`朝食（${breakfastTime}）から30分後が目安。`,
    med:"CoQ10・VitD・グルタチオン"+(isVideo?"・ルテイン":"")+"は脂溶性成分。食後に摂ることで吸収をサポート。空腹時は避けるのがおすすめ。"
  });

  // 朝食後②: B群 → 朝食後15分
  items.push({
    id:"mb", type:"morning", time:addM(breakfastTime,35), checkable:true,
    label:"朝食後サプリ ②",
    pills:filterPills([P.b, P.zinc, ...(isMusic?[P.b6]:[])]),

    reason:`朝食（${breakfastTime}）から30〜35分後が目安。`,
    med:"B群は水溶性の栄養素。朝の摂取で1日のスタートをサポート。"+(isMusic?" B6は神経系の健康維持に関わる栄養素。":"")
  });

  // Omega-3（音楽家のみ・朝食後35分・脂溶性）
  if(isMusic) {
    items.push({
      id:"om3", type:"morning", time:addM(breakfastTime,30), checkable:true,
      label:"朝食後サプリ ③（音楽家専用）",
      pills:filterPills([P.om3]),
      reason:`朝食（${breakfastTime}）から30〜40分後。脂溶性なので食事の脂質と一緒に。`,
      med:"オメガ3系脂肪酸（EPA/DHA）は関節・神経の健康維持をサポートする栄養素。継続的な摂取がおすすめ。"
    });
  }

  // 午前: VitC① → 朝食後90分
  items.push({
    id:"vc1", type:isVideo?"iron":"vitc_am", time:addM(breakfastTime,90), checkable:true,
    label:isVideo?"VitC＋ヘム鉄（午前）":"VitC（午前）",
    pills:filterPills([P.c1, ...(isVideo?[P.iron]:[])]),
    reason:`朝食（${breakfastTime}）から1時間30分が目安。`,
    med:"ビタミンCは水溶性のため分割して摂ることがおすすめ。ワカサプリのVitCは1包2,000mg。"+(isVideo?"鉄とビタミンCは一緒に摂るのがおすすめ。":"")
  });

  // コールタイム
  if(callTime) {
    items.push({
      id:"call", type:"call", time:callTime, checkable:false,
      label:"集合時間 📍", pills:[],
      reason:"劇場・現場への集合時間。この時間に合わせてサプリのタイミングを逆算しています。", med:""
    });
  }

  // ブースト系
  if(isBoost) {
    active.forEach((s,i)=>{
      const label = isVideo?`第${i+1}撮影`:isMusic?`第${i+1}ライブ`:`第${i+1}公演`;

      if(isVideo||isMusic) {
        items.push({
          id:`lte${i}`, type:"focus", time:addM(s.time,-75), checkable:true,
          label:isMusic?`${label} GABA（緊張対策）`:`${label} GABA（集中）`, pills:filterPills([P.lte]),
          reason:`${isMusic?"ライブ開演":"撮影開始"} ${s.time} の75分前。VitCより15分早く飲む。`,
          med:"GABAは体内に存在するアミノ酸の一種。ワカサプリのGABAは1粒100mgの高配合タイプ。"
        });
      }

      // 第1公演のみL-カルニチン・CoQ10・GABAを摂取（半減期9h・3h・1hのため2公演目は不要）
      if(i === 0) {
        items.push({
          id:`lc${i}`, type:"preboost", time:addM(s.time,-150), checkable:true,
          label:`${label} ブースト①`, pills:filterPills([P.lc, P.coqB]),
          reason:`${isVideo?"撮影開始":isMusic?"ライブ開演":"開演"} ${s.time} の2時間30分前。`,
          med:"L-カルニチンは体内で合成されるアミノ酸の一種。CoQ10と一緒に摂るのがおすすめ。"
        });
      } else {
        items.push({
          id:`lc${i}`, type:"preboost", time:addM(s.time,-150), checkable:false,
          label:`${label} ブースト① （第1公演分が継続中）`,
          pills:[],
          reason:`L-カルニチンの半減期は約9時間。第1公演前に摂取した分が引き続き有効です。追加摂取は不要。`,
          med:""
        });
      }

      // VitC本番前：第1公演のみ（1日合計4,000mg＝2包を守るため）
      if(i === 0) {
        items.push({
          id:`vcpre${i}`, type:"preC", time:addM(s.time,-60), checkable:true,
          label:`${label} ブースト②`, pills:filterPills([P.cB]),
          reason:`${isVideo?"撮影開始":isMusic?"ライブ開演":"開演"} ${s.time} の1時間前。`,
          med:"ビタミンCは体が活発に動くときに多く使われる水溶性栄養素。本番前の補給がおすすめ。"
        });
      }

      // 開演
      items.push({
        id:`show${i}`, type:"show", time:s.time, checkable:false,
        label:`${label} ${isVideo?"撮影開始 🎬":isMusic?"ライブ開演 🎵":"開演 🎭"}`, pills:[],
        reason:"全力でいってください！", med:""
      });

      // 終演/撮影終了（入力されていれば）
      if(s.endEnabled && s.endTime) {
        items.push({
          id:`end${i}`, type:"showend", time:s.endTime, checkable:false,
          label:`${label} ${isVideo?"撮影終了 ✅":isMusic?"ライブ終演 ✅":"終演 ✅"}`, pills:[],
          reason:isVideo?"お疲れ様でした。夜のサプリで体のケアをしましょう。":isMusic?"ライブお疲れ様でした。夜のサプリで体をいたわりましょう。":"カーテンコールお疲れ様でした。夜のサプリで体のケアをしましょう。",
          med:""
        });
      }
    });
  }

  // ── 終演・終了時刻の特定（夜サプリ基準点）
  // 終演時刻が入力されていれば使う、なければ最終公演開始+90min推定
  const lastActive = active[active.length-1];
  let endBase = null;
  if(isBoost && lastActive) {
    if(lastActive.endEnabled && lastActive.endTime) {
      endBase = lastActive.endTime;
    } else {
      endBase = addM(lastActive.time, 90); // 開始+90min推定
    }
  }

  // 稽古前後サプリ（コンディショニングモードで稽古時間が設定されている場合）
  if(!isBoost && rehearsalStart && rehearsalEnd) {
    // 稽古前1時間：BCAA（筋分解防止）
    items.push({
      id:"bcaa_pre", type:"rehearsal_pre", time:addM(rehearsalStart,-60), checkable:true,
      label:"🤸 稽古前サプリ（筋分解防止）", pills:filterPills([P.bcaa, P.cr]),
      reason:`稽古開始（${rehearsalStart}）の1時間前。アミノ酸の補給に。`,
      med:"BCAAは必須アミノ酸（ロイシン・イソロイシン・バリン）。稽古前に摂取することで筋肉の分解を防ぎ、持久力を維持する。稽古中に水に溶かして飲むのも効果的。"
    });
    // 稽古後すぐ：グルタミン（免疫低下防止）
    items.push({
      id:"glut_post", type:"rehearsal_post", time:addM(rehearsalEnd,15), checkable:true,
      label:"🏁 稽古後サプリ（コンディション維持）", pills:filterPills([P.glut, P.lac, P.pro]),
      reason:`稽古終了（${rehearsalEnd}）の15分後。稽古後の栄養補給に。`,
      med:"稽古・運動後はオープンウィンドウ現象で免疫機能が一時低下する。グルタミンはこれを抑制し、腸内環境の維持・筋修復の促進にも働く。"
    });
  }

  // 夜サプリは18:00以降に固定
  // VitC②: 最低18:00、終演後30分ならその遅い方
  const MIN_EVENING = 18 * 60; // 18:00
  const vc2Raw = endBase ? toMin(addM(endBase, 30)) : toMin(addM(wakeup, 600));
  const vc2Mins = Math.max(vc2Raw, MIN_EVENING);
  const vc2Time = `${String(Math.floor(vc2Mins/60)).padStart(2,"0")}:${String(vc2Mins%60).padStart(2,"0")}`;
  const vc2Adjusted = vc2Mins > vc2Raw; // 18:00補正が入ったか

  items.push({
    id:"vc2", type:"evening", time:vc2Time, checkable:true,
    label:isFull?"夜サプリ ① ビタミンC":"夜サプリ（回復）", pills:filterPills([P.c2]),
    reason: vc2Adjusted
      ? "18:00以降・夜サプリの開始タイミング。就寝前の修復スイッチON。"
      : endBase ? "終演/終了後30分が目安。クールダウン中に。" : "夕食後60分が目安。",
    med:"就寝中の成長ホルモン分泌で組織修復が加速する。就寝前のVitCは睡眠中の抗酸化・コラーゲン合成をサポート。"
  });

  // Mg: VitC②の30分後、最低20:30（就寝22:00の90分前）
  // 音楽家はMg増量版を使用
  const MIN_MG_MINS = 20 * 60 + 30; // 20:30
  const mgRaw = vc2Mins + 30;
  const mgMins = Math.max(mgRaw, MIN_MG_MINS);
  const mgTime = `${String(Math.floor(mgMins/60)).padStart(2,"0")}:${String(mgMins%60).padStart(2,"0")}`;
  const mgAdjusted = mgMins > mgRaw;

  const sleepTarget = addM(mgTime, 90);

  // カフェインカットオフ（翼モード）：就寝6時間前
  if(isWing && sleepTarget) {
    const cutoff = addM(sleepTarget, -360);
    items.push({
      id:"caf_cut", type:"sleep", time:cutoff, checkable:false,
      label:"🚫 カフェインここまで",
      pills:[], caffeine:true,
      reason:`就寝（${disp(sleepTarget).time}${disp(sleepTarget).ampm}）の6時間前が限界。これ以降は水・麦茶・ハーブティーに切り替える。`,
      med:"カフェインの血中半減期は約5時間。就寝6時間前以降の摂取は深睡眠を妨げ翌日のパフォーマンスに悪影響。",
      drinkInfo:null
    });
  }


  items.push({
    id:"mg", type:"mg", time:mgTime, checkable:true,
    label:isMusic?(isFull?"夜サプリ ② マグネシウム（増量）":"夜サプリ マグネシウム（増量）"):(isFull?"夜サプリ ② マグネシウム":"夜サプリ マグネシウム"), pills:filterPills([isMusic?P.mgx:P.mg, P.gaba]),
    reason: mgAdjusted
      ? "20:30を目安に摂取。就寝（22:00）の90分前が最適タイミング。"
      : "夜サプリ①の30分後。就寝90分前のタイミングに合わせています。",
    med:"MgはGABA受容体を活性化し副交感神経を優位にする。効果発現まで60〜90分かかるため、このタイミングに摂ることで入眠がスムーズになり睡眠の深さが向上する。"+(isMusic?" 音楽家は演奏による筋肉の持続収縮でMgが消耗しやすく、不足すると指・腕の痙攣・ジストニアリスクが上昇する。通常より多めの摂取が推奨される。":"")
  });

  // 就寝
  items.push({
    id:"sleep", type:"sleep", time:sleepTarget, checkable:false,
    label:`就寝目標 ${nightMode?"☀️（朝方）":"🌙"}`, pills:[],
    reason:`マグネシウム摂取から90分後が最適な就寝タイミング。`,
    med:""
  });

  const sorted = items.sort((a,b)=>toMin(a.time)-toMin(b.time));
  // ここだけは！モード：サプリが空のチェック可能アイテムを除外
  const filtered = isFull ? sorted : sorted.filter(item => item.caffeine || !item.checkable || item.pills.length > 0);
  // 全itemにdoseMapを付与
  filtered.forEach(item=>{ item.doseMap = doseMap; });
  return { items: filtered, sleepTarget, hasEndTime: !!endBase };
}

/* ─── チェックリストセクション生成 ─── */
function getClSections(jobType, dayMode, careLevel="full") {
  const isBoost = dayMode==="boost"||dayMode==="both";
  const isVideo = jobType==="video";
  const isMusic = jobType==="music";
  const isFull = careLevel==="full" || careLevel==="wing";
  const essIds = getEssentialIds(jobType, dayMode);
  const fp = (pills) => isFull ? pills : pills.filter(p => essIds.includes(p.id));
  // フィルター関数：フルケアなら全部、ここだけは！なら必須のみ
  const filterPills = (pills) => isFull ? pills : pills.filter(p => essIds.includes(p.id));
  const P_local = P; // グローバルPと同期
  const secs = [
    {label:"朝食後①（脂溶性・食後40分）", en:"MORNING FAT-SOL", dot:"gold",
     pills:fp([P_local.coq, P_local.d, P_local.gsh, ...(isVideo?[P_local.lut]:[]), ...(isMusic?[P_local.om3]:[])])},
    {label:"朝食後②（食後15分）", en:"MORNING B", dot:"gold", pills:fp([P_local.b, P_local.zinc, ...(isMusic?[P_local.b6]:[])])},
    ...((isFull || essIds.includes("c1"))?[{label:"午前 ビタミンC", en:"MORNING C", dot:isVideo?"orange":"green", pills:fp([P_local.c1, ...(isVideo?[P_local.iron]:[])])}]:[]),
  ];
  if(isBoost) {
    if((isVideo||isMusic)&&isFull) secs.push({label:isMusic?"ライブ前①（60分前）GABA":"撮影前①（60分前）GABA", en:"FOCUS", dot:"teal", pills:fp([P_local.lte])});
    else if((isVideo||isMusic)&&!isFull&&essIds.includes("lte")) secs.push({label:isMusic?"ライブ前 GABA":"撮影前 GABA", en:"FOCUS", dot:"teal", pills:[P_local.lte]});
    secs.push({label:`${isVideo?"撮影":isMusic?"ライブ":"本番"}前 ブースト`, en:"PRE BOOST", dot:"red", pills:fp([P_local.lc, P_local.coqB])});
    if(isFull || essIds.includes("cB")) secs.push({label:`${isVideo?"撮影":isMusic?"ライブ":"本番"}前 VitC`, en:"PRE-SHOW C", dot:"red", pills:fp([P_local.cB])});
  }
  if(isFull || essIds.includes("c2")) secs.push({label:"夜 ビタミンC", en:"EVENING C", dot:"blue", pills:fp([P_local.c2])});
  secs.push({label:isMusic?"夜 マグネシウム（増量）":"夜 マグネシウム", en:"SLEEP PREP", dot:"purple", pills:[isMusic?P_local.mgx:P_local.mg, P_local.gaba]});

  // 空セクションを除外
  return secs.filter(s => s.pills && s.pills.length > 0);
}



/* ─── サプリ個人最適量計算（体重・性別・モード別）
   根拠：
   ビタミンC: 基礎800mg + 本番日追加600mg + 体重補正。上限2000mg
   ビタミンD: 体重<60kg→1000IU, 60-80kg→2000IU, >80kg→3000IU
   B群: 男性>女性（エネルギー代謝量差）。本番日1.5倍
   Mg: 男性4.5mg/kg、女性3.5mg/kg（日本人食事摂取基準ベース）
   CoQ10: 体重×2mg（基礎）、本番日×1.5
   L-カルニチン: 体重×15mg（移送能力に比例）
   VitC本番前: 500mg追加固定（コルチゾール抑制の有効量）
   鉄（映像）: 女性18mg/日、男性10mg/日
   ルテイン: 10-20mg/日固定（眼科的有効量）
   L-テアニン: 100-200mg（α波誘導有効量）
─── */
/* ─── BMI・年齢別サプリ調整 ─── */
function calcAgeProfile(weight, height, age, gender) {
  const w = parseFloat(weight)||60;
  const h = parseFloat(height)||165;
  const a = parseInt(age)||30;
  const isFemale = gender==="female";

  // BMI
  const bmi = Math.round(w / ((h/100)**2) * 10) / 10;
  const bmiCat = bmi < 18.5 ? "低体重" : bmi < 25 ? "標準" : bmi < 30 ? "過体重" : "肥満";

  // 基礎代謝（Mifflin-St Jeor式）
  const bmr = isFemale
    ? Math.round(10*w + 6.25*h - 5*a - 161)
    : Math.round(10*w + 6.25*h - 5*a + 5);

  // 年齢別調整係数
  const ageGroup = a < 25 ? "20s" : a < 35 ? "30s" : a < 45 ? "40s" : "50s+";

  // 更年期フラグ（女性45歳以上）
  const isPerimenopausal = isFemale && a >= 45;

  // 年齢別サプリ調整
  const ageAdjust = {
    "20s": { coqMult:1.0, vitdMult:1.0, mgMult:1.0, note:"回復力が高い年代。基本構成で十分。" },
    "30s": { coqMult:1.3, vitdMult:1.2, mgMult:1.1, note:"CoQ10・抗酸化を増量。疲労回復を強化。" },
    "40s": { coqMult:1.5, vitdMult:1.5, mgMult:1.3, note:"CoQ10・VitD・Mgを増量。ホルモン変化に対応。" },
    "50s+":{ coqMult:1.8, vitdMult:2.0, mgMult:1.5, note:"骨密度・エネルギー産生を強化。VitD倍増。" },
  };

  return { bmi, bmiCat, bmr, ageGroup, ageAdjust: ageAdjust[ageGroup], isPerimenopausal };
}

function calcDose(weight, gender, dayMode, height="165", age="30") {
  const w  = parseFloat(weight) || 60;
  const isMale   = gender === "male";
  const isBoost  = dayMode==="boost"||dayMode==="both";
  const prof = calcAgeProfile(weight, height, age, gender);
  const ageMult = prof.ageAdjust;

  // 年齢別・ワカサプリ粒数テーブル
  const ageGroup = prof.ageGroup;
  //          CoQ10粒数  Mg粒数  VitC包数（稽古/本番）
  const agePills = {
    "20s": { coqPills:2, mgPills:1, vcPacks:1.0, vcPacksBoost:2.0 },
    "30s": { coqPills:2, mgPills:2, vcPacks:1.0, vcPacksBoost:2.0 },
    "40s": { coqPills:3, mgPills:2, vcPacks:1.5, vcPacksBoost:2.0 },
    "50s+":{ coqPills:4, mgPills:2, vcPacks:2.0, vcPacksBoost:2.0 },
  };
  const ap = agePills[ageGroup] || agePills["20s"];

  // ビタミンC：年齢別包数×2,000mg・1日2〜3回に分割
  const vcTotal = (isBoost ? ap.vcPacksBoost : ap.vcPacks) * 2000;
  const vcAm  = 1000; // 午前は常に1,000mg（0.5包）
  const vcPre = isBoost ? 1000 : 0; // 本番前1,000mg
  const vcPm  = vcTotal - vcAm - vcPre; // 残りを就寝前に

  // ビタミンD
  const vd = Math.round((w < 60 ? 1000 : w < 80 ? 2000 : 3000) * ageMult.vitdMult / 1000) * 1000;

  // B群（B1換算で表記、複合サプリ前提）
  const b1 = isMale ? (isBoost ? 1.5 : 1.2) : (isBoost ? 1.2 : 0.9);

  // マグネシウム: 年齢別粒数×175mg
  const mgPerKg = isMale ? 4.5 : 3.5;
  const mg = ap.mgPills * 175;

  // CoQ10: 年齢別粒数×50mg、本番日+1粒
  const coq = ap.coqPills * 50;
  const coqB = isBoost ? 50 : 0;

  // L-カルニチン: ワカサプリ2粒=700mg
  const lc = isBoost ? 700 : 0;

  // VitC本番前（本番日は追加で半包）

  // 鉄（映像用）：更年期前後の女性はさらに増量
  const iron = isMale ? 10 : (prof.isPerimenopausal ? 25 : 18);

  // 音楽家追加: B6・Omega-3・Mg増量
  const b6 = isMale ? 1.4 : 1.2; // mg/日（日本人食事摂取基準）
  const om3 = 2000; // mg/日（EPA+DHA 炎症抑制有効量）
  const mgMusic = Math.round(w * (isMale ? 6.0 : 5.0) / 50) * 50; // 音楽家は通常より1.5倍

  return {
    vcAm, vcPm, vcPre, vcTotal,
    vd, b1, mg, coq, coqB, lc, iron,
    lut:15, lte:150,
    b6, om3, mgMusic,
  };
}

/* ─── 栄養目標計算（医学的根拠）
   タンパク質: 本番日2.0g/kg, 稽古日1.6g/kg (運動強度別推奨量)
   炭水化物: 本番日7g/kg（高強度運動時の筋グリコーゲン補充）
   脂質: 全日0.8-1.0g/kg
─── */
function calcMacros(weight, dayMode, height="165", age="30", gender="female", jobType="stage") {
  const w = parseFloat(weight)||60;
  const h = parseFloat(height)||165;
  const a = parseInt(age)||30;
  const isFemale = gender==="female";
  const isBoost = dayMode==="boost"||dayMode==="both";

  // Mifflin-St Jeor式で基礎代謝を計算
  const bmr = isFemale
    ? Math.round(10*w + 6.25*h - 5*a - 161)
    : Math.round(10*w + 6.25*h - 5*a + 5);

  // パフォーマーの活動係数
  // boost=本番日(1.8) / both=本番期間(1.7) / cond=稽古日(1.6)
  const actMult = dayMode==="boost" ? 1.8 : dayMode==="both" ? 1.7 : 1.6;
  const kcal = Math.round(bmr * actMult / 50) * 50;

  // PFCバランス（パフォーマー向け：炭水化物50% / タンパク25% / 脂質25%）
  const prot = Math.round(w * (isBoost ? 2.0 : 1.6)); // 体重×倍率
  const fat  = Math.round(kcal * 0.25 / 9);
  const carb = Math.round((kcal - prot*4 - fat*9) / 4);

  return {prot, carb, fat, kcal, bmr, actMult};
}

const FOOD_DB = {
  breakfast:[
    {label:"A",emoji:"🍙🥚",name:"おにぎり1個＋ゆで卵2個",ex:"炭水化物＋タンパク質を最小構成で。消化が速く胃に優しい朝の定番",p:16,c:35,f:11,kcal:300,tip:"ゆで卵はサプリの脂溶性成分の吸収も助ける。まとめて摂るのが効率的"},
    {label:"B",emoji:"🍞🧀",name:"ハムチーズサンド＋牛乳",ex:"良質なタンパク質と脂質を一度に。移動が多い日でも食べやすい",p:18,c:32,f:14,kcal:325,tip:"チーズのカルシウムは骨・筋肉をサポート。牛乳と合わせると吸収UP"},
    {label:"C",emoji:"🥗🍳",name:"サラダ＋目玉焼き入り惣菜パン",ex:"野菜＋タンパク質＋炭水化物が揃う。コンビニのホットスナックも活用",p:14,c:38,f:13,kcal:320,tip:"惣菜パンは具材でタンパク量が変わる。卵・ハム・チキン系を選ぶ"},
    {label:"D",emoji:"🍜",name:"カップ麺（小）＋サラダチキン",ex:"食欲がない朝でも食べやすい。サラダチキンでタンパク質を補強",p:22,c:40,f:8,kcal:320,tip:"カップ麺だけだとタンパク質が足りないので必ずチキンをプラス"},
    {label:"E",emoji:"🥛🍌",name:"豆乳＋バナナ＋ナッツ小袋",ex:"時間がない朝の最速パターン。3つ合わせると必要な栄養が揃う",p:9,c:37,f:12,kcal:285,tip:"ナッツのマグネシウムはサプリと相乗効果。小袋タイプがコンビニに豊富"},
  ],
  lunchBento:[
    {label:"A",emoji:"🍱",name:"幕の内弁当",        p:22,c:95,f:18,kcal:780, tips:["タンパク質の具（卵・肉）から先に食べる","腹8分目を意識。本番前は特に食べすぎない","揚げ物が多い場合は量を半分に"],caution:"本番2時間前以内なら半量で。脂質が多い日は特に注意"},
    {label:"B",emoji:"🍣",name:"幕の内or寿司弁当",  p:26,c:90,f:12,kcal:720, tips:["魚のDHA・EPAが脳と神経系をサポート","酢飯は血糖値の急上昇を緩やかにする","食べる順：刺身→サラダ→ご飯"],caution:"生もの入りは食中毒リスクに注意。夏場・長時間常温保管は避ける"},
    {label:"C",emoji:"🍛",name:"カレー弁当・丼系",  p:20,c:110,f:18,kcal:820, tips:["スパイスが代謝を活性化","炭水化物多めなのでご飯は少し残す","食後に眠くなりやすいので少量が吉"],caution:"本番直前は避けたい。稽古日・公演後のランチ向き"},
    {label:"D",emoji:"🥩",name:"焼肉・から揚げ弁当",p:30,c:80,f:30,kcal:850, tips:["高タンパクで筋肉の修復・維持に◎","脂質が多いので消化に2〜3時間かかる","本番当日の昼は量を半分にする"],caution:"本番当日の昼は特に食べすぎ注意。消化が遅く体が重くなりやすい"},
    {label:"E",emoji:"🐟",name:"魚定食・和食弁当",  p:28,c:88,f:12,kcal:720, tips:["低脂質で消化が良く本番前でも安心","魚のタンパク質は筋肉修復に優秀","野菜のおかずでミネラル・ビタミンも補給"],caution:"一番おすすめ。本番当日のお昼でも安心して食べられる"},
  ],
  lunchCombini:[
    {label:"A",emoji:"🍗🍙",name:"サラダチキン＋おにぎり1個",ex:"高タンパク＋適量の炭水化物。本番前でも胃への負担が少ない",p:28,c:35,f:4,kcal:295,tip:"本番2時間以上前なら十分な量。直前は半分でも"},
    {label:"B",emoji:"🥗🍞",name:"豆腐サラダ＋サンドイッチ",ex:"植物性タンパク＋複合炭水化物。血糖値の急上昇を防ぐ",p:16,c:38,f:10,kcal:305,tip:"豆腐の大豆タンパクは筋修復に有効。食後の眠気が出にくい"},
    {label:"C",emoji:"🍜🥚",name:"温かいうどん＋ゆで卵",ex:"消化がよく胃に優しい。本番前でも食べやすい定番コンビ",p:15,c:52,f:6,kcal:320,tip:"うどんは消化吸収が速い。スープも飲んでミネラル補給"},
    {label:"D",emoji:"🫙🍙",name:"ギリシャヨーグルト＋おにぎり2個",ex:"軽めだが炭水化物とタンパク質はしっかり確保",p:18,c:68,f:1,kcal:350,tip:"ヨーグルトのカルシウムと乳酸菌で腸内環境も整える"},
    {label:"E",emoji:"🥩🥗",name:"サラダチキン＋野菜スープ＋おにぎり",ex:"3点セットで完全な栄養バランス。移動中でも食べやすい",p:30,c:38,f:5,kcal:315,tip:"スープで体を温めて副交感神経を整えてから本番へ"},
  ],
  preboost:[
    {label:"A",emoji:"🍌",name:"バナナ1本",ex:"消化30〜60分・即効エネルギー。緊張で食欲がない本番前の定番",p:1,c:27,f:0,kcal:110,tip:"開演2〜2.5時間前が理想。カリウムも含む手軽なエネルギー補給"},
    {label:"B",emoji:"🧃",name:"ゼリー飲料（エネルギー系）",ex:"固形物が食べられない時の救世主。飲むだけで即エネルギー補給",p:0,c:30,f:0,kcal:120,tip:"開演直前でもOK。inゼリー・ウイダーinゼリー等"},
    {label:"C",emoji:"🍙",name:"梅・昆布おにぎり1個",ex:"シンプルな炭水化物で持続エネルギー。消化が速く胃への負担が最小",p:4,c:35,f:1,kcal:165,tip:"具材がシンプルなほど消化が速い。ツナマヨなど油系は本番前には不向き"},
    {label:"D",emoji:"🍫",name:"高カカオチョコ＋バナナ",ex:"素早い糖質＋マグネシウム補給。チョコのテオブロミンで集中力UP",p:3,c:42,f:8,kcal:250,tip:"チョコは2〜3かけが目安。食べすぎると逆に体が重くなる"},
    {label:"E",emoji:"🥛",name:"豆乳＋和菓子（羊羹・大福）",ex:"和菓子は消化が速く即エネルギー。豆乳で本番前のタンパク質もカバー",p:8,c:45,f:5,kcal:255,tip:"羊羹はアスリートにも使われる持続エネルギー食。コンビニに常備されている"},
  ],
  recovery:[
    {label:"A",emoji:"🍗",name:"サラダチキン＋ポカリ",ex:"終演後の筋修復に最適な純タンパク源＋電解質補給",p:24,c:12,f:3,kcal:170,tip:"帰り道にコンビニで買うのをルーティン化するとgood"},
    {label:"B",emoji:"🫙🍌",name:"ギリシャヨーグルト＋バナナ",ex:"カゼインタンパク＋糖質で睡眠中の筋合成を最大化",p:15,c:35,f:0,kcal:200,tip:"就寝1〜2時間前に食べると睡眠中の修復効率が上がる"},
    {label:"C",emoji:"🍜",name:"温かいスープ＋おにぎり1個",ex:"温かい食事で副交感神経をONに。消耗したグリコーゲンを補給",p:8,c:38,f:4,kcal:220,tip:"帰宅後すぐ食べられる手軽さが大事。スープはミネラル補給にも"},
    {label:"D",emoji:"🥗🍗",name:"豆腐サラダ＋サラダチキン",ex:"低脂質・高タンパクで疲れた胃腸に優しい。抗酸化ビタミンも同時補給",p:28,c:12,f:7,kcal:225,tip:"終演後は消化器官も疲れているので脂質少なめを意識"},
    {label:"E",emoji:"🍣",name:"サーモン巻き＋味噌汁",ex:"DHAを含む食材。味噌汁でミネラルと水分を補給",p:14,c:28,f:6,kcal:225,tip:"DHA・EPAを豊富に含む食材です"},
  ],
};


/* ─── コンビニ別食事データ ─── */
const STORE_FOODS = {
  seven: {
    name:"セブン-イレブン", icon:"🏪",
    breakfast:[
      {label:"A",emoji:"🍙🥚",name:"鮭おにぎり＋半熟ゆでたまご2個",ex:"定番の炭水化物＋良質タンパク。消化が速く胃に優しい朝の定番",p:17,c:36,f:11,kcal:305,tip:"ゆで卵はCoQ10・VitDの脂溶性サプリの吸収を助ける"},
      {label:"B",emoji:"🍞🧀",name:"ハムチーズサンドイッチ＋牛乳",ex:"良質なタンパク質と脂質を一度に。移動が多い日でも食べやすい",p:18,c:32,f:14,kcal:325,tip:"チーズのカルシウムは骨・筋肉をサポート"},
      {label:"C",emoji:"🍗🍙",name:"サラダチキン ハーブ＋おにぎり",ex:"高タンパク＋炭水化物。脂溶性サプリの吸収を助ける脂質も含む",p:28,c:35,f:5,kcal:290,tip:"セブンのサラダチキン ハーブはスパイスで代謝も活性化"},
      {label:"D",emoji:"🥛🍌",name:"豆乳（無調整）＋バナナ＋アーモンド小袋",ex:"時間がない朝の最速パターン",p:11,c:38,f:13,kcal:295,tip:"ナッツのMgはサプリと相乗効果"},
      {label:"E",emoji:"🍞🥚",name:"ブランパン＋温泉卵",ex:"血糖値の急上昇を防ぐ低GIの朝食",p:12,c:25,f:9,kcal:240,tip:"ブランパンは食物繊維が豊富。血糖値を安定させてから本番へ"},
    ],
    lunchCombini:[
      {label:"A",emoji:"🍗🍙",name:"サラダチキン ハーブ＋鮭おにぎり",ex:"高タンパク＋炭水化物の理想コンビ",p:30,c:38,f:5,kcal:305,tip:"セブンのサラダチキンは脂質少なめで消化がよい"},
      {label:"B",emoji:"🥗🍞",name:"1/3日分の野菜サラダ＋サンドイッチ",ex:"野菜＋タンパク質＋炭水化物が揃う",p:16,c:38,f:10,kcal:305,tip:"野菜のVitCでサプリの効果を底上げ"},
      {label:"C",emoji:"🍜🥚",name:"温かいうどん＋ゆでたまご",ex:"消化がよく本番前でも食べやすい",p:15,c:52,f:6,kcal:320,tip:"スープも飲んでミネラル補給"},
      {label:"D",emoji:"🫙🍙",name:"ギリシャヨーグルト＋ツナマヨおにぎり",ex:"タンパク質と炭水化物をしっかり確保",p:18,c:55,f:5,kcal:330,tip:"ヨーグルトの乳酸菌で腸内環境を整える"},
      {label:"E",emoji:"🍗🍙",name:"サラダチキン ケイジャン＋おにぎり＋野菜スープ",ex:"3点セットで完全な栄養バランス",p:32,c:42,f:5,kcal:330,tip:"スープで体を温めて副交感神経を整えてから本番へ"},
    ],
    recovery:[
      {label:"A",emoji:"🍗",name:"サラダチキンバー スモークペッパー＋ポカリ",ex:"終演後の筋修復に最適な純タンパク源＋電解質補給",p:24,c:12,f:3,kcal:185,tip:"帰り道にコンビニで買うのをルーティン化"},
      {label:"B",emoji:"🫙🍌",name:"ギリシャヨーグルト＋バナナ",ex:"カゼインタンパク＋糖質で睡眠中の筋合成を最大化",p:15,c:35,f:0,kcal:200,tip:"就寝1〜2時間前が最適"},
      {label:"C",emoji:"🍜",name:"スープパスタ＋ゆでたまご",ex:"温かい食事で副交感神経をON",p:14,c:38,f:6,kcal:255,tip:"温かいスープは体の緊張をほぐす"},
      {label:"D",emoji:"🥗🍗",name:"1/3日分野菜サラダ＋サラダチキン",ex:"低脂質・高タンパクで疲れた胃腸に優しい",p:30,c:12,f:7,kcal:230,tip:"終演後は脂質少なめを意識"},
      {label:"E",emoji:"🍣",name:"サーモンのカルパッチョ風＋味噌汁＋おにぎり",ex:"DHAを含む食材。バランスの良い一食",p:16,c:32,f:7,kcal:250,tip:"DHA・EPAを豊富に含む食材です"},
    ],
  },
  famima: {
    name:"ファミリーマート", icon:"🏪",
    breakfast:[
      {label:"A",emoji:"🍙🥚",name:"ごちむすび 鮭はらみ＋半熟ゆでたまご",ex:"ボリューム系おにぎりで炭水化物とタンパク質を確保",p:18,c:40,f:10,kcal:315,tip:"ゆで卵でVitDの吸収も助ける"},
      {label:"B",emoji:"🍞🧀",name:"ハムチーズサンド＋カフェラテ",ex:"タンパク質と脂質を一度に。移動が多い朝でも食べやすい",p:17,c:33,f:15,kcal:330,tip:"チーズのカルシウムが筋肉の収縮をサポート"},
      {label:"C",emoji:"🍗🍙",name:"国産鶏のサラダチキン 淡路島の藻塩＋おにぎり",ex:"高タンパクで低カロリー。サプリの脂溶性成分の吸収を助ける",p:27,c:36,f:4,kcal:285,tip:"ファミマのサラダチキンはカロリー97kcalで最もヘルシー"},
      {label:"D",emoji:"🥛🍌",name:"豆乳（無調整）＋バナナ＋ミックスナッツ",ex:"時間がない朝の最速パターン",p:11,c:38,f:13,kcal:295,tip:"ナッツのMgはサプリと相乗効果"},
      {label:"E",emoji:"🍞🥚",name:"全粒粉サンドイッチ＋温泉卵",ex:"低GIで血糖値の急上昇を防ぐ",p:14,c:28,f:10,kcal:260,tip:"全粒粉は食物繊維が豊富"},
    ],
    lunchCombini:[
      {label:"A",emoji:"🍗🍙",name:"国産鶏のサラダチキン 淡路島の藻塩＋おにぎり",ex:"高タンパク・低脂質の理想コンビ",p:28,c:36,f:4,kcal:285,tip:"ファミマのサラダチキンは3社中最もヘルシー"},
      {label:"B",emoji:"🧀🍙",name:"タンスティック 濃厚4種のチーズ＋おにぎり",ex:"チーズの良質な脂質とタンパク質",p:20,c:38,f:12,kcal:330,tip:"チーズのカルシウムとたんぱく質をしっかり補給"},
      {label:"C",emoji:"🍜🥚",name:"うどん＋ゆでたまご",ex:"消化がよく本番前でも安心",p:15,c:52,f:6,kcal:320,tip:"本番前の定番。スープで電解質も補給"},
      {label:"D",emoji:"🫙🍙",name:"ギリシャヨーグルト＋ツナマヨおにぎり",ex:"タンパク質と炭水化物のバランスが良い",p:18,c:55,f:5,kcal:330,tip:"乳酸菌で腸内環境の維持をサポート"},
      {label:"E",emoji:"🥗🍗",name:"サラダチキン＋サラダ＋おにぎり",ex:"完璧な栄養バランス。本番日の理想的なランチ",p:32,c:42,f:5,kcal:330,tip:"サラダのVitCがサプリの効果を底上げ"},
    ],
    recovery:[
      {label:"A",emoji:"🍗",name:"国産鶏のサラダチキン 淡路島の藻塩＋ポカリ",ex:"終演後の筋修復に最適",p:25,c:12,f:2,kcal:180,tip:"3社中最も低カロリーで就寝前でも安心"},
      {label:"B",emoji:"🫙🍌",name:"ギリシャヨーグルト＋バナナ",ex:"カゼインタンパク＋糖質で睡眠中の筋合成を最大化",p:15,c:35,f:0,kcal:200,tip:"就寝1〜2時間前が最適"},
      {label:"C",emoji:"🍜",name:"温かいスープ＋おにぎり",ex:"温かい食事で副交感神経をON",p:9,c:40,f:4,kcal:225,tip:"終演後の冷えた体を温めて副交感神経を優位に"},
      {label:"D",emoji:"🧀🥗",name:"タンスティック チーズ＋サラダ",ex:"高タンパク・低糖質で就寝前でも安心",p:22,c:10,f:9,kcal:215,tip:"チーズのカゼインは吸収が遅く睡眠中の修復に最適"},
      {label:"E",emoji:"🍣",name:"サーモン巻き＋味噌汁",ex:"DHA・EPAを含む食材",p:14,c:28,f:6,kcal:225,tip:"DHA・EPAを豊富に含む食材です"},
    ],
    preboost:[
      {label:"A",emoji:"🍌",name:"バナナ1本",ex:"消化30〜60分・即効エネルギー",p:1,c:27,f:0,kcal:110,tip:"開演2〜2.5時間前が理想。カリウムも含む手軽なエネルギー補給"},
      {label:"B",emoji:"🧃",name:"ファミマ inゼリー エネルギー＋マルチビタミン",ex:"飲むだけで即エネルギー。ビタミンも同時補給できる",p:0,c:43,f:0,kcal:200,tip:"開演直前でもOK。レジ横でいつでも入手可能"},
      {label:"C",emoji:"🍙",name:"ファミマ 梅おにぎり or 昆布おにぎり",ex:"シンプルな炭水化物で持続エネルギー",p:4,c:35,f:1,kcal:165,tip:"具材がシンプルなほど消化が速い"},
      {label:"D",emoji:"🍫",name:"明治 チョコレート効果カカオ72%＋バナナ",ex:"素早い糖質＋マグネシウム補給。集中力UP",p:3,c:42,f:8,kcal:250,tip:"チョコは2〜3かけが目安"},
      {label:"E",emoji:"🥛",name:"豆乳＋ファミマ 水ようかん",ex:"和菓子は消化が速く即エネルギー",p:8,c:45,f:5,kcal:255,tip:"羊羹・水ようかんはアスリートにも使われる"},
    ],
  },
  lawson: {
    name:"ローソン", icon:"🏪",
    breakfast:[
      {label:"A",emoji:"🍙🥚",name:"大きなおにぎり 鮭＋たまごのサラダ",ex:"ボリューム満点の朝食",p:18,c:42,f:10,kcal:325,tip:"大きなおにぎりで炭水化物を確保"},
      {label:"B",emoji:"🍞🧀",name:"ハムチーズサンド＋低脂肪牛乳",ex:"良質タンパクと脂質。移動中でも食べやすい",p:19,c:31,f:13,kcal:318,tip:"牛乳とチーズで筋肉の収縮をサポート"},
      {label:"C",emoji:"🍗🍙",name:"サラダチキン プレーン＋おにぎり",ex:"高タンパク＋炭水化物",p:27,c:36,f:3,kcal:280,tip:"ローソンのサラダチキンはしっとりジューシーで食べやすい"},
      {label:"D",emoji:"🥛🍌",name:"豆乳＋バナナ＋ナッツ",ex:"時間がない朝の最速パターン",p:10,c:37,f:12,kcal:285,tip:"ナッツのマグネシウムとバナナのカリウムを補給"},
      {label:"E",emoji:"🥛🥐",name:"カフェラテ＋クロワッサン＋ゆでたまご",ex:"脂質と炭水化物で持続エネルギー",p:13,c:32,f:18,kcal:340,tip:"クロワッサンの脂質がCoQ10・VitDの吸収を助ける"},
    ],
    lunchCombini:[
      {label:"A",emoji:"🍗🍙",name:"サラダチキン プレーン＋おにぎり",ex:"高タンパク・低脂質の理想コンビ",p:27,c:36,f:3,kcal:280,tip:"ローソンのサラダチキンはしっとり感があり食べやすい"},
      {label:"B",emoji:"🍅🧀",name:"サラダチキンスティック トマト＆チーズ＋おにぎり",ex:"チーズとトマトでカルシウム＋リコピンも摂れる",p:20,c:38,f:8,kcal:300,tip:"トマトのリコピンは抗酸化作用で酸化ストレスを軽減"},
      {label:"C",emoji:"🍜🥚",name:"うどん＋ゆでたまご",ex:"消化がよく本番前でも食べやすい",p:15,c:52,f:6,kcal:320,tip:"本番前の定番。スープで電解質補給"},
      {label:"D",emoji:"🫙🍙",name:"ギリシャヨーグルト＋鮭おにぎり",ex:"タンパク質と炭水化物のバランスが良い",p:19,c:52,f:3,kcal:310,tip:"ヨーグルトの乳酸菌で腸内環境を整える"},
      {label:"E",emoji:"🥗🍗",name:"サラダチキン スティック バジル＋サラダ＋おにぎり",ex:"スティックタイプで食べやすい。完全な栄養バランス",p:29,c:40,f:4,kcal:305,tip:"バジルのハーブが気分もリフレッシュ"},
    ],
    recovery:[
      {label:"A",emoji:"🍗",name:"サラダチキン プレーン＋ポカリ",ex:"終演後の筋修復に最適",p:24,c:12,f:2,kcal:175,tip:"帰り道にコンビニで買うのをルーティン化"},
      {label:"B",emoji:"🫙🍌",name:"ギリシャヨーグルト＋バナナ",ex:"カゼインタンパクで睡眠中の筋合成を最大化",p:15,c:35,f:0,kcal:200,tip:"就寝1〜2時間前が最適"},
      {label:"C",emoji:"🍜",name:"温かいスープ＋おにぎり",ex:"温かい食事で副交感神経をON",p:9,c:40,f:4,kcal:225,tip:"温かい食事で体の緊張をほぐす"},
      {label:"D",emoji:"🍅🥗",name:"サラダチキンスティック トマト＆チーズ＋サラダ",ex:"トマトのリコピンで抗酸化",p:22,c:10,f:6,kcal:200,tip:"リコピンを含むトマトを使用"},
      {label:"E",emoji:"🍣",name:"サーモン巻き＋具だくさん味噌汁",ex:"DHAを含む食材。味噌汁でミネラルと水分を補給",p:15,c:30,f:6,kcal:230,tip:"DHA・EPAを豊富に含む食材です"},
    ],
    preboost:[
      {label:"A",emoji:"🍌",name:"バナナ1本",ex:"消化30〜60分・即効エネルギー",p:1,c:27,f:0,kcal:110,tip:"開演2〜2.5時間前が理想。カリウムも含む手軽なエネルギー補給"},
      {label:"B",emoji:"🧃",name:"ローソン inゼリー エネルギー",ex:"飲むだけで即エネルギー補給",p:0,c:43,f:0,kcal:200,tip:"開演直前でもOK。レジ横でいつでも入手可能"},
      {label:"C",emoji:"🍙",name:"ローソン 梅おにぎり or 昆布おにぎり",ex:"シンプルな炭水化物で持続エネルギー",p:4,c:35,f:1,kcal:165,tip:"具材がシンプルなほど消化が速い"},
      {label:"D",emoji:"🍫",name:"明治 チョコレート効果カカオ72%＋バナナ",ex:"素早い糖質＋マグネシウム補給",p:3,c:42,f:8,kcal:250,tip:"チョコは2〜3かけが目安"},
      {label:"E",emoji:"🥛",name:"豆乳＋ローソン あんころもち or 水ようかん",ex:"和菓子は消化が速く即エネルギー",p:8,c:45,f:5,kcal:255,tip:"羊羹・和菓子はアスリートにも使われる"},
    ],
  },
};


/* ─── ドラムロール時間ピッカーコンポーネント ─── */
function TimePicker({ value, onChange, label, disabled }) {
  const [open, setOpen] = React.useState(false);
  const [h, setH] = React.useState(() => parseInt((value||"00:00").split(":")[0]));
  const [m, setM] = React.useState(() => Math.floor(parseInt((value||"00:00").split(":")[1]||0)/5)*5);
  const hRef    = React.useRef(null);
  const mRef    = React.useRef(null);
  const hColRef = React.useRef(null);
  const mColRef = React.useRef(null);
  const dragging = React.useRef(null);

  const hours = Array.from({length:24},(_,i)=>i);
  const mins  = Array.from({length:12},(_,i)=>i*5);

  React.useEffect(()=>{
    if(value){
      setH(parseInt(value.split(":")[0]));
      setM(Math.floor(parseInt(value.split(":")[1]||0)/5)*5);
    }
  },[value]);

  const scrollTo = (ref, index, smooth=true) => {
    if(!ref.current) return;
    ref.current.style.transition = smooth ? "transform .2s ease" : "none";
    ref.current.style.transform = `translateY(${-index * 40}px)`;
  };

  React.useEffect(()=>{ scrollTo(hRef, hours.indexOf(h)); },[h, open]);
  React.useEffect(()=>{ scrollTo(mRef, mins.indexOf(m));  },[m, open]);

  // ── グローバルmove/endリスナー（touchmoveはpassive:false）──
  React.useEffect(()=>{
    const move = (e) => {
      if(!dragging.current) return;
      e.preventDefault();
      const {startY, startIdx, ref, items, setter} = dragging.current;
      const y = e.type==="touchmove" ? e.touches[0].clientY : e.clientY;
      const delta = Math.round((startY - y) / 40);
      const newIdx = Math.max(0, Math.min(items.length-1, startIdx+delta));
      ref.current.style.transition = "none";
      ref.current.style.transform = `translateY(${-newIdx * 40}px)`;
      setter(items[newIdx]);
    };
    const end = () => { dragging.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", move, {passive:false});
    window.addEventListener("touchend", end);
    return ()=>{
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  },[]);

  // ── カラムのtouchstartをネイティブ・non-passiveで登録 ──
  // Reactのo nTouchStartはpassiveなのでpreventDefault()が無視される
  React.useEffect(()=>{
    const hCol = hColRef.current;
    const mCol = mColRef.current;
    if(!hCol || !mCol) return;
    const hStart = (e) => {
      e.preventDefault();
      dragging.current = { startY:e.touches[0].clientY, startIdx:hours.indexOf(h), ref:hRef, items:hours, setter:setH };
    };
    const mStart = (e) => {
      e.preventDefault();
      dragging.current = { startY:e.touches[0].clientY, startIdx:mins.indexOf(m), ref:mRef, items:mins, setter:setM };
    };
    hCol.addEventListener("touchstart", hStart, {passive:false});
    mCol.addEventListener("touchstart", mStart, {passive:false});
    return ()=>{
      hCol.removeEventListener("touchstart", hStart);
      mCol.removeEventListener("touchstart", mStart);
    };
  },[open, h, m]);

  // h/m 変化時にリアルタイムでonChange
  React.useEffect(()=>{
    if(!open) return;
    const val = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    onChange({target:{value:val}});
  },[h, m]);

  const confirm = () => { setOpen(false); };
  const fmt = (v) => v ? `${v.split(":")[0]}:${v.split(":")[1]}` : "--:--";

  return (
    <>
      <div className={`tp-wrap ${disabled?"opacity-40":""}`}
        onClick={()=>{ if(!disabled) setOpen(true); }}
        style={{opacity:disabled?.4:1, minWidth:70, justifyContent:"center"}}>
        <span style={{fontSize:18,fontWeight:700,color:"var(--txt)",fontVariantNumeric:"tabular-nums",letterSpacing:"-.02em"}}>
          {fmt(value)}
        </span>
      </div>
      {open&&(
        <div className="tp-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setOpen(false); }}>
          <div className="tp-sheet">
            <div className="tp-sheet-hdr">
              <div className="tp-sheet-title">{label||"時間を選択"}</div>
              <div className="tp-sheet-done" onClick={confirm}>閉じる</div>
            </div>
            <div className="tp-drum-wrap">
              <div className="tp-drum-col" ref={hColRef}
                onMouseDown={(e)=>{ dragging.current = { startY:e.clientY, startIdx:hours.indexOf(h), ref:hRef, items:hours, setter:setH }; }}>
                <div className="tp-drum-inner" ref={hRef}>
                  {[...Array(2)].map((_,i)=><div key={`ph${i}`} className="tp-drum-item dim2"/>)}
                  {hours.map(v=>(
                    <div key={v} className={`tp-drum-item ${v===h?"selected":Math.abs(v-h)===1?"dim1":"dim2"}`}
                      onClick={()=>setH(v)}>
                      {String(v).padStart(2,"0")}
                    </div>
                  ))}
                  {[...Array(2)].map((_,i)=><div key={`pa${i}`} className="tp-drum-item dim2"/>)}
                </div>
                <div className="tp-drum-line"/>
              </div>
              <div className="tp-drum-sep">:</div>
              <div className="tp-drum-col" ref={mColRef}
                onMouseDown={(e)=>{ dragging.current = { startY:e.clientY, startIdx:mins.indexOf(m), ref:mRef, items:mins, setter:setM }; }}>
                <div className="tp-drum-inner" ref={mRef}>
                  {[...Array(2)].map((_,i)=><div key={`ph${i}`} className="tp-drum-item dim2"/>)}
                  {mins.map(v=>(
                    <div key={v} className={`tp-drum-item ${v===m?"selected":Math.abs(v-m)===5?"dim1":"dim2"}`}
                      onClick={()=>setM(v)}>
                      {String(v).padStart(2,"0")}
                    </div>
                  ))}
                  {[...Array(2)].map((_,i)=><div key={`pa${i}`} className="tp-drum-item dim2"/>)}
                </div>
                <div className="tp-drum-line"/>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ─── iCalファイル書き出し ─── */
function exportToICS(items) {
  if(!items || items.length === 0) return;
  const calItems = items.filter(item => item.time && item.label);
  if(calItems.length === 0) return;

  const today = new Date();
  const pad = n => String(n).padStart(2,"0");
  const dateStr = `${today.getFullYear()}${pad(today.getMonth()+1)}${pad(today.getDate())}`;

  const toICSTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return `${dateStr}T${pad(h)}${pad(m)}00`;
  };
  const toICSTimeEnd = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m+15);
    return `${dateStr}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
  };

  const uid = () => Math.random().toString(36).slice(2) + "@performerstime";
  const escape = s => (s||"").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\n/g,"\\n");

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PERFORMER'S TIME//EMA//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:PERFORMER'S TIME サプリ",
    "X-WR-TIMEZONE:Asia/Tokyo",
  ];

  calItems.forEach(item => {
    const pillNames = item.pills && item.pills.length > 0
      ? item.pills.map(p => p.name).join("・")
      : item.drinkInfo ? item.drinkInfo.name : "";
    const title = `${item.label}${pillNames ? " — "+pillNames : ""}`;
    const desc = escape(item.reason || "");

    ics = ics.concat([
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTART;TZID=Asia/Tokyo:${toICSTime(item.time)}`,
      `DTEND;TZID=Asia/Tokyo:${toICSTimeEnd(item.time)}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${desc}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT0M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(title)}`,
      "END:VALARM",
      "END:VEVENT",
    ]);
  });

  ics.push("END:VCALENDAR");

  const blob = new Blob([ics.join("\r\n")], {type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `performers-time-${dateStr}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/* ─── メインコンポーネント ─── */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ざっくりモード コンポーネント
   シンプルに「今日飲むサプリ」だけ表示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SimpleModeView({ jobType, setJobType, dayMode, setDayMode, lightMode }) {
  const isBoost = dayMode==="boost"||dayMode==="both";

  const SIMPLE = {
    stage: {
      morning: [
        {p:P.c1,  note:"抗酸化・免疫を朝から"},
        {p:P.d,   note:"筋肉・骨・関節をサポート"},
        {p:P.coq, note:"エネルギー産生を高める"},
        {p:P.b,   note:"代謝エンジンを朝からON"},
        {p:P.zinc, note:"免疫・声帯・味覚を守る"},
      ],
      boost: [
        {p:P.lc,   note:"脂肪を燃料に変える"},
        {p:P.coqB, note:"カルニチンと相乗効果"},
      ],
      night: [
        {p:P.c2,   note:"睡眠中の修復に"},
        {p:P.mg,   note:"筋弛緩・ぐっすり眠る"},
        {p:P.gaba, note:"ストレスを解きほぐす"},
      ],
    },
    music: {
      morning: [
        {p:P.c1,  note:"抗酸化・免疫を朝から"},
        {p:P.d,   note:"筋肉・骨をサポート"},
        {p:P.coq, note:"エネルギー産生を高める"},
        {p:P.b,   note:"代謝エンジンを朝からON"},
        {p:P.b6,  note:"神経・筋肉の安定"},
        {p:P.om3, note:"腱・関節の炎症を抑える"},
      ],
      boost: [
        {p:P.lte, note:"本番前の緊張をほぐす"},
        {p:P.lc,  note:"脂肪を燃料に変える"},
      ],
      night: [
        {p:P.c2,  note:"睡眠中の修復に"},
        {p:P.mgx, note:"演奏疲れの筋肉をほぐす"},
        {p:P.gaba,note:"ストレスを解きほぐす"},
      ],
    },
    video: {
      morning: [
        {p:P.c1,   note:"抗酸化・免疫を朝から"},
        {p:P.d,    note:"筋肉・骨をサポート"},
        {p:P.coq,  note:"エネルギー産生を高める"},
        {p:P.lut,  note:"撮影照明から目を守る"},
        {p:P.iron, note:"長時間撮影の持続力"},
      ],
      boost: [
        {p:P.lte, note:"撮影前の集中力UP"},
        {p:P.lc,  note:"脂肪を燃料に変える"},
      ],
      night: [
        {p:P.c2,   note:"睡眠中の修復に"},
        {p:P.mg,   note:"筋弛緩・ぐっすり眠る"},
        {p:P.gaba, note:"ストレスを解きほぐす"},
      ],
    },
  };

  const s = SIMPLE[jobType] || SIMPLE.stage;
  const jobLabel = jobType==="video" ? "映像・撮影" : jobType==="music" ? "音楽・ライブ" : "舞台・演劇";
  const modeLabel = dayMode==="cond" ? "稽古・オフ日" : "本番・撮影日";

  const gold = lightMode ? "#8a6418" : "#c9a84c";
  const goldL = lightMode ? "#6a4c10" : "#e8c97a";
  const red  = lightMode ? "#901e0e" : "#c04a3a";
  const pur  = lightMode ? "#5a3a8a" : "#8060c0";

  const TimeCard = ({ icon, color, label, time, items }) => (
    <div style={{
      background:"var(--bg3)", borderRadius:14,
      border:`1px solid ${color}33`, overflow:"hidden", marginBottom:12,
    }}>
      <div style={{
        padding:"10px 14px 8px",
        background:`${color}0d`,
        borderBottom:`1px solid ${color}22`,
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{fontSize:22}}>{icon}</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>{label}</div>
          <div style={{fontSize:10,color:"var(--dim)",marginTop:1}}>{time}</div>
        </div>
      </div>
      <div style={{padding:"10px 14px"}}>
        {items.map((item, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            paddingBottom: i < items.length-1 ? 8 : 0,
            marginBottom:  i < items.length-1 ? 8 : 0,
            borderBottom:  i < items.length-1 ? "1px solid rgba(255,255,255,.05)" : "none",
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", flexShrink:0,
              background: item.p.wakaFlag ? gold : "var(--dim)",
            }}/>
            <div style={{flex:1}}>
              <span style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>{item.p.name}</span>
              <span style={{fontSize:10,color:"var(--dim)",marginLeft:8}}>{item.note}</span>
            </div>
            {item.p.wakaFlag && (
              <a href={item.p.waka} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize:10, fontWeight:700, padding:"4px 10px",
                  borderRadius:20, flexShrink:0, textDecoration:"none",
                  background:`${gold}18`,
                  border:`1px solid ${gold}44`,
                  color: goldL,
                }}>
                購入 →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{padding:"14px 18px 0"}}>

      {/* 仕事タイプ */}
      <div style={{display:"flex", gap:8, marginBottom:12}}>
        {[
          {key:"stage", icon:"🎭", label:"舞台"},
          {key:"music", icon:"🎵", label:"音楽"},
          {key:"video", icon:"🎬", label:"映像"},
        ].map(j => (
          <button key={j.key}
            onClick={()=>setJobType(j.key)}
            style={{
              flex:1, padding:"10px 4px", borderRadius:12, border:"none",
              cursor:"pointer", fontFamily:"'Noto Sans JP',sans-serif",
              background:"var(--bg3)",
              outline: jobType===j.key ? `2px solid ${gold}` : "none",
              transition:"all .2s",
            }}>
            <div style={{fontSize:20, marginBottom:3}}>{j.icon}</div>
            <div style={{
              fontSize:12, fontWeight:700,
              color: jobType===j.key ? goldL : "var(--dim)",
            }}>{j.label}</div>
          </button>
        ))}
      </div>

      {/* 今日のモード */}
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        {[
          {key:"cond",  icon:"🌿", label:"稽古・オフ日"},
          {key:"boost", icon:"⚡", label:"本番・撮影日"},
        ].map(m => (
          <button key={m.key}
            onClick={()=>setDayMode(m.key)}
            style={{
              flex:1, padding:"12px 8px", borderRadius:12, border:"none",
              cursor:"pointer", fontFamily:"'Noto Sans JP',sans-serif",
              background:"var(--bg3)",
              outline: dayMode===m.key ? `2px solid ${gold}` : "none",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              transition:"all .2s",
            }}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <span style={{
              fontSize:12, fontWeight:700,
              color: dayMode===m.key ? goldL : "var(--dim)",
            }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* 今日飲むサプリ */}
      <div style={{
        fontSize:11, fontWeight:700, color:"var(--txt)",
        marginBottom:10, display:"flex", alignItems:"center", gap:6,
      }}>
        <span>💊</span> 今日飲むサプリ
        <span style={{fontSize:9,color:"var(--dim)",fontWeight:400,marginLeft:4}}>
          {jobLabel} · {modeLabel}
        </span>
      </div>

      <TimeCard icon="☀️" color={gold}  label="朝 飲む"      time="朝ごはんの後" items={s.morning}/>
      {isBoost && (
        <TimeCard icon="⚡" color={red} label="本番前 飲む"  time="本番・撮影の2〜3時間前" items={s.boost}/>
      )}
      <TimeCard icon="🌙" color={pur}  label="夜 飲む"       time="就寝の1〜2時間前" items={s.night}/>



      {/* ── 食事 ── */}
      <div style={{marginTop:4}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span>🍱</span> 今日の食事ポイント
          <span style={{fontSize:9,color:"var(--dim)",fontWeight:400,marginLeft:4}}>
            {isBoost?"本番・撮影日":"稽古・オフ日"}
          </span>
        </div>
        <div style={{background:"var(--bg3)",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",overflow:"hidden"}}>
          {(isBoost ? [
            {icon:"☀️", time:"朝ごはん",       text:"消化の良いものを。おにぎり＋ゆで卵が定番"},
            {icon:"🍽️", time:"本番3時間前",     text:"食べ終えておく。脂っこいものは避ける"},
            {icon:"⚡", time:"本番1〜2時間前",  text:"バナナ・ゼリー飲料など軽めのエネルギー補給"},
            {icon:"🌙", time:"終演後すぐ",      text:"サラダチキン＋ポカリ。筋修復のゴールデンタイム"},
          ] : [
            {icon:"☀️", time:"朝ごはん",     text:"消化の良いものを。サプリの脂溶性成分は食後に"},
            {icon:"🍽️", time:"お昼",         text:"腹8分目を意識。高タンパク・低脂質を心がける"},
            {icon:"🌙", time:"夜ごはん",     text:"稽古後60分以内が理想。タンパク質をしっかり摂る"},
          ]).map((item, i, arr) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:12, padding:"11px 14px",
              borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,.04)" : "none",
            }}>
              <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:goldL,marginBottom:2}}>{item.time}</div>
                <div style={{fontSize:11,color:"var(--txt)",lineHeight:1.6}}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,color:"var(--dim)",marginTop:6,paddingLeft:4,lineHeight:1.7}}>
          💡 詳しいコンビニ飯レシピは<span style={{color:goldL,fontWeight:700}}>プロ仕様 → コンビニ飯タブ</span>で
        </div>
      </div>

      {/* ── 睡眠 ── */}
      <div style={{marginTop:16,marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span>🌙</span> 睡眠のポイント
        </div>
        <div style={{background:"var(--bg3)",borderRadius:14,border:"1px solid rgba(128,96,192,.2)",overflow:"hidden"}}>
          {[
            {icon:"💊", label:"就寝1〜2時間前", text:"マグネシウム＋GABA を飲む（夜サプリ）"},
            {icon:"📵", label:"就寝30分前",      text:"スマホをやめて部屋を暗くする"},
            {icon:"⏰", label:"起床時間の計算",  text:"90分サイクルで逆算（7.5時間 or 9時間が目安）"},
            {icon:"☀️", label:"起きたらすぐ",   text:"日光を浴びて体内時計をリセット"},
          ].map((item, i, arr) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:12, padding:"11px 14px",
              borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,.04)" : "none",
            }}>
              <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#a080d0",marginBottom:2}}>{item.label}</div>
                <div style={{fontSize:11,color:"var(--txt)",lineHeight:1.6}}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,color:"var(--dim)",marginTop:6,paddingLeft:4,lineHeight:1.7}}>
          💡 翌日の起床推奨時刻は<span style={{color:goldL,fontWeight:700}}>プロ仕様 → タイムライン</span>で自動計算
        </div>
      </div>

    </div>
  );
}


export default function App() {
  // Google Analytics
  useEffect(()=>{
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = "https://www.googletagmanager.com/gtag/js?id=G-SRB8BP5YSL";
    document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", "G-SRB8BP5YSL");
  }, []);

  const [simpleMode, setSimpleMode] = useState(true); // true=ざっくり false=プロ仕様
  const [jobType,   setJobType]  = useState("stage");
  const [dayMode,   setDayMode]  = useState("cond");
  const [nightMode, setNightMode]= useState(false);
  const [wakeup,    setWakeup]   = useState("07:30");
  // 公演スケジュール登録
  const [savedSchedules, setSavedSchedules] = useState(()=>{
    try{return JSON.parse(localStorage.getItem("pt_schedules")||"[]")}catch{return[]}
  });
  const [showScheduleMgr, setShowScheduleMgr] = useState(false);
  const [newSchedDate,    setNewSchedDate]    = useState("");
  const [newSchedShows,   setNewSchedShows]   = useState([{time:"13:00",endTime:"14:30",enabled:true}]);
  const [callTime,  setCallTime] = useState("");
  const [callOn,    setCallOn]   = useState(false);
  const [rehearsalOn,  setRehearsalOn]  = useState(false);
  const [rehearsalStart, setRehearsalStart] = useState("10:00");
  const [rehearsalEnd,   setRehearsalEnd]   = useState("15:00");
  const [shows,     setShows]    = useState([
    {enabled:true,  time:"13:00", endEnabled:false, endTime:"14:30"},
    {enabled:false, time:"18:00", endEnabled:false, endTime:"19:30"},
  ]);
  const [nextDayOn, setNextDayOn]= useState(false);
  const [tab,       setTab]      = useState("schedule");
  const [schedule,  setSchedule] = useState(null);
  const [tlCk,      setTlCk]     = useState(()=>{try{return JSON.parse(localStorage.getItem("pt_tlCk")||"{}")}catch{return{}}});
  const [clCk,      setClCk]     = useState(()=>{try{return JSON.parse(localStorage.getItem("pt_clCk")||"{}")}catch{return{}}});
  const [medOpen,   setMedOpen]  = useState({});
  const [buyOpen,   setBuyOpen]  = useState({});
  const [emaOpen,   setEmaOpen]  = useState({});
  const [weight,    setWeight]   = useState("60");
  const [height,    setHeight]   = useState("165");
  const [age,       setAge]       = useState("30");
  const [gender,    setGender]   = useState("female");
  const [careLevel, setCareLevel] = useState("full"); // full / essential
  const [lightMode,  setLightMode]  = useState(true);
  const [wingMode,   setWingMode]   = useState(false);

  // ── 連続チェック日数 ──
  const [streak, setStreak] = useState(()=>{
    try {
      const s = JSON.parse(localStorage.getItem("pt_streak")||"{}");
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      if(s.lastDate === today) return s;
      if(s.lastDate === yesterday) return {...s, lastDate:today, checked:false};
      return {count:0, lastDate:today, checked:false, best:s.best||0};
    } catch { return {count:0, lastDate:new Date().toDateString(), checked:false, best:0}; }
  });

  // clCk が変化したとき（何か1つでもチェックされたら今日達成）
  useEffect(()=>{
    if(Object.values(clCk).some(v=>v) && !streak.checked) {
      const newCount = streak.count + 1;
      const newBest  = Math.max(newCount, streak.best||0);
      const next = {...streak, count:newCount, checked:true, best:newBest};
      setStreak(next);
      try { localStorage.setItem("pt_streak", JSON.stringify(next)); } catch {}
    }
  }, [clCk]);
  const [showHomeBanner, setShowHomeBanner] = useState(()=>{
    try{return localStorage.getItem("pt_homeBanner")!=="dismissed"}catch{return true}
  });
  const [lunchOn,   setLunchOn]  = useState(true);
  // マチソワ（2公演）の時は自動でお弁当ON
  React.useEffect(()=>{
    const activeCount = shows.filter(s=>s.enabled&&s.time).length;
    if(activeCount >= 2) setLunchOn(true);
  }, [shows]);
  const [store,     setStore]     = useState("seven"); // seven / famima / lawson
  const [mealIdx,   setMealIdx]  = useState({breakfast:0,lunch:0,preboost:0,recovery:0}); // male/female

  const isBoost = dayMode==="boost"||dayMode==="both";
  const isVideo = jobType==="video";
  const isMusic = jobType==="music";
  const isWing  = wingMode;
  const filterPills = (pills) => (isFull||isWing) ? pills : pills.filter(p => essIds.includes(p.id));

  const generate = () => {
    setTlCk({}); setMedOpen({});
    setSchedule(buildSchedule({jobType,dayMode,nightMode,wakeup,
      callTime: callOn?callTime:null, shows, weight, height, age, gender, careLevel,
      rehearsalStart: rehearsalOn?rehearsalStart:null,
      rehearsalEnd: rehearsalOn?rehearsalEnd:null,
      isWingMode: wingMode}));
  };

  const toggleEndTime = (i) => setShows(p=>p.map((x,idx)=>idx===i?{...x,endEnabled:!x.endEnabled}:x));
  const setEndTime    = (i,t)=> setShows(p=>p.map((x,idx)=>idx===i?{...x,endTime:t}:x));
  const setStartTime  = (i,t)=> setShows(p=>p.map((x,idx)=>idx===i?{...x,time:t}:x));
  const toggleShow    = (i)  => setShows(p=>p.map((x,idx)=>idx===i?{...x,enabled:!x.enabled}:x));

  const modeConf = {
    cond:  {concept:"「落ちない身体をつくる」",       sub:"稽古期間・疲労回復・日常維持"},
    boost: {concept:"「ここ一番で動ける身体に」",      sub:"本番日・ゲネ・撮影日"},
    both:  {concept:"「土台を守り、本番で出し切る」",  sub:"本番期間の通し設計"},
  };
  const clSecs   = getClSections(jobType, dayMode, careLevel);
  const allPills = clSecs.flatMap(s=>s.pills);
  const clDone   = allPills.filter(p=>clCk[p.id]).length;
  const clPct    = Math.round(clDone/allPills.length*100);
  const badgeClass   = wingMode?"boost":isVideo?"video":isMusic?"music":dayMode;
  const badgeIcon    = isVideo?"🎬":isMusic?"🎵":dayMode==="cond"?"🏛️":dayMode==="boost"?"🔥":"🌟";
  const badgeConcept = isVideo?(dayMode==="cond"?"「目・集中・回復を守る」":"「撮影で全力を出し切る」"):isMusic?(dayMode==="cond"?"「指・腕・神経を守る」":"「ライブで全力を出し切る」"):modeConf[dayMode].concept;
  const careLevelLabel = careLevel==="full"?"💎 フルケア":"⚡ ここだけは！";
  const badgeSub     = (isVideo?(dayMode==="cond"?"映像仕事・長時間撮影・オフ日":"撮影日・長尺・連日現場"):isMusic?(dayMode==="cond"?"練習・リハーサル・オフ日":"ライブ日・連日公演"):modeConf[dayMode].sub) + " ／ " + careLevelLabel;

  // 翌日計算
  const nextDay = schedule ? calcNextDay(schedule.sleepTarget) : null;

  return (
    <>
      <style>{CSS}</style>
      <div className={`app ${lightMode?"light-mode":""}`}>
        <div className="curtain"/>

      {/* ── モード切り替えバー ── */}
      <div style={{
        display:"flex",margin:"0",borderBottom:"2px solid var(--border)",
        background:"var(--bg2)",position:"sticky",top:0,zIndex:100
      }}>
        {[
          {key:true,  icon:"🌿", label:"ざっくり", sub:"とりあえずやってみたい"},
          {key:false, icon:"🎯", label:"プロ仕様", sub:"ガチ管理"},
        ].map(m=>(
          <button key={String(m.key)}
            onClick={()=>setSimpleMode(m.key)}
            style={{
              flex:1,padding:"10px 8px",border:"none",cursor:"pointer",
              fontFamily:"'Noto Sans JP',sans-serif",
              background:simpleMode===m.key?"var(--bg2)":"var(--bg3)",
              borderBottom:simpleMode===m.key?`2px solid ${m.key?"#4a9060":"#4a70c0"}`:"2px solid transparent",
              marginBottom:"-2px",transition:"all .2s"
            }}>
            <div style={{fontSize:15,marginBottom:2}}>{m.icon}</div>
            <div style={{fontSize:12,fontWeight:700,color:simpleMode===m.key?(m.key?"#6abf80":"#6a90d0"):"var(--dim)"}}>{m.label}</div>
            <div style={{fontSize:9,color:"var(--dim)",opacity:.7}}>{m.sub}</div>
          </button>
        ))}
      </div>


      {/* ホーム画面追加バナー */}
      {showHomeBanner&&(
        <div className="home-banner">
          <div className="home-banner-icon">📱</div>
          <div className="home-banner-body">
            <div className="home-banner-title">ホーム画面に追加するともっと便利！</div>
            <div className="home-banner-desc">
              <strong style={{color:"var(--txt)"}}>iPhone：</strong>Safari下の「共有」→「ホーム画面に追加」<br/>
              <strong style={{color:"var(--txt)"}}>Android：</strong>Chrome右上「⋮」→「ホーム画面に追加」
            </div>
          </div>
          <div className="home-banner-close" onClick={()=>{
            setShowHomeBanner(false);
            try{localStorage.setItem("pt_homeBanner","dismissed")}catch{}
          }}>✕</div>
        </div>
      )}
        <div className="hdr">
          <div>
            <div className="hdr-presents"><span className="hdr-presents-name">Marty @ EMA</span><span>presents</span></div>
            <div className="hdr-logo">FOR PERFORMERS</div>
            <div className="hdr-title">PERFORMER'S<span> TIME</span></div>
            <div style={{fontSize:10,color:"var(--dim)",marginTop:4,letterSpacing:".04em",lineHeight:1.5}}>サプリ・食事・睡眠を医学的タイミングで管理するアプリ</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <a href={simpleMode
                ? "https://performers-time-guide.netlify.app#simple"
                : "https://performers-time-guide.netlify.app"}
              target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,
                border:simpleMode?"1px solid rgba(74,144,96,.4)":"1px solid var(--border)",
                background:simpleMode?"rgba(74,144,96,.1)":"var(--bg3)",
                fontSize:10,fontWeight:700,
                color:simpleMode?"#6abf80":"var(--gold-l)",
                textDecoration:"none",
                letterSpacing:".06em",fontFamily:"'Noto Sans JP',sans-serif"}}>
              {simpleMode?"はじめかた":"GUIDE"}
            </a>

            <button onClick={()=>setLightMode(p=>!p)} style={{width:32,height:32,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--bg3)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {lightMode?"🌙":"☀️"}
            </button>
            <div style={{fontSize:22}}>{isVideo?"🎬":isMusic?"🎵":"🎭"}</div>
          </div>
        </div>

        {/* ── ざっくりモード ── */}
        {simpleMode && (
          <SimpleModeView
            jobType={jobType} setJobType={setJobType}
            dayMode={dayMode} setDayMode={setDayMode}
            lightMode={lightMode}
          />
        )}

        {/* ── プロ仕様 ── */}
        <div style={{display:simpleMode?"none":"block"}}>
        {/* 仕事タイプ */}
        <div className="job-wrap">
          <div className="job-label">▪ 仕事タイプ</div>
          <div className="job-row">
            {[
              {key:"stage", icon:"🎭", name:"舞台・演劇", sub:"ミュージカル・ダンス"},
              {key:"music", icon:"🎵", name:"音楽・ライブ", sub:"コンサート・バンド・弾き語り"},
              {key:"video", icon:"🎬", name:"映像・撮影",   sub:"ドラマ・映画・MV・CM"},
            ].map(j=>(
              <button key={j.key} className={`job-btn ${j.key} ${jobType===j.key?"active":""}`}
                onClick={()=>{setJobType(j.key);setSchedule(null);setClCk({});}}>
                <span className="ji">{j.icon}</span>
                <span className="jn">{j.name}</span>
                <span className="js">{j.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 日々モード */}
        <div className="dm-wrap">
          <div style={{fontSize:10,letterSpacing:".15em",color:"var(--dim)",marginBottom:7}}>▪ 今日のモード</div>
          <div className="dm-row">
            {[
              {key:"cond",  icon:"🌿", name:"コンディショニング",  sub:"稽古・オフ日"},
              {key:"both",  icon:"⭐", name:"本番＋コンディション", sub:"本番期間全般"},
              {key:"boost", icon:"⚡", name:"本番ブースト",         sub:"本番・撮影日"},
            ].map(m=>(
              <button key={m.key} className={`dm-btn ${m.key} ${dayMode===m.key?"active":""}`}
                onClick={()=>{setDayMode(m.key);setSchedule(null);setClCk({});}}>
                <span className="di">{m.icon}</span>
                <span className="dn">{m.name}</span>
                <span className="ds">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ケアレベル */}
        <div className="care-wrap">
          <div style={{fontSize:10,letterSpacing:".15em",color:"var(--dim)",marginBottom:7}}>▪ ケアレベル</div>
          <div className="care-row">
            <button className={`care-btn full ${careLevel==="full"?"active":""}`}
              onClick={()=>{setCareLevel("full");setSchedule(null);setClCk({});}}>
              <span className="ci">💎</span>
              <span className="cn">フルケア</span>
              <span className="cs">全サプリを<br/>完全管理</span>
            </button>
            <button className={`care-btn essential ${careLevel==="essential"?"active":""}`}
              onClick={()=>{setCareLevel("essential");setSchedule(null);setClCk({});}}>
              <span className="ci">⚡</span>
              <span className="cn">ここだけは！</span>
              <span className="cs">最重要だけに<br/>絞って管理</span>
            </button>

          </div>
        </div>

        {/* 覚醒モードトグル */}
        <div style={{
            margin:"9px 18px 0",cursor:"pointer",borderRadius:12,overflow:"hidden",
            border:wingMode?"1px solid rgba(212,140,40,.6)":"1px solid rgba(212,140,40,.25)",
            background:wingMode
              ?"linear-gradient(135deg,rgba(180,100,20,.18),rgba(212,140,40,.1))"
              :"var(--bg3)",
            boxShadow:wingMode?"0 4px 20px rgba(200,130,20,.2)":"none",
            transition:"all .3s"
          }}
          onClick={()=>{setWingMode(p=>!p);setSchedule(null);}}>
          <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              fontSize:wingMode?26:22,
              transition:"all .3s",
              filter:wingMode?"drop-shadow(0 0 6px rgba(220,160,40,.6))":"none"
            }}>☕</div>
            <div style={{flex:1}}>
              <div style={{
                fontSize:13,fontWeight:700,
                color:wingMode?"#e8a830":"var(--gold-l)",
                letterSpacing:".06em",marginBottom:2,
                transition:"all .3s"
              }}>{wingMode?"☕ カフェイン最適化 — 起動中":"カフェイン最適化モード"}</div>
              <div style={{fontSize:10,color:"var(--dim)"}}>
                {wingMode?"コーヒー・栄養ドリンクの最適タイミングをタイムラインに追加中":"コーヒー・栄養ドリンクのタイミングを最適化"}
              </div>
            </div>
            <div className={`toggle ${wingMode?"on":""}`}
              style={wingMode?{background:"#d4890a",flexShrink:0}:{flexShrink:0}}/>
          </div>
        </div>

        {/* 夜撮影トグル */}
        <div className={`night-wrap ${nightMode?"on":""}`} style={{margin:"9px 18px 0"}}>
          <div className="night-info">
            <div className="night-title">🌙 夜撮影・昼夜逆転モード</div>
            <div className="night-sub">夜間撮影・深夜公演など概日リズムが逆転する日に</div>
          </div>
          <div className={`toggle ${nightMode?"on":""}`} onClick={()=>{setNightMode(p=>!p);setSchedule(null);}}/>
        </div>

        <div className={`badge ${badgeClass}`} style={{
          margin:"9px 18px 0",
          ...(wingMode?{
            background:"linear-gradient(135deg,rgba(180,100,20,.15),rgba(212,140,40,.08))",
            border:"1px solid rgba(212,140,40,.5)",
            boxShadow:"0 4px 20px rgba(200,130,20,.15)"
          }:{})
        }}>
          <span style={{fontSize:17}}>{badgeIcon}</span>
          <div>
            <div className="bc" style={wingMode?{
              color:"#e8a830",
              textShadow:"0 2px 12px rgba(200,140,20,.4)"
            }:{}}>{badgeConcept}</div>
            <div className="bs" style={wingMode?{
              fontFamily:"'Share Tech Mono',monospace",
              color:"rgba(200,0,0,.8)",
              letterSpacing:".12em",
              textShadow:"0 0 6px rgba(200,0,0,.5)"
            }:{}}>{badgeSub}{nightMode?" ／ 夜撮影対応":""}{wingMode?" ／ ⚡ 覚醒モード":""}</div>
          </div>
        </div>

        {/* プロフィール（常時表示・折りたたみ） */}
        {(()=>{
          const dose = calcDose(weight, gender, dayMode, height, age);
          return(
          <div style={{padding:"10px 18px 0"}}>
            <div className="profile-card">
              <div className="profile-title">👤 あなたのプロフィール</div>
              <div className="profile-row">
                <div className="profile-label">性別</div>
                <div className="gender-btns">
                  <button className={`gender-btn ${gender==="female"?"active":""}`} onClick={()=>setGender("female")}>女性</button>
                  <button className={`gender-btn ${gender==="male"?"active":""}`} onClick={()=>setGender("male")}>男性</button>
                </div>
              </div>
              <div className="profile-row">
                <div className="profile-label">体重</div>
                <input className="wt-input" type="number" value={weight} min="30" max="150"
                  onChange={e=>setWeight(e.target.value)} style={{fontSize:18,padding:"5px 10px",width:80}}/>
                <span style={{fontSize:12,color:"var(--dim)",marginLeft:4}}>kg</span>
              </div>
              <div className="profile-row">
                <div className="profile-label">身長</div>
                <input className="wt-input" type="number" value={height} min="140" max="210"
                  onChange={e=>setHeight(e.target.value)} style={{fontSize:18,padding:"5px 10px",width:80}}/>
                <span style={{fontSize:12,color:"var(--dim)",marginLeft:4}}>cm</span>
              </div>
              <div className="profile-row">
                <div className="profile-label">年齢</div>
                <input className="wt-input" type="number" value={age} min="15" max="80"
                  onChange={e=>setAge(e.target.value)} style={{fontSize:18,padding:"5px 10px",width:80}}/>
                <span style={{fontSize:12,color:"var(--dim)",marginLeft:4}}>歳</span>
              </div>
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{fontSize:10,letterSpacing:".1em",color:"var(--dim)",marginBottom:7}}>
                  ▪ 今日の推奨摂取量{careLevel==="essential"&&<span style={{marginLeft:6,fontSize:9,color:"#8090d0",background:"rgba(74,112,192,.1)",padding:"1px 7px",borderRadius:20,border:"1px solid rgba(74,112,192,.2)"}}>⚡ ここだけは！</span>}{wingMode&&<span style={{marginLeft:6,fontSize:9,fontFamily:"'Share Tech Mono',monospace",color:"#e8a830",background:"rgba(180,100,20,.12)",padding:"2px 8px",borderRadius:20,border:"1px solid rgba(200,140,20,.4)"}}>☕ 起動中</span>}
                </div>
                {(()=>{
                  const active = getActivePillIds(jobType, dayMode, careLevel);
                  const s = (id) => active.has(id);
                  const dmap = {
                    c1:  {label:`VitC ${dose.vcTotal}mg／日`,           cls:""},
                    c2:  {label:`VitC ${dose.vcPm}mg（就寝前）`,        cls:"", hidden:true},
                    d:   {label:`VitD ${dose.vd}IU`,                   cls:""},
                    b:   {label:`B群 ${dose.b1}mg（B1換算）`,           cls:""},
                    b6:  {label:`VitB6 ${dose.b6}mg`,                  cls:""},
                    mg:  {label:`Mg ${dose.mg}mg`,                     cls:""},
                    mgx: {label:`Mg増量 ${dose.mgMusic}mg`,             cls:""},
                    coq: {label:`CoQ10 ${dose.coq}mg`,                 cls:""},
                    coqB:{label:`CoQ10追加 ${dose.coqB}mg`,            cls:"boost-dose"},
                    lc:  {label:`L-カルニチン ${dose.lc}mg`,            cls:"boost-dose"},
                    cB:  {label:`VitC本番前 ${dose.vcPre}mg`,          cls:"boost-dose", hidden:true},
                    lut: {label:`ルテイン ${dose.lut}mg`,               cls:"teal-dose"},
                    iron:{label:`鉄 ${dose.iron}mg`,                   cls:"orange-dose"},
                    lte: {label:`GABA（本番前）150mg`,                  cls:"teal-dose"},
                    gaba:{label:`GABA（ギャバ）150mg（1〜2粒）`,             cls:""},
                    om3: {label:`Omega-3 ${dose.om3}mg`,               cls:"music-dose"},
                  };
                  return(
                  <div className="dose-badge-wrap">
                    {Object.entries(dmap).map(([id,{label,cls,hidden}])=>
                      s(id)&&!hidden&&<span key={id} className={`dose-badge ${cls}`}
                        style={cls==="teal-dose"?{background:"rgba(58,144,144,.1)",borderColor:"rgba(58,144,144,.3)",color:"#60c0c0"}:
                               cls==="orange-dose"?{background:"rgba(192,112,64,.1)",borderColor:"rgba(192,112,64,.25)",color:"#d08060"}:
                               cls==="music-dose"?{background:"rgba(128,96,192,.1)",borderColor:"rgba(128,96,192,.25)",color:"#b090e0"}:{}}>
                        {label}
                      </span>
                    )}
                    {wingMode&&<>
                      <span className="dose-badge" style={{background:"rgba(180,100,20,.1)",borderColor:"rgba(200,140,20,.35)",color:"#d4890a"}}>☕ カフェイン 80mg（コーヒー1杯）</span>
                      <span className="dose-badge" style={{background:"rgba(180,100,20,.1)",borderColor:"rgba(200,140,20,.35)",color:"#d4890a"}}>💊 栄養ドリンク 50mg〜</span>
                    </>}
                  </div>
                  );
                })()}
                <div style={{fontSize:9,marginTop:4,lineHeight:1.6,padding:"4px 10px",borderRadius:8,
  background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",
  color:"var(--gold-l)",opacity:.9}}>
  ※ {gender==="female"?"女性":"男性"} {weight}kg・{dayMode==="boost"?"本番日（VitC 2包＝4,000mg）":dayMode==="both"?"本番期間（VitC 2包＝4,000mg）":"稽古日（VitC 1包＝2,000mg）"}基準で計算。粒数はワカサプリ製品基準。
</div>
                {(()=>{
                  const prof = calcAgeProfile(weight, height, age, gender);
                  return(
                  <div style={{marginTop:10,padding:"10px 12px",background:"var(--bg3)",borderRadius:10,border:"1px solid rgba(255,255,255,.06)"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"var(--dim)",marginBottom:2}}>BMI</div>
                        <div style={{fontSize:16,fontWeight:700,color:prof.bmi<18.5?"#60c0c0":prof.bmi<25?"var(--gold-l)":prof.bmi<30?"#d08060":"var(--red-l)"}}>{prof.bmi}</div>
                        <div style={{fontSize:8,color:"var(--dim)"}}>{prof.bmiCat}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"var(--dim)",marginBottom:2}}>基礎代謝</div>
                        <div style={{fontSize:16,fontWeight:700,color:"var(--txt)"}}>{prof.bmr}</div>
                        <div style={{fontSize:8,color:"var(--dim)"}}>kcal/日</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"var(--dim)",marginBottom:2}}>年齢帯</div>
                        <div style={{fontSize:16,fontWeight:700,color:"var(--gold-l)"}}>{prof.ageGroup}</div>
                        <div style={{fontSize:8,color:"var(--dim)"}}>補正あり</div>
                      </div>
                    </div>
                    <div style={{fontSize:9,color:"var(--dim)",lineHeight:1.6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                      💡 {prof.ageAdjust.note}
                      {prof.isPerimenopausal&&<span style={{color:"#d08060",marginLeft:4}}>更年期対応：鉄・VitD増量</span>}
                    </div>
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
          );
        })()}





        {/* ── 連続チェック＋シェア ── */}
        {(()=>{
          const msgs = [
            [1,   "🌱", "はじめの一歩！"],
            [3,   "✨", "3日連続！いいペース"],
            [7,   "🔥", "1週間達成！"],
            [14,  "⚡", "2週間！習慣になってきた"],
            [30,  "💎", "1ヶ月！本物のプロ仕様"],
            [60,  "🏅", "2ヶ月！身体が変わってくる頃"],
            [100, "🏆", "100日！伝説のパフォーマー"],
          ];
          const [icon, msg] = [...msgs].reverse().find(([d])=>streak.count>=d) || ["💊","今日から始めよう！"];
          const streakText = `🔥 PERFORMER'S TIME で${streak.count}日連続サプリ達成！
「身体が資本」をガチで管理中💊
https://react-ts-rgihnpye.stackblitz.io
#PERFORMERSTIME #パフォーマー`;
          const appText = `💊 パフォーマー向けサプリ管理アプリ「PERFORMER'S TIME」
医学的タイミングで今日飲むサプリがわかる！
https://react-ts-rgihnpye.stackblitz.io
#PERFORMERSTIME #舞台 #パフォーマー`;
          const doShare = (text) => {
            if(navigator.share){
              navigator.share({text}).catch(()=>{});
            } else {
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,"_blank");
            }
          };
          return(
            <div style={{padding:"10px 18px 0",display:"flex",flexDirection:"column",gap:8}}>
              {/* 連続チェック */}
              <div className="streak">
                <div style={{fontSize:26}}>{icon}</div>
                <div style={{flex:1}}>
                  <div className="streak-msg">{msg}</div>
                  <div className="streak-best">最高記録 {streak.best}日</div>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div className="streak-num">{streak.count}</div>
                  <div className="streak-unit">日連続</div>
                </div>
                {streak.count>=1&&(
                  <button className="streak-share" onClick={()=>doShare(streakText)}>
                    シェア 🔗
                  </button>
                )}
              </div>

            </div>
          );
        })()}

        <div className="tabs">
          <button className={`tab ${tab==="schedule"?"active":""}`} onClick={()=>setTab("schedule")}><span className="ti">🕐</span>タイムライン</button>
          <button className={`tab ${tab==="checklist"?"active":""}`} onClick={()=>setTab("checklist")}><span className="ti">📋</span>サプリ一覧</button>
          <button className={`tab ${tab==="food"?"active":""}`} onClick={()=>setTab("food")}><span className="ti">🍱</span>コンビニ飯</button>
          <button className={`tab ${tab==="info"?"active":""}`} onClick={()=>setTab("info")}><span className="ti">🔬</span>医学根拠</button>
        </div>

        {/* ══ SCHEDULE ══ */}
        {tab==="schedule"&&(
          <div className="page">
            <div className="icard">
              {/* ── 公演スケジュール登録 ── */}
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",display:"flex",alignItems:"center",gap:6}}>
                    📅 <span>公演スケジュール登録</span>
                  </div>
                  <button onClick={()=>setShowScheduleMgr(p=>!p)}
                    style={{fontSize:10,padding:"3px 10px",borderRadius:20,border:"1px solid var(--border)",background:"transparent",color:"var(--gold)",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700}}>
                    {showScheduleMgr?"閉じる":"＋ 登録する"}
                  </button>
                </div>

                {/* 登録済みスケジュール一覧 */}
                {savedSchedules.length>0&&(
                  <div className="sched-mgr" style={{marginBottom:10}}>
                    {savedSchedules.sort((a,b)=>a.date.localeCompare(b.date)).map((s,i)=>{
                      const today = new Date().toISOString().slice(0,10);
                      const d = new Date(s.date+"T00:00:00");
                      const label = `${d.getMonth()+1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）`;
                      return(
                        <div key={i} className="sched-row">
                          <div className={`sched-date ${s.date===today?"today":""}`}>
                            {s.date===today?"🔴 ":""}
                            {label}
                          </div>
                          <div className="sched-shows">
                            {s.shows.filter(x=>x.time).map((x,j)=>(
                              <span key={j} className="sched-pill">{x.time}{x.endTime?`〜${x.endTime}`:""}</span>
                            ))}
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>{
                              setShows(s.shows.map(x=>({...x,endEnabled:!!x.endTime})));
                            }} style={{fontSize:9,padding:"2px 7px",borderRadius:20,border:"1px solid var(--border)",background:"rgba(201,168,76,.1)",color:"var(--gold-l)",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700}}>
                              適用
                            </button>
                            <span className="sched-del" onClick={()=>setSavedSchedules(p=>p.filter((_,idx)=>idx!==i))}>✕</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 新規登録フォーム */}
                {showScheduleMgr&&(
                  <div style={{background:"var(--bg3)",borderRadius:12,padding:12,border:"1px solid var(--border)",marginBottom:10}}>
                    <div style={{fontSize:10,color:"var(--dim)",marginBottom:8}}>▪ 公演日・時間を追加</div>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                      <div style={{fontSize:10,color:"var(--dim)",minWidth:40}}>日付</div>
                      <input type="date" value={newSchedDate} onChange={e=>setNewSchedDate(e.target.value)}
                        style={{flex:1,padding:"6px 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg2)",color:"var(--txt)",fontSize:12,fontFamily:"'Noto Sans JP',sans-serif"}}/>
                    </div>
                    {newSchedShows.map((sh,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:7}}>
                        <div style={{fontSize:10,color:"var(--dim)",minWidth:40}}>開演{newSchedShows.length>1?i+1:""}</div>
                        <TimePicker value={sh.time} onChange={e=>setNewSchedShows(p=>p.map((x,j)=>j===i?{...x,time:e.target.value}:x))} label="開演時間"/>
                        <div style={{fontSize:10,color:"var(--dim)"}}>〜</div>
                        <TimePicker value={sh.endTime||"14:30"} onChange={e=>setNewSchedShows(p=>p.map((x,j)=>j===i?{...x,endTime:e.target.value}:x))} label="終演時間"/>
                        {newSchedShows.length>1&&<span onClick={()=>setNewSchedShows(p=>p.filter((_,j)=>j!==i))} style={{color:"var(--dim)",cursor:"pointer",fontSize:12}}>✕</span>}
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button onClick={()=>setNewSchedShows(p=>[...p,{time:"18:30",endTime:"20:00",enabled:true}])}
                        style={{flex:1,padding:"7px",fontSize:10,borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
                        ＋ マチソワ追加
                      </button>
                      <button onClick={()=>{
                        if(!newSchedDate) return;
                        const entry = {date:newSchedDate, shows:newSchedShows.map(s=>({...s,enabled:true}))};
                        setSavedSchedules(p=>{
                          const filtered = p.filter(x=>x.date!==newSchedDate);
                          return [...filtered, entry];
                        });
                        setNewSchedDate("");
                        setNewSchedShows([{time:"13:00",endTime:"14:30",enabled:true}]);
                        setShowScheduleMgr(false);
                      }}
                        style={{flex:1,padding:"7px",fontSize:11,borderRadius:8,background:"var(--gold)",color:"#0a0a0f",fontWeight:700,border:"none",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
                        保存する
                      </button>
                    </div>
                  </div>
                )}

                {/* 今日のスケジュールが登録されている場合のバナー */}
                {(()=>{
                  const today = new Date().toISOString().slice(0,10);
                  const todaySched = savedSchedules.find(s=>s.date===today);
                  if(!todaySched) return null;
                  return(
                    <div style={{padding:"8px 12px",background:"rgba(201,168,76,.08)",borderRadius:9,border:"1px solid rgba(201,168,76,.25)",fontSize:10,color:"var(--gold-l)",display:"flex",alignItems:"center",gap:6}}>
                      ✅ <span>今日の公演時間が自動入力されました</span>
                    </div>
                  );
                })()}
              </div>

              <div className="icard-t">⏰ 今日のスケジュールを入力</div>

              <div className="irow">
                <div className="irow-lbl on">{nightMode?"🌅 起床時間（夕方〜夜）":"🌅 起床時間"}</div>
                <TimePicker value={wakeup} onChange={e=>setWakeup(e.target.value)} label="起床時間"/>
              </div>

              <div className={`irow ${callOn?"call-row":""}`}>
                <div className={`row-toggle ${callOn?"on":""}`} onClick={()=>setCallOn(p=>!p)}/>
                <div className={`irow-lbl ${callOn?"on":""}`}>📍 劇場・現場の集合時間</div>
                <TimePicker value={callTime} onChange={e=>setCallTime(e.target.value)} label="集合時間" disabled={!callOn}/>
              </div>

              {/* 公演・撮影ブロック（開始＋終了） */}
              {isBoost&&shows.map((s,i)=>(
                <div key={i} className={`show-block ${s.enabled?"active":""}`}>
                  {/* 開始時刻 */}
                  <div className="show-start">
                    <div className={`row-toggle ${s.enabled?"on":""}`} onClick={()=>toggleShow(i)}/>
                    <div className={`irow-lbl ${s.enabled?"on":""}`}>
                      {isVideo?"🎬":isMusic?"🎵":"🎭"} 第{i+1}{isVideo?"撮影　開始":isMusic?"ライブ　開演":"公演　開演"}
                    </div>
                    <TimePicker value={s.time} onChange={e=>setStartTime(i,e.target.value)} label="開演時間" disabled={!s.enabled}/>
                  </div>
                  {/* 終了時刻 */}
                  {s.enabled&&(()=>{
                    const isMatisowaFirst = i===0 && shows.filter(x=>x.enabled).length>=2;
                    return(
                    <div className={`show-end ${(s.endEnabled||isMatisowaFirst)?"active":""}`}
                      style={isMatisowaFirst?{background:"rgba(74,144,96,.08)",border:"1px solid rgba(74,144,96,.2)",borderRadius:8,marginTop:4}:{}}>
                      {!isMatisowaFirst&&(
                        <div className={`row-toggle ${s.endEnabled?"green-on":""}`} onClick={()=>toggleEndTime(i)}/>
                      )}
                      {isMatisowaFirst&&(
                        <div style={{fontSize:10,color:"#6abf80",fontWeight:700,paddingLeft:4}}>🍱</div>
                      )}
                      <div className={`end-label on`} style={isMatisowaFirst?{color:"#6abf80",fontWeight:700}:{}}>
                        {isMatisowaFirst
                          ? (isVideo?"撮影終了時刻（必須）":isMusic?"マチネ終演時刻（必須）":"マチネ終演時刻（必須）")
                          : (isVideo?"終了予定時刻（撮影）":isMusic?"終演時刻（ライブ）":"終演時刻（ミュージカル）")}
                      </div>
                      <TimePicker value={s.endTime}
                        onChange={e=>{setEndTime(i,e.target.value); if(isMatisowaFirst) setShows(p=>p.map((x,idx)=>idx===i?{...x,endEnabled:true}:x));}}
                        label="終演時間" disabled={!s.endEnabled&&!isMatisowaFirst}/>
                    </div>
                    );
                  })()}
                </div>
              ))}

              {/* 稽古時間（コンディショニングモードのみ） */}
              {!isBoost&&(
                <div style={{marginTop:7}}>
                  <div className={`irow ${rehearsalOn?"active-row":""}`}>
                    <div className={`row-toggle ${rehearsalOn?"on":""}`} onClick={()=>setRehearsalOn(p=>!p)}/>
                    <div className={`irow-lbl ${rehearsalOn?"on":""}`}>🤸 稽古時間（前後サプリを追加）</div>
                  </div>
                  {rehearsalOn&&(
                    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,paddingLeft:4}}>
                      <div style={{fontSize:10,color:"var(--dim)",minWidth:30}}>開始</div>
                      <TimePicker value={rehearsalStart} onChange={e=>setRehearsalStart(e.target.value)} label="稽古開始"/>
                      <div style={{fontSize:10,color:"var(--dim)"}}>〜</div>
                      <TimePicker value={rehearsalEnd} onChange={e=>setRehearsalEnd(e.target.value)} label="稽古終了"/>
                    </div>
                  )}
                </div>
              )}

              {/* 翌日あり？ */}
              <div className={`irow ${nextDayOn?"active-row":""}`} style={{marginTop:7}}>
                <div className={`row-toggle ${nextDayOn?"on":""}`} onClick={()=>setNextDayOn(p=>!p)}/>
                <div className={`irow-lbl ${nextDayOn?"on":""}`}>🌅 翌日の起床推奨時間を計算する</div>
              </div>
            </div>

            {/* サプリ購入ボタン */}
            <button onClick={()=>{setTab("checklist"); window.scrollTo({top:0,behavior:"smooth"});}}
              style={{
                width:"100%",padding:"11px",marginBottom:10,borderRadius:12,
                border:"1px solid rgba(201,168,76,.35)",
                background:"linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.06))",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                fontFamily:"'Noto Sans JP',sans-serif",
              }}>
              <span style={{fontSize:14}}>🛒</span>
              <span style={{fontSize:12,fontWeight:700,color:"var(--gold-l)",letterSpacing:".04em"}}>サプリ購入</span>
              <span style={{fontSize:10,color:"var(--dim)"}}>→ 一覧から購入</span>
            </button>

            <button className="gen-btn" onClick={generate}>▶︎　タイムラインを生成する</button>

            {schedule&&(
              <>
                <button onClick={()=>exportToICS(schedule.items)}
                  style={{width:"100%",padding:"12px",marginBottom:8,borderRadius:12,border:"1px solid rgba(74,112,192,.3)",background:"rgba(74,112,192,.08)",color:"#4a90c0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>📅</span>
                  <span>カレンダーに一括追加（.ics）</span>
                </button>

              </>
            )}
            {!schedule&&(
              <div className="empty">
                <div className="empty-icon">🗓️</div>
                <div className="empty-t">時間を入力して生成してください</div>
                <div className="empty-s">終演・終了時刻を入れると<br/>夜サプリと翌日の起床時間まで自動計算します</div>
              </div>
            )}

            {schedule&&(
              <>
                <div className="tl-hdr">MEDICALLY OPTIMIZED TIMELINE</div>
                {schedule.items.map((item,idx)=>{
                  const fd=disp(item.time);
                  const isLast=idx===schedule.items.length-1;
                  return(
                    <div key={item.id} className="tl-item">
                      <div className="tl-left">
                        <div className="tl-t">{fd.time}</div>
                        <div className="tl-ap">{fd.ampm}</div>
                      </div>
                      <div className="tl-mid">
                        <div className={`tl-dot ${item.type}`}/>
                        {!isLast&&<div className="tl-line"/>}
                      </div>
                      <div
                        className={`tl-card ${item.type==="show"?"show-c":""} ${item.type==="showend"?"showend-c":""} ${item.type==="call"?"call-c":""} ${item.type==="sleep"?"sleep-c":""} ${item.checkable&&tlCk[item.id]?"checked":""}`}
                        onClick={()=>item.checkable&&setTlCk(p=>({...p,[item.id]:!p[item.id]}))}
                      >
                        <div className="tl-ch">
                          <div className={`tl-lbl ${item.type}`}>{item.label}</div>
                          <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
                            {item.checkable&&(
                              <div onClick={e=>{e.stopPropagation();setTlCk(p=>({...p,[item.id]:!p[item.id]}));}}
                                style={{fontSize:11,padding:"5px 10px",borderRadius:20,cursor:"pointer",
                                  fontWeight:700,transition:"all .2s",
                                  background:tlCk[item.id]?"var(--gold)":"rgba(255,255,255,.08)",
                                  color:tlCk[item.id]?"#0a0a0f":"var(--txt)",
                                  border:tlCk[item.id]?"1px solid var(--gold)":"1px solid rgba(255,255,255,.2)"}}>
                                {tlCk[item.id]?"✓ 飲んだ！":"飲んだ！"}
                              </div>
                            )}
                            {item.med&&(
                              <div onClick={e=>{e.stopPropagation();setMedOpen(p=>({...p,[item.id]:!p[item.id]}));}}
                                style={{fontSize:16,padding:"4px 6px",borderRadius:7,flexShrink:0,
                                  background:medOpen[item.id]?"rgba(74,144,96,.2)":"rgba(255,255,255,.06)",
                                  border:"1px solid rgba(255,255,255,.12)",cursor:"pointer",lineHeight:1}}>
                                🔬
                              </div>
                            )}

                          </div>
                        </div>
                        {!item.caffeine&&item.pills.length>0&&(
                          <div className="tl-pills">
                            {item.pills.map(p=>(
                              <span key={p.id} className={`tl-pill${p.wakaFlag===true?" waka":p.wakaFlag===false?" grey":""}`}>
                                {p.name}{item.doseMap&&item.doseMap[p.id]?<strong style={{marginLeft:5,fontWeight:700}}>{item.doseMap[p.id]}</strong>:""}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.drinkInfo&&(
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"8px 10px",
                            background:"rgba(180,100,20,.08)",
                            borderRadius:8,
                            border:"1px solid rgba(200,140,20,.3)"}}>
                            <span style={{fontSize:16}}>{item.drinkInfo.name.includes("コーヒー")?"☕":"💊"}</span>
                            <div>
                              <div style={{fontSize:11,fontWeight:700,
                                color:"#d4890a",
                                fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700
                              }}>{item.drinkInfo.name}</div>
                              <div style={{fontSize:10,
                                color:"rgba(180,110,20,.8)"
                              }}>カフェイン {item.drinkInfo.mg}mg · {item.drinkInfo.note}</div>
                              {!item.drinkInfo.name.includes("コーヒー")&&(
                                <div style={{fontSize:9,marginTop:4,color:"rgba(180,110,20,.7)",
                                  background:"rgba(180,100,20,.08)",borderRadius:4,padding:"3px 6px",
                                  display:"inline-block"}}>
                                  ⚠️ リポビタン等にはB群含有 → 朝のB群サプリは省いてOK
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="tl-reason">{item.reason}</div>
                        {item.med&&medOpen[item.id]&&(
                          <div className="tl-med">🔬 {item.med}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ── 翌日起床推奨 ── */}
                {nextDayOn && nextDay && (
                  <div className="nextday-wrap">
                    <div className="nextday-header">
                      <span style={{fontSize:18}}>🌅</span>
                      <div>
                        <div className="nextday-title">翌日の起床推奨</div>
                        <div className="nextday-sub">就寝 {disp(schedule.sleepTarget).time} {disp(schedule.sleepTarget).ampm} を基準に計算</div>
                      </div>
                    </div>
                    <div className="nextday-cards">
                      <div className="nd-card min">
                        <div>
                          <div className="nd-time">{disp(nextDay.min5).time}</div>
                          <div className="nd-time-ap">{disp(nextDay.min5).ampm}</div>
                        </div>
                        <div className="nd-info">
                          <div className="nd-label">最低ライン起床</div>
                          <div className="nd-note">睡眠5サイクル（{nextDay.sleep5h}）<br/>翌日も公演・撮影がある場合の最低ライン</div>
                        </div>
                        <div className="nd-badge">5サイクル</div>
                      </div>
                      <div className="nd-card opt">
                        <div>
                          <div className="nd-time">{disp(nextDay.min6).time}</div>
                          <div className="nd-time-ap">{disp(nextDay.min6).ampm}</div>
                        </div>
                        <div className="nd-info">
                          <div className="nd-label">理想ライン起床</div>
                          <div className="nd-note">睡眠6サイクル（{nextDay.sleep6h}）<br/>翌日がオフ・稽古日の場合の完全回復ライン</div>
                        </div>
                        <div className="nd-badge">6サイクル</div>
                      </div>
                    </div>
                    <div className="sleep-summary">
                      <div className="sleep-row">
                        <span className="sleep-key">就寝目標</span>
                        <span className="sleep-val">{disp(schedule.sleepTarget).time} {disp(schedule.sleepTarget).ampm}</span>
                      </div>
                      <div className="sleep-row">
                        <span className="sleep-key">最低睡眠（5サイクル）</span>
                        <span className="sleep-val">{nextDay.sleep5h}</span>
                      </div>
                      <div className="sleep-row">
                        <span className="sleep-key">理想睡眠（6サイクル）</span>
                        <span className="sleep-val">{nextDay.sleep6h}</span>
                      </div>
                      <div style={{fontSize:9,color:"var(--dim)",opacity:.6,marginTop:6,lineHeight:1.6}}>
                        ※ 睡眠サイクル90分、入眠潜時15分を加味して計算。<br/>連日公演の場合は5サイクル以上を確保してください。
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="bot"/>
          </div>
        )}

        {/* ══ CHECKLIST ══ */}
        {tab==="checklist"&&(()=>{
          const dose = calcDose(weight, gender, dayMode, height, age);
          // pill id → 摂取量マッピング
          const doseMap = {
            c1:`${dose.vcAm}mg（${dose.vcAm/2000}包）`, c2:`${dose.vcPm}mg（${dose.vcPm/2000}包）`, cB:`${dose.vcPre}mg`,
            d:`${dose.vd}IU（1粒）`, b:`${dose.b1}mg・B1換算（1粒）`, mg:`${dose.mg}mg（${dose.mg/175}粒）`,
            coq:`${dose.coq}mg（${dose.coq/50}粒）`, coqB:`${dose.coqB}mg（${dose.coqB/50}粒）`, lc:`${dose.lc}mg（2粒）`,
            lut:`${dose.lut}mg（1粒）`, lte:"100mg（1粒）", iron:`${dose.iron}mg（3粒）`,
            b6:`${dose.b6}mg（1粒）`, om3:`${dose.om3}mg`, mgx:`${dose.mgMusic}mg（${Math.round(dose.mgMusic/175)}粒）`,
          };
          const medBasis = {
            c1:"水溶性・4-6hで排泄のため分割摂取", c2:"就寝中の修復に充当",
            cB:"体のコンディション維持に役立つ摂取量", d:"脂溶性・体重で分布容積が変わる",
            b:`エネルギー代謝量（体重・性別）に比例`,
            mg:"日本人食事摂取基準：男性4.5mg/kg、女性3.5mg/kg",
            coq:"体重×2mg（基礎）。本番日は産生需要が1.5倍に増加",
            coqB:"L-カルニチンと協働する追加分", lc:"輸送タンパク量は体重に比例",
            lut:"眼科的有効量10-20mg/日", lte:"α波誘導の有効量100-200mg",
            iron:"月経のある女性は損失補填で男性の1.8倍必要",
            b6:"神経伝達物質の合成に必須。末梢神経の健康を支え指・腕の精度に直結",
            om3:"EPA/DHAを含むオメガ3系脂肪酸。継続的な摂取がおすすめ",
            mgx:"演奏による筋持続収縮でMgが消耗→不足で痙攣・ジストニアリスク上昇",
            lte:"α波誘導で緊張を抑えながら集中力を維持。演奏30〜60分前に摂取",
          };
          return(
          <div className="page">
            <div className="prog">
              <div className="prog-h">
                <div className="prog-t">TODAY'S PROGRESS</div>
                <div className="prog-n">{clDone}<span> / {allPills.length}種</span></div>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${clPct}%`}}/></div>
            </div>
            <div style={{fontSize:10,color:"var(--dim)",marginBottom:12,padding:"8px 12px",background:"var(--bg)",borderRadius:8,letterSpacing:".04em",lineHeight:1.7}}>
              👤 {gender==="female"?"女性":"男性"} {weight}kg｜{dayMode==="boost"?"本番日":dayMode==="both"?"本番期間":"稽古日"}｜摂取量は個人に最適化済み（粒数はワカサプリ基準）
            </div>
            {clSecs.map((sec,si)=>(
              <div key={si} className="cl-sec">
                <div className="cl-sh">
                  <div className={`cl-dot ${sec.dot}`}/>
                  <span className="cl-sn">{sec.label}</span>
                  <span className="cl-se">{sec.en}</span>
                </div>
                <div className="pill-list">
                  {sec.pills.map(p=>(
                    <div key={p.id} className={`pill-card ${clCk[p.id]?"checked":""}`}
                      onClick={()=>setClCk(prev=>({...prev,[p.id]:!prev[p.id]}))}>
                      <div className="cc">{clCk[p.id]?"✓":""}</div>
                      <div className="pi">
                        <div className="pn">{p.name}</div>
                        <div className="pnote">{p.note}</div>
                        {doseMap[p.id]&&(
                          <div style={{marginTop:5,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontSize:12,fontFamily:"'Shippori Mincho',serif",fontWeight:700,color:"var(--gold-l)",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",padding:"2px 9px",borderRadius:20}}>
                              {doseMap[p.id]}
                            </span>
                            {medBasis[p.id]&&<span style={{fontSize:9,color:"var(--dim)",opacity:.7}}>{medBasis[p.id]}</span>}
                          </div>
                        )}
                      </div>
                      <div className={`ptag ${p.tag}`}>{p.tag==="base"?"ベース":p.tag==="boost"?"ブースト":"映像"}</div>
                    </div>
                  ))}
                </div>
                {si<clSecs.length-1&&<div className="divider"/>}
              </div>
            ))}
            {/* ══ ワカサプリ セット購入 ══ */}
            {(()=>{
              // 現在の設定でアクティブなサプリのうちwakaFlag:trueのものを重複排除で取得
              const activeIds = getActivePillIds(jobType, dayMode, "full");
              const essentialIds = new Set(getEssentialIds(jobType, dayMode));

              // ワカサプリ商品を名前で重複排除（VitCは1種にまとめる等）
              const seen = new Set();
              const fullItems = [];
              const essItems  = [];

              [...activeIds].forEach(id => {
                const p = P[id];
                if(!p || !p.wakaFlag || !p.waka) return;
                // VitC系は1つにまとめる
                const dedupeKey = p.brands.split("（")[0].trim();
                if(seen.has(dedupeKey)) return;
                seen.add(dedupeKey);
                fullItems.push(p);
                if(essentialIds.has(id)) essItems.push(p);
              });

              const jobLabel = isVideo?"映像・撮影":isMusic?"音楽・ライブ":"舞台・演劇";
              const WAKA_TOP = "https://wakasapri.com/shop/product_categories/supplement?srsltid=AfmBOoqSHdV6vJUzL-qaaX-7-FCRj9Ppq7Ne1W_iUhxcWvNfDzoGn4H0";

              const SetBox = ({level, items, color, icon, labelMain, labelSub}) => (
                <div style={{
                  background:"var(--bg3)",
                  border:`1px solid ${color}44`,
                  borderRadius:14,
                  overflow:"hidden",
                  marginBottom:12,
                }}>
                  {/* ヘッダー */}
                  <div style={{
                    padding:"12px 14px 10px",
                    background:`${color}11`,
                    borderBottom:`1px solid ${color}22`,
                    display:"flex",alignItems:"center",gap:8
                  }}>
                    <span style={{fontSize:18}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--txt)",letterSpacing:".04em"}}>{labelMain}</div>
                      <div style={{fontSize:10,color:"var(--dim)",marginTop:2}}>{jobLabel}向け · ワカサプリで揃う {items.length}種</div>
                    </div>
                  </div>
                  {/* 商品リスト */}
                  <div style={{padding:"10px 14px 4px"}}>
                    {items.map((p,i)=>(
                      <div key={p.id} style={{
                        display:"flex",alignItems:"flex-start",gap:8,
                        paddingBottom:8,marginBottom:8,
                        borderBottom: i<items.length-1 ? "1px solid rgba(255,255,255,.04)" : "none"
                      }}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:"var(--txt)"}}>{p.name}</div>
                          <div style={{fontSize:10,color:"var(--dim)",marginTop:2,lineHeight:1.5}}>{p.note}</div>
                          <div style={{fontSize:10,color:"var(--gold-l)",marginTop:2,fontWeight:500}}>{p.brands}</div>
                        </div>
                        <a href={p.waka} target="_blank" rel="noopener noreferrer"
                          style={{
                            flexShrink:0,
                            fontSize:10,fontWeight:700,
                            padding:"5px 10px",borderRadius:20,
                            background:`${color}18`,
                            border:`1px solid ${color}44`,
                            color:color,
                            textDecoration:"none",
                            whiteSpace:"nowrap"
                          }}>
                          購入 →
                        </a>
                      </div>
                    ))}
                  </div>
                  {/* まとめて見るボタン */}
                  <div style={{padding:"0 14px 14px"}}>
                    <a href={WAKA_TOP} target="_blank" rel="noopener noreferrer"
                      style={{
                        display:"block",
                        textAlign:"center",
                        padding:"11px",
                        borderRadius:10,
                        background:`linear-gradient(135deg, ${color}cc, ${color}88)`,
                        color:"#fff",
                        fontSize:13,
                        fontWeight:700,
                        textDecoration:"none",
                        letterSpacing:".06em",
                        boxShadow:`0 3px 12px ${color}44`
                      }}>
                      {labelSub} まとめて見る →
                    </a>
                  </div>
                </div>
              );

              return(
                <div style={{marginTop:20,padding:"0 2px"}}>
                  <div style={{
                    fontSize:10,letterSpacing:".2em",color:"var(--gold)",
                    opacity:.8,marginBottom:12,display:"flex",alignItems:"center",gap:6
                  }}>
                    🛒 <span>ワカサプリで今すぐ揃える</span>
                  </div>
                  {fullItems.length>0 && (
                    <SetBox
                      level="full"
                      items={fullItems}
                      color="#c9a84c"
                      icon="💎"
                      labelMain="フルケアセット"
                      labelSub="💎 フルケアセット"
                    />
                  )}
                  {essItems.length>0 && (
                    <SetBox
                      level="essential"
                      items={essItems}
                      color="#4a70c0"
                      icon="⚡"
                      labelMain="ここだけは！セット"
                      labelSub="⚡ ここだけは！セット"
                    />
                  )}
                  <div style={{fontSize:9,color:"var(--dim)",textAlign:"center",opacity:.5,marginTop:4,lineHeight:1.8}}>
                    ※ 粒数はワカサプリ製品を基準に表示しています。<br/>各リンクはワカサプリ公式通販に繋がります。在庫・価格は公式サイトでご確認ください。
                  </div>
                </div>
              );
            })()}
            <button className="reset-btn" onClick={()=>{setClCk({});try{localStorage.removeItem('pt_clCk')}catch{}}}>↺　今日の記録をリセット</button>
            <div className="bot"/>
          </div>
          );
        })()}


        {/* ══ コンビニ飯 ══ */}
        {tab==="food"&&(()=>{
          const macros = calcMacros(weight, dayMode, height, age, gender, jobType);
          const isBoost = dayMode==="boost"||dayMode==="both";
          const isVideo = jobType==="video";
          const isMusic = jobType==="music";
          const setIdx = (key,v) => setMealIdx(p=>({...p,[key]:v}));
          const SF = STORE_FOODS[store] || STORE_FOODS.seven;
          const cycle  = (key,dir) => setMealIdx(p=>({...p,[key]:((p[key]||0)+dir+5)%5}));

          // 食事タイムライン生成（起床・本番時間から自動計算）
          const active = shows.filter(s=>s.enabled&&s.time);
          const lastActive = active[active.length-1];
          const endBase = isBoost&&lastActive
            ? (lastActive.endEnabled&&lastActive.endTime ? lastActive.endTime : addM(lastActive.time,90))
            : null;

          // 食事タイムアイテム
          const foodItems = [];
          // 朝食時間はサプリタイムラインと同じ基準（起床+30分）
          const fBreakfast = addM(wakeup, 30);

          // 朝食：起床後30分（サプリタイムラインと完全連動）
          foodItems.push({
            id:"f_breakfast", mkey:"breakfast", time:fBreakfast,
            label:"朝食", dot:"am",
            reason:`起床後30分が目安。この後サプリ①（脂溶性）を35分後、サプリ②を15分後に摂取。`,
            db: SF.breakfast,
          });

          // 公演がある場合
          if(isBoost && active.length>0) {
            const firstShow = active[0];
            // 1公演のみ：ランチをマチネ前に挿入
            if(active.length === 1) {
              const lunchTime = addM(firstShow.time, -210); // 開演3.5h前
              if(toMin(lunchTime) - toMin(wakeup) >= 90) {
                foodItems.push({
                  id:"f_lunch", mkey:"lunch", time:lunchTime,
                  label:"お昼", dot:"pm",
                  reason:`開演${firstShow.time}の3時間30分前。消化を終わらせるための食べ終わりタイミング`,
                  db: lunchOn ? FOOD_DB.lunchBento : SF.lunchCombini,
                  isBento: lunchOn,
                });
              }
            }
            // マチソワ（2公演以上）：マチネ前のランチは表示しない（マチネ後に食べる）

            // 各公演の前後
            active.forEach((s,i)=>{
              const label = isVideo?`第${i+1}撮影`:isMusic?`第${i+1}ライブ`:`第${i+1}公演`;
              // 本番前（開演2.5h前）
              foodItems.push({
                id:`f_pre${i}`, mkey:"preboost", time:addM(s.time,-150),
                label:`${label}前・軽食`, dot:"pre",
                reason:`開演${s.time}の2時間30分前。消化の軽いものでエネルギーをチャージ`,
                db: SF.preboost || FOOD_DB.preboost,
              });
              // 開演
              foodItems.push({
                id:`f_show${i}`, mkey:null, time:s.time,
                label:`${label} ${isVideo?"撮影開始 🎬":"開演 🎭"}`, dot:"show",
                reason:"全力で！", db:null,
              });
              // マチソワ：1公演終了後〜2公演前の食事
              if(i < active.length-1) {
                const nextShow = active[i+1];
                // マチネ終演時刻を使って正確に計算
                const matEndTime = (s.endEnabled && s.endTime) ? s.endTime : addM(s.time, 90);
                const interMealTime = addM(matEndTime, 20); // 終演20分後
                const minutesUntilNext = toMin(nextShow.time) - toMin(matEndTime);
                foodItems.push({
                  id:`f_inter${i}`, mkey:"lunch", time:interMealTime,
                  label:`🍱 マチネ終演後・お弁当`, dot:"post",
                  reason:`マチネ終演（${matEndTime}）の20分後。次の${isMusic?"ライブ":isVideo?"撮影":"公演"}（${nextShow.time}）まで${Math.floor(minutesUntilNext/60)}時間${minutesUntilNext%60>0?minutesUntilNext%60+"分":""}。しっかり食べてソワレに備える。`,
                  db: FOOD_DB.lunchBento,
                  isBento: true,
                });
              }
            });

            // 終演後回復食
            const recovTime = addM(endBase,60);
            foodItems.push({
              id:"f_recovery", mkey:"recovery", time:recovTime,
              label:"終演後・回復食", dot:"post",
              reason:`終演後60分以内が筋修復のゴールデンタイム。タンパク質を優先`,
              db: SF.recovery,
            });
          } else {
            // 公演なし（稽古日）
            foodItems.push({
              id:"f_lunch", mkey:"lunch", time:addM(wakeup,240),
              label:"お昼", dot:"pm",
              reason:"稽古の合間に。腹8分目を意識してエネルギーを持続させる",
              db: lunchOn ? FOOD_DB.lunchBento : SF.lunchCombini,
              isBento: lunchOn,
            });
            foodItems.push({
              id:"f_recovery", mkey:"recovery", time:addM(wakeup,660),
              label:"稽古後・夜ごはん", dot:"post",
              reason:"稽古終了後60分以内が理想。タンパク質をしっかり摂って睡眠中の修復を最大化",
              db: SF.recovery,
            });
          }

          foodItems.sort((a,b)=>toMin(a.time)-toMin(b.time));

          const PatternNav = ({mkey})=>(
            <div className="pattern-nav">
              <div className="pattern-arrow" onClick={()=>cycle(mkey,-1)}>‹</div>
              <div className="pattern-dots">
                {[0,1,2,3,4].map(i=>(
                  <div key={i} className={`pattern-dot ${(mealIdx[mkey]||0)===i?"active":""}`}
                    onClick={()=>setIdx(mkey,i)}>
                    {["A","B","C","D","E"][i]}
                  </div>
                ))}
              </div>
              <div className="pattern-arrow" onClick={()=>cycle(mkey,1)}>›</div>
            </div>
          );

          return(
          <div className="page">
            {/* 目標マクロ */}
            <div className="macro-grid">
              <div className="macro-card prot">
                <div className="macro-icon">💪</div>
                <div className="macro-name">タンパク質</div>
                <div className="macro-val">{macros.prot}</div>
                <div className="macro-unit">g / 日</div>
              </div>
              <div className="macro-card carb">
                <div className="macro-icon">⚡</div>
                <div className="macro-name">炭水化物</div>
                <div className="macro-val">{macros.carb}</div>
                <div className="macro-unit">g / 日</div>
              </div>
              <div className="macro-card fat">
                <div className="macro-icon">🥑</div>
                <div className="macro-name">脂質</div>
                <div className="macro-val">{macros.fat}</div>
                <div className="macro-unit">g / 日</div>
              </div>
            </div>
            {(()=>{
              // 選択中の食事の合計カロリーを計算
              const SF2 = STORE_FOODS[store]||STORE_FOODS.seven;
              const mealKcals = {
                breakfast: SF2.breakfast?.[mealIdx.breakfast||0]?.kcal||0,
                lunch:     lunchOn ? (FOOD_DB.lunchBento?.[mealIdx.lunch||0]?.kcal||0) : (SF2.lunchCombini?.[mealIdx.lunch||0]?.kcal||0),
                preboost:  SF2.preboost?.[mealIdx.preboost||0]?.kcal||0,
                recovery:  SF2.recovery?.[mealIdx.recovery||0]?.kcal||0,
              };
              const totalMealKcal = Object.values(mealKcals).reduce((a,b)=>a+b,0);
              const remaining = Math.max(0, macros.kcal - totalMealKcal);
              const pct = Math.round(totalMealKcal / macros.kcal * 100);
              return(
              <div style={{margin:"0 0 14px"}}>
                <div style={{textAlign:"center",fontSize:11,color:"var(--dim)",marginBottom:8}}>
                  目標 <span style={{color:"var(--gold-l)",fontFamily:"'Shippori Mincho',serif",fontSize:16,fontWeight:700}}>{macros.kcal}</span> kcal
                  <span style={{margin:"0 6px",color:"var(--border)"}}>|</span>
                  {gender==="female"?"女性":"男性"} {weight}kg・{height}cm・{age}歳
                  <span style={{marginLeft:6,fontSize:10,color:"var(--gold-l)"}}>（基礎代謝{macros.bmr}+活動{Math.round((macros.baseKcal-macros.bmr))}+公演{macros.extraKcal}kcal）</span>
                </div>
                {totalMealKcal>0&&(
                <div style={{background:"var(--bg3)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,.06)"}}>
                  {/* プログレスバー */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:4,background:pct>100?"var(--red-l)":pct>75?"var(--gold)":"#6abf80",width:`${Math.min(pct,100)}%`,transition:"width .5s ease"}}/>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,minWidth:36,textAlign:"right",color:pct>100?"var(--red-l)":pct>75?"var(--gold)":"#6abf80"}}>{pct}%</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:10,color:"var(--dim)",marginBottom:2}}>コンビニ飯の合計</div>
                      <div style={{fontSize:18,fontWeight:700,color:"var(--txt)"}}>{totalMealKcal} <span style={{fontSize:10,color:"var(--dim)"}}>kcal</span></div>
                    </div>
                    <div style={{fontSize:20,color:"var(--dim)"}}>→</div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:"var(--dim)",marginBottom:2}}>あと必要なカロリー</div>
                      <div style={{fontSize:18,fontWeight:700,color:remaining<200?"var(--gold-l)":"var(--red-l)"}}>{remaining} <span style={{fontSize:10,color:"var(--dim)"}}>kcal</span></div>
                    </div>
                  </div>
                  {remaining>0&&(
                    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:10,color:"var(--dim)"}}>
                      💡 {remaining<300?"もう少し！間食・補食で調整できます":"補食・おやつ・ドリンク等で補いましょう"}（残り{remaining}kcal）
                    </div>
                  )}
                  {remaining<=0&&(
                    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:10,color:"var(--gold-l)"}}>
                      ✅ 目標カロリー達成！バランスよく摂れています
                    </div>
                  )}
                </div>
                )}
              </div>
              );
            })()}

            {/* お昼トグル */}
            {(()=>{
              const activeCount = shows.filter(s=>s.enabled&&s.time).length;
              return(
              <div className={`lunch-toggle-row ${lunchOn?"on":""}`} style={{marginBottom:12}}>
                <div className="lunch-info">
                  <div className="lunch-info-title">{lunchOn?"🍱 お弁当が出る日":"🏪 コンビニで買う日"}</div>
                  <div className="lunch-info-sub">
                    {activeCount>=2
                      ? "マチソワはお弁当が出ることが多いです"
                      : "タップで切り替え"}
                  </div>
                </div>
                <div className={`row-toggle ${lunchOn?"on":""}`} onClick={()=>setLunchOn(p=>!p)}/>
              </div>
              );
            })()}

            {/* 食事タイムライン */}
            {/* コンビニ選択 */}
            <div style={{padding:"0 16px 14px"}}>
              <div style={{fontSize:10,letterSpacing:".15em",color:"var(--dim)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                🏪 <span>今日のコンビニを選んでください</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {key:"seven",  name:"セブン-イレブン", color:"#e63329", bg:"rgba(230,51,41,.1)",  border:"rgba(230,51,41,.35)"},
                  {key:"famima", name:"ファミリーマート",  color:"#008c4a", bg:"rgba(0,140,74,.1)",   border:"rgba(0,140,74,.35)"},
                  {key:"lawson", name:"ローソン",          color:"#009bdf", bg:"rgba(0,155,223,.1)",  border:"rgba(0,155,223,.35)"},
                ].map(s=>(
                  <button key={s.key} onClick={()=>setStore(s.key)}
                    style={{
                      flex:1,padding:"11px 4px",borderRadius:12,
                      fontSize:10,fontWeight:700,cursor:"pointer",
                      fontFamily:"'Noto Sans JP',sans-serif",transition:"all .2s",
                      border:`2px solid ${store===s.key?s.border:"rgba(255,255,255,.06)"}`,
                      background:store===s.key?s.bg:"var(--bg3)",
                      color:store===s.key?s.color:"var(--dim)",
                      lineHeight:1.5,
                      boxShadow:store===s.key?`0 0 12px ${s.bg}`:"none"
                    }}>
                    {s.name}
                  </button>
                ))}
              </div>
              {store&&<div style={{fontSize:9,color:"var(--dim)",marginTop:7,textAlign:"center",opacity:.6}}>
                ※ 商品は地域・時期により異なる場合があります
              </div>}
            </div>
            <div className="tl-hdr">MEAL TIMELINE</div>
            {foodItems.map((item, idx)=>{
              const fd = disp(item.time);
              const isLast = idx===foodItems.length-1;
              const selIdx = mealIdx[item.mkey]||0;
              const food = item.db ? item.db[selIdx] : null;
              return(
                <div key={item.id} className="tl-item">
                  <div className="tl-left">
                    <div className="tl-t">{fd.time}</div>
                    <div className="tl-ap">{fd.ampm}</div>
                  </div>
                  <div className="tl-mid">
                    <div className={`tl-dot ${item.dot==="show"?"show":item.dot==="pre"?"preboost":item.dot==="post"?"showend":item.dot==="am"?"morning":item.dot==="pm"?"evening":"vitc_am"}`}/>
                    {!isLast&&<div className="tl-line"/>}
                  </div>
                  <div className={`tl-card ${item.dot==="show"?"show-c":""}`} style={{cursor:item.mkey?"pointer":"default"}}
                    onClick={()=>{}}>
                    <div className="tl-ch">
                      <div className={`tl-lbl ${item.dot==="show"?"show":item.dot==="pre"?"preboost":item.dot==="post"?"showend":item.dot==="am"?"morning":"evening"}`}>
                        {item.label}
                      </div>
                      {/* お昼はここにもトグル */}
                      {item.id==="f_lunch"&&(
                        <div style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:lunchOn?"rgba(74,144,96,.15)":"rgba(255,255,255,.06)",border:lunchOn?"1px solid rgba(74,144,96,.3)":"1px solid rgba(255,255,255,.1)",color:lunchOn?"#6abf80":"var(--dim)",cursor:"pointer"}}
                          onClick={e=>{e.stopPropagation();setLunchOn(p=>!p);}}>
                          {lunchOn?"🍱 弁当":"🏪 コンビニ"}
                        </div>
                      )}
                    </div>
                    {food&&(
                      <>
                        {/* パターン選択ナビ */}
                        {item.mkey&&(
                          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                            <div className="pattern-arrow" style={{width:22,height:22,fontSize:12}} onClick={()=>cycle(item.mkey,-1)}>‹</div>
                            <div style={{display:"flex",gap:3,flex:1,justifyContent:"center"}}>
                              {[0,1,2,3,4].map(i=>(
                                <div key={i} className={`pattern-dot ${selIdx===i?"active":""}`}
                                  style={{width:20,height:20,fontSize:9}}
                                  onClick={()=>setIdx(item.mkey,i)}>
                                  {["A","B","C","D","E"][i]}
                                </div>
                              ))}
                            </div>
                            <div className="pattern-arrow" style={{width:22,height:22,fontSize:12}} onClick={()=>cycle(item.mkey,1)}>›</div>
                          </div>
                        )}
                        {/* 食品内容 */}
                        {item.isBento ? (
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:"var(--txt)",marginBottom:5}}>
                              <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"var(--gold)",color:"#0a0a0f",fontWeight:700,marginRight:5}}>{food.label}</span>
                              {food.emoji} {food.name}
                            </div>
                            {food.kcal>0&&(
                              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                                <span className="fm-tag fm-p">P {food.p}g</span>
                                <span className="fm-tag fm-c">C {food.c}g</span>
                                <span className="fm-tag fm-f">F {food.f}g</span>
                                <span className="fm-tag fm-cal">{food.kcal}kcal</span>
                              </div>
                            )}
                            {food.tips.map((t,i)=>(
                              <div key={i} style={{display:"flex",gap:6,fontSize:10,color:"var(--dim)",marginBottom:3,lineHeight:1.5}}>
                                <span style={{color:"var(--green)",flexShrink:0}}>✓</span>{t}
                              </div>
                            ))}
                            {food.caution&&<div style={{fontSize:9,color:"var(--orange)",marginTop:5,padding:"4px 8px",background:"rgba(192,112,64,.08)",borderRadius:6,border:"1px solid rgba(192,112,64,.2)"}}>⚠️ {food.caution}</div>}
                          </div>
                        ):(
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:"var(--txt)",marginBottom:4}}>
                              <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"var(--gold)",color:"#0a0a0f",fontWeight:700,marginRight:5}}>{food.label}</span>
                              {food.emoji} {food.name}
                            </div>
                            {food.kcal>0&&(
                              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
                                <span className="fm-tag fm-p">P {food.p}g</span>
                                <span className="fm-tag fm-c">C {food.c}g</span>
                                <span className="fm-tag fm-f">F {food.f}g</span>
                                <span className="fm-tag fm-cal">{food.kcal}kcal</span>
                              </div>
                            )}
                            <div style={{fontSize:10,color:"var(--dim)",lineHeight:1.5}}>💡 {food.tip}</div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="tl-reason" style={{marginTop:food?5:0}}>{item.reason}</div>
                  </div>
                </div>
              );
            })}

            <div style={{textAlign:"center",fontSize:10,color:"var(--dim)",opacity:.5,marginTop:16,lineHeight:1.8}}>
              A〜Eのパターンを日替わりで使ってください。<br/>栄養素はコンビニ商品の平均値を参考にした概算です。
            </div>
            <div className="bot"/>
          </div>
          );
        })()}

        {/* ══ 医学根拠 ══ */}
        {tab==="info"&&(
          <div className="page">
            {[
              {icon:"🔋",color:"#c9a84c",name:"CoQ10（酸化型）",    timing:"朝食後40分",
               why:"脂溶性。食事の脂質が消化管にある状態で摂取しないと吸収率が大幅に低下。食後摂取で3〜4倍向上することが研究で確認されている。"},
              {icon:"☀️",color:"#c9a84c",name:"ビタミンD＆オメガ-3",timing:"朝食後（脂溶性）",
               why:"ビタミンDは筋肉機能・免疫調整・概日リズムをサポート。ワカサプリはD＆オメガ-3が1粒に配合されており、関節・腱の炎症抑制も同時にカバーできる。CoQ10と同タイミングで摂取すると効率的。"},
              {icon:"⚡",color:"#c9a84c",name:"ビタミンB群",        timing:"朝食後すぐ",
               why:"水溶性で吸収が速く、摂取後すぐにエネルギー代謝回路で利用される。朝一番に摂取することで日中の代謝エンジンを早期起動できる。"},
              {icon:"🛡️",color:"#6abf80",name:"ビタミンC（2回）",  timing:"午前＋終演後30分",
               why:"水溶性で4〜6時間で代謝・排泄される。分割摂取で血中濃度を安定維持。終演後30分以内の摂取は睡眠中の組織修復・コラーゲン合成に直接寄与する。"},
              {icon:"🌙",color:"#a080d0",name:"マグネシウム",       timing:"終演後60分（就寝90分前）",
               why:"MgはGABA受容体を活性化し副交感神経を優位にする。効果発現まで60〜90分。終演後60分に摂取することで、帰宅→就寝のタイミングに効果がピークになるよう設計している。"},
              {icon:"🔥",color:"#e07060",name:"L-カルニチン",       timing:"開演/撮影2.5h前",
               why:"カルニチンが肝臓で代謝され、筋肉の脂肪酸β酸化回路に組み込まれるまで2〜2.5時間。本番パフォーマンスのピークに合わせるにはこのリードタイムが必要。"},
              {icon:"💊",color:"#c09060",name:"VitC（本番前）",     timing:"開演/撮影1h前",
               why:"本番ストレスでコルチゾールが急上昇しVitCが急速に消耗される。1時間前の追加摂取がコルチゾール過剰分泌を抑制し精神的ピーク維持に効果。"},
              {icon:"🔋",color:"#e07060",name:"CoQ10（本番追加）",   timing:"開演/撮影2h前",
               why:"L-カルニチンと協働して脂肪酸燃焼効率を最大化する。カルニチン摂取の30分後に追加摂取することで相乗効果が得られる。本番日は基礎量に加えて追加することでエネルギー産生を底上げできる。"},
              {icon:"😌",color:"#3a9090",name:"GABA",                timing:"ライブ/撮影60分前",
               why:"植物由来のアミノ酸で、副交感神経を直接活性化する。本番前の過緊張を抑えながら集中力を維持する。吸収・効果発現まで30〜60分。ワカサプリのGABAは1粒100mgと高配合。音楽家・映像俳優に特に推奨。"},
              {icon:"👁️",color:"#60c0c0",name:"ルテイン",            timing:"朝食後（脂溶性）・映像専用",
               why:"目の黄斑部に蓄積し、ブルーライト・強い照明から目を保護するカロテノイド。脂溶性のため食事の脂質と一緒に摂ることで吸収率が大幅に向上する。撮影照明や長時間のモニター露出による眼精疲労を軽減する効果が認められている。"},
              {icon:"🩸",color:"#c07040",name:"ヘム鉄",              timing:"午前・VitCと同時・映像専用",
               why:"ヘム鉄は非ヘム鉄より吸収率が約3倍高く、VitCと同時摂取でさらに向上する。ワカサプリのヘム鉄は動物性原料由来で胃腸への負担が少ない。長時間撮影における酸素運搬・持続エネルギー・集中力の維持に直結する。月経のある女性は男性の約1.8倍の摂取が推奨される。"},
              {icon:"💊",color:"#b090e0",name:"音楽家専用：ミネラルフォーミュラ", timing:"朝食後",
               why:"ワカサプリのミネラルフォーミュラは酵母由来の9種ミネラルを配合。亜鉛・マグネシウム・鉄などを含み、神経伝達・筋肉機能・免疫を総合的にサポートする。演奏家は通常よりミネラルの消耗が多いため、ミネラルフォーミュラでまとめて補給できる。"},
              {icon:"✨",color:"#d0a0e0",name:"グルタチオン",          timing:"朝食後（脂溶性）",
               why:"体内で最も重要な抗酸化物質。活性酸素による声帯・筋肉・肝臓のダメージを防ぐ。VitC・VitEと協働して抗酸化ネットワークを形成する。発声を多用するパフォーマーは声帯への酸化ストレスが高いため特に推奨。食事と一緒に摂ると吸収が高まる。"},
              {icon:"🛡️",color:"#80a0d0",name:"亜鉛＆銅",                timing:"朝食後（水溶性）",
               why:"亜鉛は免疫細胞の生成・傷の修復・味覚維持に必須。銅は亜鉛との拮抗作用があるため必ずセットで摂る。激しい稽古後に免疫が低下する「オープンウィンドウ」現象の予防に有効。歌手は味覚・口腔粘膜の健康維持にも重要。"},
              {icon:"😌",color:"#70b090",name:"GABA（ギャバ）",           timing:"就寝前（マグネシウムと同タイミング）",
               why:"ワカサプリのGABAは二条大麦乳酸発酵由来・1粒100mgの高配合。副交感神経を直接活性化し、本番後の過緊張を解きほぐす。ストレス・疲労感の軽減と睡眠の質改善が同時に期待できる。アシュワガンダ・メラトニンはいずれも日本では薬機法上の医薬品成分に該当するため、国内で合法的に入手できるGABAで代替。ワカサプリ通販で購入可能。"},
              {icon:"⚡",color:"#90c0d0",name:"クレアチン",               timing:"稽古1時間前",
               why:"筋肉内のATP（エネルギー通貨）を迅速に再合成する。瞬発力・最大筋力が向上し、高強度の稽古・ダンス・殺陣などに特に有効。5g/日の継続摂取で筋肉内クレアチン濃度が飽和する。安全性が最も確立されたスポーツサプリメントの一つ。"},

              {icon:"🐟",color:"#b090e0",name:"音楽家専用：植物性オメガ-3", timing:"朝食後（脂溶性）",
               why:"植物性オメガ-3（α-リノレン酸）は腱・関節・末梢神経の慢性炎症を抑制する。ミュージシャンズジストニア（過使用による局所性ジストニア）の予防にも継続摂取が推奨される。ワカサプリの植物性オメガ-3はビタミンD＆オメガ-3でもカバー可能。"},
              {icon:"💊",color:"#b090e0",name:"音楽家専用：Mg増量",  timing:"就寝前（通常の1.5倍）",
               why:"演奏時の持続的な筋収縮でマグネシウムが通常より多く消耗される。不足すると指・腕の痙攣リスクが上昇し、ジストニア症状の悪化につながる可能性がある。音楽家は体重×5〜6mg/kgを目安に増量する。"},
              {icon:"😴",color:"#6abf80",name:"翌日起床計算",       timing:"就寝時間＋睡眠サイクル",
               why:"睡眠は90分を1サイクルとして深い睡眠と浅い睡眠を繰り返す。サイクルの切れ目（浅い睡眠のタイミング）で起床することで目覚めが大幅に楽になる。入眠潜時15分を加味して5サイクル（7h45m）または6サイクル（9h15m）後を推奨している。"},
              {icon:"💪",color:"#c07040",name:"稽古中：BCAA",          timing:"稽古30分前 or 稽古中",
               why:"必須アミノ酸（ロイシン・イソロイシン・バリン）。長時間の稽古・ダンス練習中に筋肉が分解されるのを防ぐ。稽古中のエネルギー補給にもなり、疲労感の軽減にも効果がある。水に溶かして稽古中に飲むのが最も効率的。"},
              {icon:"🛡️",color:"#c07040",name:"稽古後：グルタミン",    timing:"稽古直後",
               why:"稽古・運動後に免疫機能が一時的に低下する「オープンウィンドウ」現象を抑制する。腸内環境の維持・筋修復の促進にも働く。長期稽古期間中の体調管理に特に有効。"},
            ].map(s=>(
              <div key={s.name} style={{background:"var(--bg3)",border:"1px solid rgba(255,255,255,.05)",borderRadius:10,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${s.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:15}}>{s.icon}</span>
                  <span style={{fontFamily:"'Shippori Mincho',serif",fontSize:13,fontWeight:600,color:"var(--txt)",flex:1}}>{s.name}</span>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:`${s.color}22`,color:s.color,border:`1px solid ${s.color}44`,flexShrink:0,whiteSpace:"nowrap"}}>{s.timing}</span>
                </div>
                <div style={{fontSize:11,color:"var(--dim)",lineHeight:1.8}}>{s.why}</div>
              </div>
            ))}
            {/* どこで買えるか */}
            <div style={{marginTop:16,background:"var(--bg3)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:10,letterSpacing:".15em",color:"var(--gold)",marginBottom:10,opacity:.8}}>🛒 どこで買えますか？</div>
              {[
                {name:"ビタミンC・B群・D・Mg・CoQ10", where:"ドラッグストア・薬局・コンビニ（DHC・NOW・ネイチャーメイド等）"},
                {name:"L-カルニチン・L-テアニン",      where:"ドラッグストア・Amazon（ナウフーズ・Now Foods・Jarrow等）"},
                {name:"Omega-3（EPA/DHA）",          where:"ドラッグストア・薬局（ディアナチュラ・DHC・サントリー等）"},
                {name:"ルテイン・鉄・ビタミンB6",      where:"ドラッグストア・薬局（ファンケル・DHC・ネイチャーメイド等）"},
                {name:"BCAA・グルタミン",              where:"スポーツ用品店・Amazon（ザバス・マイプロテイン・DNS等）"},
                {name:"全サプリ対応",                  where:"ワカサプリ（まとめて購入可能）"},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start",paddingBottom:8,borderBottom:i<5?"1px solid rgba(255,255,255,.04)":"none"}}>
                  <div style={{fontSize:10,color:"var(--txt)",flex:"0 0 auto",maxWidth:"45%",lineHeight:1.5}}>{item.name}</div>
                  <div style={{fontSize:10,color:"var(--dim)",flex:1,lineHeight:1.5}}>→ {item.where}</div>
                </div>
              ))}
            </div>

            <div style={{textAlign:"center",fontSize:10,color:"var(--dim)",opacity:.5,marginTop:14,lineHeight:1.8}}>
              ワカサプリ実商品に対応した構成です。<br/>個人差・体調により効果は異なります。
            </div>
            <div className="bot"/>
          </div>
        )}

        </div>{/* /プロ仕様 */}

        {/* フッタークレジット */}
        {/* ── 免責・広告表示 ── */}
        <div style={{
          margin:"0 18px 16px",padding:"14px 16px",
          background:"var(--bg3)",borderRadius:12,
          border:"1px solid var(--border)"
        }}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--dim)",letterSpacing:".1em",marginBottom:8}}>
            【免責事項・広告表示】
          </div>
          <div style={{fontSize:9,color:"var(--dim)",lineHeight:1.9,opacity:.85}}>
            ■ 本アプリは医療行為・診断・治療を目的とするものではありません。サプリメントの摂取にあたっては、医師・薬剤師にご相談ください。<br/>
            ■ 効果・効能には個人差があります。記載内容は特定の効果を保証するものではありません。<br/>
            ■ 疾病中の方・妊娠中・授乳中の方は、摂取前に必ず医師にご相談ください。<br/>
            ■ 本アプリには楽天アフィリエイトプログラムによる広告リンクが含まれます。<br/>

          </div>
        </div>

        <div className="credit">
          <div className="credit-name">Marty @ EMA presents</div>
          <div className="credit-sub" style={{marginBottom:14}}>PERFORMER'S TIME<br/>パフォーマーのためのメディカルケアアプリ</div>
          <div style={{textAlign:"left",width:"100%",padding:"0 8px"}}>
            <div style={{fontSize:10,letterSpacing:".15em",color:"var(--gold)",marginBottom:10,opacity:.8,textAlign:"center"}}>EDOGAWABASHI MEDICAL ASSN.</div>
            {[
              {label:"Director",    value:"Marty"},
              {label:"Members",     value:"Yukiko Takeda,  Hirofumi Kasama,  Kurumi Sakai"},
              {label:"Supervision", value:"Prof. Yuzuru Itoh,  Nippon Sport Science University"},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                <div style={{fontSize:9,color:"var(--gold)",opacity:.8,letterSpacing:".08em",minWidth:72,flexShrink:0,paddingTop:1}}>{row.label}</div>
                <div style={{fontSize:10,color:i===2?"var(--gold-l)":"var(--txt)",lineHeight:1.8,fontWeight:i===2?600:400}}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
