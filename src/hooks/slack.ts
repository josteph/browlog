const generateTemplate = (log: Log) => {
  const finalLog = {
    environment: 'production',
    ...log,
  };

  return {
    text: "<!channel> An error has occurred!",
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
        fields: [
          ...Object.keys(finalLog).map(key => {
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
        ],
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

const generateFetch = (data, webhookUrl: string) => {
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

const slackReporter = (log: Log, webhookUrl: string) => {
  return generateFetch(generateTemplate(log), webhookUrl);
};

export { generateTemplate, generateFetch };

export default slackReporter;
