const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const LINE_TOKEN = process.env.LINE_TOKEN;

app.post('/webhook', async (req, res) => {
  const formData = req.body;

  const message = `มีข้อมูลใหม่จาก Google Form:  
ชื่อ: ${formData.name}
อีเมล: ${formData.email}
ข้อความ: ${formData.message}`;

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: process.env.LINE_TO,
        messages: [{ type: 'text', text: message }]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error sending to LINE:', error);
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => res.send('Webhook is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
