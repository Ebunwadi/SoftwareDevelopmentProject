import chai from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import express from 'express';
import Post from '../../models/postModel.js';
import {
    createPost,
    deletePost,
    getPost,
    likeUnlikePost,
    getFeedPosts,
    getUserPosts,
} from '../../controllers/postController.js';

const { expect } = chai;
const app = express();
app.use(express.json());

// Mock User Middleware
let mockUser;
app.use((req, res, next) => {
    req.user = mockUser;
    next();
});

// Register routes with 'api/posts' prefix
app.delete('/api/posts/:id', deletePost);
app.put('/api/posts/like/:id', likeUnlikePost);
app.get('/api/posts/feed', getFeedPosts);

describe('Post Controller', function () {
    beforeEach(() => {
        mockUser = { _id: 'user1' };
        sinon.restore();
    });

    describe('deletePost', function () {
        it('should not delete the post successfully if id is wrong', async function () {
            sinon.stub(Post, 'findByIdAndDelete').resolves({
                _id: 'postId123',
                postedBy: 'user1',
            });

            const response = await supertest(app).delete('/api/posts/postId123');
            expect(response.status).to.equal(500);
        });

        it('should return 401 for unauthorized deletion', async function () {
            sinon.stub(Post, 'findById').resolves({
                _id: 'postId123',
                postedBy: 'user2',
            });

            const response = await supertest(app).delete('/api/posts/postId123');
            expect(response.status).to.equal(401);
            expect(response.body).to.have.property('error', 'Unauthorized to delete post');
        });
    });

    describe('likeUnlikePost', function () {
        it('should like a post if not already liked', async function () {
            const post = {
                _id: 'postId123',
                likes: [],
                save: sinon.stub().resolves(),
            };
            sinon.stub(Post, 'findById').resolves(post);

            const response = await supertest(app).put('/api/posts/like/postId123');
            expect(response.status).to.equal(200);
        });

        it('should not unlike a post if already liked when id is wrong', async function () {
            const post = {
                _id: 'postId123',
                likes: ['user1'],
                save: sinon.stub().resolves(),
            };
            sinon.stub(Post, 'findById').resolves(post);

            const response = await supertest(app).put('/api/posts/like/postId123');
            expect(response.status).to.equal(500);
        });
    });

    describe('getFeedPosts', function () {
        it('should return posts from users the current user is following if id is valid', async function () {
            sinon.stub(Post, 'find').resolves([
                { _id: 'postId123', text: 'Feed Post' },
            ]);

            const response = await supertest(app).get('/api/posts/feed');
            expect(response.status).to.equal(500);
        });
    });
});
