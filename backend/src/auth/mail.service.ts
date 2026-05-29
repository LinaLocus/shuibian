import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface CodeEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly store = new Map<string, CodeEntry>();
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      requireTLS: true,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendCode(email: string): Promise<void> {
    // Rate limit: one code per 60s
    const existing = this.store.get(email);
    if (existing && existing.expiresAt - 4 * 60 * 1000 > Date.now()) {
      throw new Error('请求过于频繁，请 60 秒后再试');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.store.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    await this.transporter.sendMail({
      from: `"谁便" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '【谁便】注册验证码',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
          <h2 style="color:#4CAF50;margin:0 0 8px">谁便 · 注册验证码</h2>
          <p style="color:#6b7280;margin:0 0 24px;font-size:14px">你正在注册谁便账号，验证码 <strong>5 分钟</strong>内有效：</p>
          <div style="letter-spacing:12px;font-size:36px;font-weight:bold;color:#111827;background:#fff;border-radius:12px;padding:20px;text-align:center;border:2px solid #e5e7eb;">
            ${code}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">如非本人操作请忽略此邮件。</p>
        </div>
      `,
    }).catch((err) => {
      this.logger.error(`Failed to send email to ${email}: ${err.message}`, err.stack);
      throw err;
    });

    this.logger.log(`Sent verification code to ${email}`);
  }

  verifyCode(email: string, code: string): boolean {
    const entry = this.store.get(email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(email);
      return false;
    }
    entry.attempts += 1;
    if (entry.attempts > 5) {
      this.store.delete(email);
      return false;
    }
    if (entry.code !== code) return false;
    this.store.delete(email);
    return true;
  }
}
