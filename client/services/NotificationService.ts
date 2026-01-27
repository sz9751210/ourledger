export class NotificationService {
    private static timeoutId: NodeJS.Timeout | null = null;

    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    static cancelReminder() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    static scheduleReminder(hour: number, minute: number, title: string, body: string) {
        // Cancel existing reminder first
        this.cancelReminder();

        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        if (now > scheduledTime) {
            // If time has passed today, schedule for tomorrow
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntilReminder = scheduledTime.getTime() - now.getTime();

        // Clear any existing timeout if we were storing it (needs state or service instance)
        // For simplicity in this demo, let's just set a timeout. 
        // In a real app, you might use a Service Worker or a more robust scheduler.
        // For now, simple setTimeout is acceptable for a client-side only demo.

        this.timeoutId = setTimeout(() => {
            new Notification(title, {
                body,
                icon: '/vite.svg',
            });
            // Reschedule for next day by calling recursively
            this.scheduleReminder(hour, minute, title, body);
        }, timeUntilReminder);
    }
}
