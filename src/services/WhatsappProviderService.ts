// src/services/WhatsappProviderService.ts
import Twilio from 'twilio';

import { TWILIO_API_KEY, TWILIO_API_SID } from "../config/twilio";

type SendResponse = {
    success: boolean;
    sid?: string;
    error?: any;
};

type RecvResponse = {
    from: string;
    body: string;
    receivedAt: Date;
};

export class WhatsappProviderService {
  private static client = Twilio(TWILIO_API_SID, TWILIO_API_KEY);

  private static receivedMessages: RecvResponse[] = [];

  static async send(msg: string, dst: string): Promise<SendResponse>
  {
    try {
      const message = await WhatsappProviderService.client.messages.create({
        from: 'whatsapp:+14155238886',
        body: msg,
        to: `whatsapp:${dst}`,
      });
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('ERRO: ', error);
      return { success: false, error };
    }
  }

  public static async recv(dst: string): Promise<RecvResponse[]>
  {
    return this.receivedMessages.filter(m => m.from === dst);
  }

  public static simulateIncomingMessage(from: string, body: string)
  {
    this.receivedMessages.push({
      from,
      body,
      receivedAt: new Date(),
    });
  }
}