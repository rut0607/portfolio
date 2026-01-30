const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');

// Configure Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email template
const createEmailTemplate = (formData) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #2563eb; }
          .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Portfolio Contact Form Submission</h1>
            <p>From: ${formData.name}</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${formData.name}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${formData.email}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="value">${formData.message}</div>
            </div>
            <div class="field">
              <div class="label">Submitted At:</div>
              <div class="value">${new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Validation middleware
const validateContactForm = (req, res, next) => {
  const { name, email, message } = req.body;
  
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!message || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// POST /api/contact - Submit contact form
router.post('/', validateContactForm, async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // 1. Store in Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (dbError) {
      console.error('Supabase error:', dbError);
      throw new Error('Failed to save submission to database');
    }
    
    // 2. Send email notification
    let emailSent = false;
    let emailError = null;
    
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_TO,
        subject: `New Contact Form Submission from ${name}`,
        html: createEmailTemplate({ name, email, message }),
        replyTo: email
      };
      
      await transporter.sendMail(mailOptions);
      emailSent = true;
      
    } catch (emailErr) {
      console.error('Email sending error:', emailErr);
      emailError = emailErr.message;
      // Don't throw here - we still want to return success if DB save worked
    }
    
    // 3. Return success response
    res.status(201).json({
      success: true,
      message: 'Thank you for your message! I\'ll get back to you soon.',
      data: {
        id: dbData.id,
        name: dbData.name,
        email: dbData.email,
        created_at: dbData.created_at
      },
      notification: {
        email_sent: emailSent,
        ...(emailError && { email_error: emailError })
      }
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    res.status(500).json({
      error: 'Failed to process contact form submission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// GET /api/contact/stats - Get submission statistics (optional, for admin)
router.get('/stats', async (req, res) => {
  try {
    // Note: In production, add authentication middleware here
    
    const { count, error } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    res.json({
      total_submissions: count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;