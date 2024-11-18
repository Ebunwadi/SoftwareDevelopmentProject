import chai from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { after, before, beforeEach, describe, it } from 'mocha';


import {
  signupUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getSuggestedUsers,
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
app.get('/user/:query', getUserProfile);
app.post('/signup', signupUser);
app.post('/login', loginUser);
app.get('/logout', logoutUser);
app.get('/suggested-users', getSuggestedUsers);



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
  describe('getUserProfile', function () {
    it('should not return the user profile if id is wrong', async function () {
      sinon.stub(User, 'findOne').resolves(new User({ _id: mockUser._id, username: 'testUser' }));

      const response = await supertest(app).get('/user/invalidId');

      expect(response.status).to.equal(500);
    });

    it('should return 404 if user not found', async function () {
      sinon.stub(User, 'findOne').resolves(null);

      const response = await supertest(app).get(`/user/${mockUser._id}`);

      expect(response.status).to.equal(500);
    });
  });

  describe('signupUser', function () {
    it('should create a new user with Coventry email and return user data', async function () {
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User.prototype, 'save').resolves({ _id: mockUser._id, email: 'user@coventry.ac.uk' });
      sinon.stub(bcrypt, 'hash').resolves('hashedPassword');

      const response = await supertest(app)
        .post('/signup')
        .send({ name: 'Test User', email: 'user@coventry.ac.uk', username: 'testuser', password: 'password' });

      expect(response.status).to.equal(201);
      expect(response.body.email).to.equal('user@coventry.ac.uk');
    });

    it('should return 400 for non-Coventry emails', async function () {
      const response = await supertest(app)
        .post('/signup')
        .send({ email: 'user@otheruni.edu', password: 'password' });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', 'sorry, only coventry university students can access this app');
    });
  });

  describe('loginUser', function () {
    it('should login successfully and return user data', async function () {
      sinon.stub(User, 'findOne').resolves({ _id: mockUser._id, password: 'hashedPassword' });
      sinon.stub(bcrypt, 'compare').resolves(true);

      const response = await supertest(app)
        .post('/login')
        .send({ username: 'testuser', password: 'password' });

      expect(response.status).to.equal(200);
    });

    it('should return 400 for invalid credentials', async function () {
      sinon.stub(User, 'findOne').resolves(null);

      const response = await supertest(app)
        .post('/login')
        .send({ username: 'testuser', password: 'wrongPassword' });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', 'Invalid username or password');
    });
  });

  describe('logoutUser', function () {
    it('should clear the JWT cookie and logout the user', async function () {
      const response = await supertest(app).get('/logout');
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'User logged out successfully');
    });
  });
});
