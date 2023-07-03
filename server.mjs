import express from 'express';
import { zbd } from '@zbd/node';
import cors from 'cors';

const ZBD = new zbd(process.env.ZBD_API_KEY)

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  console.log('[Request Body]', req.body);
  next();
});

app.post('/payment', async (req, res) => {
  const { amount, lnAddress, comment } = req.body;

  const response = await zbd.sendLightningAddressPayment({ amount, lnAddress, comment });

  console.log('[Response]', response);

  res.json(response);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running...');
});
