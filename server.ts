import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let embedder: any = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * FIZx2 ECOSYSTEM INITIALIZER
   * Triggered upon Model Sync
   */
  const setupModelWorkspace = async (modelName: string) => {
    // Sanitize model name for filesystem
    const sanitizedName = modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const root = path.join(process.cwd(), 'workspaces', `${sanitizedName}_ecosystem`);
    const subfolders = ['media', 'data', 'history', 'memory'];

    subfolders.forEach(folder => {
        const folderPath = path.join(root, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });

    // Create the initial memory anchor
    const memoryPath = path.join(root, 'memory', 'state.json');
    if (!fs.existsSync(memoryPath)) {
        fs.writeFileSync(memoryPath, JSON.stringify({ 
            init_constant: 1.61803398875,
            last_sync: new Date().toISOString()
        }, null, 2));
    }

    // Initialize Vector Engine (Background)
    if (!embedder) {
        console.log("[SYSTEM]: Initializing Vector Engine (all-MiniLM-L6-v2)...");
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log("[SYSTEM]: all-MiniLM Vector Engine Ready.");
    }

    // Background task: Scan project files and index them
    // Note: This is an expensive operation, we run it without awaiting
    indexProjectFiles(root).catch(err => console.error("Indexing failed:", err));

    return root;
  };

  const indexProjectFiles = async (workspaceRoot: string) => {
    if (!embedder) return;
    
    const projectRoot = process.cwd();
    const filesToScan: string[] = [];
    
    const scanDir = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.relative(projectRoot, fullPath);
        
        if (relPath.startsWith('node_modules') || relPath.startsWith('.git') || relPath.startsWith('dist') || relPath.startsWith('workspaces')) continue;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile() && /\.(tsx|ts|js|jsx|css|json|md)$/.test(item)) {
          filesToScan.push(fullPath);
        }
      }
    };

    scanDir(projectRoot);

    const embeddings: any = {};
    for (const file of filesToScan) {
      const content = fs.readFileSync(file, 'utf-8');
      const relPath = path.relative(projectRoot, file);
      try {
        const output = await embedder(content, { pooling: 'mean', normalize: true });
        embeddings[relPath] = Array.from(output.data);
      } catch (err) {
        console.error(`Error embedding ${relPath}:`, err);
      }
    }

    const memoryFile = path.join(workspaceRoot, 'memory', 'codebase_index.json');
    fs.writeFileSync(memoryFile, JSON.stringify(embeddings, null, 2));
    console.log(`[SYSTEM]: Indexed ${Object.keys(embeddings).length} files into /memory.`);
  };

  // API Routes
  app.post("/api/init-ecosystem", async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) {
      return res.status(400).json({ error: "modelName is required" });
    }

    try {
      const workspacePath = await setupModelWorkspace(modelName);
      res.json({ 
        status: "success", 
        message: "Model Ecosystem Initialized",
        workspace: workspacePath
      });
    } catch (error) {
      console.error("Workspace setup failed:", error);
      res.status(500).json({ error: "Failed to initialize workspace" });
    }
  });

  // Keep compatibility with previous turn if needed
  app.post("/api/setup-workspace", async (req, res) => {
    const { modelName } = req.body;
    try {
      const workspacePath = await setupModelWorkspace(modelName);
      res.json({ status: "success", workspace: workspacePath });
    } catch (err) {
      res.status(500).json({ error: "Setup failed" });
    }
  });

  app.post("/api/process", (req, res) => {
    const { code, instruction } = req.body;
    
    // Internal fallback logic for Hermes/Momoa
    res.json({
        payload: `[HERMES]: Processing instruction "${instruction}" against local context.`,
        status: `[MOMOA]: System stabilized. Workspace mapped. 1.618 logic active.`
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
