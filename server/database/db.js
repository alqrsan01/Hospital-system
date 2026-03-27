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
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clinics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      department_id INT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
