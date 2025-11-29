import axios from "axios";

import { WHATSAPP_SRC, WHATSAPP_API_KEY, WHATSAPP_API_URL } from "../config/whatsapp";

export class MessagingWhatsapp {
	static async send(message: string, dst: string): Promise<Response>
	{
		const payload = new URLSearchParams();
		
		payload.append("channel", "whatsapp");
		payload.append("source", WHATSAPP_SRC);
		payload.append("destination", dst);
		payload.append("message", JSON.stringify({type: "text", text: {
			body: message
		}}));

		return axios.post(WHATSAPP_API_URL, payload.toString());
	}
/*
	static async function read(dst: string): Promise<Response>
	{
	}*/
};
