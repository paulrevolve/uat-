const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve the built frontend (if you run a build into dist)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// If you're developing locally with Vite running separately, you can
// call the route with ?dev=true and it will navigate to the dev server URL.
const DEV_ORIGIN = process.env.DEV_ORIGIN || 'http://localhost:5173';

app.get('/pdf/invoice', async (req, res) => {
  const { dev } = req.query;
  const origin = dev ? DEV_ORIGIN : `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
  const url = `${origin}/invoice`;

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    // Set viewport large enough for A4-ish rendering
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': 'attachment; filename=invoice.pdf',
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`PDF server listening on http://localhost:${PORT}`);
  console.log(`Dev origin set to ${DEV_ORIGIN}. Use /pdf/invoice?dev=true to render from dev server.`);
});
