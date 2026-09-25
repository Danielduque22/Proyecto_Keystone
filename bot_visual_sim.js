// bot_visual_sim.js - Simulación de Ataque Distribuido con Comportamientos Asíncronos
const FEED_URL = 'http://localhost:3000/api/v1/bot-telemetry-feed';
const ATTACK_URL = 'http://localhost:3000/api/v1/cart/add';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 3 Bots con roles, trayectorias y objetivos completamente diferentes en la pantalla
const BOTS = [
  {
    id: 'BOT-01',
    role: 'Acaparador (MacBook)',
    start: { x: 40, y: 70 },
    target: { x: 230, y: 395 }, // Botón Agregar al Carrito del Producto 1
    totalFrames: 42,
    delayStart: 0,
    targetBtnId: 'prod-card-1'
  },
  {
    id: 'BOT-02',
    role: 'Sniper (Xbox Series X)',
    start: { x: 500, y: 60 },
    target: { x: 510, y: 395 }, // Botón Agregar al Carrito del Producto 2
    totalFrames: 38,
    delayStart: 180, // Inicia un poco después
    targetBtnId: 'prod-card-2'
  },
  {
    id: 'BOT-03',
    role: 'Checkout Bypass',
    start: { x: 200, y: 80 },
    target: { x: 920, y: 340 }, // Viaja directo al Checkout en el panel lateral derecho
    totalFrames: 46,
    delayStart: 350,
    targetBtnId: 'btn-checkout'
  }
];

async function runBotThread(bot) {
  if (bot.delayStart > 0) {
    await sleep(bot.delayStart);
  }

  const telemetrySamples = [];
  let currentScore = 1.0;

  for (let i = 0; i <= bot.totalFrames; i++) {
    const progress = i / bot.totalFrames;
    // Movimiento lineal artificial (y = mx + b) sin varianza orgánica
    const currentX = Math.round(bot.start.x + (bot.target.x - bot.start.x) * progress);
    const currentY = Math.round(bot.start.y + (bot.target.y - bot.start.y) * progress);
    const timestamp = Date.now();

    telemetrySamples.push({ x: currentX, y: currentY, t: timestamp, speed: 1.2 });

    let statusText = `${bot.id} navegando hacia${bot.role}...`;
    if (i > 10 && i <= 24) {
      currentScore = 0.68;
      statusText = `⚠️ Muestreo: ${bot.id} presenta curvatura nula`;
    } else if (i > 24 && i <= 36) {
      currentScore = 0.30;
      statusText = `🚨 ${bot.id} detectado como proceso automatizado`;
    } else if (i > 36) {
      currentScore = 0.05;
      statusText = `🛑 ${bot.id} bloqueado antes de ejecutar clic`;
    }

    await fetch(FEED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'BOT_FRAME',
        botId: bot.id,
        role: bot.role,
        x: currentX,
        y: currentY,
        score: currentScore,
        activeBotsCount: 3,
        status: statusText,
        targetBtnId: bot.targetBtnId
      })
    });

    await sleep(85);
  }

  return { bot, telemetrySamples };
}

async function runDiverseBotnetSimulation() {
  console.log('🎬 [INICIANDO DEMOSTRACIÓN DE BOTNET CON OBJETIVOS DIVERSOS]');
  console.log('👉 Revisa el navegador en http://localhost:3000:\n');
  console.log('   • BOT-01 ataca la MacBook Pro');
  console.log('   • BOT-02 ataca la Xbox Series X');
  console.log('   • BOT-03 viaja al panel lateral derecho hacia el Checkout\n');

  // Ejecución concurrente con rumbos y velocidades distintas
  const results = await Promise.all(BOTS.map(bot => runBotThread(bot)));

  console.log('🎯 Todos los bots alcanzaron sus botones de destino.');
  console.log('Inyectando bloqueo general de la botnet...');
  await sleep(400);

  // Notificar al backend la intercepción
  const res = await fetch(ATTACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionName: 'Ataque Coordinado Multi-Objetivo',
      data: { bots: BOTS.map(b => b.role) },
      isVisualSim: true,
      bioZeroTelemetry: {
        environment: { webdriver: true },
        mouse: results[0].telemetrySamples,
        keystrokes: []
      }
    })
  });

  const data = await res.json();
  if (res.status === 403) {
    console.log('\n🛑 [DEFENSA BIOZERO]: Los 3 ataques fueron interceptados.');
    console.log('✅ Demostración visual completada con éxito.\n');
  }
}

runDiverseBotnetSimulation();