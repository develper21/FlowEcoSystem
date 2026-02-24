import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import bomRoutes from './routes/bom.routes';
import ecoRoutes from './routes/eco.routes';
import reportRoutes from './routes/report.routes';
import roleRoutes from './routes/role.routes';
import notificationRoutes from './routes/notification.routes';
import comparisonRoutes from './routes/comparison.routes';
import settingsRoutes from './routes/settings.routes';
import operationsRoutes from './routes/operations.routes'; // CRITICAL FIX: Operations routes
import attachmentRoutes from './routes/attachment.routes'; // Attachment routes
import roleRequestRoutes from './routes/roleRequest.routes'; // Role request routes

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
// Server restart trigger for DB sync

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'ECOFlow Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to ECOFlow API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/ecos', ecoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/operations', operationsRoutes); // CRITICAL FIX: Operations endpoints for OPERATIONS role
app.use('/api', attachmentRoutes); // Attachment upload endpoints
app.use('/api/role-requests', roleRequestRoutes); // Role request endpoints

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 ECOFlow Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
