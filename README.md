# Quickotech Backend API

Backend API for Quickotech platform, built with Node.js, Express, and MongoDB.

## Features

- Authentication & Authorization (JWT)
- Blog Management
- User Management
- Product Management
- P2P File Sharing Architecture
- Swagger Documentation
- Environment Configuration
- Error Handling

## Prerequisites

- Node.js 18.x or higher
- MongoDB
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/quickotech-backend.git
cd quickotech-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_RESET_SECRET`: Secret key for password reset tokens
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## API Documentation

- Development: http://localhost:3000/api-docs
- Production: Update with your production URL

## Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server
- `npm test`: Run tests

## Deployment

The application can be deployed to any Node.js hosting platform of your choice. Make sure to:

1. Set up all required environment variables
2. Configure your production MongoDB instance
3. Set up proper security measures (SSL, firewalls, etc.)
4. Configure your domain and DNS settings
5. Set up proper logging and monitoring

## Project Structure

```
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── blog/
│   │       ├── user/
│   │       └── admin/
│   ├── config/
│   ├── middleware/
│   └── utils/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Security

- All sensitive data must be stored in environment variables
- Never commit `.env` files
- Keep dependencies updated
- Use secure middleware (helmet, cors, etc.)
- Validate all inputs
- Implement rate limiting for production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
