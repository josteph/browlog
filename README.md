# Browlog

[![npm](https://img.shields.io/npm/v/browlog.svg)](https://www.npmjs.com/package/browlog)

Automatically log any errors happening in your app!


## Disclaimer

Browlog is simply just an extension which instantly post to any specified reporter(s).

This means, this extension doesn't have a dashboard like other monitoring tools since this is a very lightweight error logger by utilizing error events.

If this is enough for your needs, then let's get started!


## Installation

```sh
npm i browlog
```


## Usage

Browlog uses singleton approach, you need to call the `init` as following:

```js
import browlog from 'browlog';
import slackReporter from 'browlog/reporters/slack';

browlog({
  reporters: [
    slackReporter('<slack_webhook_url>'),
  ]
});
```

Browlog will start to listen to any errors happening in your app. Hence, I would suggest to init browlog as early as possible.

Also please remember that this is only for client-side logger, if this code also runs in server (SSR / prerender), you should not init browlog when the code is running in server.

## Reporters

You can import any existing reporters (or create your own), by importing from this path:

```js
import reporter from 'browlog/reporters/<supported_reporter>';
```

List of currently supported reporters:

1. Slack
2. Microsoft Teams (soon)

Note: If you don't specify any reporters, browlog will be disabled automatically.

---

You can, however, add your own custom reporter as such:

```js
const customReporter = (log) => {
  // do anything
  // as long as you return a promise here.
};
```

You can check what is a `Log` object from the typings:

```ts
interface Log {
  type: string; // event type, could be window:onerror, etc.
  referrer: string;
  userAgent: string;
  timestamp: number; // unix timestamp
  time: string; // humanized timestamp, Asia/Jakarta as timezone
  href: string;
  messages: string[];
}
```

## Options

Below are available options for browlog initialization:

```
/**
 * An array of promises generated from fetch after chain process a log request.
 * 
 * Read more about it here:
 * https://github.com/josteph/browlog#reporters
 */
reporters: ((...data: any[]) => void)[];

/**
 * Prevent browlog from init & attaching event listeners.
 * 
 * You can call another `browlog.init()` again somewhere.
 */
disable?: boolean;

/**
 * An array of regex to filter out unnecessary errors from being logged.
 * 
 * For example:
 * 
 * `[/Message\: Script error\./, /Vue warn/, /Service worker/]`
 */
ignoreErrors?: RegExp[];

/**
 * Debounce threshold for the logger to be queued before sending them in parallel.
 * 
 * Default value is `2000` (in ms)
 */
threshold?: number;
```
