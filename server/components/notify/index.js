/*
* Purpose: Use this to send notifications to slack and notification server
* Usage:
* const Notify = require('../../components/notify');
* const slackSent = await Notify.slack(`${SLACK_USER_NAME} Sending Successful,
        from ${PREFIX}${DOMAIN}`, SLACK_CRON_URL);
* */

const rp = require('request-promise');
const config = require('../../config/environment');

module.exports = {
  slack(text, uri = config.URLS.SLACK) {
    if (config.env !== 'production') return '';

    const options = {
      method: 'POST',
      uri,
      form: JSON.stringify({ text: text || 'Someone sending blank notification noble...' }),
    };

    return rp(options);
  },

  create(userId, {
    title,
    body = '',
    tag = 'default',
    link = '',
    gcm = true,
    icon = config.LOGO_URL,
    expire_at,
  }) {
    if (!title) return Promise.reject({ error_description: 'Empty notification title' });

    return rp({
      method: 'POST',
      uri: `${config.URLS.QNOTIFY_SERVER}/api/notifications`,
      body: {
        user_id: userId,
        expire_at,
        payload: { title, body, tag, icon, link, gcm },
      },
      json: true,
    });
  },
};
