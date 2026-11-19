
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

let geminiAI = null;

async function obtenerGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No se encontró GEMINI_API_KEY en el archivo .env');
  }

  if (!geminiAI) {
    const { GoogleGenAI } = await import('@google/genai');

    geminiAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiAI;
}

app.post('/api/asistente', async (req, res) => {
  try {
    const { pregunta, modo, datos } = req.body;

    if (typeof pregunta !== 'string' || !pregunta.trim()) {
      return res.status(400).json({
        error: 'Debes escribir una pregunta.',
      });
    }

    const gemini = await obtenerGemini();

    const instrucciones = `
Eres el asistente inteligente de SMARTGO,
una aplicación de clasificación y venta de bebidas.

Tu función depende del tipo de usuario:

${modo === 'admin'
  ? 'Eres el asistente administrativo. Ayuda a analizar ventas, inventario y existencias.'
  : 'Eres el asistente de un cliente. Ayuda con sus compras y recomendaciones de bebidas.'}

Utiliza únicamente los datos proporcionados.
No inventes ventas, cantidades ni compras.
Responde en español, de forma clara, amable y útil.

Datos disponibles:
${JSON.stringify(datos || {}, null, 2)}

Pregunta del usuario:
${pregunta}
`;

    const resultado = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: instrucciones,
    });

    res.json({
      respuesta: resultado.text || 'No pude generar una respuesta.',
    });

  } catch (error) {
    console.error('Error en Gemini:', error);

    res.status(500).json({
      error: 'No se pudo obtener una respuesta de Gemini.',
    });
  }
});

const SERVER_PORT = 3001;

app.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log('====================================');
  console.log('       SMARTGO - ASISTENTE IA');
  console.log('====================================');
  console.log(`Servidor activo en puerto ${SERVER_PORT}`);
  console.log('====================================');
});
