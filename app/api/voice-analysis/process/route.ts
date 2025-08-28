import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// Helper function to handle today's all reports
async function handleTodayAllReports(isManager: boolean, currentUser: any) {
    try {
        if (!isManager) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: false,
                    text: 'گزارشات امروز',
                    message: 'شما مجوز مشاهده گزارشات همه همکاران را ندارید.'
                }
            });
        }

        const today = new Date().toISOString().split('T')[0];

        const reports = await executeQuery(`
            SELECT 
                dr.*,
                u.name as user_name,
                u.role as user_role
            FROM daily_reports dr
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE dr.report_date = ?
            ORDER BY dr.created_at DESC
        `, [today]);

        if (reports.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    text: 'گزارشات امروز',
                    analysis: `امروز (${today}) هیچ گزارشی ثبت نشده است.`
                }
            });
        }

        // Get tasks for each report
        for (let report of reports) {
            if (report.completed_tasks) {
                try {
                    const taskIds = JSON.parse(report.completed_tasks);
                    if (taskIds && taskIds.length > 0) {
                        const tasks = await executeQuery(`
                            SELECT id, title, status, description
                            FROM tasks
                            WHERE id IN (${taskIds.map(() => '?').join(',')})
                        `, taskIds);
                        report.tasks = tasks;
                    }
                } catch (e) {
                    report.tasks = [];
                }
            } else {
                report.tasks = [];
            }
        }

        // Prepare data for AI analysis
        const analysisData = {
            report_type: 'today_all',
            date: today,
            total_reports: reports.length,
            employees: reports.map(report => ({
                name: report.user_name,
                role: report.user_role,
                work_description: report.work_description,
                working_hours: report.working_hours,
                challenges: report.challenges,
                achievements: report.achievements,
                tasks: report.tasks || []
            }))
        };

        // Create analysis prompt
        const analysisPrompt = `
تحلیل گزارشات کاری همه همکاران - امروز (${today})

تعداد کل گزارشات: ${analysisData.total_reports}

گزارشات:
${analysisData.employees.map((emp, index) => `
همکار ${index + 1}: ${emp.name} (${emp.role})
- کار انجام شده: ${emp.work_description}
- ساعات کاری: ${emp.working_hours || 'ثبت نشده'}
- چالش‌ها: ${emp.challenges || 'ندارد'}
- دستاوردها: ${emp.achievements || 'ندارد'}
- تسک‌ها: ${emp.tasks.length > 0 ? emp.tasks.map((t: any) => t.title).join('، ') : 'ندارد'}
`).join('\n')}

لطفاً تحلیل کوتاه و مفیدی ارائه دهید شامل:

1. خلاصه عملکرد کلی تیم امروز
2. نقاط قوت اصلی
3. چالش‌های مشترک
4. پیشنهادات بهبود
5. ارزیابی کلی تیم (عالی/خوب/متوسط/ضعیف)

پاسخ را به زبان فارسی و کوتاه بنویسید.
        `;

        // Send to AI API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const encodedPrompt = encodeURIComponent(analysisPrompt);
            const aiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedPrompt}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!aiResponse.ok) {
                throw new Error(`AI API error: ${aiResponse.status}`);
            }

            const aiResult = await aiResponse.json();
            const analysis = aiResult.answer || aiResult.response || aiResult.text || aiResult;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    report_type: 'today_all',
                    text: 'گزارشات امروز',
                    reports_count: reports.length,
                    analysis: analysis,
                    date: today
                }
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Fallback analysis
            const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);
            const avgHours = reports.filter(r => r.working_hours).length > 0 ?
                (totalHours / reports.filter(r => r.working_hours).length).toFixed(1) : 'نامشخص';
            const challengesCount = reports.filter(r => r.challenges && r.challenges.trim()).length;
            const achievementsCount = reports.filter(r => r.achievements && r.achievements.trim()).length;

            const fallbackAnalysis = `
📊 تحلیل خودکار گزارشات امروز (${today})

⚠️ سرویس تحلیل هوش مصنوعی در دسترس نیست.

📈 خلاصه کلی عملکرد تیم:
امروز تعداد ${reports.length} همکار گزارش کاری ثبت کرده‌اند.

📊 آمار کلیدی:
- تعداد گزارشات ثبت شده: ${reports.length} گزارش
- مجموع ساعات کاری: ${totalHours} ساعت
- میانگین ساعات کاری: ${avgHours} ساعت
- تعداد چالش‌های ثبت شده: ${challengesCount} مورد
- تعداد دستاورد‌های ثبت شده: ${achievementsCount} مورد

🎯 ارزیابی اولیه:
${reports.length >= 5 ? '✅ مشارکت خوب تیم در گزارش‌دهی' : '⚠️ نیاز به تشویق بیشتر برای گزارش‌دهی'}
${avgHours !== 'نامشخص' && parseFloat(avgHours) >= 8 ? '✅ ساعات کاری مناسب تیم' : '⚠️ نیاز به بررسی ساعات کاری'}
            `;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    report_type: 'today_all',
                    text: 'گزارشات امروز',
                    reports_count: reports.length,
                    analysis: fallbackAnalysis,
                    date: today,
                    ai_error: true
                }
            });
        }

    } catch (error) {
        console.error('Error in handleTodayAllReports:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت گزارشات امروز' },
            { status: 500 }
        );
    }
}

