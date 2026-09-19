JTalk_v1

AI-powered Japanese Speaking Practice — a web application for beginner Japanese learners (N4–N5).

1. Project Overview

JTalk helps Japanese learners practice speaking through a simple flow:

Choose Topic → Practice Speaking → Get Feedback → Improve

Tech Stack

Frontend

React

Vite

TypeScript

Tailwind CSS

Zustand

Axios

React Hook Form + Zod

Backend

Node.js

Express.js

MongoDB Atlas

Mongoose

JWT

bcrypt

2. Requirements

Before running the project, install:

Node.js 20+

npm

Git

MongoDB Atlas account

Check Node.js:

node -v
npm -v

3. Clone the Project

git clone git@github.com:quangtm11/JTalk_v1.git
cd JTalk_v1

If you use HTTPS instead:

git clone https://github.com/quangtm11/JTalk_v1.git
cd JTalk_v1

4. Project Structure

JTalk_v1/
├── backend/
│ ├── src/
│ ├── package.json
│ └── .env
│
├── frontend/
│ ├── src/
│ ├── package.json
│ └── ...
│
├── .gitignore
├── package.json
└── README.md

5. Environment Variables

Backend

Create:

backend/.env

Use the required environment variables provided by the project owner.

Example:

PORT=5001
MONGODB_CONNECTIONSTRING=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret

IMPORTANT

Do NOT commit .env to GitHub.

Do NOT share passwords, MongoDB connection strings, JWT secrets, refresh tokens, or other credentials publicly.

The repository already ignores .env.

6. Install Dependencies

From the project root:

npm install

This installs the root development dependency used to run frontend and backend together.

Then install project dependencies if needed:

cd backend
npm install

cd ../frontend
npm install

cd ..

7. Run the Entire Project

The recommended way is to run both frontend and backend from the root:

npm run dev

This starts:

Backend

http://localhost:5001

Frontend

http://localhost:5173

You should see both processes running in the terminal.

Example:

[0] backend -> nodemon src/server.js
[1] frontend -> vite

8. Run Frontend and Backend Separately

If you need to debug one side separately:

Backend

cd backend
npm run dev

Frontend

Open another terminal:

cd frontend
npm run dev

9. MongoDB Atlas

The backend requires a working MongoDB Atlas cluster.

Before running the backend:

Open MongoDB Atlas.

Open the JTalk project.

Check the database cluster status.

Make sure the cluster is running.

Make sure your current IP is allowed in Network Access / IP Access List.

Make sure the database connection string in backend/.env is correct.

If the Atlas cluster is paused, resume it before starting the backend.

10. Authentication

JTalk uses:

Short-lived JWT access token

HTTP-only refresh token cookie

MongoDB session storage

Main authentication endpoints:

POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
POST /api/auth/refresh
GET /api/users/me

Authentication flow

Sign Up
↓
Create User
↓
Sign In
↓
Access Token + Refresh Session
↓
Dashboard
↓
Refresh Page
↓
Restore Session
↓
Logout
↓
Sign In

11. First Run Checklist

After starting the project:

Frontend

Open:

http://localhost:5173

Test Sign Up

Open Sign Up.

Create a test account.

Submit the form.

Go to Sign In.

Test Sign In

Enter the account created above.

Sign in.

Verify that Dashboard loads.

Verify that the logged-in user's information is displayed.

Test Refresh

Press:

F5

The session should remain available if the refresh session is valid.

Test Protected Route

Open a protected page without being logged in.

The application should redirect to:

/signin

Test Logout

Click Logout.

Verify the user is redirected to /signin.

Try opening a protected page again.

It should require authentication.

12. Common Problems

Backend cannot connect to MongoDB

Check:

MongoDB Atlas cluster is running.

Your IP is allowed.

MONGODB_CONNECTIONSTRING exists in backend/.env.

The connection string belongs to the current Atlas cluster.

Your MongoDB database user/password is correct.

Typical error:

MongooseServerSelectionError
Could not connect to any servers

Port already in use

If port 5001 or 5173 is already being used, stop the previous development process and run the project again.

On Windows:

Ctrl + C

Dependencies are missing

From the project root:

npm install

If necessary:

cd backend
npm install

cd ../frontend
npm install

13. Development Rules

Before pushing code:

git status

Do not commit:

.env
node_modules/
dist/
build/

Never commit:

Database passwords

MongoDB connection strings containing credentials

JWT secrets

API keys

Refresh tokens

Before creating a pull request or pushing major changes, make sure the project can:

Start frontend.

Start backend.

Connect to MongoDB.

Sign up.

Sign in.

Refresh the page.

Access protected routes.

Log out.

14. Useful Commands

Start everything

npm run dev

Check Git status

git status

Pull latest changes

git pull

Install dependencies

npm install

15. Team Workflow

Recommended workflow:

git pull
↓
Create / switch branch
↓
Make changes
↓
Test locally
↓
git status
↓
git add .
↓
git commit
↓
git push

Avoid directly modifying another teammate's work without coordinating first.

16. Project Status

Current project structure has already been refactored and authentication is being cleaned up.

Main development priorities:

Authentication

Protected routes

User/session handling

UI integration with authenticated user data

Speaking practice

AI integration

17. Team Members

Repository:

JTalk_v1

GitHub:

git@github.com:quangtm11/JTalk_v1.git

For project questions, coordinate with the project owner before changing shared architecture or authentication logic.
