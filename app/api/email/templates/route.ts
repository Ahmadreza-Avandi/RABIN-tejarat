import { NextResponse } from 'next/server';

// Define email template types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for email templates
const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to CEM-CRM!',
    body: `
      <h1>Welcome to CEM-CRM!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board.</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The CEM-CRM Team</p>
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Password Reset',
    subject: 'Password Reset Request',
    body: `
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password. Please click the link below to reset your password:</p>
      <p><a href="{{resetLink}}">Reset Password</a></p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p>Best regards,<br>The CEM-CRM Team</p>
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET handler to retrieve all email templates
export async function GET() {
  return NextResponse.json(emailTemplates);
}

// POST handler to create a new email template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required fields' },
        { status: 400 }
      );
    }
    
    // Create new template
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: body.name,
      subject: body.subject,
      body: body.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // In a real application, you would save this to a database
    emailTemplates.push(newTemplate);
    
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}