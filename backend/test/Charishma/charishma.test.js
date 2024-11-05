import chai from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  followUnFollowUser,
  updateUser,
  getSuggestedUsers,
  freezeAccount,
} from '../../controllers/userController.js';
import User from '../../models/userModel.js';

const { expect } = chai;
const app = express();
app.use(express.json());

// Middleware to mock authentication
let mockUser;
app.use((req, res, next) => {
    req.user = mockUser;
    next();
});

// Register routes for testing

app.post('/follow/:id', followUnFollowUser);
app.put('/user/update/:id', updateUser);
app.get('/suggested-users', getSuggestedUsers);
app.post('/freeze-account', freezeAccount);

// Set up an in-memory MongoDB server
let mongoServer;
before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => {
  mockUser = { _id: new mongoose.Types.ObjectId().toString() }; // Mock ObjectId
  sinon.restore(); // Restore mocks before each test

  // Mock JWT sign and verify
  sinon.stub(jwt, 'sign').returns('mockedToken');
  sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
    callback(null, mockUser); // Mock user verification
  });
});

describe('User Controller', function () {

  describe('followUnFollowUser', function () {
    it('should return 400', async function () {
      sinon.stub(User, 'findById').resolves({
        _id: new mongoose.Types.ObjectId(),
        following: [],
        save: sinon.stub().resolves(),
      });

      const response = await supertest(app).post(`/follow/${mockUser._id}`);
      expect(response.status).to.equal(400);
    });

    it('should return 400 when trying to follow yourself', async function () {
      const response = await supertest(app).post(`/follow/${mockUser._id}`);
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', 'You cannot follow/unfollow yourself');
    });
  });

  describe('freezeAccount', function () {
    it('should freeze the user account', async function () {
      sinon.stub(User, 'findById').resolves({
        isFrozen: false,
        save: sinon.stub().resolves(),
      });

      const response = await supertest(app).post('/freeze-account');
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
    });
  });

  describe('updateUser', function () {
    it('should update user details and return updated user', async function () {
      sinon.stub(User, 'findById').resolves({
        _id: mockUser._id,
        name: 'Old Name',
        save: sinon.stub().resolves({ name: 'New Name' }),
      });

      const response = await supertest(app)
        .put(`/user/update/${mockUser._id}`)
        .send({ name: 'New Name' });

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal('New Name');
    });

    it('should return 400 when updating a non existing user', async function () {
      const response = await supertest(app).put(`/user/update/anotherUser`);
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', "User not found");
    });
  });
});
