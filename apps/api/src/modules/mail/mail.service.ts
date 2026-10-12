import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';

interface PasswordResetEmail {
  to: string;
  name: string;
  link: string;
}

/**
 * Sends emails. Real sending arrives with notifications (QN-19); until then,
 * outside production the email is printed in the API terminal so you can click the link.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async sendPasswordReset({ to, name, link }: PasswordResetEmail): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === 'production') {
      this.logger.warn(`Email sending isn't set up yet. Password reset email to ${to} not sent.`);
      return;
    }
    this.logger.log(`Password reset email for ${name} <${to}>:\n  ${link}`);
  }
}
