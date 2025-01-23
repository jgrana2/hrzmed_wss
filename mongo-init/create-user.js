// create-user.js

// 1. Authenticate as root
db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

// 2. Switch to the database you want to create
db = db.getSiblingDB(process.env.DBNAME);

// 3. Create a non-root user with readWrite role
db.createUser({
  user: process.env.MONGO_USER,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    { role: "readWrite", db: process.env.DBNAME }
  ]
});