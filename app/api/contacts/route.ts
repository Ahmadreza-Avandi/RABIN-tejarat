import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// GET /api/contacts - Get all contacts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
            SELECT DISTINCT
                c.id,
                c.company_id,
                c.first_name,
                c.last_name,
                c.full_name,
                c.job_title,
                c.department,
                c.email,
                c.phone,
                c.mobile,
                c.linkedin_url,
                c.twitter_url,
                c.address,
                c.city,
                c.country,
                c.postal_code,
                c.notes,
                c.tags,
                c.custom_fields,
                c.avatar_url,
                c.status,
                c.is_primary,
                c.source,
                c.last_contact_date,
                c.assigned_to,
                c.created_by,
                c.created_at,
                c.updated_at,
                cust.name as customer_name,
                cust.industry as company_industry,
                cust.segment as company_segment,
                cust.status as company_status,
                u.name as assigned_user_name
            FROM contacts c
            LEFT JOIN customers cust ON c.company_id = cust.id 
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE 1=1
        `;

    const params: any[] = [];

    if (companyId) {
      if (companyId === 'individual') {
        query += ' AND (c.company_id IS NULL OR c.company_id = "")';
      } else {
        query += ' AND c.company_id = ?';
        params.push(companyId);
      }
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.first_name ASC, c.last_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    console.log('Executing query:', query); // اضافه کردن لاگ برای دیباگ
    console.log('With params:', params); // اضافه کردن لاگ برای دیباگ

    const contacts = await executeQuery(query, params);

    console.log('Query result:', contacts); // اضافه کردن لاگ برای دیباگ

    // Transform the data for customer club compatibility
    const transformedContacts = contacts.map(contact => ({
      id: contact.id,
      company_id: contact.company_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      name: contact.full_name || `${contact.first_name} ${contact.last_name}`.trim(),
      job_title: contact.job_title,
      department: contact.department,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      customer_id: contact.company_id,
      role: contact.job_title || 'مخاطب',
      type: contact.company_segment || 'individual',
      company: contact.customer_name ? {
        id: contact.company_id,
        name: contact.customer_name,
        industry: contact.company_industry,
        size: contact.company_segment,
        status: contact.company_status
      } : null,
      status: contact.status,
      source: contact.source,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      assigned_to: contact.assigned_to,
      assigned_user_name: contact.assigned_user_name
    }));

    console.log('Transformed contacts:', transformedContacts); // اضافه کردن لاگ برای دیباگ

    return NextResponse.json({
      success: true,
      data: transformedContacts
    });

  } catch (error) {
    console.error('Get contacts API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مخاطبین' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(req: NextRequest) {
  try {
    const currentUserId = req.headers.get('x-user-id');
    const data = await req.json();
    const {
      company_id = null,
      first_name,
      last_name,
      job_title = null,
      department = null,
      email = null,
      phone = null,
      mobile = null,
      linkedin_url = null,
      twitter_url = null,
      address = null,
      city = null,
      country = null,
      source = 'other'
    } = data;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, message: 'نام و نام خانوادگی الزامی است' },
        { status: 400 }
      );
    }

    const id = 'cnt-' + Date.now().toString(36);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Log the values before insertion for debugging
    console.log('Inserting contact with values:', {
      id, company_id, first_name, last_name, job_title, department,
      email, phone, mobile, linkedin_url, twitter_url,
      address, city, country, source, currentUserId, now
    });

    await executeSingle(`
            INSERT INTO contacts (
                id, company_id, first_name, last_name, job_title, department,
                email, phone, mobile, linkedin_url, twitter_url,
                address, city, country, source, status, is_primary,
                assigned_to, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', false, ?, ?, ?, ?)
        `, [
      id, company_id, first_name, last_name, job_title, department,
      email, phone, mobile, linkedin_url, twitter_url,
      address, city, country, source,
      currentUserId, currentUserId, now, now
    ]);

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت ایجاد شد',
      data: { id }
    });

  } catch (error) {
    console.error('Create contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مخاطب' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/:id - Update a contact
export async function PUT(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    const updateData = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب الزامی است' },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await executeQuery('SELECT id FROM contacts WHERE id = ?', [id]);
    if (existingContact.length === 0) {
      return NextResponse.json(
        { success: false, message: 'مخاطب یافت نشد' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const allowedFields = [
      'company_id', 'first_name', 'last_name', 'job_title', 'department',
      'email', 'phone', 'mobile', 'linkedin_url', 'twitter_url',
      'address', 'city', 'country', 'status', 'is_primary', 'source'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ فیلد قابل به‌روزرسانی ارسال نشده است' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    updateValues.push(id);

    await executeSingle(
      `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('Update contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی مخاطب' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/:id - Delete a contact
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب الزامی است' },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await executeQuery('SELECT id FROM contacts WHERE id = ?', [id]);
    if (existingContact.length === 0) {
      return NextResponse.json(
        { success: false, message: 'مخاطب یافت نشد' },
        { status: 404 }
      );
    }

    // For now, we'll use regular delete since soft delete is not implemented yet
    await executeSingle('DELETE FROM contacts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Delete contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مخاطب' },
      { status: 500 }
    );
  }
}
