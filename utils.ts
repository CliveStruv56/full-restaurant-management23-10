import { AppSettings, Order, TimeSlot } from "./types";

export const formatCurrency = (amount: number, currency: AppSettings['currency']): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export const generateAvailableSlots = (settings: AppSettings, orders: Order[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    
    const minLeadDate = new Date(now.getTime() + settings.minLeadTimeMinutes * 60000);
    
    for (let i = 0; i < settings.maxDaysInAdvance; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        date.setSeconds(0, 0);

        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof AppSettings['weekSchedule'];
        const daySettings = settings.weekSchedule[dayOfWeek];

        if (!daySettings.isOpen) continue;

        const openingTime = new Date(date);
        openingTime.setHours(daySettings.openingHour, settings.openingBufferMinutes, 0, 0);

        const closingTime = new Date(date);
        closingTime.setHours(daySettings.closingHour, 0, 0, 0);
        // Adjust for closing buffer
        closingTime.setMinutes(closingTime.getMinutes() - settings.closingBufferMinutes);

        let currentTime = new Date(openingTime);

        while (currentTime < closingTime) {
            if (currentTime > minLeadDate) {
                const ordersInSlot = orders.filter(o => {
                    const orderTime = new Date(o.collectionTime);
                    return orderTime >= currentTime && orderTime < new Date(currentTime.getTime() + settings.slotDuration * 60000);
                }).length;

                if (ordersInSlot < settings.maxOrdersPerSlot) {
                     const isToday = now.toDateString() === currentTime.toDateString();
                     const isTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === currentTime.toDateString();
                     
                     let dayLabel = '';
                     if (isToday) {
                        dayLabel = 'Today';
                     } else if (isTomorrow) {
                        dayLabel = 'Tomorrow';
                     } else {
                        dayLabel = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                     }

                    slots.push({
                        value: currentTime.toISOString(),
                        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                        group: dayLabel,
                    });
                }
            }
            currentTime = new Date(currentTime.getTime() + settings.slotDuration * 60000);
        }
    }
    return slots;
};