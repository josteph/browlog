import type { Log } from '../index';

const generateTemplate = (log: Log, extraLogProps: any) => {
  const { appName, ...restExtraLog } = extraLogProps || {};

  const finalLog = { ...log, ...restExtraLog };

  return {
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    'type': 'AdaptiveCard',
    'version': '1.0',
    'body': [
      {
        'type': 'ColumnSet',
        'columns': [
          {
            'type': 'Column',
            'padding': 'None',
            'width': 'stretch',
            'items': [
              {
                'type': 'TextBlock',
                'text': appName || 'Browlog',
                'wrap': true,
                'weight': 'Bolder'
              }
              ],
              'verticalContentAlignment': 'Center'
            }
        ],
        'padding': {
          'top': 'Small',
          'bottom': 'Small',
          'left': 'Default',
          'right': 'Small'
        },
        'style': 'emphasis'
      },
      {
        'type': 'Container',
        'padding': 'Default',
        'spacing': 'None',
        'items': [
          {
            'type': 'TextBlock',
            'text': 'An error has occurred, please check!',
            'wrap': true,
            'weight': 'Bolder',
            'size': 'Large',
            'color': 'Attention'
          },
          {
            'type': 'FactSet',
            'facts': Object.keys(finalLog).map(key => {
              let content = finalLog[key];
  
              if (!content) return null;
  
              if (Array.isArray(content)) {
                if (!content.length) return null;
  
                content = content.join('\n');
              }
  
              return {
                title: key,
                value: content,
              };
            }).filter(Boolean)
          }
        ]
      }
    ],
    'padding': 'None'
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

const teamsReporter = (webhookUrl: string, extraLogProps: any) => (log: Log) => {
  return generateFetch(generateTemplate(log, extraLogProps), webhookUrl);
};

export { generateTemplate, generateFetch };

export default teamsReporter;
