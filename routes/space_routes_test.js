
const chai = require('chai');
const sinonChai = require('sinon-chai');
const makeHttpRequest = require('supertest');
const SpaceRoutesFactory = require('./space_routes');
const express = require('express');

chai.use(sinonChai);
const { expect } = chai;


describe('space_routes', () => {
  it('should call space controller when route called', async function () {
    const mockResponseData = 'data';
    const mockSpaceController = {
      getSpaces: (request, response) => {
        response.send(mockResponseData);
      },
    };
    const spaceRoutes = SpaceRoutesFactory(mockSpaceController);

    const shellAppForTesting = express();
    shellAppForTesting.use('/', spaceRoutes);

    const response = await makeHttpRequest(shellAppForTesting)
      .get('/');

    expect(response.text).to.equal(mockResponseData);
  });
});

