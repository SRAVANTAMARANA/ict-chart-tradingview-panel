import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const dataDir = path.join(process.cwd(), 'astroquant', 'data');

app.get('/astro/events', (req, res) => {
  const file = path.join(dataDir, 'astro_events.json');
  if (!fs.existsSync(file)) return res.status(404).send({ error: 'no events data' });
  const raw = fs.readFileSync(file,'utf8');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.send(raw);
});

app.get('/astro/predictions', (req, res) => {
  const file = path.join(dataDir, 'astro_predictions.json');
  if (!fs.existsSync(file)) return res.status(404).send({ error: 'no predictions' });
  const raw = fs.readFileSync(file,'utf8');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.send(raw);
});

app.listen(3000, ()=> console.log('Astro server running on http://localhost:3000'));
