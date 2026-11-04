import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import createOrderHandler from './api/create-ngenius-order.js';
import verifyPaymentHandler from './api/verify-ngenius-payment.js';
import webhookHandler from './api/ngenius-webhook.js';
import createDemoBookingHandler from './api/create-demo-booking.js';
import seatHoldHandler from './api/seat-hold.js';
import verifyTicketHandler from './api/verify-ticket.js';
import ticketAccessHandler from './api/ticket-access.js';
import adminBookingsHandler from './api/admin-bookings.js';
import adminEventsHandler from './api/admin-events.js';
import adminVenuesHandler from './api/admin-venues.js';
import adminCategoriesHandler from './api/admin-categories.js';
import adminPromoCodesHandler from './api/admin-promo-codes.js';

function adaptServerlessHandler(handler) {
  return async (req, res) => {
    // Populate req.query from req.url for Vercel/serverless compatibility
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch (_) {
      req.query = {};
    }

    const execute = async (bodyString) => {
      try {
        req.body = bodyString ? JSON.parse(bodyString) : {};
      } catch (_) {
        req.body = {};
      }

      const mockRes = {
        status(code) {
          res.statusCode = code;
          return this;
        },
        setHeader(k, v) {
          res.setHeader(k, v);
          return this;
        },
        json(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end(data) {
          res.end(data);
        }
      };

      try {
        await handler(req, mockRes);
      } catch (e) {
        console.error('Vite API proxy error:', e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    };

    if (req.method === 'GET' || req.method === 'HEAD' || req.readableEnded) {
      return execute('');
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => execute(body));
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env with loaded env for server-side handlers
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'ngenius-backend-api',
        configureServer(server) {
          server.middlewares.use('/api/create-ngenius-order', adaptServerlessHandler(createOrderHandler));
          server.middlewares.use('/api/verify-ngenius-payment', adaptServerlessHandler(verifyPaymentHandler));
          server.middlewares.use('/api/ngenius-webhook', adaptServerlessHandler(webhookHandler));
          server.middlewares.use('/api/create-demo-booking', adaptServerlessHandler(createDemoBookingHandler));
          server.middlewares.use('/api/seat-hold', adaptServerlessHandler(seatHoldHandler));
          server.middlewares.use('/api/verify-ticket', adaptServerlessHandler(verifyTicketHandler));
          server.middlewares.use('/api/ticket-access', adaptServerlessHandler(ticketAccessHandler));
          server.middlewares.use('/api/admin-bookings', adaptServerlessHandler(adminBookingsHandler));
          server.middlewares.use('/api/admin-events', adaptServerlessHandler(adminEventsHandler));
          server.middlewares.use('/api/admin-venues', adaptServerlessHandler(adminVenuesHandler));
          server.middlewares.use('/api/admin-categories', adaptServerlessHandler(adminCategoriesHandler));
          server.middlewares.use('/api/admin-promo-codes', adaptServerlessHandler(adminPromoCodesHandler));
        }
      }
    ],
    server: {
      host: true,
      port: 5190,
    },
  };
});
