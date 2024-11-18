/* eslint-disable no-undef */
import chai from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import { beforeEach, describe, it } from 'mocha';
import express from 'express';
import { sendMessage, getMessages, getConversations } from '../../controllers/messageController.js';
import Conversation from '../../models/conversationModel.js';

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
app.post('/sendMessage', sendMessage);
app.get('/getMessages/:otherUserId', getMessages);
app.get('/getConversations', getConversations);

describe('Message Controller', function () {
    beforeEach(() => {
        mockUser = { _id: 'user1' }; // Set a mock user
        sinon.restore(); // Restore sinon mocks before each test
    });

    describe('sendMessage', function () {
        it('should return 500 on error',
        async function () {
        sinon.stub(Conversation, 'findOne')
        .rejects(new Error('Database error'));

        const response = await supertest(app)
        .post('/sendMessage')
        .send({ recipientId: 'user2', message: 'Test' });

        expect(response.status).to.equal(500);
        expect(response.body).to.have.property('error', 'Database error');
        });
    });

    describe('getMessages', function () {

        it('should return 404 if conversation not found',
        async function () {
        sinon.stub(Conversation, 'findOne').resolves(null);

        const response = await supertest(app)
        .get('/getMessages/user2');

        expect(response.status).to.equal(404);
        expect(response.body).to.have.property('error',
        'Conversation not found');
        });

        it('should return 500 on error', async function () {
            sinon.stub(Conversation, 'findOne').rejects(new Error('Database error'));

            const response = await supertest(app).get('/getMessages/user2');

            expect(response.status).to.equal(500);
            expect(response.body).to.have.property('error', 'Database error');
        });
    });

    describe('getConversations', function () {
        it('should retrieve conversations excluding the current user',
        async function () {
        const mockConversations = [
            {
                _id: 'conversationId',
                participants: [{ _id: 'user2',
                username: 'User Two',
                profilePic: 'pic.jpg' 
            }]
            }
        ];

            // Stub the entire find().populate() chain using returnsThis()
            sinon.stub(Conversation, 'find').returns({
                populate: sinon.stub().resolves(mockConversations),
            });

            const response = await supertest(app).get('/getConversations');

            expect(response.status).to.equal(200);
            expect(response.body[0].participants[0]._id).to.equal('user2');
        });

        it('should return 500 on error', async function () {
            sinon.stub(Conversation, 'find').returns({
                populate: sinon.stub().rejects(new Error('Database error')),
            });

            const response = await supertest(app).get('/getConversations');

            expect(response.status).to.equal(500);
            expect(response.body).to.have.property('error', 'Database error');
        });
    });
});
