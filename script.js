// -------------------- CANVAS SETUP --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas to screen + keep border
function resizeCanvas() {
    const container = document.getElementById("gameContainer");
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.8;

    container.style.width = width + "px";
    container.style.height = height + "px";

    canvas.width = width;
    canvas.height = height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// -------------------- GAME STATE --------------------
let gamePaused = false;
let gameOver = false;
let coins = 200;
let level = 1;

let enemies = [];
let bullets = [];
let enemyBullets = [];

let currentWeaponIndex = 0;
let purchasedWeapons = [];

// -------------------- PLAYER --------------------
const player = {
    x: 400,
    y: 300,
    size: 20,
    health: 1000,
    speed: 4
};

// -------------------- WEAPONS --------------------
const WEAPONS = [
  { name:"Pistol", damage:10, fireRate:20, cost:0 },
  { name:"Shotgun", damage:25, fireRate:40, cost:100 },
  { name:"SMG", damage:8, fireRate:5, cost:150 },
  { name:"Rifle", damage:20, fireRate:25, cost:200 },
  { name:"Sniper", damage:80, fireRate:60, cost:400 },
  { name:"Rocket Launcher", damage:100, fireRate:80, cost:500 },
  { name:"Auto Blaster", damage:15, fireRate:5, cost:600, auto:true },
  { name:"Rail Gun", damage:120, fireRate:50, cost:800, auto:true }
];
purchasedWeapons.push(WEAPONS[0]);

// -------------------- INPUT --------------------
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Mouse
let mouse = { x: 400, y: 300 };
canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// -------------------- SHOOTING --------------------
let shootCooldown = 0;
function shoot(tx, ty){
    let weapon = purchasedWeapons[currentWeaponIndex];
    let dx = tx - player.x;
    let dy = ty - player.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    bullets.push({ x: player.x, y: player.y, dx: dx/dist, dy: dy/dist, damage: weapon.damage });
}
canvas.addEventListener("click", ()=>{
    let w = purchasedWeapons[currentWeaponIndex];
    if(!w.auto) shoot(mouse.x, mouse.y);
});

// -------------------- JOYSTICK --------------------
const joystick = document.getElementById("joystick");
const container = document.getElementById("joystickContainer");
let joy = {x:0,y:0};
let active = false;

joystick.addEventListener("mousedown", ()=>active=true);
joystick.addEventListener("touchstart", ()=>active=true);
document.addEventListener("mouseup", ()=>{ active=false; joy={x:0,y:0}; joystick.style.transform="translate(0,0)"; });
document.addEventListener("touchend", ()=>{ active=false; joy={x:0,y:0}; joystick.style.transform="translate(0,0)"; });

document.addEventListener("mousemove", moveJoy);
document.addEventListener("touchmove", moveJoy);
function moveJoy(e){
    if(!active) return;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let rect = container.getBoundingClientRect();
    let dx = clientX - (rect.left + rect.width/2);
    let dy = clientY - (rect.top + rect.height/2);
    let dist = Math.sqrt(dx*dx + dy*dy);
    let max = 40;
    if(dist > max){ dx = dx/dist*max; dy = dy/dist*max; }
    joystick.style.transform = `translate(${dx}px,${dy}px)`;
    joy.x = dx/max; joy.y = dy/max;
}

// -------------------- SHOP --------------------
document.getElementById("shopBtn").onclick = ()=>{
    gamePaused = true;
    document.getElementById("shopOverlay").style.display = "flex";
    updateShop();
};
document.getElementById("switchBtn").onclick = ()=>{
    if(purchasedWeapons.length > 1){
        currentWeaponIndex = (currentWeaponIndex + 1) % purchasedWeapons.length;
    }
};
function updateShop(){
    let shop = document.getElementById("shopContent");
    shop.innerHTML = `<h2>Coins: ${coins}</h2>`;
    WEAPONS.forEach(w=>{
        let owned = purchasedWeapons.includes(w);
        let div = document.createElement("div");
        div.className="weaponCard";
        div.innerHTML = `<span>${w.name} | ${w.damage} dmg | ${w.cost}</span><button ${owned?"disabled":""}>${owned?"Owned":"Buy"}</button>`;
        div.querySelector("button").onclick = ()=>{
            if(coins >= w.cost && !owned){ coins-=w.cost; purchasedWeapons.push(w); updateShop(); }
        };
        shop.appendChild(div);
    });
}
document.getElementById("shopOverlay").onclick = (e)=>{
    if(e.target.id==="shopOverlay"){ e.target.style.display="none"; gamePaused=false; }
};

// -------------------- ENEMIES --------------------
function spawnEnemy(){
    let margin = 50;
    enemies.push({
        x: Math.random()*(canvas.width-margin*2)+margin,
        y: Math.random()*(canvas.height-margin*2)+margin,
        health: 100+level*20,
        shootCooldown: 60
    });
}

// -------------------- GAME OVER / RESET --------------------
function resetGame() {
    gameOver = false;
    gamePaused = false;
    player.x = canvas.width/2;
    player.y = canvas.height/2;
    player.health = 1000;
    coins = 200;
    level = 1;

    enemies = [];
    bullets = [];
    enemyBullets = [];

    currentWeaponIndex = 0;
    purchasedWeapons = [WEAPONS[0]];

    document.getElementById("gameOverScreen").style.display = "none";
}

// -------------------- GAME LOOP --------------------
function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#111827";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    if(!gamePaused && !gameOver){
        // Player Movement
        player.x += joy.x * player.speed;
        player.y += joy.y * player.speed;
        if(keys["w"]) player.y -= player.speed;
        if(keys["s"]) player.y += player.speed;
        if(keys["a"]) player.x -= player.speed;
        if(keys["d"]) player.x += player.speed;
     // Keep player inside border
if(player.x < 0) player.x = 0;
if(player.y < 0) player.y = 0;
if(player.x + player.size > canvas.width) player.x = canvas.width - player.size;
if(player.y + player.size > canvas.height) player.y = canvas.height - player.size;

// Keep enemies inside border
enemies.forEach(e=>{
    if(e.x < 0) e.x = 0;
    if(e.y < 0) e.y = 0;
    if(e.x + 20 > canvas.width) e.x = canvas.width - 20;
    if(e.y + 20 > canvas.height) e.y = canvas.height - 20;
});

        // Auto shooting
        let weapon = purchasedWeapons[currentWeaponIndex];
        shootCooldown--;
        if(weapon.auto && shootCooldown<=0 && enemies.length>0){
            shoot(enemies[0].x, enemies[0].y);
            shootCooldown = weapon.fireRate;
        }

        // Spawn enemies gradually
        let maxEnemies = Math.min(2+Math.floor(level*0.5),10);
        while(enemies.length < maxEnemies) spawnEnemy();

        // Draw Player (only inside game area)
        if(player.x>=0 && player.x<=canvas.width && player.y>=0 && player.y<=canvas.height){
            ctx.fillStyle="cyan"; ctx.fillRect(player.x,player.y,player.size,player.size);
        }

        // Bullets
        bullets.forEach((b,i)=>{
            b.x += b.dx*10; b.y += b.dy*10;
            ctx.fillStyle="yellow"; ctx.fillRect(b.x,b.y,5,5);
            enemies.forEach((e)=>{ if(Math.abs(b.x-e.x)<20 && Math.abs(b.y-e.y)<20) e.health-=b.damage; });
        });

        // Enemies
        enemies.forEach((e,i)=>{
            if(e.x>=0 && e.x<=canvas.width && e.y>=0 && e.y<=canvas.height){
                let dx=player.x-e.x; let dy=player.y-e.y;
                let dist=Math.sqrt(dx*dx+dy*dy);
                let nx=dx/dist; let ny=dy/dist;
                e.x += nx; e.y += ny;

                e.shootCooldown--;
                if(e.shootCooldown<=0){
                    enemyBullets.push({x:e.x,y:e.y,dx:nx,dy:ny});
                    e.shootCooldown = 80 - level*2;
                }

                // Draw enemy + health
                ctx.fillStyle="red"; ctx.fillRect(e.x,e.y,20,20);
                ctx.fillStyle="black"; ctx.fillRect(e.x,e.y-8,20,4);
                ctx.fillStyle="lime"; ctx.fillRect(e.x,e.y-8,(e.health/(100+level*20))*20,4);

                if(e.health<=0){ coins+=10; enemies.splice(i,1); }
            }
        });

        // Enemy bullets
        enemyBullets.forEach((b,i)=>{
            b.x+=b.dx*5; b.y+=b.dy*5;
            ctx.fillStyle="orange"; ctx.fillRect(b.x,b.y,5,5);
            if(Math.abs(b.x-player.x)<20 && Math.abs(b.y-player.y)<20){ player.health-=2; }
        });

        // Level up
        if(coins>level*100) level++;

        // Game over
        if(player.health<=0){
            gameOver=true;
            document.getElementById("gameOverScreen").style.display="flex";
        }
    }

    // Update HUD
    document.getElementById("health").innerText = "Health: "+player.health;
    document.getElementById("coins").innerText = "Coins: "+coins;
    document.getElementById("currentWeapon").innerText = "Weapon: "+purchasedWeapons[currentWeaponIndex].name;

    requestAnimationFrame(gameLoop);
}

gameLoop();