// Helper function to handle all reports
async function handleAllReports(isManager: boolean, currentUser: any) {
    try {
        if (!isManager) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: false,
                    text: 'همه گزارشات',
                    message: 'شما مجوز مشاهده گزارشات همه همکاران را ندارید.'
                }
            });
        }

        const today = new Date().toISOString().split('T')[0];

        const reports = await executeQuery(`
            SELECT 
                dr.*,
                u.name as user_name,
                u.role as user_role
            FROM daily_reports dr
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE dr.report_date = ?
            ORDER BY dr.created_at DESC
        `, [today]);

        if (reports.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    text: 'همه گزارشات',
                    analysis: `امروز (${today}) هیچ گزارشی ثبت نشده است.`
                }
            });
        }

        // Get tasks for each report
        for (let report of reports) {
            if (report.completed_tasks) {
                try {
                    const taskIds = JSON.parse(report.completed_tasks);
                    if (taskIds && taskIds.length > 0) {
                        const tasks = await executeQuery(`
                            SELECT id, title, status, description
                            FROM tasks
                            WHERE id IN (${taskIds.map(() => '?').join(',')})
                        `, taskIds);
                        report.tasks = tasks;
                    }
                } catch (e) {
                    report.tasks = [];
                }
            } else {
                report.tasks = [];
            }
        }

        // Group reports by employee
        const employeeReports = reports.reduce((acc: any, report: any) => {
            if (!acc[report.user_name]) {
                acc[report.user_name] = {
                    name: report.user_name,
                    role: report.user_role,
                    reports: []
                };
            }
            acc[report.user_name].reports.push(report);
            return acc;
        }, {});

        // Create analysis prompt
        const analysisPrompt = `
تحلیل گزارشات کاری همه همکاران - امروز (${today})

تاریخ: ${today}
تعداد کل گزارشات: ${reports.length}
تعداد همکاران فعال: ${Object.keys(employeeReports).length}

خلاصه گزارشات به تفکیک همکار:
${Object.values(employeeReports).map((emp: any) => `
${emp.name} (${emp.role}):
- تعداد گزارشات: ${emp.reports.length}
- میانگین ساعات کاری: ${emp.reports.filter((r: any) => r.working_hours).length > 0 ?
                (emp.reports.reduce((sum: number, r: any) => sum + (parseFloat(r.working_hours) || 0), 0) /
                    emp.reports.filter((r: any) => r.working_hours).length).toFixed(1) : 'نامشخص'} ساعت
