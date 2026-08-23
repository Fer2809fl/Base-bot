'use strict';

import { TikTokClient } from 'tik-api';

const tiktok = new TikTokClient({ region: 'US' });

export default {
  command: ['tiktok', 'tt'],
  category: 'descargas',
  description: 'Descarga un video de TikTok por URL o texto de búsqueda',
  run: async ({ sock, m, from, args, text }) => {
    const query = text || args.join(' ');

    if (!query) {
      return sock.sendMessage(from, { text: '📌 Uso: .tiktok <url o texto de búsqueda>' }, { quoted: m });
    }

    await sock.sendMessage(from, { text: '🔎 Buscando/descargando...' }, { quoted: m });

    try {
      const result = await tiktok.downloadVideo(query);

      if (result.status !== 'success' || result.result?.type !== 'video') {
        return sock.sendMessage(from, { text: '❌ No se pudo descargar ese video.' }, { quoted: m });
      }

      const formats = result.result.video.formats ?? [];
      const best = formats.find((f) => !f.has_watermark) ?? formats[0];

      if (!best?.url) {
        return sock.sendMessage(from, { text: '❌ No se encontró un formato descargable.' }, { quoted: m });
      }

      await sock.sendMessage(
        from,
        {
          video: { url: best.url },
          caption: `🎵 ${result.result.desc ?? ''}\n👤 @${result.result.author?.nickname ?? ''}`,
        },
        { quoted: m },
      );
    } catch (err) {
      console.error('[tiktok]', err);
      await sock.sendMessage(from, { text: '❌ Ocurrió un error al descargar el video.' }, { quoted: m });
    }
  },
};
