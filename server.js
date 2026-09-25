const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria para órdenes y usuarios
let ordersDatabase = [];
let sseClients = [];

app.get('/api/v1/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

function notifyClients(data) {
  sseClients.forEach(c => c.write(`data: ${JSON.stringify(data)}\n\n`));
}

// Emisión para el feed visual del bot
app.post('/api/v1/bot-telemetry-feed', (req, res) => {
  notifyClients(req.body);
  res.json({ ok: true });
});

// Endpoint para limpiar el lienzo sin recargar
app.post('/api/v1/clear-canvas', (req, res) => {
  notifyClients({ type: 'CLEAR_CANVAS' });
  res.json({ ok: true });
});

// Motor de evaluación cinemática BioZero
function evaluateHumanity(telemetry) {
  const startTime = process.hrtime();
  let score = 1.0;
  const reasons = [];
  const { environment, mouse, keystrokes } = telemetry || {};

  if (!environment || environment.webdriver === true) {
    reasons.push('Entorno automatizado detectado (navigator.webdriver activado).');
    return { isHuman: false, score: 0.0, reasons, latencyMs: '0.8 ms' };
  }

  if (Array.isArray(mouse) && mouse.length >= 6) {
    const speeds = mouse.map(m => m.speed || 0);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((acc, s) => acc + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      score -= 0.60;
      reasons.push('Cinemática lineal sintética: velocidad constante sin temblor biológico.');
    }
  } else if (!keystrokes || keystrokes.length === 0) {
    score -= 0.70;
    reasons.push('Acción ejecutada sin telemetría física previa en pantalla.');
  }

  score = Math.max(0.0, Math.min(1.0, score));
  const diff = process.hrtime(startTime);
  const latencyMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

  return {
    isHuman: score >= 0.60,
    score: Number(score.toFixed(2)),
    reasons: reasons.length ? reasons : ['Comportamiento orgánico humano validado.'],
    latencyMs: `${latencyMs} ms`
  };
}

// Middleware de verificación reutilizable
function verifyTelemetryMiddleware(req, res, next) {
  const validation = evaluateHumanity(req.body.bioZeroTelemetry);

  if (!validation.isHuman) {
    if (req.body.isVisualSim === true) {
      notifyClients({
        type: 'BOT_BLOCKED_VISUAL',
        action: req.body.actionName || 'Simulación Cinemática',
        diagnostico: validation
      });
    } else {
      notifyClients({
        type: 'BOT_BLOCKED_FORENSIC',
        action: req.body.actionName || 'Petición Automatizada Directa',
        interceptedData: {
          recurso: req.originalUrl,
          payload: JSON.stringify(req.body.data || {}),
          eventosMouse: req.body.bioZeroTelemetry?.mouse?.length || 0,
          webdriverDetectado: req.body.bioZeroTelemetry?.environment?.webdriver ? 'SÍ (true)' : 'NO (false)'
        },
        diagnostico: validation
      });
    }
    return res.status(403).json({ status: 'BLOCKED', diagnostico: validation });
  }

  req.validation = validation;
  next();
}

// 1. Endpoint de Inicio de Sesión
app.post('/api/v1/auth', (req, res) => {
  const { user, pass, bioZeroTelemetry } = req.body;
  const validation = evaluateHumanity(bioZeroTelemetry);

  if (!validation.isHuman) {
    notifyClients({
      type: 'BOT_BLOCKED_FORENSIC',
      action: 'Ataque de Credential Stuffing / Brute Force en Login',
      interceptedData: {
        usuarioObjetivo: user || 'admin@banco.com',
        claveInyectada: '••••••••',
        eventosMouse: bioZeroTelemetry?.mouse?.length || 0,
        webdriverDetectado: bioZeroTelemetry?.environment?.webdriver ? 'SÍ (true)' : 'NO (false)'
      },
      diagnostico: validation
    });
    return res.status(403).json({ status: 'BLOCKED', message: 'Acceso denegado: interacción no humana.', diagnostico: validation });
  }

  return res.status(200).json({
    status: 'AUTHORIZED',
    user: {
      email: user,
      name: user.split('@')[0].replace('.', ' ').toUpperCase()
    },
    diagnostico: validation
  });
});

// 2. Carrito y Checkout
app.post('/api/v1/cart/add', verifyTelemetryMiddleware, (req, res) => {
  res.json({ status: 'SUCCESS', message: 'Producto agregado al carrito.', score: req.validation.score });
});

app.post('/api/v1/checkout', verifyTelemetryMiddleware, (req, res) => {
  const newOrder = {
    orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    userEmail: req.body.data.userEmail || 'usuario@empresa.com',
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: req.body.data.items || [],
    total: req.body.data.totalAmount || 0,
    paymentMethod: req.body.data.paymentMethod || 'Tarjeta Débito Nu',
    score: req.validation.score,
    latency: req.validation.latencyMs
  };
  ordersDatabase.unshift(newOrder);
  res.json({ status: 'PURCHASE_COMPLETED', order: newOrder });
});

app.get('/api/v1/orders', (req, res) => {
  const userEmail = req.query.email;
  const filtered = userEmail ? ordersDatabase.filter(o => o.userEmail === userEmail) : ordersDatabase;
  res.json({ orders: filtered });
});

app.listen(PORT, () => {
  console.log(`BioZero Store activa en http://localhost:${PORT}`);
});