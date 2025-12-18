import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.json());

// Ensure worlds directory exists
const WORLDS_DIR = path.join(__dirname, 'worlds');
if (!fs.existsSync(WORLDS_DIR)) {
    fs.mkdirSync(WORLDS_DIR, { recursive: true });
}

// Routes
app.get('/api/worlds', (req, res) => {
    try {
        const files = fs.readdirSync(WORLDS_DIR);
        // Filter for .sand files
        const worlds = files
            .filter(f => f.endsWith('.sand'))
            .map(f => f.replace('.sand', ''));
        res.json(worlds);
    } catch (err) {
        console.error('Error listing worlds:', err);
        res.status(500).json({ error: 'Failed to list worlds' });
    }
});

app.post('/api/worlds/:name', (req, res) => {
    try {
        const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, ''); // Sanitize
        if (!name) return res.status(400).json({ error: 'Invalid name' });

        const filePath = path.join(WORLDS_DIR, `${name}.sand`);
        const buffer = req.body; // Raw buffer from express.raw()

        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            return res.status(400).json({ error: 'Empty body' });
        }

        fs.writeFileSync(filePath, buffer);
        console.log(`Saved world: ${name} (${buffer.length} bytes)`);
        res.json({ success: true, name });
    } catch (err) {
        console.error('Error saving world:', err);
        res.status(500).json({ error: 'Failed to save world' });
    }
});

app.get('/api/worlds/:name', (req, res) => {
    try {
        const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = path.join(WORLDS_DIR, `${name}.sand`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'World not found' });
        }

        const buffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(buffer);
    } catch (err) {
        console.error('Error loading world:', err);
        res.status(500).json({ error: 'Failed to load world' });
    }
});

app.delete('/api/worlds/:name', (req, res) => {
    try {
        const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = path.join(WORLDS_DIR, `${name}.sand`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'World not found' });
        }

        fs.unlinkSync(filePath);
        console.log(`Deleted world: ${name}`);
        res.json({ success: true, name });
    } catch (err) {
        console.error('Error deleting world:', err);
        res.status(500).json({ error: 'Failed to delete world' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Worlds directory: ${WORLDS_DIR}`);
});
