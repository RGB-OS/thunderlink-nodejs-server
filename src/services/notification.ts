import axios from "axios";
import { notificationTemplate, NotificationType } from "../utils/notificationTemplate";


class NotificationService {

    notify(type: NotificationType, message: any): void {
        this.pushTelegramAlert(notificationTemplate[type](message)).catch((err) => { console.error('Error in pushTelegramAlert:', err) });
    }
    pushTelegramAlert = async (text: string) => {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            if (token) {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { "chat_id": "-1002337351317", parse_mode: 'HTML', text }).catch((err) => { console.error('Error in sending telegram alert:', err) });
            }
        } catch (err) {
            console.error('Error sending pushTelegramAlert', err);
        }
    }
}

export const notificationService = new NotificationService();