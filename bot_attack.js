// bot_attack.js - Ataque en background sin interfaz visual
const URL = 'http://localhost:3000/api/v1/cart/add';

async function launchDirectAttack() {
  console.log('⚡ [ATAQUE DE BOT EN SEGUNDO PLANO]');
  console.log('Inyectando solicitud POST directa sin telemetría física...\n');

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionName: 'Extracción Automatizada de Inventario',
        data: { productId: 1, quantity: 5 },
        isVisualSim: false, // NO activa la interfaz visual de la web
        bioZeroTelemetry: {
          environment: { webdriver: true },
          mouse: [],
          keystrokes: []
        }
      })
    });

    const result = await res.json();

    if (res.status === 403) {
      console.log('🛑 [BLOQUEADO SILENCIOSAMENTE POR EL BACKEND]');
      console.log('Estado HTTP:   403 FORBIDDEN');
      console.log('Score BioZero: ' + result.diagnostico.score);
      console.log('Motivo:        ' + result.diagnostico.reasons[0]);
      console.log('Latencia:      ' + result.diagnostico.latencyMs + '\n');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

launchDirectAttack();