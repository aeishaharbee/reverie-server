# A server for Reverie

This is a MongoDB connected server.

## Getting started

To set up this server project locally, follow these steps:

1. Creat a new folder. Inside the folder, create two new folders called 'client' and 'server'.

1. Inside the server file, clone the repository:

   ```
   git clone https://github.com/yourusername/reverie-server.git
   ```
2. Install the following dependencies:
   ```
   npm install
   ```
3. Create a .env file and add the following environment variables:
   ```
   SECRET_KEY=your_secret_key
   ```
4. Run the development servers:
   ```npm start```
5. If you see below lines, you've successfully connected to the server.
   ```
   Server is running on PORT: 4444
   Connected to MongoDB
   ```
