import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const BOT_AGENTS = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot|bingbot/i;
const API_BASE = process.env.VITE_API_URL || 'https://api.axess.pro';

function fetchEventJson(apiUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(apiUrl, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', reject);
  });
}

app.get('/e/:slug', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!BOT_AGENTS.test(ua)) return next();

  try {
    const slug = encodeURIComponent(req.params.slug);
    const event = await fetchEventJson(`${API_BASE}/e/${slug}`);
    if (!event) return next();

    const stripHtml = (html) => (html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/h[1-6]>/gi, ' ')
      .replace(/<\/div>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const title = event.title || 'AXESS';
    const description = stripHtml(event.description_text || event.description || '').slice(0, 200);
    const image = event.cover_image_url || event.image_url || '';
    const url = `https://axess.pro/e/${req.params.slug}`;

    return res.send(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="he_IL" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <p><a href="${url}">${title}</a></p>
</body>
</html>`);
  } catch (err) {
    console.error('Bot OG error:', err);
    return next();
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(process.env.PORT || 8080);
