import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export async function initDb() {
  // Create database if not exists (connect without DB first)
  const tempConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'hospital_db'}\``);
  await tempConn.end();

  const db = await getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      type ENUM('emergency','clinic','pharmacy') NOT NULL,
      code VARCHAR(10) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add code column to departments if it doesn't exist (migration)
  await db.execute(`
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS code VARCHAR(10) NOT NULL DEFAULT ''
  `).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clinics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      code VARCHAR(10) NOT NULL DEFAULT '',
      department_id INT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `);

  // Add code column to clinics if it doesn't exist (migration)
  await db.execute(`
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS code VARCHAR(10) NOT NULL DEFAULT ''
  `).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      age INT,
      gender ENUM('male','female') NOT NULL DEFAULT 'male',
      phone VARCHAR(20),
      id_number VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS queue_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_number VARCHAR(20) NOT NULL,
      patient_id INT NOT NULL,
      clinic_id INT,
      department_id INT,
      priority TINYINT NOT NULL DEFAULT 5,
      status ENUM('waiting','called','in_progress','done','no_show','transferred') NOT NULL DEFAULT 'waiting',
      notes TEXT,
      called_at TIMESTAMP NULL,
      done_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','manager','doctor','screen') NOT NULL,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      clinic_id INT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id)
    )
  `);

  await seedDefaults(db);
  console.log('✅ Database initialized successfully');
}

async function seedDefaults(db) {
  const [rows] = await db.execute('SELECT COUNT(*) as c FROM users');
  if (rows[0].c > 0) return;

  const adminHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);

  await db.execute(
    `INSERT INTO users (username, password_hash, role, name_en, name_ar)
     VALUES (?, ?, 'admin', 'System Admin', 'مدير النظام')`,
    ['admin', adminHash]
  );

  await db.execute(
    `INSERT INTO users (username, password_hash, role, name_en, name_ar)
     VALUES (?, ?, 'manager', 'Hospital Manager', 'مدير المستشفى')`,
    ['manager', managerHash]
  );

  console.log('✅ Default users seeded:');
  console.log('   admin / admin123');
  console.log('   manager / manager123');
}