- چالش‌ها: ${emp.reports.filter((r: any) => r.challenges && r.challenges.trim()).length} مورد
- دستاوردها: ${emp.reports.filter((r: any) => r.achievements && r.achievements.trim()).length} مورد
`).join('\n')}

لطفاً تحلیل کوتاه و مفیدی ارائه دهید شامل:

1. خلاصه عملکرد کلی تیم امروز
2. بهترین عملکردها و همکاران برتر امروز
3. چالش‌های مشترک امروز
4. پیشنهادات بهبود برای فردا
5. ارزیابی کلی تیم امروز (عالی/خوب/متوسط/ضعیف)

پاسخ را به زبان فارسی و کوتاه بنویسید.
        `;

        // Send to AI API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const encodedPrompt = encodeURIComponent(analysisPrompt);
            const aiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedPrompt}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!aiResponse.ok) {
                throw new Error(`AI API error: ${aiResponse.status}`);
            }

            const aiResult = await aiResponse.json();
            const analysis = aiResult.answer || aiResult.response || aiResult.text || aiResult;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    report_type: 'all_reports',
                    text: 'همه گزارشات',
                    reports_count: reports.length,
                    employees_count: Object.keys(employeeReports).length,
                    analysis: analysis,
                    date: today
                }
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Fallback analysis
            const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);
            const avgHours = reports.filter(r => r.working_hours).length > 0 ?
                (totalHours / reports.filter(r => r.working_hours).length).toFixed(1) : 'نامشخص';
            const challengesCount = reports.filter(r => r.challenges && r.challenges.trim()).length;
            const achievementsCount = reports.filter(r => r.achievements && r.achievements.trim()).length;

            const fallbackAnalysis = `
📊 تحلیل خودکار همه گزارشات امروز (${today})

⚠️ سرویس تحلیل هوش مصنوعی در دسترس نیست.

📈 خلاصه کلی عملکرد تیم:
امروز تعداد ${Object.keys(employeeReports).length} همکار مجموعاً ${reports.length} گزارش ثبت کرده‌اند.

📊 آمار کلیدی:
- تعداد کل گزارشات: ${reports.length} گزارش
- تعداد همکاران فعال: ${Object.keys(employeeReports).length} نفر
- مجموع ساعات کاری: ${totalHours} ساعت
- میانگین ساعات کاری: ${avgHours} ساعت
- تعداد چالش‌های ثبت شده: ${challengesCount} مورد
- تعداد دستاورد‌های ثبت شده: ${achievementsCount} مورد

🎯 ارزیابی اولیه:
${reports.length >= 5 ? '✅ مشارکت خوب تیم در گزارش‌دهی امروز' : '⚠️ نیاز به تشویق بیشتر برای گزارش‌دهی'}
${avgHours !== 'نامشخص' && parseFloat(avgHours) >= 8 ? '✅ ساعات کاری مناسب تیم امروز' : '⚠️ نیاز به بررسی ساعات کاری امروز'}
            `;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    report_type: 'all_reports',
                    text: 'همه گزارشات',
                    reports_count: reports.length,
                    employees_count: Object.keys(employeeReports).length,
                    analysis: fallbackAnalysis,
                    date: today,
                    ai_error: true
                }
            });
        }

    } catch (error) {
        console.error('Error in handleAllReports:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت همه گزارشات' },
            { status: 500 }
        );
    }
}

