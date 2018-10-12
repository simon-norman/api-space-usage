
const { expect } = require('chai');
const express = require('express');
const axios = require('axios');
const request = require('supertest');
const addAuthorizationToApp = require('../services/authorization/auth.js');

describe('Auth0 middleware', function () {
  context('when initialised with the correct config and added to the app,', function () {
    let appWithAuthorization;

    const setUpTestAppWithAuthorization = () => {
      const testApp = express();
      appWithAuthorization = addAuthorizationToApp(testApp);

      appWithAuthorization.get('/some-resource', (req, res) => {
        res.status(200).send('Success!');
      });
    };

    const overrideDefaultExpressErrorHandlerToStopLogStacktraceInTests = () => {
      appWithAuthorization.use((error, req, res, next) => {
        res.status(error.status).send();
      });
    };

    const getErrorFromRejectedPromise = async (rejectedPromise) => {
      try {
        const result = await rejectedPromise;
        return result;
      } catch (error) {
        return error;
      }
    };

    beforeEach(() => {
      setUpTestAppWithAuthorization();

      overrideDefaultExpressErrorHandlerToStopLogStacktraceInTests();
    });

    context('and then a request is made WITHOUT a valid access token,', function () {
      const expectAppToRefuseRequestWith401Status = async (invalidTokenHeader) => {
        const response = request(appWithAuthorization)
          .get('/some-resource')
          .set('authorization', invalidTokenHeader)
          .send();

        const responseError = await getErrorFromRejectedPromise(response);
        expect(responseError.status).equals(401);
      };

      it('like no token at all', async function () {
        await expectAppToRefuseRequestWith401Status('');
      });

      it('like a token for another api', async function () {
        // have set up another test api on 0Auth purely to generate
        // tokens that should be invalid for this api
        const tokenForOtherApi = await axios.post(
          'https://recordings.eu.auth0.com/oauth/token',
          {
            grant_type: 'client_credentials',
            client_id: 'tO3FtdJESKfvT35pgR0fqqpJJaIIEBc6',
            client_secret: process.env.TEST_APP_WITHOUT_ACCESS_CLIENT_SECRET,
            audience: 'https://test-api.com',
          },
        );

        await expectAppToRefuseRequestWith401Status(`${tokenForOtherApi.data.token_type} ${tokenForOtherApi.data.access_token}`);
      });
    });

    context('and then a request is made WITH a VALID access token', function () {
      it('should allow the requestor to access ALL endpoints', async function () {
        const validToken = await axios.post(
          'https://recordings.eu.auth0.com/oauth/token',
          {
            grant_type: 'client_credentials',
            client_id: 'RLZ307GIruy1BWkURusz3xt0eL9EAAC8',
            client_secret: process.env.TEST_APP_WITH_ACCESS_TO_SPACE_USAGE_API_CLIENT_SECRET,
            audience: 'https://api-space-usage.com',
          },
        );

        const response = await request(appWithAuthorization)
          .get('/some-resource')
          .set('authorization', `${validToken.data.token_type} ${validToken.data.access_token}`)
          .send();

        expect(response.status).equals(200);
        expect(response.text).equals('Success!');
      });
    });
  });
});

