const { getSmsClient, getSmsFromNumber } = require('./settingsService');

exports.sendBulkSMS = async (contacts, message, organization) => {
  try {
    const client = await getSmsClient();
    const fromNumber = await getSmsFromNumber();

    if (!client || !fromNumber) {
      // Fallback to dev-mode logging if not configured
      contacts.forEach(contact => {
        if (contact.optInWhatsApp && contact.mobile) {
          console.log('[SMS Dev Fallback] To:', contact.mobile, 'Body:', message);
        }
      });
      return { success: true, message: 'SMS logged (no provider configured)' };
    }

    const smsPromises = contacts.map(contact => {
      if (contact.optInWhatsApp && contact.mobile) {
        return client.messages.create({
          body: message,
          from: fromNumber,
          to: contact.mobile
        });
      }
      return Promise.resolve();
    });

    await Promise.all(smsPromises);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    throw new Error('Failed to send SMS: ' + error.message);
  }
};
