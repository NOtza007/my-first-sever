const http = require('http');
const url = require('url');
const querystring = require('querystring');
// 1. เรียกใชงาน Pool จากไลบรารี pg สําหรับจัดการการเชื่อมตอฐานขอมูล
const { Pool } = require('pg');
// 2. ตั้งคาการเชื่อมตอ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const port = process.env.PORT || 3000;

// ฟังก์ชันสำหรับสร้าง HTML หน้าจอหลัก
async function getMainPage() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM students ORDER BY student_id');
    client.release();

    let html = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ระบบจัดการข้อมูลนักศึกษา</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .form-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        input[type="text"],
        input[type="hidden"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        button {
            padding: 10px 20px;
            margin-right: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        .btn-submit {
            background-color: #28a745;
            color: white;
        }
        .btn-submit:hover {
            background-color: #218838;
        }
        .btn-reset {
            background-color: #6c757d;
            color: white;
        }
        .btn-reset:hover {
            background-color: #5a6268;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #007bff;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .actions {
            text-align: center;
        }
        .btn-edit {
            background-color: #ffc107;
            color: black;
            padding: 6px 12px;
            font-size: 12px;
        }
        .btn-edit:hover {
            background-color: #e0a800;
        }
        .btn-delete {
            background-color: #dc3545;
            color: white;
            padding: 6px 12px;
            font-size: 12px;
        }
        .btn-delete:hover {
            background-color: #c82333;
        }
        .message {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            display: none;
        }
        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 ระบบจัดการข้อมูลนักศึกษา</h1>
        
        <div id="message" class="message"></div>

        <div class="form-section">
            <h2>➕ เพิ่ม / แก้ไขรายชื่อนักศึกษา</h2>
            <form id="studentForm" method="POST" action="/add-student">
                <input type="hidden" id="student_id" name="student_id" value="">
                <div class="form-row">
                    <div class="form-group">
                        <label for="id_input">รหัสนักศึกษา:</label>
                        <input type="text" id="id_input" name="id_input" placeholder="เช่น 001" required>
                    </div>
                    <div class="form-group">
                        <label for="name_input">ชื่อ-นามสกุล:</label>
                        <input type="text" id="name_input" name="name_input" placeholder="เช่น นาย สมชาย ใจดี" required>
                    </div>
                </div>
                <button type="submit" class="btn-submit">💾 บันทึกข้อมูล</button>
                <button type="reset" class="btn-reset">🔄 ล้างข้อมูล</button>
            </form>
        </div>

        <h2>📋 รายชื่อนักศึกษาทั้งหมด</h2>
        <table>
            <tr>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ-นามสกุล</th>
                <th>การจัดการ</th>
            </tr>
`;

    if (result.rows.length === 0) {
      html += `<tr><td colspan="3" style="text-align: center; color: #999;">ไม่มีข้อมูลนักศึกษา</td></tr>`;
    } else {
      result.rows.forEach(row => {
        html += `
            <tr>
                <td>${row.student_id}</td>
                <td>${row.student_name}</td>
                <td class="actions">
                    <button type="button" class="btn-edit" onclick="editStudent('${row.student_id}', '${row.student_name.replace(/'/g, "\\'")}')">✏️ แก้ไข</button>
                    <button type="button" class="btn-delete" onclick="deleteStudent('${row.student_id}')">🗑️ ลบ</button>
                </td>
            </tr>
        `;
      });
    }

    html += `
        </table>
    </div>

    <script>
        function editStudent(id, name) {
            document.getElementById('student_id').value = id;
            document.getElementById('id_input').value = id;
            document.getElementById('name_input').value = name;
            document.querySelector('.btn-submit').textContent = '✏️ อัปเดตข้อมูล';
            document.getElementById('id_input').disabled = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function deleteStudent(id) {
            if (confirm('คุณแน่ใจว่าต้องการลบรายชื่อ ' + id + ' หรือไม่?')) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/delete-student';
                form.innerHTML = '<input type="hidden" name="student_id" value="' + id + '">';
                document.body.appendChild(form);
                form.submit();
            }
        }

        document.getElementById('studentForm').addEventListener('reset', function() {
            document.getElementById('student_id').value = '';
            document.getElementById('id_input').disabled = false;
            document.querySelector('.btn-submit').textContent = '💾 บันทึกข้อมูล';
        });

        // แสดงข้อความจากการ redirect
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        if (message) {
            const messageDiv = document.getElementById('message');
            const isSuccess = urlParams.get('type') === 'success';
            messageDiv.textContent = decodeURIComponent(message);
            messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
            
            // ลบ query string หลังจากแสดงข้อความ
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
        }
    </script>
</body>
</html>
    `;
    return html;
  } catch (err) {
    console.error(err);
    return `<h1>❌ เกิดข้อผิดพลาด!</h1><p>${err.message}</p>`;
  }
}

// ฟังก์ชันสำหรับเพิ่มหรืออัปเดตข้อมูลนักศึกษา
async function addOrUpdateStudent(student_id, id_input, name_input, isUpdate = false) {
  try {
    const client = await pool.connect();
    
    if (isUpdate) {
      // อัปเดตข้อมูล
      await client.query(
        'UPDATE students SET student_name = $1 WHERE student_id = $2',
        [name_input, student_id]
      );
    } else {
      // เพิ่มข้อมูลใหม่
      await client.query(
        'INSERT INTO students (student_id, student_name) VALUES ($1, $2)',
        [id_input, name_input]
      );
    }
    
    client.release();
    return { success: true, message: isUpdate ? 'อัปเดตข้อมูลสำเร็จ!' : 'เพิ่มรายชื่อสำเร็จ!' };
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return { success: false, message: 'รหัสนักศึกษานี้มีอยู่แล้ว!' };
    }
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
  }
}

// ฟังก์ชันสำหรับลบข้อมูลนักศึกษา
async function deleteStudent(student_id) {
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM students WHERE student_id = $1', [student_id]);
    client.release();
    return { success: true, message: 'ลบรายชื่อสำเร็จ!' };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
  }
}

// ฟังก์ชันสำหรับอ่าน POST data
function readPostData(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(querystring.parse(body));
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    if (pathname === '/' && req.method === 'GET') {
      // หน้าหลัก
      const html = await getMainPage();
      res.statusCode = 200;
      res.end(html);

    } else if (pathname === '/add-student' && req.method === 'POST') {
      // เพิ่มหรืออัปเดตนักศึกษา
      const postData = await readPostData(req);
      const student_id = postData.student_id;
      const id_input = postData.id_input;
      const name_input = postData.name_input;
      const isUpdate = student_id !== '';

      const result = await addOrUpdateStudent(id_input, id_input, name_input, isUpdate);

      res.statusCode = 302;
      res.setHeader('Location', `/?type=${result.success ? 'success' : 'error'}&message=${encodeURIComponent(result.message)}`);
      res.end();

    } else if (pathname === '/delete-student' && req.method === 'POST') {
      // ลบนักศึกษา
      const postData = await readPostData(req);
      const student_id = postData.student_id;

      const result = await deleteStudent(student_id);

      res.statusCode = 302;
      res.setHeader('Location', `/?type=${result.success ? 'success' : 'error'}&message=${encodeURIComponent(result.message)}`);
      res.end();

    } else {
      res.statusCode = 404;
      res.end('<h1>❌ ไม่พบหน้านี้</h1>');
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(`<h1>❌ เกิดข้อผิดพลาด!</h1><p>${err.message}</p>`);
  }
});

server.listen(port, () => {
  console.log(`✅ Server is running on port: ${port}`);
});