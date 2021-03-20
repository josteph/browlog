import type { Log } from '../index';

const generateTemplate = (log: Log, extraLogProps: any) => {
  const { appName, ...restExtraLog } = extraLogProps;

  const finalLog = { ...log, ...restExtraLog };

  return {
    text: `<!channel> An error has occurred!${appName ? ` - ${appName}` : ''}`,
    blocks: [
      {
        type: "section",
        text: {
          type: 'mrkdwn',
          text: `<!channel> Error Occurred`,
        }
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: Object.keys(finalLog).map(key => {
          let content = finalLog[key];

          if (!content) return null;

          if (Array.isArray(content)) {
            if (!content.length) return null;

            content = content.join('\n');
          }

          return {
            type: 'mrkdwn',
            text: `*${key}*:\n${content}`,
          };
        }).filter(Boolean),
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Generated on ${new Date(
              Date.now(),
            ).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} | via Webhook`,
          },
        ],
      },
    ],
  };
};

const generateFetch = (data: any, webhookUrl: string) => {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'no-cors',
    body: JSON.stringify(data),
  }).catch(e => {
    if (window._browlog) {
      window._browlog.console.error(e);
    }
  });
};

const slackReporter = (webhookUrl: string, extraLogProps: any) => (log: Log) => {
  return generateFetch(generateTemplate(log, extraLogProps), webhookUrl);
};

export { generateTemplate, generateFetch };

export default slackReporter;
