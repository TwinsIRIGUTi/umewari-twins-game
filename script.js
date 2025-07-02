const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("leftButton");
const rightBtn = document.getElementById("rightButton");
const placeTurretBtn = document.getElementById("placeTurretButton");
const pauseBtn = document.getElementById("pauseButton");

const gameOverDiv = document.getElementById("gameOver");
const finalScoreText = document.getElementById("finalScore");
const finalTimeText = document.getElementById("finalTime");
const warningText = document.getElementById("warningText");
const waveText = document.getElementById("waveText");

let isPaused = false;
let isGameOver = false;
let score = 0;
let startTime = Date.now();
let player, bullets, enemies, turrets;
let currentStage = 0;
let currentWave = 0;
let waveActive = false;
let turretLimit = 4;
let turretAmmo = 1000;
let autoShootInterval;

const stages = [
  {
    waves: [
      { groups: 3, enemyHp: 1, boss: false },
      { groups: 4, enemyHp: 1, boss: "big" }
    ]
  },
  {
    waves: [
      { groups: 4, enemyHp: 2, boss: false },
      { groups: 5, enemyHp: 2, boss: "big" }
    ]
  },
  {
    waves: [
      { groups: 3, enemyHp: 2, boss: false },
      { groups: 5, enemyHp: 3, boss: "small" },
      { groups: 6, enemyHp: 3, boss: "mid" }
    ]
  }
];

function showWarning(text) {
  warningText.textContent = text;
  warningText.classList.remove("hidden");
  setTimeout(() => warningText.classList.add("hidden"), 2000);
}

function showWaveStart(waveNum) {
  waveText.textContent = `敵集団来襲！ Wave ${waveNum + 1}`;
  waveText.classList.remove("hidden");
  setTimeout(() => waveText.classList.add("hidden"), 2000);
}

function spawnEnemyGroup(count, hp) {
  const centerX = 40 + Math.random() * 240;
  for (let i = 0; i < count; i++) {
    const offset = (i % 10) * 10 - 45 + Math.random() * 5;
    enemies.push({ x: centerX + offset, y: -20 * Math.floor(i / 10), hp });
  }
}

function spawnBoss(type) {
  let size = 20, hp = 5;
  if (type === "small") { size = 40; hp = 10; }
  else if (type === "mid") { size = 60; hp = 20; }
  else if (type === "big") { size = 80; hp = 40; }

  enemies.push({ x: canvas.width / 2 - size / 2, y: -size, hp, size });
  showWarning("脅威接近中");
}

function startNextWave() {
  const stage = stages[currentStage];
  if (!stage || !stage.waves[currentWave]) {
    currentStage++;
    currentWave = 0;
    return;
  }
  const wave = stage.waves[currentWave];
  waveActive = true;
  showWaveStart(currentWave);

  let groupIndex = 0;
  const groupInterval = setInterval(() => {
    if (groupIndex < wave.groups) {
      spawnEnemyGroup(10 + Math.floor(Math.random() * 10), wave.enemyHp);
      groupIndex++;
    } else {
      clearInterval(groupInterval);
      if (wave.boss) {
        setTimeout(() => spawnBoss(wave.boss), 1500);
      }
    }
  }, 1500);
}

function updateWaveProgress() {
  if (waveActive && enemies.length === 0) {
    currentWave++;
    waveActive = false;
    setTimeout(startNextWave, 2000);
  }
}

function shootBullet(fromX, fromY, dx = 0, dy = -5) {
  bullets.push({ x: fromX, y: fromY, dx, dy });
}

function startAutoShooting() {
  if (autoShootInterval) clearInterval(autoShootInterval);
  autoShootInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      shootBullet(player.x + 10, player.y);
    }
  }, 150);
}

function stopAutoShooting() {
  if (autoShootInterval) clearInterval(autoShootInterval);
}

function initGame() {
  player = { x: 160, y: 580, speed: 4 };
  bullets = [];
  enemies = [];
  turrets = [];
  score = 0;
  startTime = Date.now();
  isGameOver = false;
  currentStage = 0;
  currentWave = 0;
  waveActive = false;
  gameOverDiv.classList.add("hidden");
  startNextWave();
  startAutoShooting();
}

function update() {
  if (isPaused || isGameOver) return;

  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  bullets = bullets.filter(b => b.y > -10 && b.y < canvas.height && b.x > -10 && b.x < canvas.width);

  enemies.forEach(e => e.y += 1);

  bullets.forEach(bullet => {
    enemies.forEach(e => {
      let size = e.size || 20;
      if (bullet.x > e.x && bullet.x < e.x + size && bullet.y > e.y && bullet.y < e.y + size) {
        e.hp--; bullet.hit = true;
        if (e.hp <= 0) { score += 10; e.dead = true; }
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
  enemies = enemies.filter(e => !e.dead);

  enemies.forEach(e => {
    let size = e.size || 20;
    if (e.y + size >= player.y) gameOver();
  });

  turrets.forEach(t => {
    t.cooldown--;
    if (t.ammo > 0 && t.cooldown <= 0) {
      shootBullet(t.x, t.y, -2, -4);
      shootBullet(t.x, t.y, 2, -4);
      t.cooldown = 20;
      t.ammo--;
    }
  });

  updateWaveProgress();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // player
  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, 20, 20);

  // bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 8));

  // enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    let size = e.size || 20;
    ctx.fillRect(e.x, e.y, size, size);
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(`HP:${e.hp}`, e.x, e.y - 2);
    ctx.fillStyle = "red";
  });

  // turrets
  ctx.fillStyle = "cyan";
  turrets.forEach(t => ctx.fillRect(t.x, t.y, 10, 10));

  // score
  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime) / 1000)}s`, 10, 40);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function gameOver() {
  isGameOver = true;
  stopAutoShooting();
  finalScoreText.textContent = `スコア: ${score}`;
  finalTimeText.textContent = `生存時間: ${Math.floor((Date.now() - startTime) / 1000)}秒`;
  gameOverDiv.classList.remove("hidden");
}

function restartGame() {
  initGame();
}

leftBtn.ontouchstart = () => player.x -= player.speed * 3;
rightBtn.ontouchstart = () => player.x += player.speed * 3;
leftBtn.ontouchmove = e => e.preventDefault();
rightBtn.ontouchmove = e => e.preventDefault();

placeTurretBtn.onclick = () => {
  if (score >= 500 && turrets.length < turretLimit) {
    let tx = turrets.length % 2 === 0 ? 40 : canvas.width - 50;
    let ty = canvas.height - 100 - Math.floor(turrets.length / 2) * 40;
    turrets.push({ x: tx, y: ty, ammo: turretAmmo, cooldown: 0 });
    score -= 500;
  }
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️" : "⏸";
};

initGame();
loop();
