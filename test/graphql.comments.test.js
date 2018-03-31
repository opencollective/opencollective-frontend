import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import * as utils from './utils';
import models from '../server/models';
import roles from '../server/constants/roles';
import emailLib from '../server/lib/email';

let host, user1, user2, collective1, event1, expense1, comment1;
let sandbox, sendEmailSpy;

describe('graphql.comments.test', () => {

  /* SETUP
     - collective1: host, user1 as admin
       - event1: user1 as admin
     - user2
  */

  before(() => {
    sandbox = sinon.sandbox.create();
    sendEmailSpy = sandbox.spy(emailLib, 'sendMessage');
  });

  after(() => sandbox.restore());

  before(() => utils.resetTestDB());

  before(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => user1 = u));
  before(() => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));

  before(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => user2 = u));
  before(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));
  before(() => models.Expense.create({
    CollectiveId: collective1.id,
    CreatedByUserId: user1.id,
    FromCollectiveId: user1.CollectiveId,
    markdown: "This is a first **comment**"
  }).tap(e => expense1 = e));
  before(() => collective1.addUserWithRole(host, roles.HOST));
  before(() => collective1.addUserWithRole(user1, roles.ADMIN));

  before(() => {
    return models.Comment.create({
      CollectiveId: collective1.id,
      FromCollectiveId: user1.CollectiveId,
      CreatedByUserId: user1.id,
      title: `first comment & "love"`,
      html: `long text for the comment #1 <a href="https://google.com">here is a link</a>`,
    }).then(u => comment1 = u)
  });

  before('create an event collective', () => models.Collective.create(
    Object.assign(utils.data('event1'), { CreatedByUserId: user1.id, ParentCollectiveId: collective1.id }))
    .tap(e => event1 = e));
  before(() => event1.addUserWithRole(user1, roles.ADMIN));


  let comment;
  before(() => {
    comment = {
      title: `Monthly comment 2`,
      html: "This is the comment",
      collective: {
        id: collective1.id
      }
    };
  })

  describe('create a comment', () => {

    const createCommentQuery = `
    mutation createComment($comment: CommentInputType!) {
      createComment(comment: $comment) {
        id
        slug
        publishedAt
      }
    }
    `;

    it("fails if not authenticated", async () => {
      const result = await utils.graphqlQuery(createCommentQuery, { comment });
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal("You must be logged in to create a comment");
    });

    it("fails if authenticated but cannot edit collective", async () => {
      const result = await utils.graphqlQuery(createCommentQuery, { comment }, user2);
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].message).to.equal("You don't have sufficient permissions to create a comment");
    });

    it("creates a comment", async () => {
      const result = await utils.graphqlQuery(createCommentQuery, { comment }, user1);
      result.errors && console.error(result.errors[0]);
      const createdComment = result.data.createComment;
      expect(createdComment.slug).to.equal(`monthly-comment-2`);
    })
  })

  describe('edit a comment', () => {

    const editCommentQuery = `
    mutation editComment($comment: CommentAttributesInputType!) {
      editComment(comment: $comment) {
        id
        markdown
      }
    }
    `;

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(editCommentQuery, { comment: { id: comment1.id } });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You must be logged in to edit this comment");
    });

    it('fails if not authenticated as author or admin of collective', async () => {
      const result = await utils.graphqlQuery(editCommentQuery, { comment: { id: comment1.id } }, user2);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You must be the author or an admin of this collective to edit this comment");
    });

    it('edits a comment successfully', async () => {
      const result = await utils.graphqlQuery(editCommentQuery, { comment: { id: comment1.id, markdown: 'new *comment* text' } }, user1);
      expect(result.errors).to.not.exist;
      expect(result.data.editComment.html).to.equal('new <i>comment</i> text');
    });

  })

  describe('delete Comment', () => {

    const deleteCommentQuery = `
      mutation deleteComment($id: Int!) {
        deleteComment(id: $id) {
          id,
          slug
        }
      }`;

    it('fails to delete a comment if not logged in', async () => {
      const result = await utils.graphqlQuery(deleteCommentQuery, { id: comment1.id });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You must be logged in to delete this comment");
      return models.Comment.findById(comment1.id).then(commentFound => {
        expect(commentFound).to.not.be.null;
      })
    });

    it('fails to delete a comment if logged in as another user', async () => {
      const result = await utils.graphqlQuery(deleteCommentQuery, { id: comment1.id }, user2);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal("You need to be logged in as a core contributor or as a host to delete this comment");
      return models.Comment.findById(comment1.id).then(commentFound => {
        expect(commentFound).to.not.be.null;
      })
    });

    it('deletes a comment', async () => {
      const res = await utils.graphqlQuery(deleteCommentQuery, { id: comment1.id }, user1);
      res.errors && console.error(res.errors[0]);
      expect(res.errors).to.not.exist;
      return models.Comment.findById(comment1.id).then(commentFound => {
        expect(commentFound).to.be.null;
      })
    });
  });


  describe('query comments', () => {

    const allCommentsQuery = `
    query allComments($ExpenseId: Int, $limit: Int, $offset: Int) {
      allComments(ExpenseId: $ExpenseId, limit: $limit, offset: $offset) {
        id
        markdown
        html
      }
    }
    `;

    before(() => {
      return models.Comment.destroy({ where: {}, truncate: true }).then(() => models.Comment.createMany([
        { markdown: 'draft comment 1', createdAt: new Date('2018-01-11'), publishedAt: null },
        { markdown: 'comment 1', publishedAt: new Date('2018-01-01') },
        { markdown: 'comment 2', publishedAt: new Date('2018-01-02') },
        { markdown: 'comment 3', publishedAt: new Date('2018-01-03') },
        { markdown: 'comment 4', publishedAt: new Date('2018-01-04') },
        { markdown: 'comment 5', publishedAt: new Date('2018-01-05') },
        { markdown: 'comment 6', publishedAt: new Date('2018-01-06') },
        { markdown: 'comment 7', publishedAt: new Date('2018-01-07') },
        { markdown: 'comment 8', publishedAt: new Date('2018-01-08') },
        { markdown: 'comment 9', publishedAt: new Date('2018-01-09') },
        { markdown: 'comment 10', publishedAt: new Date('2018-01-10') },
      ], { CreatedByUserId: user1.id, ExpenseId: expense1.id }));
    });

    it('get all the comments that are published', async () => {
      const result = await utils.graphqlQuery(allCommentsQuery, { ExpenseId: expense1.id, limit: 5, offset: 2 });
      const comments = result.data.allComments;
      expect(result.errors).to.not.exist;
      expect(comments).to.have.length(5);
      expect(comments[0].slug).to.equal('comment-8');
    });

    it('get all the comments that are published and unpublished if admin', async () => {
      const result = await utils.graphqlQuery(allCommentsQuery, { ExpenseId: expense1.id, limit: 5, offset: 0 }, user1);
      const comments = result.data.allComments;
      expect(result.errors).to.not.exist;
      expect(comments).to.have.length(5);
      expect(comments[0].slug).to.equal('draft-comment-1');
    });
  });  
});
