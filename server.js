import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

// BURAYA DEEPSEEK API ANAHTARINI YAZ
const DEEPSEEK_API_KEY = 'sk-e21b6c498f854c909e9818a8d42ba59a';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'DeepSeek Proxy Çalışıyor',
    endpoints: {
      chat: '/v1/chat/completions',
      models: '/v1/models'
    }
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model = 'deepseek-chat', stream = false, max_tokens = 4000 } = req.body;
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream,
        max_tokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      response.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        }
      }));
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'deepseek-chat',
        object: 'model',
        created: Date.now(),
        owned_by: 'deepseek'
      }
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`🌐 Port: ${PORT}`);
});
