const { getEmailTransport, getEmailFrom } = require('./settingsService');

exports.sendBulkEmail = async (contacts, subject, message, organization) => {
  try {
    const transporter = await getEmailTransport();
    const defaultFrom = await getEmailFrom();
    const from = organization?.name && organization?.contactEmail
      ? `${organization.name} <${organization.contactEmail}>`
      : defaultFrom;

    if (!transporter) {
      // Fallback to dev-mode logging if no transporter configured
      contacts.forEach(contact => {
        if (contact.optInEmail && contact.email) {
          console.log('[Email Dev Fallback] To:', contact.email, 'Subject:', subject);
        }
      });
      return { success: true, message: 'Emails logged (no SMTP configured)' };
    }

    const emailPromises = contacts.map(contact => {
      if (contact.optInEmail && contact.email) {
        const mailOptions = {
          from,
          to: contact.email,
          subject,
          html: message
        };
        return transporter.sendMail(mailOptions);
      }
      return Promise.resolve();
    });

    await Promise.all(emailPromises);
    return { success: true, message: 'Emails sent successfully' };
  } catch (error) {
    throw new Error('Failed to send emails: ' + error.message);
  }
};
