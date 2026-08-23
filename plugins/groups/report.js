'use strict';

export default {
  command: ['report', 'reportar', 'denuncia'],
  category: 'grupo',
  description: 'Reporta un mensaje a los admins',
  group: true,
  run: async ({ sock, m, from, sender, text }) => {
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!quotedMsg) {
      return sock.sendMessage(from, { text: '📝 Responde a un mensaje con *.report [razón]* para reportarlo.' }, { quoted: m });
    }

    const meta = await sock.groupMetadata(from);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);

    if (admins.length === 0) return sock.sendMessage(from, { text: 'ℹ️ No hay admins para reportar.' }, { quoted: m });

    const reason = text || 'Sin razón especificada';
    const num = sender.split('@')[0];
    const quotedNum = quotedSender?.split('@')[0] || 'Desconocido';

    const reportText = [
      `🚨 *REPORTE*`,
      ``,
      `👤 *De:* @${num}`,
      `🎯 *Contra:* @${quotedNum}`,
      `📝 *Razón:* ${reason}`,
      ``,
      `> Revisa este mensaje y toma acción.`,
    ].join('\n');

    await sock.sendMessage(from, {
      text: reportText,
      mentions: [...admins, sender, quotedSender].filter(Boolean),
    }, { quoted: m });
  },
};
