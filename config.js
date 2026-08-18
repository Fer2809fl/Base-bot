'use strict';

module.exports = {
  // Nombre del bot, se usa en mensajes y en el "browser" de la conexión
  botName: 'Asta',

  // Números del owner, con código de país, SIN + ni espacios. Puedes poner varios.
  ownerNumber: ['521234567890'],

  // Prefijos válidos para los comandos
  prefix: ['.', '#', '!'],

  // Carpeta donde se guarda la sesión (credenciales de WhatsApp)
  sessionName: 'session',

  // null = pregunta en consola al iniciar (QR o código de vinculación)
  // true = siempre código de emparejamiento
  // false = siempre QR
  usePairingCode: null,
};
