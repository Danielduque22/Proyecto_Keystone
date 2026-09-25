// bot_login_attack.js - Simula un ataque automatizado de fuerza bruta / Credential Stuffing en el Login
const LOGIN_URL = 'http://localhost:3000/api/v1/auth';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lista de credenciales robadas que el bot intentará inyectar en ráfaga
const CREDENTIAL_ATTEMPTS = [
  { user: 'admin@banco.com', pass: 'admin1234' },
  { user: 'camilo.duque@empresa.com', pass: 'Password2026!' },
  { user: 'root_system@servidor.net', pass: 'toor_crack' }
];

async function runLoginBruteForce() {
  console.log('🤖 [INICIANDO ATAQUE DE CREDENTIAL STUFFING]');
  console.log('El bot intentará forzar el acceso sin mover el cursor ni teclear físicamente...\n');

  for (let i = 0; i < CREDENTIAL_ATTEMPTS.length; i++) {
    const cred = CREDENTIAL_ATTEMPTS[i];
    console.log(`Intentando vector [${i + 1}/${CREDENTIAL_ATTEMPTS.length}] -> Usuario: ${cred.user}`);

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: cred.user,
          pass: cred.pass,
          bioZeroTelemetry: {
            environment: { webdriver: true }, // Marcador de Selenium / Headless
            mouse: [],                         // Cero eventos cinemáticos
            keystrokes: []                     // Cero eventos de tecleo natural
          }
        })
      });

      const data = await res.json();

      if (res.status === 403) {
        console.log(`🛑 BLOQUEADO: Score ${data.diagnostico.score} | Causa: ${data.diagnostico.reasons[0]}`);
      }
    } catch (err) {
      console.error('Error de conexión:', err.message);
    }

    await sleep(700); // Pequeña pausa entre intentos
  }

  console.log('\n✅ Ataque de Login mitigado por BioZero. Revisa la pantalla web en http://localhost:3000\n');
}

runLoginBruteForce();