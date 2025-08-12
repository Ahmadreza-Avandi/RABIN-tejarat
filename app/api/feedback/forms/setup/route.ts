import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// POST /api/feedback/forms/setup - Create default feedback forms
export async function POST(req: NextRequest) {
  try {
    // Check if forms already exist
    const formsExist = await executeQuery('SELECT COUNT(*) as count FROM feedback_forms');
    
    if (formsExist[0].count > 0) {
      return NextResponse.json({
        success: true,
        message: 'فرم‌های بازخورد قبلاً ایجاد شده‌اند',
        data: { formsCount: formsExist[0].count }
      });
    }
    
    // Create sales feedback form
    const salesFormId = uuidvo4();
    await executeSingle(`
      INSERT INTO feedback_forms (
        id, type, title, description, template, status, created_at, updated_at
      ) VALUES (
        ?, 'sales', 'فرم بازخورد تیم فروش', 
        'لطفا نظر خود را درباره عملکرد تیم فروش به ما اعلام کنید', 
        '<div class="feedback-form" dir="rtl">
          <h2 class="text-2xl font-bold mb-4">فرم بازخورد تیم فروش</h2>
          <p class="mb-6">مشتری گرامی، نظر شما درباره عملکرد تیم فروش ما برای ما بسیار ارزشمند است. لطفا با تکمیل این فرم، ما را در بهبود خدمات یاری کنید.</p>
          <form id="salesFeedbackFrm">
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
    
    return NextResponse.json({
      success: true,
      message: 'فرم‌های بازخورد با موفقیت ایجاد شدند',
      data: {
        salesFormId,
        productFormId,
        salesQuestionsCount: salesQuestions.length,
        productQuestionsCount: productQuestions.length
      }
    });
  } catch (error) {
    console.error('Setup feedback forms API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد فرم‌های بازخورد' },
      { status: 500 }
    );
  }
}