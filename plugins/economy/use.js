'use strict';

import { useItem, formatInventory, addMoney, formatMoney } from '../../lib/database.js';

export default {
  command: ['use', 'usar', 'activar'],
  category: 'economy',
  description: 'Usa un item de tu inventario',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `❌ Uso: *.use ID*\nEjemplo: *.use map*\n\nLos boosts se activan automáticamente al comprarlos.` }, { quoted: m });
      return;
    }

    const itemId = args[0].toLowerCase();
    const result = useItem(sender, itemId);

    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    let text = '';

    switch (result.effect) {
      case 'digDouble':
        text = `🗺️ *¡Mapa del Tesoro usado!*\n\nTu próxima excavación será x2.`;
        break;
      case 'recoverFine':
        addMoney(sender, result.value);
        text = `🩹 *¡Botiquín usado!*\n\nRecuperaste *$${formatMoney(result.value)}* de multas.`;
        break;
      case 'title':
        text = `✨ *¡Título equipado!*\n\nAhora eres "${result.value}" en tu perfil.`;
        break;
      default:
        text = `✅ Item "${itemId}" usado.`;
    }

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
