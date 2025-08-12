const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: 'root',
  password: '1234',
  database: 'crm_system',
  timezone: '+00:00',
  charset: 'utf8mb4',
};

// Create connection pool for better performance
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Execute query with error handling
async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute single query (for inserts, updates, deletes)
async function executeSingle(query, params = []) {
  try {
    console.log('Executing query:', query);
    console.log('With params:', params);
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query was:', query);
    console.error('Params were:', params);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Database operation failed: ${errorMessage}`);
  }
}

async function setupFeedbackSystem() {
  console.log('🚀 Setting up feedback system...');
  
  try {
    // 1. Check if admin user exists
    const adminEmail = 'Robintejarat@gmail.com';
    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (users.length === 0) {
      console.log('👤 Creating admin user...');
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await executeSingle(`
        INSERT INTO users (
          id, name, email, password_hash, role, status, created_at
        ) VALUES (?, ?, ?, ?, 'admin', 'active', NOW())
      `, [userId, 'Admin', adminEmail, hashedPassword]);
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // 2. Set up feedback database tables
    console.log('🗄️ Setting up feedback database tables...');
    
    // Check if tables already exist
    const tablesExist = await executeQuery(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'feedback_forms'
    `);
    
    if (tablesExist[0].count > 0) {
      console.log('📊 Feedback tables already exist, checking for forms...');
      
      // Check if forms exist
      const formsExist = await executeQuery('SELECT COUNT(*) as count FROM feedback_forms');
      
      if (formsExist[0].count === 0) {
        console.log('📝 Creating feedback forms...');
        await createFeedbackForms();
      } else {
        console.log('✅ Feedback forms already exist');
      }
    } else {
      console.log('📊 Creating feedback tables and forms...');
      
      // Read the SQL file
      const sqlFilePath = path.join(process.cwd(), 'app/api/database/setup-extended/feedback-system.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split the SQL content into individual statements
      const statements = sqlContent
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0 && !statement.startsWith('--'));
      
      // Execute each statement
      for (const statement of statements) {
        try {
          await executeSingle(statement);
          console.log('✅ Executed SQL statement successfully');
        } catch (error) {
          console.error('❌ Error executing SQL statement:', error.message);
        }
      }
    }
    
    console.log('✅ Feedback system setup completed successfully');
    
  } catch (error) {
    console.error('❌ Error setting up feedback system:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

async function createFeedbackForms() {
  try {
    // Create sales feedback form
    const salesFormId = uuidv4();
    await executeSingle(`
      INSERT INTO feedback_forms (
        id, type, title, description, template, status, created_at, updated_at
      ) VALUES (
        ?, 'sales', 'فرم بازخورد تیم فروش', 
        'لطفا نظر خود را درباره عملکرد تیم فروش به ما اعلام کنید', 
        '<div class="feedback-form" dir="rtl">
          <h2 class="text-2xl font-bold mb-4">فرم بازخورد تیم فروش</h2>
          <p class="mb-6">مشتری گرامی، نظر شما درباره عملکرد تیم فروش ما برای ما بسیار ارزشمند است. لطفا با تکمیل این فرم، ما را در بهبود خدمات یاری کنید.</p>
          <form id="salesFeedbackForm">
            <!-- Questions will be inserted here dynamically -->
            <div class="form-actions mt-8">
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">ارسال بازخورد</button>
            </div>
          </form>
        </div>', 
        'active', NOW(), NOW()
      )
    `, [salesFormId]);
    
    // Create product feedback form
    const productFormId = uuidv4();
    await executeSingle(`
      INSERT INTO feedback_forms (
        id, type, title, description, template, status, created_at, updated_at
      ) VALUES (
        ?, 'product', 'فرم بازخورد محصول', 
        'لطفا نظر خود را درباره کیفیت و عملکرد محصول به ما اعلام کنید', 
        '<div class="feedback-form" dir="rtl">
          <h2 class="text-2xl font-bold mb-4">فرم بازخورد محصول</h2>
          <p class="mb-6">مشتری گرامی، نظر شما درباره محصول ما برای ما بسیار ارزشمند است. لطفا با تکمیل این فرم، ما را در بهبود محصولات یاری کنید.</p>
          <form id="productFeedbackForm">
            <!-- Questions will be inserted here dynamically -->
            <div class="form-actions mt-8">
              <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">ارسال بازخورد</button>
            </div>
          </form>
        </div>', 
        'active', NOW(), NOW()
      )
    `, [productFormId]);
    
    // Create questions for sales feedback form
    const salesQuestions = [
      { question: 'میزان رضایت کلی شما از عملکرد تیم فروش ما چقدر است؟', type: 'rating', options: '{"min": 1, "max": 5}', required: true, order: 1 },
      { question: 'کارشناس فروش تا چه حد به نیازهای شما توجه کرد؟', type: 'rating', options: '{"min": 1, "max": 5}', required: true, order: 2 },
      { question: 'آیا کارشناس فروش اطلاعات کافی درباره محصولات داشت؟', type: 'choice', options: '{"options": ["بله، کاملاً", "تا حدودی", "خیر، اطلاعات کافی نداشت"]}', required: true, order: 3 },
      { question: 'سرعت پاسخگویی تیم فروش به درخواست‌های شما چگونه بود؟', type: 'choice', options: '{"options": ["بسیار سریع", "مناسب", "کند", "بسیار کند"]}', required: true, order: 4 },
      { question: 'آیا فرآیند خرید ساده و روان بود؟', type: 'choice', options: '{"options": ["بله، کاملاً", "تا حدودی", "خیر، پیچیده بود"]}', required: true, order: 5 },
      { question: 'نقاط قوت تیم فروش ما چه بود؟', type: 'textarea', options: null, required: false, order: 6 },
      { question: 'چه پیشنهاداتی برای بهبود عملکرد تیم فروش دارید؟', type: 'textarea', options: null, required: false, order: 7 },
      { question: 'آیا مایل به خرید مجدد از ما هستید؟', type: 'choice', options: '{"options": ["بله، حتماً", "احتمالاً", "خیر"]}', required: true, order: 8 }
    ];
    
    for (const q of salesQuestions) {
      await executeSingle(`
        INSERT INTO feedback_form_questions (
          id, form_id, question, type, options, required, question_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), salesFormId, q.question, q.type, q.options, q.required ? 1 : 0, q.order]);
    }
    
    // Create questions for product feedback form
    const productQuestions = [
      { question: 'میزان رضایت کلی شما از محصول چقدر است؟', type: 'rating', options: '{"min": 1, "max": 5}', required: true, order: 1 },
      { question: 'کیفیت محصول را چگونه ارزیابی می‌کنید؟', type: 'rating', options: '{"min": 1, "max": 5}', required: true, order: 2 },
      { question: 'آیا محصول با توضیحات ارائه شده مطابقت داشت؟', type: 'choice', options: '{"options": ["بله، کاملاً", "تا حدودی", "خیر، متفاوت بود"]}', required: true, order: 3 },
      { question: 'نسبت کیفیت به قیمت محصول را چگونه ارزیابی می‌کنید؟', type: 'choice', options: '{"options": ["عالی", "خوب", "متوسط", "ضعیف"]}', required: true, order: 4 },
      { question: 'کدام ویژگی محصول برای شما مفیدتر بود؟', type: 'textarea', options: null, required: false, order: 5 },
      { question: 'کدام ویژگی محصول نیاز به بهبود دارد؟', type: 'textarea', options: null, required: false, order: 6 },
      { question: 'آیا استفاده از محصول آسان بود؟', type: 'choice', options: '{"options": ["بله، بسیار آسان", "نسبتاً آسان", "کمی دشوار", "بسیار دشوار"]}', required: true, order: 7 },
      { question: 'آیا این محصول را به دیگران پیشنهاد می‌دهید؟', type: 'choice', options: '{"options": ["بله، حتماً", "احتمالاً", "خیر"]}', required: true, order: 8 },
      { question: 'هرگونه نظر یا پیشنهاد دیگری دارید؟', type: 'textarea', options: null, required: false, order: 9 }
    ];
    
    for (const q of productQuestions) {
      await executeSingle(`
        INSERT INTO feedback_form_questions (
          id, form_id, question, type, options, required, question_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), productFormId, q.question, q.type, q.options, q.required ? 1 : 0, q.order]);
    }
    
    console.log('✅ Feedback forms and questions created successfully');
  } catch (error) {
    console.error('❌ Error creating feedback forms:', error);
  }
}

// Run the setup function
setupFeedbackSystem();