// POST /api/voice-analysis/process - Process voice command
export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const cookieToken = req.cookies.get('auth-token')?.value;
        const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
        const token = cookieToken || headerToken;

        console.log('🔍 API: Cookie token:', cookieToken ? 'Yes' : 'No');
        console.log('🔍 API: Header token:', headerToken ? 'Yes' : 'No');
        console.log('🔍 API: Final token:', token ? 'Yes' : 'No');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        console.log('🔍 Processing voice analysis with token:', token ? 'Token exists' : 'No token');

        const userId = await getUserFromToken(token);
        console.log('🔍 User ID from token:', userId);

        if (!userId) {
            console.log('❌ Token validation failed');
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        // Get user info to check role
        const userInfo = await executeQuery(`
            SELECT id, name, role, email 
            FROM users 
            WHERE id = ? AND status = 'active'
        `, [userId]);

        if (userInfo.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const currentUser = userInfo[0];
        console.log('🔍 Current user:', currentUser.name, 'Role:', currentUser.role);

        const body = await req.json();
        const { text, employeeName } = body;

        if (!text) {
            return NextResponse.json(
                { success: false, message: 'متن الزامی است' },
                { status: 400 }
            );
        }

        console.log('🔍 Processing voice command:', text);
        console.log('🔍 Employee name parameter:', employeeName);

        // Check if user is manager/CEO - comprehensive check
        const isManager = [
            'ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin', 'manager',
            'supervisor', 'team_lead', 'مدیر عامل', 'مدیر کل', 'سرپرست'
        ].some(role => currentUser.role?.toLowerCase().includes(role.toLowerCase()));

        console.log('🔍 Is manager:', isManager, 'User role:', currentUser.role);

        let employees = [];
        let reportType = 'individual'; // 'individual', 'today_all', 'all_reports'

        // Analyze the voice command to determine what type of report is requested
        const lowerText = text.toLowerCase();
        const lowerEmployeeName = employeeName ? employeeName.toLowerCase() : '';

        // Check for "گزارشات امروز" (today's reports)
        if (lowerText.includes('گزارشات امروز') || lowerText.includes('گزارش امروز') ||
            lowerText.includes('همه گزارشات امروز') || lowerText.includes('تمام گزارشات امروز')) {
            console.log('🔍 User requesting all today\'s reports');
            reportType = 'today_all';
        }
        // Check for "همه گزارشات" or "کل گزارشات" (all reports)
        else if (lowerText.includes('همه گزارشات') || lowerText.includes('کل گزارشات') ||
            lowerText.includes('تمام گزارشات') || lowerText.includes('all reports')) {
            console.log('🔍 User requesting all reports');
            reportType = 'all_reports';
        }
        // Handle individual employee reports
        else if (employeeName) {
            // Search for employee by name with better matching
            let employeeQuery = `
                SELECT id, name, role 
                FROM users 
                WHERE (
                    name LIKE ? OR 
                    name LIKE ? OR 
                    name LIKE ? OR
                    REPLACE(name, ' ', '') LIKE ? OR
                    SOUNDEX(name) = SOUNDEX(?)
                ) AND status = 'active'
            `;
            let queryParams = [
                `%${employeeName}%`,
                `${employeeName}%`,
                `%${employeeName}`,
                `%${employeeName.replace(/\s/g, '')}%`,
                employeeName
            ];

            // If user is not manager, they can only see their own reports
            if (!isManager) {
                employeeQuery += ` AND id = ?`;
                queryParams.push(currentUser.id);
            }

            employeeQuery += ` ORDER BY 
                CASE 
                    WHEN name = ? THEN 1
                    WHEN name LIKE ? THEN 2
                    ELSE 3
                END, name LIMIT 5`;
            queryParams.push(employeeName, `${employeeName}%`);

            employees = await executeQuery(employeeQuery, queryParams);
            console.log('🔍 Found employees:', employees.length, employees.map(e => e.name));

            if (employees.length === 0) {
                // Try a broader search for managers
                if (isManager) {
                    const allUsers = await executeQuery(`
                        SELECT id, name, role 
                        FROM users 
                        WHERE status = 'active'
                        ORDER BY name
                    `);
                    console.log('🔍 All users for manager:', allUsers.length);

                    return NextResponse.json({
                        success: true,
                        data: {
                            employee_found: false,
                            employee_name: employeeName,
                            text: text,
                            available_employees: allUsers.map(u => u.name),
                            message: `همکار "${employeeName}" یافت نشد. همکاران موجود: ${allUsers.map(u => u.name).join('، ')}`
                        }
                    });
                } else {
                    return NextResponse.json({
                        success: true,
                        data: {
                            employee_found: false,
                            employee_name: employeeName,
                            text: text,
                            message: `همکار "${employeeName}" یافت نشد یا شما مجوز مشاهده گزارشات این همکار را ندارید.`
                        }
                    });
                }
            }
        }

        // Handle different report types
        if (reportType === 'today_all') {
            // Get all today's reports
            return await handleTodayAllReports(isManager, currentUser);
        } else if (reportType === 'all_reports') {
            // Get all reports (last 30 days)
            return await handleAllReports(isManager, currentUser);
        }

        if (employees.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: false,
                    employee_name: employeeName,
                    text: text,
                    message: 'همکار مورد نظر یافت نشد'
                }
            });
        }

        // Take the first match
        const employee = employees[0];

        // Get recent reports for this employee (last 7 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const reports = await executeQuery(`
            SELECT 
                dr.*,
                u.name as user_name,
                u.role as user_role
            FROM daily_reports dr
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE dr.user_id = ? 
            AND dr.report_date BETWEEN ? AND ?
            ORDER BY dr.report_date DESC
            LIMIT 10
        `, [employee.id, startDate, endDate]);

        if (reports.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    text: text,
                    analysis: `همکار ${employee.name} در 7 روز گذشته هیچ گزارشی ثبت نکرده است.`
                }
            });
        }

        // Get tasks for each report if completed_tasks exists
        for (let report of reports) {
            if (report.completed_tasks) {
                try {
                    const taskIds = JSON.parse(report.completed_tasks);
                    if (taskIds && taskIds.length > 0) {
                        const tasks = await executeQuery(`
                            SELECT id, title, status, description
                            FROM tasks
                            WHERE id IN (${taskIds.map(() => '?').join(',')})
                        `, taskIds);
                        report.tasks = tasks;
                    }
                } catch (e) {
                    report.tasks = [];
                }
            } else {
                report.tasks = [];
            }
        }

        // Prepare data for AI analysis
        const analysisData = {
            user_name: employee.name,
            user_role: employee.role,
            period: {
                start_date: startDate,
                end_date: endDate,
                total_days: reports.length
            },
            reports: reports.map(report => ({
                date: report.report_date,
                persian_date: report.persian_date,
                work_description: report.work_description,
                working_hours: report.working_hours,
                challenges: report.challenges,
                achievements: report.achievements,
                tasks: report.tasks || []
            }))
        };

        // Create analysis prompt
        const analysisPrompt = `
