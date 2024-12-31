const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLID,
  GraphQLNonNull,
} = require("graphql");
const { AppDataSource } = require("../config/db");

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    age: { type: GraphQLInt },
    posts: {
      type: new GraphQLList(PostType),
      resolve(parent) {
        return AppDataSource.getRepository("Post").find({
          where: { userId: parent.id },
        });
      },
    },
  }),
});

const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
    userId: { type: GraphQLID },
    user: {
      type: UserType,
      resolve(parent) {
        return AppDataSource.getRepository("User").findOne({
          where: { id: parent.userId },
        });
      },
    },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(_, args) {
        return AppDataSource.getRepository("User").findOne({
          where: { id: args.id },
        });
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(_, args) {
        return AppDataSource.getRepository("User").find();
      },
    },
    post: {
      type: PostType,
      args: { id: { type: GraphQLID } },
      resolve(_, args) {
        return AppDataSource.getRepository("Post").findOne({
          where: { id: args.id },
        });
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve() {
        return AppDataSource.getRepository("Post").find({
          relations: ["user"],
        });
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    // user
    addUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(_, args) {
        const userRepository = AppDataSource.getRepository("User");
        const existingUser = await userRepository.findOne({
          where: { email: args.email },
        });
        if (existingUser) throw new Error("Email already exists");
        const user = userRepository.create(args);
        return await userRepository.save(user);
      },
    },
    updateUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        age: { type: GraphQLInt },
      },
      async resolve(_, args) {
        const userRepo = AppDataSource.getRepository("User");
        await userRepo.update(args.id, {
          name: args.name,
          email: args.email,
          age: args.age,
        });
        return await userRepo.findOne({ where: { id: args.id } });
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_, args) {
        const userRepo = AppDataSource.getRepository("User");
        const postRepo = AppDataSource.getRepository("Post");
        const user = await userRepo.findOne({ where: { id: args.id } });
        if (!user) throw new Error("User not found");

        // Check if the user has any posts
        const userPosts = await postRepo.find({ where: { userId: args.id } });
        if (userPosts.length > 0)
          throw new Error("Cannot delete user with existing posts");

        await userRepo.delete(args.id);
        return user;
      },
    },
    // posts
    addPost: {
      type: PostType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        userId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_, args) {
        const postRepo = AppDataSource.getRepository("Post");
        const post = postRepo.create({
          title: args.title,
          content: args.content,
          userId: args.userId,
          createdAt: new Date().toISOString(),
        });
        return await postRepo.save(post);
      },
    },
    updatePost: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
        userId: { type: GraphQLID },
      },
      async resolve(_, args) {
        const postRepo = AppDataSource.getRepository("Post");
        await postRepo.update(args.id, {
          title: args.title,
          content: args.content,
          userId: args.userId,
        });
        return await postRepo.findOne({ where: { id: args.id } });
      },
    },
    deletePost: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_, args) {
        const postRepo = AppDataSource.getRepository("Post");
        const post = await postRepo.findOne({ where: { id: args.id } });
        if (!post) throw new Error("Post not found");
        await postRepo.delete(args.id);
        return post;
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
