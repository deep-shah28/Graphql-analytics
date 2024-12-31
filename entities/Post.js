const { EntitySchema } = require("typeorm");

const Post = new EntitySchema({
  name: "Post",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    title: {
      type: "varchar",
    },
    content: {
      type: "text",
    },
    userId: {
      type: "int",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      inverseSide: "posts",
      joinColumn: {
        name: "userId",
      },
    },
  },
});

module.exports = Post;
