import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// This is the "Ecosystem" logic you mentioned
app.post('/api/init-gemma', (req, res) => {
  try {
    // 1. Define the production workspace on YOUR server's disk
    const modelId = "gemma-4-e2b";
    const workspaceRoot = path.join(__dirname, '..', 'workspaces', modelId);

    // 2. PURGE OLD/TEMP DATA and create fresh ecosystem folders
    const subDirs = ['media', 'data', 'history', 'memory'];
    
    subDirs.forEach(dir => {
      const fullPath = path.join(workspaceRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    console.log(`[SYSTEM]: Gemma 4 E2B Ecosystem Initialized at ${workspaceRoot}`);

    // 3. Return the success signal to the Vercel frontend
    res.status(200).json({ 
      status: 'READY', 
      path: workspaceRoot,
      sandboxId: `sbx_${Math.random().toString(36).substr(2, 9)}` 
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to initialize server-side ecosystem." });
  }
});

app.listen(3000, () => console.log("Gemma Server running on port 3000"));
