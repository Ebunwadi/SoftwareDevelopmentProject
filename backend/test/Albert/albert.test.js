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
app.post('/api/posts/create', createPost);
app.get('/api/posts/:id', getPost);
app.delete('/api/posts/:id', deletePost);

describe('Post Controller', function () {
    beforeEach(() => {
        mockUser = { _id: 'user1' };
        sinon.restore();
    });

    describe('createPost', function () {
        it('should not create a post if a required field is absent', async function () {
            sinon.stub(Post.prototype, 'save').resolves({
                _id: 'newPostId',
                text: 'Test Post',
                postedBy: 'user1',
            });

            const response = await supertest(app)
                .post('/api/posts/create')
                .send({ text: 'Test Post' });

            expect(response.status).to.equal(400);
        });
    });

    describe('getPost', function () {
        it('should return the post by ID', async function () {
            sinon.stub(Post, 'findById').resolves({
                _id: 'postId123',
                text: 'Test Post',
            });

            const response = await supertest(app).get('/api/posts/postId123');
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('text', 'Test Post');
        });

        it('should return 404 if post is not found', async function () {
            sinon.stub(Post, 'findById').resolves(null);

            const response = await supertest(app).get('/api/posts/unknownId');
            expect(response.status).to.equal(404);
            expect(response.body).to.have.property('error', 'Post not found');
        });
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
});
