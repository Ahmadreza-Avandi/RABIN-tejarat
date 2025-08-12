import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// GET /api/feedback/forms - Get all feedback forms
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const forms = await executeQuery(`
      SELECT * FROM feedback_forms
      ${whereClause}
      ORDER BY created_at DESC
    `, params);

    // For each form, get its questions
    for (const form of forms) {
      const questions = await executeQuery(`
        SELECT * FROM feedback_form_questions
        WHERE form_id = ?
        ORDER BY question_order ASC
      `, [form.id]);
      
      form.questions = questions;
    }

    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    console.error('Get feedback forms API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فرم‌های بازخورد' },
      { status: 500 }
    );
  }
}

// POST /api/feedback/forms - Create a new feedback form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, description, template, questions } = body;

    if (!type || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات فرم بازخورد کامل نیست' },
        { status: 400 }
      );
    }

    const formId = uuidv4();

    // Insert the form
    await executeSingle(`
      INSERT INTO feedback_forms (
        id, type, title, description, template, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `, [formId, type, title, description, template]);

    // Insert the questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionId = uuidv4();
      
      await executeSingle(`
        INSERT INTO feedback_form_questions (
          id, form_id, question, type, options, required, question_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        questionId,
        formId,
        question.question,
        question.type,
        question.options ? JSON.stringify(question.options) : null,
        question.required ? 1 : 0,
        i + 1
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'فرم بازخورد با موفقیت ایجاد شد',
      data: { id: formId }
    });
  } catch (error) {
    console.error('Create feedback form API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد فرم بازخورد' },
      { status: 500 }
    );
  }
}