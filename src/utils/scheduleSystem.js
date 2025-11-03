// Learning Schedule/Calendar System
export const createScheduleEvent = (userEmail, event) => {
  try {
    const scheduleKey = `mumayaz_schedule_${userEmail}`;
    const schedule = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
    
    const newEvent = {
      id: Date.now().toString(),
      ...event,
      createdAt: new Date().toISOString()
    };
    
    schedule.push(newEvent);
    localStorage.setItem(scheduleKey, JSON.stringify(schedule));
    
    return newEvent;
  } catch (error) {
    console.error('Error creating schedule event:', error);
  }
};

export const getScheduleEvents = (userEmail, date = null) => {
  try {
    const scheduleKey = `mumayaz_schedule_${userEmail}`;
    const schedule = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
    
    if (date) {
      return schedule.filter(event => {
        const eventDate = new Date(event.date).toDateString();
        return eventDate === new Date(date).toDateString();
      });
    }
    
    return schedule;
  } catch (error) {
    console.error('Error getting schedule events:', error);
    return [];
  }
};

export const deleteScheduleEvent = (userEmail, eventId) => {
  try {
    const scheduleKey = `mumayaz_schedule_${userEmail}`;
    const schedule = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
    
    const filtered = schedule.filter(event => event.id !== eventId);
    localStorage.setItem(scheduleKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting schedule event:', error);
  }
};

export const getTodayEvents = (userEmail) => {
  return getScheduleEvents(userEmail, new Date());
};

export const getUpcomingEvents = (userEmail, days = 7) => {
  try {
    const schedule = getScheduleEvents(userEmail);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return schedule.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};
