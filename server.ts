import fs from 'fs';
import path from 'path';

// Endpoint to build the Gemma 2 E2B workspace
app.post('/init-ecosystem', (req, res) => {
  const { modelName } = req.body;
  const root = path.join(__dirname, `workspaces/${modelName}_env`);
  const dirs = ['media', 'data', 'history', 'memory'];

  dirs.forEach(d => {
    const dirPath = path.join(root, d);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  });

  res.send({ status: 'Ecosystem Live', path: root });
});
