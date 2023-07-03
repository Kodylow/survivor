import * as express from 'express';
import * as session from 'express-session';
import { zbd } from '@zbd/node';
import * as cors from 'cors';
import * as path from 'path';
import { Client as Database } from "@replit/database"

const db = new Database()

const userGreedy = async (userId, amount) => {
    console.log("checking userGreedy...")
    // db tracks userId: satsSent
    const satsSent = await db.get(userId) as number | null
    // if userId not in db, add it with amount
    if (satsSent == null) {
        db.set(userId, amount)
        return false;
    } else {
        // else verify total amount to user won't exceed 10000000
        if (satsSent + amount > 10000) {
            return true;
        } else {
            db.set(userId, satsSent + amount)
            return false;
        }
    }
} 
        

const ZBD = new zbd(process.env.ZBD_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());
app.use(session({
  proxy: true,
  resave: false,
  secret: process.env.SECRET,
  cookie: {
    secure: true
  }            
}));

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  console.log('[Request Body]', req.body);
  next();
});

app.post('/payment', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ message: "No user id, no dice."});
    return;
  }
  
  const { amount, lnAddress, comment } = req.body;
  if (await userGreedy(userId, amount)) {
      res.status(429).json({ message: "You're greedy."});
      return;
  }

  try {
    const response = await ZBD.sendLightningAddressPayment({
      amount,
      lnAddress,
      comment,
      callbackUrl: undefined,
      internalId: undefined,
    });
    console.log('[Response]', response);
    res.json(response);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: "ZBD error" });
    return;
  }
});


app.get("/", (req, res) => {
  const userId = req.headers['x-replit-user-id'];
  if (userId) {
    req.session.userId = userId;
  }

  const wwwDir = path.resolve(__dirname, 'www');
  res.sendFile('index.html', {root: wwwDir}, (err) => {
    res.end();
    if (err) throw(err);
  });
});

app.use(express.static("www"))



app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running...');
});


// render_template('index.html',
//                            user_id=request.headers.get('X-Replit-User-Id'),
//                            user_name=request.headers.get('X-Replit-User-Name'))
//     # user_roles=request.headers.get('X-Replit-User-Roles'),
//     # user_bio=request.headers.get('X-Replit-User-Bio'),
//     # user_profile_image=request.headers.get('X-Replit-User-Profile-Image'),
//     # user_teams=request.headers.get('X-Replit-User-Teams'),
//     # user_url=request.headers.get('X-Replit-User-Url'))


// if (sats > 0 && lightningAddress) {
//         k.load(new Promise(async (resolve, reject) => {
//             try {
//               const response = await fetch("https://api.zebedee.io/v0/ln-address/send-payment", {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//                 'apikey': ZBD_API_KEY
//               },
//               body: JSON.stringify({
//                 amount: sats*1000, // in millisatoshis
//                 lnAddress: lightningAddress,
//               })
//             });
            
//             const data = await response.json();
            
//             if (data.success) {
//               console.log(data);
//               console.log(`Sats swept successfully: ${data}`);
//               resolve("ok");
//             } else {
//               console.log(data);
//               console.log(`Sat sweep unsuccessful: ${data}`);
//               reject(data);
//             }
//             } catch (err) {
//             console.error(`Failed to sweep sats: ${err}`);
//             reject(err);
//             }
//         }));
//     }