تحلیل گزارشات کاری ${analysisData.user_name} (${analysisData.user_role})

دوره: ${analysisData.period.start_date} تا ${analysisData.period.end_date} (${analysisData.period.total_days} روز)

گزارشات:
${analysisData.reports.map((report, index) => `
روز ${index + 1} (${report.persian_date || report.date}):
- کار انجام شده: ${report.work_description}
- ساعات کاری: ${report.working_hours || 'ثبت نشده'}
- چالش‌ها: ${report.challenges || 'ندارد'}
- دستاوردها: ${report.achievements || 'ندارد'}
- تسک‌ها: ${report.tasks.length > 0 ? report.tasks.map((t: any) => t.title).join('، ') : 'ندارد'}
`).join('\n')}

لطفاً تحلیل کوتاه و مفیدی ارائه دهید شامل:

1. خلاصه عملکرد کلی
2. نقاط قوت اصلی
3. چالش‌های مهم
4. پیشنهادات بهبود
5. ارزیابی کلی (عالی/خوب/متوسط/ضعیف)

پاسخ را به زبان فارسی و کوتاه بنویسید.
        `;

        // Send to AI API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const encodedPrompt = encodeURIComponent(analysisPrompt);
            const aiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedPrompt}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!aiResponse.ok) {
                throw new Error(`AI API error: ${aiResponse.status}`);
            }

            const aiResult = await aiResponse.json();
            const analysis = aiResult.answer || aiResult.response || aiResult.text || aiResult;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    employee_role: employee.role,
                    text: text,
                    reports_count: reports.length,
                    analysis: analysis,
                    period: `${startDate} تا ${endDate}`
                }
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Fallback analysis if AI fails
            const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);
            const avgHours = reports.filter(r => r.working_hours).length > 0 ?
                (totalHours / reports.filter(r => r.working_hours).length).toFixed(1) : 'نامشخص';
            const challengesCount = reports.filter(r => r.challenges && r.challenges.trim()).length;
            const achievementsCount = reports.filter(r => r.achievements && r.achievements.trim()).length;

            const fallbackAnalysis = `
📊 تحلیل خودکار گزارشات ${employee.name}

⚠️ سرویس تحلیل هوش مصنوعی در دسترس نیست.

📈 خلاصه کلی عملکرد:
در بازه زمانی ${startDate} تا ${endDate}، همکار ${employee.name} تعداد ${reports.length} گزارش روزانه ثبت کرده است.

📊 آمار کلیدی:
- تعداد روزهای گزارش شده: ${reports.length} روز
- مجموع ساعات کاری: ${totalHours} ساعت
- میانگین ساعات کاری روزانه: ${avgHours} ساعت
- تعداد چالش‌های ثبت شده: ${challengesCount} مورد
- تعداد دستاورد‌های ثبت شده: ${achievementsCount} مورد

🎯 ارزیابی اولیه:
${reports.length >= 5 ? '✅ انضباط خوب در گزارش‌دهی' : '⚠️ نیاز به بهبود در گزارش‌دهی'}
${avgHours !== 'نامشخص' && parseFloat(avgHours) >= 8 ? '✅ ساعات کاری مناسب' : '⚠️ نیاز به بررسی ساعات کاری'}
            `;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    employee_role: employee.role,
                    text: text,
                    reports_count: reports.length,
                    analysis: fallbackAnalysis,
                    period: `${startDate} تا ${endDate}`,
                    ai_error: true
                }
            });
        }

    } catch (error) {
        console.error('Voice analysis API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در پردازش دستور صوتی' },
            { status: 500 }
        );
    }
}