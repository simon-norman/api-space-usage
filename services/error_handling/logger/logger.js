
const Raven = require('raven');

module.exports = (environment) => {
  Raven.config(
    'https://068084ef143940ab92b8d162f253702a@sentry.io/1268748',
    {
      captureUnhandledRejections: true,
    },
  ).install();

  const logExceptionToRaven = (exception) => {
    Raven.captureException(exception);
  };

  const wrapperToHandleUnhandledExceptionsUsingRaven = Raven.context.bind(Raven);

  const logExceptionToConsole = (exception) => {
    console.log(exception.stack);
  };

  const wrapperToHandleUnhandledExceptionsLocally = async (functionToWrap) => {
    try {
      await functionToWrap();
    } catch (error) {
      console.log(error);
    }
  };

  let logException;
  let wrapperToHandleUnhandledExceptions;

  if (environment === 'production') {
    logException = logExceptionToRaven;
    wrapperToHandleUnhandledExceptions = wrapperToHandleUnhandledExceptionsUsingRaven;
  } else {
    logException = logExceptionToConsole;
    wrapperToHandleUnhandledExceptions = wrapperToHandleUnhandledExceptionsLocally;
  }

  return { logException, wrapperToHandleUnhandledExceptions };
};

