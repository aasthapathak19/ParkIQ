import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ParkIQ API',
      version: '1.0.0',
      description: 'API documentation for the ParkIQ Smart Parking Platform',
    },
    servers: [
      {
        url: `${env.APP_URL}/api/${env.API_VERSION}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.routes.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
