/**
 * @file index.js
 * @description Node.js Express server to act as a webhook receiver for Google Forms
 * and push notifications to Line Official Account (Line OA).
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // ใช้สำหรับทำ HTTP requests ไปยัง Line API

const app = express();
// Middleware: ใช้ body-parser เพื่อให้ Express สามารถอ่าน JSON body จาก incoming requests ได้
app.use(bodyParser.json());

// ดึง Line Channel Access Token จาก Environment Variable
// โทเค็นนี้คือ 'Channel access token (long-lived)' ที่ได้จาก Line Developers Console
// ห้าม hardcode token นี้ในโค้ด!
const LINE_TOKEN = process.env.LINE_TOKEN;

// ดึง User ID ของ Line Official Account (Line OA) ของคุณจาก Environment Variable
// นี่คือ 'User ID' ของ Bot ที่ได้จากแท็บ Basic settings ใน Line Developers Console
// เป็นปลายทางสำหรับ Push Message
const LINE_OA_USER_ID = process.env.LINE_OA_USER_ID;

// กำหนด Endpoint สำหรับรับข้อมูลจาก Google Apps Script
// URL นี้คือ https://sine-project.onrender.com/webhook
app.post('/webhook', async (req, res) => {
  // รับ payload ที่ส่งมาจาก Google Apps Script
  // โครงสร้างที่คาดหวัง: { timestamp: "...", message: "..." }
  const receivedPayload = req.body;

  // ตรวจสอบว่า payload ที่ได้รับมานั้นมี 'message' property หรือไม่
  // เพื่อป้องกันข้อผิดพลาดหาก payload ไม่ได้อยู่ในรูปแบบที่คาดหวัง
  if (!receivedPayload || !receivedPayload.message) {
    console.error('Invalid payload received: missing "message" property.');
    // ส่งสถานะ 400 Bad Request กลับไปหาก payload ไม่ถูกต้อง
    return res.status(400).send('Bad Request: Missing "message" in payload.');
  }

  // ใช้ข้อความที่ Google Apps Script จัดรูปแบบมาให้แล้วโดยตรง
  const messageToLine = receivedPayload.message;

  // ตรวจสอบว่ามี LINE_TOKEN และ LINE_OA_USER_ID ถูกตั้งค่าหรือไม่
  if (!LINE_TOKEN || !LINE_OA_USER_ID) {
    console.error('LINE_TOKEN or LINE_OA_USER_ID environment variables are not set.');
    return res.status(500).send('Server configuration error.');
  }

  try {
    // ส่งข้อความไปยัง Line Messaging API โดยใช้ Push Message
    // 'to' คือ User ID ของ Line OA ของคุณ
    // 'messages' คือ array ของวัตถุข้อความ (ในที่นี้คือข้อความประเภท text)
    const lineResponse = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: LINE_OA_USER_ID, // ส่งไปยัง User ID ของ Line OA ของคุณ
        messages: [{ type: 'text', text: messageToLine }]
      },
      {
        headers: {
          // กำหนด Authorization Header ด้วย Bearer Token
          Authorization: `Bearer ${LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // บันทึก Log ของการตอบกลับจาก Line API (สำหรับการ Debug)
    console.log('Message sent to LINE successfully:', lineResponse.data);
    // ส่งสถานะ 200 OK กลับไปหากส่งข้อความสำเร็จ
    res.status(200).send('OK');
  } catch (error) {
    // ดักจับและแสดงข้อผิดพลาดหากการส่งข้อความไปยัง Line API ล้มเหลว
    // พยายามแสดงข้อมูล error response จาก Line API เพื่อช่วยในการ Debug
    console.error('Error sending message to LINE:', error.response ? error.response.data : error.message);
    // ส่งสถานะ 500 Internal Server Error กลับไป
    res.status(500).send('Error sending message to LINE.');
  }
});

// กำหนด Endpoint สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ (GET request)
// เมื่อเข้าถึง URL หลักของ Webhook นี้ (เช่น https://sine-project.onrender.com/)
// จะแสดงข้อความ "Webhook is running"
app.get('/', (req, res) => res.send('Webhook is running'));

// กำหนด Port ที่เซิร์ฟเวอร์จะรัน
// ใช้ process.env.PORT หากมีการกำหนดไว้ (เช่นบนแพลตฟอร์ม Render) หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;
// เริ่มต้นเซิร์ฟเวอร์และแสดงข้อความใน console
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
