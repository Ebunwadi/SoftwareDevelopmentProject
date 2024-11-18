/* eslint-disable no-undef */
import { expect } from 'chai';
import sinon from 'sinon';
import { io as Client } from 'socket.io-client';
import { server, getRecipientSocketId } from '../../socket/socket.js';
import Message from '../../models/messageModel.js';
import Conversation from '../../models/conversationModel.js';

const PORT = 5000;
const URL = `http://localhost:${PORT}`;
let clientSocket;

describe('Socket.IO Server', function () {
    let messageStub, conversationStub;

    before((done) => {
        if (!server.listening) {
            server.listen(PORT, done); // Start server if not already listening
        } else {
            done();
        }
    });

    beforeEach(() => {
        sinon.restore(); // Reset stubs before each test

        // Stub database calls to prevent actual database interactions
        messageStub = sinon.stub(Message, 'updateMany').resolves({ nModified: 1 });
        conversationStub = sinon.stub(Conversation, 'updateOne').resolves({ nModified: 1 });

        // Connect client socket with a mocked user ID
        clientSocket = new Client(URL, {
            query: { userId: 'user1' },
        });
    });

    afterEach(() => {
        clientSocket.close(); // Disconnect client after each test
    });

    it('should connect a client and emit online users',
        (done) => {
        clientSocket.once('getOnlineUsers',
        (onlineUsers) => {
        expect(onlineUsers).to.include('user1');
        done();
        });
    });

    it('should handle markMessagesAsSeen event and emit messagesSeen',
        (done) => {
        clientSocket.emit('markMessagesAsSeen',
        { conversationId: 'conversation1', userId: 'user1' });

        clientSocket.once('messagesSeen', (data) => {
            expect(data).to.have.property('conversationId', 'conversation1');
            expect(messageStub.calledOnce).to.be.true;
            expect(conversationStub.calledOnce).to.be.true;
            done();
        });
    });

    it('should update online users list on disconnect', function (done) {
        this.timeout(5000); // Ensure this test doesn't timeout

        clientSocket.once('getOnlineUsers', (onlineUsers) => {
            expect(onlineUsers).to.include('user1');
            clientSocket.disconnect(); // Disconnect the client

            // Verify that user is removed from `userSocketMap`
            setTimeout(() => {
                expect(getRecipientSocketId('user1')).to.be.undefined; // user1 should be removed
                done();
            }, 100); // Small delay to allow disconnect to propagate
        });
    });

    it('getRecipientSocketId should return correct socket ID', () => {
        expect(getRecipientSocketId('user1')).to.equal(clientSocket.id); // Should return the client socket ID for user1
    });
});
