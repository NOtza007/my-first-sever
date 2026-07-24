# ระบบจัดการข้อมูลนักศึกษา

ระบบจัดการข้อมูลนักศึกษาที่สร้างด้วย Node.js และ PostgreSQL โดยสามารถ **เพิ่ม แก้ไข ลบ** ข้อมูลได้

## 🎯 ฟีเจอร์
- ✅ **แสดงรายชื่อ** นักศึกษาทั้งหมด
- ➕ **เพิ่มรายชื่อ** นักศึกษาใหม่
- ✏️ **แก้ไขข้อมูล** นักศึกษาที่มีอยู่
- 🗑️ **ลบรายชื่อ** นักศึกษา
- 🎨 **UI สวยงาม** แบบ Responsive

## 📋 ความต้องการ
- Node.js v12 ขึ้นไป
- PostgreSQL Database
- Railway (สำหรับ Deployment)

## 🚀 วิธีติดตั้ง

### 1. Clone Repository
```bash
git clone <repository-url>
cd my-first-server
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` หรือตั้งค่าใน Railway:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
PORT=3000
```

### 4. สร้างตาราง Database
```bash
npm run init-db
```

### 5. รัน Server
```bash
npm start
```

เปิดเบราว์เซอร์และไปที่ `http://localhost:3000`

## 📝 วิธีใช้งาน

### เพิ่มรายชื่อนักศึกษา
1. กรอก "รหัสนักศึกษา" (เช่น 001)
2. กรอก "ชื่อ-นามสกุล"
3. คลิก "💾 บันทึกข้อมูล"

### แก้ไขข้อมูล
1. คลิกปุ่ม "✏️ แก้ไข" ข้างตัวนักศึกษาที่ต้องการแก้ไข
2. ข้อมูลจะโหลดมาในฟอร์ม
3. แก้ไขชื่อตามต้องการ
4. คลิก "✏️ อัปเดตข้อมูล"

### ลบรายชื่อ
1. คลิกปุ่ม "🗑️ ลบ" ข้างตัวนักศึกษาที่ต้องการลบ
2. ยืนยันการลบ

## 🗄️ โครงสร้าง Database

### ตาราง: `students`
| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
|--------|----------|----------|
| student_id | VARCHAR(50) | รหัสนักศึกษา (Primary Key) |
| student_name | VARCHAR(255) | ชื่อ-นามสกุล |
| created_at | TIMESTAMP | วันที่สร้าง (ค่าเริ่มต้น: เวลาปัจจุบัน) |

## 📂 โครงสร้างไฟล์
```
my-first-server/
├── server.js          # Main server file
├── init-db.js         # Database initialization
├── package.json       # Dependencies
└── README.md          # Documentation
```

## 🔧 API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/` | แสดงหน้าหลัก |
| POST | `/add-student` | เพิ่ม/แก้ไข นักศึกษา |
| POST | `/delete-student` | ลบนักศึกษา |

## 🐛 Troubleshooting

### เกิดข้อผิดพลาด: "Cannot find module 'pg'"
```bash
npm install pg
```

### ไม่สามารถเชื่อมต่อ Database
- ตรวจสอบ `DATABASE_URL` ว่าถูกต้อง
- ตรวจสอบว่า Database Server ทำงานอยู่

### ตาราง `students` ไม่มีอยู่
```bash
npm run init-db
```

## 📞 ติดต่อ
สำหรับข้อมูลเพิ่มเติมหรือปัญหาใด ๆ ให้ติดต่อผู้พัฒนา

## 📄 License
MIT License