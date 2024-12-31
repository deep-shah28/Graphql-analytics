const { EntitySchema } = require("typeorm");

const User = new EntitySchema({
  name: "User",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    age: {
      type: "int",
    },
  },
  relations: {
    posts: {
      target: "Post",
      type: "one-to-many",
      inverseSide: "user",
    },
  },
});

module.exports = User;
