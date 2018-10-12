
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');

const addAuthorizationToApp = (app) => {
  const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://recordings.eu.auth0.com/.well-known/jwks.json',
    }),
    audience: 'https://api-space-usage.com',
    issuer: 'https://recordings.eu.auth0.com/',
    algorithms: ['RS256'],
  });

  app.use(jwtCheck);

  return app;
};


module.exports = addAuthorizationToApp;
