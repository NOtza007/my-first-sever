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
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .main-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            animation: slideDown 0.6s ease-out;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            letter-spacing: 1px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content-wrapper {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            animation: fadeIn 0.8s ease-out;
        }

        @media (max-width: 992px) {
            .content-wrapper {
                grid-template-columns: 1fr;
            }
        }

        .form-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: fit-content;
            position: sticky;
            top: 20px;
        }

        .form-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
        }

        .form-card h2 {
            color: #667eea;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            font-size: 1.5em;
        }

        .form-card h2 i {
            margin-right: 10px;
            font-size: 1.3em;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
            font-size: 0.95em;
        }

        input[type="text"],
        input[type="hidden"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
            font-family: inherit;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: scale(1.01);
        }

        input[type="text"]:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
            color: #999;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 25px;
        }

        button {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-submit {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        .btn-submit:active {
            transform: translateY(0);
        }

        .btn-reset {
            background-color: #f0f0f0;
            color: #333;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }

        .btn-reset:hover {
            background-color: #e0e0e0;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        }

        .table-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
        }

        .table-card h2 {
            color: #667eea;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            font-size: 1.5em;
        }

        .table-card h2 i {
            margin-right: 10px;
            font-size: 1.3em;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }

        tbody tr {
            transition: all 0.3s ease;
        }

        tbody tr:hover {
            background-color: #f8f9ff;
            transform: scale(1.01);
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }

        .empty-state i {
            font-size: 3em;
            margin-bottom: 15px;
            opacity: 0.5;
        }

        .empty-state p {
            font-size: 1.1em;
        }

        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }

        .btn-action {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 5px;
            text-decoration: none;
            color: white;
            border: none;
        }

        .btn-edit {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 3px 10px rgba(245, 87, 108, 0.3);
        }

        .btn-edit:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
        }

        .btn-delete {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            box-shadow: 0 3px 10px rgba(250, 112, 154, 0.3);
        }

        .btn-delete:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(250, 112, 154, 0.4);
        }

        .message {
            padding: 16px 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            display: none;
            animation: slideInTop 0.4s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .message i {
            font-size: 1.3em;
        }

        .message.success {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            color: #2d5016;
            border-left: 4px solid #4caf50;
        }

        .message.error {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: #6d1f1f;
            border-left: 4px solid #f44336;
        }

        .close-message {
            margin-left: auto;
            cursor: pointer;
            font-size: 1.5em;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }

        .close-message:hover {
            opacity: 1;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes slideInTop {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .student-id {
            font-weight: 600;
            color: #667eea;
        }

        .student-name {
            color: #333;
        }

        /* Loading animation */
        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }

            .header p {
                font-size: 0.95em;
            }

            .form-card, .table-card {
                padding: 20px;
            }

            th, td {
                padding: 10px;
                font-size: 0.9em;
            }

            .btn-action {
                padding: 6px 10px;
                font-size: 11px;
            }

            .button-group {
                flex-direction: column;
            }

            button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h1><i class="fas fa-graduation-cap"></i> ระบบจัดการข้อมูลนักศึกษา</h1>
            <p>Student Information Management System</p>
        </div>

        <div class="content-wrapper">
            <!-- Form Section -->
            <div class="form-card">
                <h2><i class="fas fa-user-plus"></i> เพิ่ม/แก้ไขข้อมูล</h2>
                
                <div id="message" class="message" style="display: none;"></div>

                <form id="studentForm" method="POST" action="/add-student">
                    <input type="hidden" id="student_id" name="student_id" value="">
                    
                    <div class="form-group">
                        <label for="id_input">
                            <i class="fas fa-id-card"></i> รหัสนักศึกษา:
                        </label>
                        <input type="text" id="id_input" name="id_input" placeholder="เช่น 001" required>
                    </div>

                    <div class="form-group">
                        <label for="name_input">
                            <i class="fas fa-user"></i> ชื่อ-นามสกุล:
                        </label>
                        <input type="text" id="name_input" name="name_input" placeholder="เช่น นาย สมชาย ใจดี" required>
                    </div>

                    <div class="button-group">
                        <button type="submit" class="btn-submit">
                            <i class="fas fa-save"></i> บันทึกข้อมูล
                        </button>
                        <button type="reset" class="btn-reset">
                            <i class="fas fa-redo"></i> ล้างข้อมูล
                        </button>
                    </div>
                </form>
            </div>

            <!-- Table Section -->
            <div class="table-card">
                <h2><i class="fas fa-list"></i> รายชื่อนักศึกษาทั้งหมด</h2>
                
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th><i class="fas fa-sort-numeric-up-alt"></i> รหัสนักศึกษา</th>
                                <th><i class="fas fa-user-tie"></i> ชื่อ-นามสกุล</th>
                                <th><i class="fas fa-tools"></i> การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
`;

    if (result.rows.length === 0) {
      html += `
                            <tr>
                                <td colspan="3">
                                    <div class="empty-state">
                                        <i class="fas fa-inbox"></i>
                                        <p>ไม่มีข้อมูลนักศึกษา</p>
                                    </div>
                                </td>
                            </tr>
`;
    } else {
      result.rows.forEach(row => {
        html += `
                            <tr>
                                <td class="student-id">${row.student_id}</td>
                                <td class="student-name">${row.student_name}</td>
                                <td class="actions">
                                    <button type="button" class="btn-action btn-edit" onclick="editStudent('${row.student_id}', '${row.student_name.replace(/'/g, "\\'")}')">
                                        <i class="fas fa-edit"></i> แก้ไข
                                    </button>
                                    <button type="button" class="btn-action btn-delete" onclick="deleteStudent('${row.student_id}')">
                                        <i class="fas fa-trash"></i> ลบ
                                    </button>
                                </td>
                            </tr>
`;
      });
    }

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        function editStudent(id, name) {
            document.getElementById('student_id').value = id;
            document.getElementById('id_input').value = id;
            document.getElementById('name_input').value = name;
            document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-sync"></i> อัปเดตข้อมูล';
            document.getElementById('id_input').disabled = true;
            document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
            document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล';
        });

        // แสดงข้อความจากการ redirect
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        if (message) {
            const messageDiv = document.getElementById('message');
            const isSuccess = urlParams.get('type') === 'success';
            const icon = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            messageDiv.innerHTML = '<i class="' + icon + '"></i><span>' + decodeURIComponent(message) + '</span><i class="fas fa-times close-message" onclick="this.parentElement.style.display=\\'none\\'"></i>';
            messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
            messageDiv.style.display = 'flex';
            
            // ลบ query string หลังจากแสดงข้อความ
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);

            // ซ่อนข้อความหลังจาก 5 วินาที
            setTimeout(() => {
                messageDiv.style.animation = 'slideInTop 0.4s ease-out reverse';
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 400);
            }, 5000);
        }
    </script>
</body>
</html>
    `;
    return html;
  } catch (err) {
    console.error(err);
    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Error</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .error-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
        }
        .error-container h1 {
            color: #f44336;
            margin-bottom: 15px;
        }
        .error-container p {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>❌ เกิดข้อผิดพลาด!</h1>
        <p>${err.message}</p>
    </div>
</body>
</html>
    `;
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
