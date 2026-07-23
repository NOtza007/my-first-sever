const http = require('http');
// 1. เรียกใชงาน Pool จากไลบรารี pg สําหรับจัดการการเชื่อมตอฐานขอมูล
const { Pool } = require('pg');
// 2. ตั้งคาการเชื่อมตอ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const port = process.env.PORT || 3000;
const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    // 3. ขอเชื่อมตอและสงคําสั่ง SQL ไปดึงขอมูลจากตาราง students
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM students');
    client.release(); // ปล่อยการเชื่อมต่อเมื่อใชงานเสร็จ

    // 4. สร้างหน้า HTML ที่มีพื้นหลังเป็นรูปภาพจาก URL ที่ผู้ใช้ให้มา
    const backgroundImage = 'https://play-lh.googleusercontent.com/YDFyzwf2LDXbQrzT_akkQOSvwGp_2FzXbOWrL43QvgBXfshGTbM5gRXF6Eq8CNKBN1x1J2EKqMelkEy_tyLXRw';

    let rowsHtml = '';
    result.rows.forEach(row => {
      rowsHtml += `<tr><td>${row.student_id || ''}</td><td>${row.student_name || ''}</td></tr>`;
    });

    const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ฐานข้อมูลนักศึกษา</title>
  <style>
    html,body { height:100%; margin:0; }
    body {
      background-image: url('${backgroundImage}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      color: #fff;
      -webkit-font-smoothing: antialiased;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:100vh;
    }
    .content {
      background: rgba(0,0,0,0.45);
      padding: 24px;
      border-radius: 10px;
      max-width: 900px;
      text-align: center;
      backdrop-filter: blur(4px);
    }
    table { width:100%; border-collapse: collapse; margin-top:12px; }
    th, td { padding:8px 12px; border: 1px solid rgba(255,255,255,0.2); }
    th { background: rgba(255,255,255,0.06); }
    h1 { margin: 0 0 8px 0; font-size: 1.4rem; }
  </style>
</head>
<body>
  <div class="content">
    <h1>ฐานข้อมูลนักศึกษา (ทดสอบการเชื่อมต่อ)</h1>
    <p>รายการนักศึกษาจากตาราง students</p>
    <table>
      <thead>
        <tr><th>รหัสนักศึกษา</th><th>ชื่อ - นามสกุล</th></tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    res.end(html);
  } catch (err) {
    // กรณีเชื่อมต่อไม่ไดหรือเขียนชื่อตารางผิด
    console.error(err);
    res.end(`<h1>เกิดขอผิดพลาด!</h1><p>${err.message}</p>`);
  }
});
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
