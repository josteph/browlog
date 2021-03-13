declare global {
  interface Window {
    /**
     * The browlog instance assigned in window property.
     * 
     * Make sure this logger is run in the browser
     */
    _browlog: BrowLog | undefined;
  }

  interface BrowLog {
    /**
     * Enable logging after being disabled.
     * 
     * Browlog will be automatically enabled by default.
     * 
     * Calling this when browlog is already enabled will not yield any effect.
     */
    enable(): void;

    /**
     * Disable logging temporarily until enable() is called again
     */
    disable(): void;

    /**
     * Post an error log. Although it will be queued until debounce duration finished.
     */
    log(type: string, messages: any[]): void;

    /**
     * The original from overriden console object.
     * 
     * Browlog only covers "error" only for now.
     */
    console: {
      error: any;
    }
  }

  interface Log {
    type: string;
    referrer: string;
    userAgent: string;
    timestamp: number;
    time: string;
    href: string;
    messages: string[];
  }

  interface LoggerOptions {
    /**
     * An array of promises generated from fetch after chain process a log request.
     * 
     * Read more about it here:
     * https://github.com/josteph/browlog#reporter
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
  }
}

import debounce from 'debounce';
import flat from './helpers/flat';

export function init(options: LoggerOptions) {
  let enableLogging = false;
  let logs: Log[] = [];

  const noop = () => {};
  const defaultLogger = {
    enable: noop,
    disable: noop,
    log: noop,
    console: console,
  };

  const reporters = options.reporters || [];

  if (!reporters.length) {
    console.warn('[Browlog] Logger is disabled due to reporter is not specified. Please at least add 1 reporter, for more information check https://github.com/josteph/browlog#reporter')
    return defaultLogger;
  }

  if (options.disable) {
    return defaultLogger;
  }

  const ignoreErrors = options.ignoreErrors || [];

  const _error = console.error;

  const sendLog = async () => {
    const promisifiedLogs: (void | Promise<void | Response>)[] = flat(logs.map((log: Log) => {
      return reporters.map(reporter => reporter(log));
    }));

    return Promise.all(promisifiedLogs).then(() => {
      logs = [];
    });
  };

  const debouncedSendLog = debounce(sendLog, options.threshold || 2000);

  const postLog = (type: string, messages: string[]) => {
    const ignoreRegex = new RegExp(ignoreErrors.map(reg => '(' + reg.source + ')').join('|'));

    if (messages.some((m: string) => ignoreRegex.test(m))) {
      return;
    }
    
    const filteredMessages = messages.filter((m: string) => !ignoreRegex.test(m));

    if (!filteredMessages.length) {
      return;
    }

    const date = new Date();

    const payload: Log = {
      type,
      userAgent: window.navigator.userAgent,
      referrer: document.referrer,
      timestamp: date.getTime(),
      time: new Date(
        Date.now(),
      ).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      href: window.location.href,
      messages: filteredMessages,
    };

    logs.push(payload);
    debouncedSendLog();
  };

  const handleUnhandledRejection = function(e) {
    if (e.reason) {
      postLog('window:unhandledrejection', [`Stack: ${e.reason.stack || e.reason.message}`]);
    }
  };

  const handleOnError = function(event) {
    const { message, lineno, colno, error, type, filename } = event;
    postLog('window:onerror', [
      `Type: ${type}`,
      `Filename: ${filename}`,
      `Line: ${lineno}`,
      `Col: ${colno}`,
      `Message: ${message}`,
      `Stack: ${error?.stack}`,
    ]);
  };

  const enable = (): void => {
    if (enableLogging) {
      return;
    }

    enableLogging = true;
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleOnError);

    console.error = function(...arg) {
      postLog('console.error', arg);
      _error.apply(console, arg);
    };
  };

  const disable = (): void => {
    if (!enableLogging) {
      return;
    }

    enableLogging = false;

    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleOnError);

    console.error = _error;
  };

  window._browlog = {
    enable,
    disable,
    log: postLog,
    console: {
      error: _error
    }
  };

  return window._browlog;
}