# Asta Base

Bot base de WhatsApp en CommonJS usando tu fork `@fer2809fl/baileys`.

## Estructura

```
asta-base/
├── index.js          # Conexión a WhatsApp (QR o código) y arranque
├── config.js          # Prefijos, owner, nombre del bot, etc.
├── package.json
├── lib/
│   ├── handler.js     # Carga plugins y procesa cada mensaje entrante
│   └── jid.js          # Sistema de JID (normaliza, detecta grupo/owner, resuelve @lid)
└── plugins/
    ├── owner/          # Comandos solo para el owner (vacía, lista para usar)
    ├── economia/        # Comandos de economía (vacía, lista para usar)
    └── general/
        └── ping.js      # Comando .ping de ejemplo
```

## Instalación (Termux o cualquier entorno con Node)

```bash
cd asta-base
npm install
npm start
```

Al iniciar por primera vez, la consola te preguntará:

```
¿Cómo quieres vincular el bot?
1) Código QR
2) Código de 8 dígitos
```

- **1**: se imprime un QR en la terminal para escanear desde WhatsApp > Dispositivos vinculados.
- **2**: te pide tu número (con código de país, sin `+`) y genera un código de 8 dígitos para ingresar en WhatsApp > Vincular con número de teléfono.

Puedes forzar el método sin que pregunte, cambiando en `config.js`:

```js
usePairingCode: true,  // siempre código
usePairingCode: false, // siempre QR
usePairingCode: null,  // pregunta (por defecto)
```

## Crear un comando nuevo

Crea un archivo `.js` dentro de la carpeta de categoría que quieras (`plugins/owner`, `plugins/economia`, `plugins/general`, o una nueva carpeta que tú crees) con este formato:

```js
module.exports = {
  command: ['saludo', 'hola'],   // alias del comando
  category: 'general',            // opcional, si no se pone usa el nombre de la carpeta
  description: 'Saluda al usuario',
  owner: false,                   // true = solo owner
  group: false,                   // true = solo en grupos
  run: async (ctx) => {
    const { sock, from, m, sender, isGroup, isOwner, args, text } = ctx;
    await sock.sendMessage(from, { text: '¡Hola! 👋' }, { quoted: m });
  },
};
```

Los plugins se recargan cada vez que llamas `loadPlugins()` (por ejemplo desde un comando `.reload` que tú agregues).

## Sistema de JID

`lib/jid.js` expone:

- `decodeSender(msg)` → `{ from, sender, isGroup, senderNumber }`
- `isOwner(jid, ownerList)`
- `normalizeJid`, `isGroupJid`, `isLidJid`, `jidToNumber`

Ya está integrado en el handler, así que cada `ctx` que reciben tus comandos trae `sender`, `senderNumber`, `isGroup` e `isOwner` resueltos automáticamente (incluyendo el caso de jids `@lid`).
