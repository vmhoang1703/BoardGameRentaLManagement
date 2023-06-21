const boardgameRouter = require('./storeRouter');
const orderRouter = require('./orderRouter');
const userRouter = require('./userRouter');
const authRouter = require('./authRouter');
const homeRouter = require('./homeRouter')

function route(app) {
  app.use('/', homeRouter); 
  app.use('/user', userRouter);
  app.use('/store/order', orderRouter);
  app.use('/store', boardgameRouter);   
  app.use('/', authRouter); 
}

module.exports = route;
