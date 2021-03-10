declare global {
  interface Window {
    _browlog: BrowLog | undefined;
  }

  interface BrowLog {
    enable(): void;
    disable(): void;
    log(type: string, messages: any[]): void;
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

  interface Options {
    reporter: (...data: any[]) => void;
    disable?: boolean;
    ignoreErrors?: RegExp[];
    template?: string;
    threshold?: number;
    webhookUrl: string;
  }
}

import debounce from 'debounce';

export function init(options: Options) {
  let enableLogging = false;
  let logs: Log[] = [];

  const noop = () => {};
  const defaultLogger = {
    enable: noop,
    disable: noop,
    log: noop,
    console: console,
  };

  if (!options.reporter) {
    console.warn('[Browlog] Logger is disabled due to reporter is not specified. Please at least add 1 reporter, for more information check https://github.com/josteph/browlog#reporter')
    return defaultLogger;
  }

  if (options.disable) {
    return defaultLogger;
  }

  const ignoreErrors = options.ignoreErrors || [];

  const _error = console.error;

  const sendLog = async () => {
    const promisifiedLogs: (void | Promise<void | Response>)[] = logs.map((log: Log) => {
      if (!options.webhookUrl) {
        return _error(log);
      }

      return options.reporter(log);
    });

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