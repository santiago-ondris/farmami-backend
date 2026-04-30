import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import ingresoRoutes from './routes/ingreso.routes.js';
import egresoRoutes from './routes/egreso.routes.js';
import stockRoutes from './routes/stock.routes.js';
import exportRoutes from './routes/export.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import evaluacionesClientesRoutes from './routes/evaluaciones-clientes.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import evaluacionesProveedoresRoutes from './routes/evaluaciones-proveedores.routes.js';
import rechazosRoutes from './routes/rechazos.routes.js';
import remitosRoutes from './routes/remitos.routes.js';
import ordenesCompraRoutes from './routes/ordenes-compra.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/egresos', egresoRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api', evaluacionesClientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api', evaluacionesProveedoresRoutes);
app.use('/api/rechazos', rechazosRoutes);
app.use('/api/remitos', remitosRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
