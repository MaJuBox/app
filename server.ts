import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy para o servidor do usuário (evita problemas de CORS)
  app.post("/api/proxy/check", async (req, res) => {
    let { serverUrl, token, hwid } = req.body;
    if (!serverUrl.startsWith("http")) serverUrl = `https://${serverUrl}`;
    
    try {
      const response = await axios.post(`${serverUrl.replace(/\/$/, '')}/api/machine/check`, { token, hwid }, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message;
      console.error(`Erro no Proxy Check (${status}):`, errorMsg);
      res.status(status || 500).json({ 
        ok: false, 
        error: `Erro no servidor remoto (${status || 'timeout'}): ${errorMsg}` 
      });
    }
  });

  app.post("/api/proxy/pix/create", async (req, res) => {
    let { serverUrl, token, amount, credits } = req.body;
    if (!serverUrl || !serverUrl.startsWith("http")) serverUrl = `https://${serverUrl || 'juke-2.onrender.com'}`;

    try {
      const response = await axios.post(`${serverUrl.replace(/\/$/, '')}/api/machine/pix/create`, { token, amount, credits }, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message;
      console.error(`Erro no Proxy PIX (${status}):`, errorMsg);
      res.status(status || 500).json({ ok: false, error: "Erro ao gerar PIX" });
    }
  });

  app.post("/api/proxy/pix/status", async (req, res) => {
    let { serverUrl, token, paymentId, id } = req.body;
    const pId = paymentId || id;
    if (!serverUrl.startsWith("http")) serverUrl = `https://${serverUrl}`;

    try {
      // Endpoint alterado para /api/machine/pix/status conforme solicitado
      const response = await axios.post(`${serverUrl.replace(/\/$/, '')}/api/machine/pix/status`, { 
        token, 
        payment_id: pId // Usando payment_id conforme especificado
      }, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message;
      console.error(`Erro no Proxy PIX Status (${status}):`, errorMsg);
      res.status(status || 500).json({ ok: false, error: "Erro ao verificar status do PIX" });
    }
  });

  // Vite middleware
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
    console.log(`MajuBox Server rodando em http://localhost:${PORT}`);
  });
}

startServer();
