const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const port = process.env.PORT || 3000;

// Helper: แปลง Body ของ Request ให้เป็น Promise
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', err => {
      reject(err);
    });
  });
}

// Helper: Escape ตัวอักษรพิเศษป้องกัน XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ฟังก์ชันสำหรับดึงข้อมูลนักศึกษาทั้งหมด
async function getAllStudents() {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY student_id');
    return result.rows;
  } catch (err) {
    console.error('Error fetching students:', err);
    return [];
  }
}

// ฟังก์ชันสำหรับเพิ่มนักศึกษาใหม่
async function addStudent(studentName) {
  try {
    const result = await pool.query(
      'INSERT INTO students (student_name) VALUES ($1) RETURNING *',
      [studentName]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error adding student:', err);
    return null;
  }
}

// ฟังก์ชันสำหรับอัปเดตข้อมูลนักศึกษา
async function updateStudent(studentId, studentName) {
  try {
    const result = await pool.query(
      'UPDATE students SET student_name = $1 WHERE student_id = $2 RETURNING *',
      [studentName, studentId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error updating student:', err);
    return null;
  }
}

// ฟังก์ชันสำหรับลบนักศึกษา
async function deleteStudent(studentId) {
  try {
    const result = await pool.query(
      'DELETE FROM students WHERE student_id = $1 RETURNING *',
      [studentId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error deleting student:', err);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // --- API Endpoint: GET /api/students ---
    if (pathname === '/api/students' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const students = await getAllStudents();
      res.statusCode = 200;
      res.end(JSON.stringify(students));
      return;
    }

    // --- API Endpoint: POST /api/students ---
    if (pathname === '/api/students' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const body = await getRequestBody(req);
      const params = querystring.parse(body);
      const studentName = params.student_name || '';

      if (studentName.trim()) {
        const newStudent = await addStudent(studentName);
        res.statusCode = 201;
        res.end(JSON.stringify(newStudent));
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'ชื่อนักศึกษาไม่ควรว่าง' }));
      }
      return;
    }

    // --- API Endpoint: PUT /api/students ---
    if (pathname === '/api/students' && req.method === 'PUT') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const body = await getRequestBody(req);
      const params = querystring.parse(body);
      const studentId = params.student_id;
      const studentName = params.student_name || '';

      if (studentId && studentName.trim()) {
        const updated = await updateStudent(studentId, studentName);
        res.statusCode = 200;
        res.end(JSON.stringify(updated));
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'รหัสและชื่อนักศึกษาจำเป็น' }));
      }
      return;
    }

    // --- API Endpoint: DELETE /api/students ---
    if (pathname === '/api/students' && req.method === 'DELETE') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const studentId = query.id;

      if (studentId) {
        const deleted = await deleteStudent(studentId);
        res.statusCode = 200;
        res.end(JSON.stringify(deleted));
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'ต้องการ ID ของนักศึกษา' }));
      }
      return;
    }

    // --- หน้าหลัก UI (HTML) ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;

    const students = await getAllStudents();
    const backgroundImage = 'https://play-lh.googleusercontent.com/YDFyzwf2LDXbQrzT_akkQOSvwGp_2FzXbOWrL43QvgBXfshGTbM5gRXF6Eq8CNKBN1x1J2EKqMelkEy_tyLXRw';

    let rowsHtml = '';
    students.forEach(row => {
      const safeName = escapeHtml(row.student_name);
      rowsHtml += `
        <tr>
          <td>${row.student_id || ''}</td>
          <td>${safeName}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit" onclick="editStudent(${row.student_id}, '${safeName.replace(/'/g, "\\'")}')">แก้ไข</button>
              <button class="btn-delete" onclick="deleteStudentRow(${row.student_id})">ลบ</button>
            </div>
          </td>
        </tr>
      `;
    });

    const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ฐานข้อมูลนักศึกษา</title>
  <style>
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body {
      background-image: url('${backgroundImage}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-attachment: fixed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      color: #fff;
      -webkit-font-smoothing: antialiased;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: rgba(0,0,0,0.45);
      padding: 32px;
      border-radius: 10px;
      max-width: 1000px;
      width: 100%;
      backdrop-filter: blur(4px);
    }
    h1 { margin: 0 0 12px 0; font-size: 1.6rem; text-align: center; }
    .subtitle { text-align: center; margin-bottom: 24px; opacity: 0.9; }
    .form-section {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .form-group {
      margin-bottom: 12px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .form-group label {
      font-weight: 500;
      min-width: 120px;
      display: flex;
      align-items: center;
    }
    input[type="text"] {
      flex: 1;
      min-width: 200px;
      padding: 10px 12px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      background: rgba(255,255,255,0.1);
      color: #fff;
      font-size: 14px;
    }
    input[type="text"]::placeholder { color: rgba(255,255,255,0.6); }
    input[type="text"]:focus {
      outline: none;
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.5);
    }
    .button-group { display: flex; gap: 12px; flex-wrap: wrap; }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-add { background: #4CAF50; color: white; }
    .btn-add:hover { background: #45a049; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); }
    .btn-update { background: #2196F3; color: white; }
    .btn-update:hover { background: #0b7dda; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4); }
    .btn-cancel { background: #757575; color: white; }
    .btn-cancel:hover { background: #616161; }
    .btn-edit { background: #FF9800; color: white; padding: 6px 12px; font-size: 12px; }
    .btn-edit:hover { background: #e68900; }
    .btn-delete { background: #f44336; color: white; padding: 6px 12px; font-size: 12px; }
    .btn-delete:hover { background: #da190b; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: left; }
    th { background: rgba(255,255,255,0.1); font-weight: 600; }
    tr:hover { background: rgba(255,255,255,0.08); }
    .table-actions { display: flex; gap: 8px; }
    .no-data { text-align: center; padding: 30px; opacity: 0.8; }
    .message { padding: 12px; border-radius: 6px; margin-bottom: 12px; display: none; }
    .message.show { display: block; }
    .message.success { background: rgba(76, 175, 80, 0.3); border: 1px solid rgba(76, 175, 80, 0.5); color: #c8e6c9; }
    .message.error { background: rgba(244, 67, 54, 0.3); border: 1px solid rgba(244, 67, 54, 0.5); color: #ffcdd2; }
    #editingId { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 ฐานข้อมูลนักศึกษา</h1>
    <p class="subtitle">จัดการข้อมูลนักศึกษา (เพิ่ม แก้ไข ลบ)</p>
    
    <div class="message" id="message"></div>
    
    <div class="form-section">
      <div class="form-group">
        <label for="studentName">ชื่อ - นามสกุล:</label>
        <input type="text" id="studentName" placeholder="ป้อนชื่อ - นามสกุลนักศึกษา">
      </div>
      <div class="button-group">
        <button class="btn-add" id="addBtn" onclick="addNewStudent()">➕ เพิ่มรายชื่อ</button>
        <button class="btn-update" id="updateBtn" onclick="updateStudentData()" style="display: none;">✏️ บันทึกการแก้ไข</button>
        <button class="btn-cancel" id="cancelBtn" onclick="cancelEdit()" style="display: none;">❌ ยกเลิก</button>
      </div>
    </div>
    
    <input type="hidden" id="editingId">
    
    <div class="table-section">
      <h3 style="margin-top: 0;">รายการนักศึกษา</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">รหัสนักศึกษา</th>
            <th style="width: 55%;">ชื่อ - นามสกุล</th>
            <th style="width: 30%;">การจัดการ</th>
          </tr>
        </thead>
        <tbody id="studentsList">
          ${students.length > 0 ? rowsHtml : '<tr><td colspan="3" class="no-data">ไม่มีข้อมูลนักศึกษา</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const studentNameInput = document.getElementById('studentName');
    const addBtn = document.getElementById('addBtn');
    const updateBtn = document.getElementById('updateBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const studentsList = document.getElementById('studentsList');
    const messageDiv = document.getElementById('message');
    const editingIdInput = document.getElementById('editingId');

    function showMessage(text, type = 'success') {
      messageDiv.textContent = text;
      messageDiv.className = 'message show ' + type;
      setTimeout(() => {
        messageDiv.classList.remove('show');
      }, 3000);
    }

    async function addNewStudent() {
      const name = studentNameInput.value.trim();
      if (!name) {
        showMessage('⚠️ กรุณาป้อนชื่อนักศึกษา', 'error');
        return;
      }

      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'student_name=' + encodeURIComponent(name)
        });

        if (response.ok) {
          showMessage('✅ เพิ่มนักศึกษาสำเร็จ', 'success');
          studentNameInput.value = '';
          refreshStudents();
        } else {
          showMessage('❌ เกิดข้อผิดพลาด', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showMessage('❌ เกิดข้อผิดพลาด: ' + err.message, 'error');
      }
    }

    function editStudent(id, name) {
      studentNameInput.value = name;
      editingIdInput.value = id;
      addBtn.style.display = 'none';
      updateBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      studentNameInput.focus();
    }

    async function updateStudentData() {
      const id = editingIdInput.value;
      const name = studentNameInput.value.trim();
      if (!name) {
        showMessage('⚠️ กรุณาป้อนชื่อนักศึกษา', 'error');
        return;
      }

      try {
        const response = await fetch('/api/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'student_id=' + id + '&student_name=' + encodeURIComponent(name)
        });

        if (response.ok) {
          showMessage('✅ อัปเดตข้อมูลสำเร็จ', 'success');
          cancelEdit();
          refreshStudents();
        } else {
          showMessage('❌ เกิดข้อผิดพลาด', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showMessage('❌ เกิดข้อผิดพลาด: ' + err.message, 'error');
      }
    }

    function cancelEdit() {
      studentNameInput.value = '';
      editingIdInput.value = '';
      addBtn.style.display = 'inline-block';
      updateBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
    }

    async function deleteStudentRow(id) {
      if (!confirm('คุณแน่ใจหรือว่าต้องการลบนักศึกษารายนี้?')) return;

      try {
        const response = await fetch('/api/students?id=' + id, { method: 'DELETE' });

        if (response.ok) {
          showMessage('✅ ลบนักศึกษาสำเร็จ', 'success');
          refreshStudents();
        } else {
          showMessage('❌ เกิดข้อผิดพลาด', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showMessage('❌ เกิดข้อผิดพลาด: ' + err.message, 'error');
      }
    }

    async function refreshStudents() {
      try {
        const response = await fetch('/api/students');
        const students = await response.json();
        
        if (!students || students.length === 0) {
          studentsList.innerHTML = '<tr><td colspan="3" class="no-data">ไม่มีข้อมูลนักศึกษา</td></tr>';
          return;
        }

        let html = '';
        students.forEach(row => {
          const safeName = (row.student_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += `
            <tr>
              <td>${row.student_id || ''}</td>
              <td>${safeName}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-edit" onclick="editStudent(${row.student_id}, '${safeName.replace(/'/g, "\\'")}')">แก้ไข</button>
                  <button class="btn-delete" onclick="deleteStudentRow(${row.student_id})">ลบ</button>
                </div>
              </td>
            </tr>
          `;
        });
        studentsList.innerHTML = html;
      } catch (err) {
        console.error('Error refreshing students:', err);
      }
    }

    window.addEventListener('load', () => {
      showMessage('👋 ยินดีต้อนรับ! ระบบพร้อมใช้งาน', 'success');
    });
  </script>
</body>
</html>`;

    res.end(html);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('<h1>❌ เกิดข้อผิดพลาด!</h1><p>' + err.message + '</p>');
  }
});

// เริ่มต้นเปิด Server ให้ทำงานบนพอร์ตที่ตั้งไว้
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});  console.log('🚀 Server is running on port: ' + port);
});
