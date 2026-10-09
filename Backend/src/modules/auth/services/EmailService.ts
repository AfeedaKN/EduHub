import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendVerificationEmail(to: string, fullName: string, otp: string): Promise<void>;
  sendPasswordResetEmail(to: string, fullName: string, resetLink: string): Promise<void>;
}

export class EmailService implements IEmailService {
  private transporter?: Transporter;
  private fromAddress: string;

  constructor(config?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from: string;
  }) {
    this.fromAddress = config?.from || 'EduHub <no-reply@eduhub.school>';

    if (config?.host && config?.user && config?.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.secure || false,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } else {
      console.log('---------------------------------------------------------');
      console.log('[DEV EMAIL SENDER] Outgoing Email:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: \n${options.html}`);
      console.log('---------------------------------------------------------');
    }
  }

  async sendVerificationEmail(to: string, fullName: string, otp: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Verify your EduHub Parent Account',
      html: `
        <h2>Welcome to EduHub!</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for registering for EduHub. Please use the following 6-digit verification code to activate your account:</p>
        <h1 style="letter-spacing: 4px; color: #4338ca;">${otp}</h1>
        <p>This code will expire in 15 minutes.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, fullName: string, resetLink: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset Your EduHub Password',
      html: `
        <h2>EduHub Password Reset</h2>
        <p>Dear ${fullName},</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#4338ca;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a></p>
        <p>Or visit: ${resetLink}</p>
        <p>This link is valid for 1 hour.</p>
      `,
    });
  }
}
