const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 160, y: 580, width: 40, height: 40, speed: 4 };
let bullets = [];
let enemies = [];
let leftPressed = false;
let rightPressed = false;
let score = 0;
let startTime = Date.now();
let gameOver = false;

function spawnEnemy() {
  const laneX = [60, 160, 260];
  const x = laneX[Math.floor(Math.random() * laneX.length)];
  enemies.push({ x, y: -40, width: 40, height: 40, hp: Math.ceil(Math.random() * 3) });
}

function drawPlayer() {
  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));
}

function drawEnemies() {
  enemies.forEach((e) => {
    ctx.fillStyle = "red";
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`HP: ${e.hp}`, e.x + 2, e.y + 12);
  });
}

function update() {
  if (leftPressed) player.x -= player.speed;
  if (rightPressed) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  bullets.forEach((b) => b.y -= 6);
  bullets = bullets.filter((b) => b.y > -10);

  enemies.forEach((e) => e.y += 1.2);

  bullets.forEach((b) => {
    enemies.forEach((e) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.hp--;
        b.hit = true;
      }
    });
  });

  bullets = bullets.filter((b) => !b.hit);
  enemies = enemies.filter((e) => {
    if (e.hp <= 0) {
      score += 10;
      return false;
    }
    return true;
  });

  enemies.forEach((e) => {
    if (
      e.x < player.x + player.width &&
      e.x + e.width > player.x &&
      e.y + e.height >= player.y
    ) {
      endGame();
    }
  });
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  const time = ((Date.now() - startTime) / 1000).toFixed(1);
  ctx.fillText(`Time: ${time}s`, 10, 20);
  ctx.fillText(`Score: ${score}`, 10, 40);
}

function gameLoop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawHUD();
  update();
  requestAnimationFrame(gameLoop);
}

setInterval(() => {
  if (!gameOver) spawnEnemy();
}, 1000);

setInterval(() => {
  if (!gameOver) {
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
  }
}, 300);

document.getElementById("leftButton").addEventListener("touchstart", () => (leftPressed = true));
document.getElementById("leftButton").addEventListener("touchend", () => (leftPressed = false));
document.getElementById("rightButton").addEventListener("touchstart", () => (rightPressed = true));
document.getElementById("rightButton").addEventListener("touchend", () => (rightPressed = false));

function endGame() {
  gameOver = true;
  document.getElementById("gameOver").classList.remove("hidden");
  document.getElementById("finalScore").textContent = `スコア: ${score}`;
  const time = ((Date.now() - startTime) / 1000).toFixed(1);
  document.getElementById("finalTime").textContent = `生存時間: ${time}s`;
}

function restartGame() {
  score = 0;
  bullets = [];
  enemies = [];
  player.x = 160;
  startTime = Date.now();
  gameOver = false;
  document.getElementById("gameOver").classList.add("hidden");
  gameLoop();
}

gameLoop();
