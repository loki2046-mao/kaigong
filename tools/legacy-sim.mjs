/*
 * 《开弓》数值模拟验证
 * 从 index.html 的 PURE 区提取与游戏完全相同的物理函数，
 * 用三种玩家模型（慢手 3 次/秒、普通 5 次/秒、高手 8 次/秒）逐关模拟。
 *
 * 硬性要求（文档 §5.2/§27/§28）：
 *   1. 普通玩家首过率不能是 0（数学可通关）；
 *   2. 慢手玩家在动态难度拉满后必须可以通过；
 *   3. 8 次尝试内绝大多数玩家应能过关（不许死关）。
 *
 * 玩家模型包含首试行为：新机制慌乱（点击率下降 / 抖动变大）、
 * 两段关锁定段手滑、节奏关前几秒未适应乱点。
 *
 * 运行：node tools/sim.mjs
 */
import { readFileSync } from "fs";

const html = readFileSync(new URL("../晋升.html", import.meta.url), "utf8");
const m = html.match(/\/\*__PURE_BEGIN__\*\/([\s\S]*?)\/\*__PURE_END__\*\//);
if (!m) { console.error("找不到 PURE 区"); process.exit(1); }
const api = new Function(
  m[1] + ";return {clamp,LEVELS,computeDDA,computeZone,newRun,stepRun,doClick,judgeHold,beatQualityAt,beatWindows,aimPos,passiveDecay};"
)();
const { LEVELS, computeDDA, computeZone, newRun, stepRun, doClick, judgeHold, beatQualityAt, aimPos } = api;

/* ---------------- 玩家模型参数 ---------------- */
const PLAYERS = [
  { name: "慢手", cps: 3, react: .34, reactSd: .10, beatJitter: .16, aimSd: .13,
    panic: .6, lockFail: .38, adapt: [1.8, 3.2] },
  { name: "普通", cps: 5, react: .24, reactSd: .07, beatJitter: .09, aimSd: .085,
    panic: .65, lockFail: .28, adapt: [1.4, 2.6] },
  { name: "高手", cps: 8, react: .16, reactSd: .05, beatJitter: .05, aimSd: .05,
    panic: .85, lockFail: .08, adapt: [.5, 1.2] },
];

let seed = 42;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const gauss = sd => {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
};
const DT = 1 / 120;

/* ---------------- 单次尝试模拟 ---------------- */
// 长按类（hold / hold2）
function simHold(L, dda, P, firstTry) {
  const zone = computeZone(L, dda);
  const s = newRun(L, dda);
  let releaseAt = Infinity;
  const aimFrac = .3 + rand() * .35;
  const aimP = zone[0] + (zone[1] - zone[0]) * aimFrac;
  const willFumbleLock = firstTry && rand() < P.lockFail; // L8 首试：锁定段手滑
  let fumbleAt = 0;
  if (willFumbleLock) fumbleAt = .1 + rand() * L.lockDur * .8;
  while (true) {
    let holding = true;
    if (s.phase === "stage2" && s.t >= releaseAt) holding = false;
    const ev = stepRun(s, DT, L, dda, holding);
    if (ev === "timeout") return { res: "fail", why: "timeout", p: s.p };
    if (L.mode === "hold2") {
      if (s.phase === "lock") {
        if (willFumbleLock && s.lockT >= fumbleAt) return { res: "fail", why: "脱手", p: s.p };
      } else if (s.phase === "stage2" && releaseAt === Infinity && s.p >= aimP) {
        releaseAt = s.t + Math.max(.02, P.react + gauss(P.reactSd));
      }
    } else if (releaseAt === Infinity && s.p >= aimP) {
      const surprise = L.lateRebound && firstTry ? .1 : 0;
      releaseAt = s.t + Math.max(.02, P.react + gauss(P.reactSd) + surprise);
    }
    if (s.t >= releaseAt) {
      const j = judgeHold(s, L, zone);
      return j === "win" ? { res: "win", p: s.p } : { res: "fail", why: j === "over" ? "over" : "short", p: s.p };
    }
    if (s.t > 60) return { res: "fail", why: "stuck", p: s.p };
  }
}

// 连点类（tap / hybrid 后段）
function simTap(L, dda, P, firstTry) {
  const s = newRun(L, dda);
  const effCps = P.cps * (firstTry ? P.panic : 1); // 首试看新机制，手会慢半拍
  let next = .3 + rand() * .3;
  let holding = L.mode === "hybrid"; // hybrid 前段长按
  while (true) {
    const ev = stepRun(s, DT, L, dda, holding);
    if (ev === "timeout") return { res: "fail", why: "timeout", p: s.p };
    if (ev === "zone") return { res: "win", p: s.p };
    if (L.mode === "hybrid" && s.phase !== "hold") holding = false;
    if (s.t >= next && !holding) {
      next = s.t + Math.max(.13, -Math.log(1 - rand()) / effCps);
      const r = doClick(s, L, dda, null);
      if (r === "zone") return { res: "win", p: s.p };
    }
    if (s.t > 60) return { res: "fail", why: "stuck", p: s.p };
  }
}

// 节奏/混合类：hold → tap → rhythm，先乱点适应，再跟拍
function simRhythm(L, dda, P, firstTry) {
  const s = newRun(L, dda);
  const effCps = P.cps * (firstTry ? P.panic : 1);
  let holding = L.mode === "hybrid";
  let inRhythm = L.mode === "rhythm";
  let adaptEnd = 0, spamNext = 0, tapNext = .3, beatClicked = -1; // 纯节奏关从一开始就跟拍
  while (true) {
    const ev = stepRun(s, DT, L, dda, holding);
    if (ev === "timeout") return { res: "fail", why: "timeout", p: s.p };
    if (ev === "zone") return { res: "win", p: s.p };
    if (L.mode === "hybrid") {
      if (s.phase === "hold") continue;
      holding = false;
      if (s.phase === "rhythm" && !inRhythm) {
        inRhythm = true;
        const a = firstTry ? P.adapt : [P.adapt[0] * .3, P.adapt[1] * .3];
        adaptEnd = s.t + a[0] + rand() * (a[1] - a[0]);
        spamNext = s.t + .15;
      }
      if (s.phase === "tap" && s.t >= tapNext) {
        // 连点段（70~90）
        tapNext = s.t + Math.max(.13, -Math.log(1 - rand()) / effCps);
        const r = doClick(s, L, dda, null);
        if (r === "zone") return { res: "win", p: s.p };
      }
      if (s.phase === "rhythm") {
        // 节奏段：与独立节奏关同一套适应→跟拍逻辑
        if (s.t < adaptEnd) {
          if (s.t >= spamNext) {
            spamNext = s.t + Math.max(.13, -Math.log(1 - rand()) / (P.cps * .8));
            const r = doClick(s, L, dda, beatQualityAt(s.t, L, dda));
            if (r === "zone") return { res: "win", p: s.p };
          }
        } else {
          const beat = L.beat;
          const k = Math.floor((s.t - beat * .5) / beat);
          if (k > beatClicked) {
            const jittered = (k + .5) * beat + gauss(P.beatJitter);
            if (s.t >= jittered) {
              beatClicked = k;
              const q = beatQualityAt(jittered, L, dda);
              const r = doClick(s, L, dda, q);
              if (r === "zone") return { res: "win", p: s.p };
            }
          }
        }
      }
      continue;
    }
    if (!inRhythm) continue;
    if (s.t < adaptEnd) {
      // 适应期：乱点（时机随机，质量按真实时间判定）
      if (s.t >= spamNext) {
        spamNext = s.t + Math.max(.13, -Math.log(1 - rand()) / (P.cps * .8));
        const r = doClick(s, L, dda, beatQualityAt(s.t, L, dda));
        if (r === "zone") return { res: "win", p: s.p };
      }
    } else {
      // 跟拍：在节拍点 ±抖动 处点击
      const beat = L.beat;
      const k = Math.floor((s.t - beat * .5) / beat); // 以节拍点为中心分段
      if (k > beatClicked) {
        const jittered = (k + .5) * beat + gauss(P.beatJitter);
        if (s.t >= jittered) {
          beatClicked = k;
          const q = beatQualityAt(jittered, L, dda);
          const r = doClick(s, L, dda, q);
          if (r === "zone") return { res: "win", p: s.p };
        }
      }
    }
    if (s.t > 90) return { res: "fail", why: "stuck", p: s.p };
  }
}

// 殿试：准星进圈时带反应误差放箭
function simAim(L, dda, P) {
  const zone = computeZone(L, dda);
  let t = rand() * L.aimPeriod;
  for (let i = 0; i < 2000; i++) {
    t += .004;
    const a = aimPos(t, L);
    if (a >= zone[0] + .3 && a <= zone[1] - .3) {
      const aFire = aimPos(t + gauss(P.aimSd), L);
      return aFire >= zone[0] && aFire <= zone[1] ? { res: "win", p: 100 } : { res: "fail", why: "miss", p: 100 };
    }
  }
  return { res: "fail", why: "miss", p: 100 };
}

function attempt(L, dda, P, firstTry) {
  if (L.mode === "hold" || L.mode === "hold2") return simHold(L, dda, P, firstTry);
  if (L.mode === "rhythm" || L.mode === "hybrid") return simRhythm(L, dda, P, firstTry);
  if (L.mode === "aim") return simAim(L, dda, P);
  return simTap(L, dda, P, firstTry);
}

/* ---------------- 逐关 × 逐玩家：首过率与 8 次内通过率 ---------------- */
const N = 1200;
const TARGETS = { 1: [95, 100], 2: [85, 100], 3: [70, 100], 4: [45, 80], 5: [30, 70],
  6: [25, 60], 7: [18, 50], 8: [10, 45], 9: [8, 70], 10: [8, 40],
  11: [5, 40], 12: [8, 55], 13: [6, 100], 14: [6, 40],
  15: [10, 50], 16: [8, 45], 17: [5, 60] }; // 普通玩家首过率目标区间（宽松）
  // 注：第13关节拍 0.5s，模拟的"普通"是节拍器机器人（抖动 σ0.09s），真人远难于此模型，故不设首过率上限（参照 9/30 第6/9关同款修正）
  // 注：2026-09-30 真人实测反馈，节奏关判定窗整体放宽（good 0.15→0.20 beat）以提升真人可读性，第 6/9 关上限相应上调
  // 注：2026-09-30 真人实测反馈，第 9 关节拍段对真人远难于模型玩家，判定窗放宽后上限由 40 调至 70
const rows = [];
let allOk = true;

for (const L of LEVELS) {
  for (const P of PLAYERS) {
    let in8 = 0, attSum = 0, firstWins = 0;
    for (let i = 0; i < N; i++) {
      let fails = 0, win = false, used = 0;
      for (let a = 0; a < 8; a++) {
        used = a + 1;
        const r = attempt(L, computeDDA(fails), P, a === 0);
        if (r.res === "win") { win = true; break; }
        fails++;
      }
      if (win) { in8++; attSum += used; }
    }
    for (let i = 0; i < N; i++) {
      if (attempt(L, computeDDA(0), P, true).res === "win") firstWins++;
    }
    const firstRate = firstWins / N, in8Rate = in8 / N;
    const avgAtt = attSum / Math.max(1, in8);
    let ok = firstRate > 0 && in8Rate > 0.85;
    if (P.name === "普通") {
      const fr = Math.round(firstRate * 100); // 百分比
      const [lo, hi] = TARGETS[L.id];
      ok = fr >= lo && in8Rate > 0.85;
      if (fr > hi && L.id > 3) ok = false; // 中后期太简单也不行
    }
    if (!ok) allOk = false;
    rows.push({ L, P, firstRate, in8Rate, avgAtt, ok });
  }
}

/* ---------------- 机制硬校验 ---------------- */
function tapNet(L, cps, p, dda) {
  let g = L.tapGain;
  if (L.lateFrom && p > L.lateFrom) g *= L.lateTapMul;
  g *= dda.gain;
  const dec = (L.tapDecay * (L.lateFrom && p > L.lateFrom ? L.lateDecayMul : 1)) * dda.decay;
  return g * Math.min(cps, 1 / .13) - dec;
}
const checks = [];
function check(name, cond, detail) {
  checks.push({ name, cond, detail });
  if (!cond) allOk = false;
}
{
  const dda0 = computeDDA(0), dda6 = computeDDA(6);
  const L5 = LEVELS[4];
  check("L5 普通5cps前段净增长>0", tapNet(L5, 5, 30, dda0) > 0, tapNet(L5, 5, 30, dda0).toFixed(1));
  check("L5 普通5cps后段净增长>0", tapNet(L5, 5, 85, dda0) > 2, tapNet(L5, 5, 85, dda0).toFixed(1));
  check("L5 慢手3cps+满辅助后段净增长>0", tapNet(L5, 3, 85, dda6) > 0, tapNet(L5, 3, 85, dda6).toFixed(1));
  const L7 = LEVELS[6];
  check("L7 普通5cps后段净增长>0", tapNet(L7, 5, 88, dda0) > 0, tapNet(L7, 5, 88, dda0).toFixed(1));
  check("L7 慢手3cps+满辅助后段净增长>0", tapNet(L7, 3, 88, dda6) > 0, tapNet(L7, 3, 88, dda6).toFixed(1));
  const L9 = LEVELS[8];
  {
    // L9 节奏段：只踩拍也能涨（+满辅助必须明显为正）
    const beatAligned = (1 / L9.beat) * L9.rhythmBonus * dda6.gain - L9.lateDecay * dda6.decay;
    check("L9 慢手踩拍+满辅助净增长>0", beatAligned > 0, beatAligned.toFixed(1));
    // 乱点不该有正收益（迫使玩家跟环，否则节奏机制无意义）。
    // 节奏段一拍只认一击（doClick 内 lastQClick 限制），最高有效乱点频率 = 1/beat
    const spam = (1 / L9.beat) * L9.rhythmNorm * dda0.gain - L9.lateDecay * dda0.decay;
    check("L9 高频乱点(首试)净增长<=0", spam <= 0, spam.toFixed(1));
    // 连点段（70~90）普通玩家净增长
    check("L9 普通5cps连点段净增长>0", tapNet({ ...L9, lateFrom: 999 }, 5, 80, dda0) - 0 > 0,
      (L9.tapGain * 5 - L9.tapDecay).toFixed(1));
    // 回归：按住段中途松手不得产生 NaN（曾因缺 dropRate 导致全程报废）
    {
      const s = newRun(L9, dda0);
      stepRun(s, .5, L9, dda0, true);   // 按住 0.5s
      stepRun(s, .2, L9, dda0, false);  // 中途松手
      const finite = isFinite(s.p);
      stepRun(s, .4, L9, dda0, true);   // 再按住仍能涨
      check("L9 按住段松手后力量保持有限值", finite, `p=${s.p.toFixed(1)}`);
      check("L9 松手后再按住继续蓄力", s.p > 0, `p=${s.p.toFixed(1)}`);
      check("L9 已配置 dropRate", typeof L9.dropRate === "number", String(L9.dropRate));
    }
  }
  const L6 = LEVELS[5];
  {
    const beat = L6.beat;
    const goodNet = (L6.goodGain * dda0.gain - L6.tapDecay * dda0.decay * beat) / beat;
    check("L6 全good跟拍净增长>2%/s", goodNet > 2, goodNet.toFixed(1));
    const allNorm = (L6.tapGain * dda0.gain - L6.tapDecay * dda0.decay * beat) / beat;
    check("L6 全乱点净增长≈不涨(节奏有门槛)", allNorm < 2, allNorm.toFixed(1));
    const dda6Net = (L6.tapGain * dda6.gain - L6.tapDecay * dda6.decay * beat) / beat;
    check("L6 慢手乱点+满辅助净增长>0(兜底)", dda6Net > 0, dda6Net.toFixed(1));
  }
  const L13 = LEVELS[12];
  {
    const goodNet = (L13.goodGain * dda0.gain - L13.tapDecay * dda0.decay * L13.beat) / L13.beat;
    check("L13 全good跟拍净增长>2%/s", goodNet > 2, goodNet.toFixed(1));
    const allNorm = (L13.tapGain * dda0.gain - L13.tapDecay * dda0.decay * L13.beat) / L13.beat;
    check("L13 全乱点净增长<=0(节奏有门槛)", allNorm <= 0, allNorm.toFixed(1));
    const dda6Net = (L13.perfectGain * dda6.gain - L13.tapDecay * dda6.decay * L13.beat) / L13.beat;
    check("L13 慢手完美跟拍+满辅助净增长>0(兜底)", dda6Net > 0, dda6Net.toFixed(1));
    check("L13 已配置 winScale(慢手首过窗口放宽)", typeof L13.winScale === "number", String(L13.winScale));
  }
  const L12 = LEVELS[11];
  {
    check("L12 慢手3cps后段净增长>0(首过率不可为0)", tapNet(L12, 3, 85, dda0) > 0, tapNet(L12, 3, 85, dda0).toFixed(2));
    check("L12 慢手3cps+满辅助后段净增长>0", tapNet(L12, 3, 85, dda6) > 0, tapNet(L12, 3, 85, dda6).toFixed(1));
  }
  const L11 = LEVELS[10];
  check("L11 已配置 lateRebound(回扯机制)", !!L11.lateRebound, JSON.stringify(L11.lateRebound));
  const L14 = LEVELS[13];
  check("L14 两段关已配置 dropRate", typeof L14.dropRate === "number", String(L14.dropRate));
  {
    const dda0z = computeZone(LEVELS[15], dda0), dda6z = computeZone(LEVELS[15], dda6);
    check("L16 夜战射柳满辅助区间宽度≥首试两倍(慢手兜底)", dda6z[1] - dda6z[0] >= (dda0z[1] - dda0z[0]) * 2,
      `${(dda6z[1]-dda6z[0]).toFixed(0)} vs ${(dda0z[1]-dda0z[0]).toFixed(0)}`);
    const L15w = LEVELS[14];
    check("L15 逆风:普通净蓄力>0", L15w.holdGain * dda0.gain - L15w.windDrift > 0,
      (L15w.holdGain * dda0.gain - L15w.windDrift).toFixed(1));
    check("L15 逆风:慢手满辅助净蓄力>0", L15w.holdGain * dda6.gain - L15w.windDrift > 0,
      (L15w.holdGain * dda6.gain - L15w.windDrift).toFixed(1));
    check("L15 逆风已配置 windDrift", typeof L15w.windDrift === "number", String(L15w.windDrift));
  }
  const L17 = LEVELS[16];
  check("L17 混合大比已配置 dropRate", typeof L17.dropRate === "number", String(L17.dropRate));
  {
    const s = newRun(L17, dda0);
    stepRun(s, .5, L17, dda0, true);
    stepRun(s, .2, L17, dda0, false);
    const finite = isFinite(s.p);
    stepRun(s, .4, L17, dda0, true);
    check("L17 按住段松手后力量保持有限值", finite, `p=${s.p.toFixed(1)}`);
    check("L17 松手后再按住继续蓄力", s.p > 0, `p=${s.p.toFixed(1)}`);
  }
  for (const L of LEVELS) {
    const z0 = computeZone(L, dda0), z6 = computeZone(L, dda6);
    checks.push({ name: `${L.id}关 成功区 首次→满辅助`, cond: true, detail: `${z0[0]}~${z0[1]} → ${z6[0]}~${z6[1]}` });
  }
}

/* ---------------- 输出 ---------------- */
console.log("\n=== 首过率 / 8次内通过率 ===");
console.log("关卡    玩家  首过率  8次内过  均尝试  状态");
for (const r of rows) {
  console.log(
    `第${String(r.L.id).padStart(2)}关  ` +
    r.P.name.padEnd(4) +
    (Math.round(r.firstRate * 100) + "%").padEnd(8) +
    (Math.round(r.in8Rate * 100) + "%").padEnd(9) +
    r.avgAtt.toFixed(1).padEnd(8) +
    (r.ok ? "OK" : "!! 不达标")
  );
}
console.log("\n=== 机制硬校验 ===");
for (const c of checks) {
  console.log((c.cond ? "✓ " : "✗ ") + c.name + (c.detail != null ? "  [" + c.detail + "]" : ""));
}
console.log("\n总体：" + (allOk ? "全部通过 ✓" : "存在不达标项，需要调参 ✗"));
process.exit(allOk ? 0 : 2);
