# Quickotech-Backend

Backend service for Quickotech, a cyber cafe management system.

## Deployment Status
![Deployment Status](https://github.com/Quickoline/Quickotech-Backend/workflows/Deploy%20to%20EC2/badge.svg)

## Features

- Document Services (Print, Scan, Photocopy)
- Order Management
- User Authentication & Authorization
- Admin Dashboard
- Chat System
- Blog Management
- OCR Integration

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Socket.IO for real-time chat

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Quickoline/Quickotech-Backend.git
   cd Quickotech-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

API documentation is available through Swagger UI at `/api-docs` when running the server.

## Deployment

This project is configured for automated deployment using GitHub Actions and AWS Elastic Beanstalk.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
