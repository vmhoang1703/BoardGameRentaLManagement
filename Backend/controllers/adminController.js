const bcrypt = require('bcrypt');
const User = require('../models/User');
const Boardgame = require('../models/Boardgame');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { mongooseToObject } = require('../util/mongoose');
const { multipleMongooseToObject } = require('../util/mongoose');
const multer = require('multer');
const path = require('path');

// Thiết lập storage engine cho multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Boardgame_img/'); // Đường dẫn thư mục lưu trữ file
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, uniqueSuffix + extname); // Tên file được lưu trữ
  }
});

// Tạo middleware upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Giới hạn kích thước file (ở đây là 5MB)
  },
  fileFilter: function (req, file, cb) {
    // Kiểm tra loại file
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG file formats are allowed.'));
    }
  }
}).array('images', 5); // Tên trường trong form chứa các tệp tin ảnh (giới hạn là 5 ảnh)

  

class adminController {
  //[GET] /admin/
  async index(req, res, next){
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        res.send('Trang admin');
      }
    } catch(error){
      next(error);
    }
  } 

  //[GET] /admin/addboardgame
  async getAddBoardgamePage(req, res, next){
   try{
    if(req.session.user && req.session.user.role === 'admin'){
      const flash = req.flash();
      const user = await User.findOne({ _id: req.session.user }); //sử dụng phương thức findOne để tìm kiếm một boardgame trong cơ sở dữ liệu dựa trên giá trị _id lấy từ session (req.session.user) (phiên boardgame hiện tại sau khi đăng nhập)
      res.render('admin/them_san_pham',{
        flash,
        user: user,
      });
    }
   } catch(error){
    next(error);
   }
  }

  //[GET] /admin/editboardgame
  async getEditBoardgamePage(req, res, next){
    try{
      if(req.session.user && req.session.user.role === 'admin'){
        const boardgame = await Boardgame.findById(req.params.id);
        const user = await User.findOne({ _id: req.session.user });
        res.render('admin/chinh_sua_san_pham',{
        user: user,
        boardgame: mongooseToObject(boardgame),
        });
      }
    } catch(error){
      next(error);
    }
  }

  //[GET] /admin/manageboardgame
  async getManageBoardgamePage(req, res, next) {
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const flash = req.flash();
        const boardgames = await Boardgame.find({}).sort({ createdAt: -1 });
        const user = await User.findOne({ _id: req.session.user });
        const checkStock = req.query.checkStock || 'all';
        let filteredBoardgames = boardgames;

        // Lọc sản phẩm hết hàng
        if (checkStock !== 'all') {
          filteredBoardgames = filteredBoardgames.filter((boardgame) => boardgame.quantity.toString() === checkStock);
        }

        // Tìm kiếm sản phẩm theo id
        const boardgameSearchId = req.query.boardgameId;
        if (boardgameSearchId) {
          const boardgameSearch = await Boardgame.findOne({ Id: boardgameSearchId });
          if (boardgameSearch) {
            filteredBoardgames = [boardgameSearch];
          } else {
            req.flash('errorMessages', 'Sản phẩm không tồn tại');
            return res.redirect('/admin/manageboardgame');
          }
        }

        const itemsPerPage = 6; // Số sản phẩm trên mỗi trang
        const currentPage = req.query.page || 1; // Trang hiện tại (mặc định là 1)
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const boardgamesPage = filteredBoardgames.slice(startIndex, endIndex);
        res.render('admin/quan_ly_san_pham', {
          flash,
          user: user,
          boardgames: multipleMongooseToObject(boardgamesPage),
          totalPages: Math.ceil(filteredBoardgames.length / itemsPerPage),
          currentPage,
          checkStock: checkStock,
        });
      }
    } catch (error) {
      next(error);
    }
  }


  //[GET] /admin/manageorder
  async getManageOrderPage(req, res, next) {
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const user = await User.findOne({ _id: req.session.user });
        const orders = await Order.find({ orderStatus: { $in: [1, 2, 3, 4] } }).sort({ createdAt: -1 });
        const boardgames = await Boardgame.find();
        const users = await User.find();
        const orderStatus = req.query.orderStatus || 'all';
        let filteredOrders = orders;
        const flash = req.flash();


        // Lọc theo trạng thái đơn hàng
        if (orderStatus !== 'all') {
          filteredOrders = filteredOrders.filter((order) => order.orderStatus.toString() === orderStatus);
        }

        // Tìm kiếm đơn hàng
        const searchOrderId = req.query.orderId;
        if (searchOrderId) {
          const orderSearch = await Order.findOne({ Id: searchOrderId });
          if (orderSearch) {
            const order_idSearch = orderSearch._id;
            return res.redirect(`/admin/orderdetail/${order_idSearch}`);
          } else {
            req.flash('errorMessages', 'Đơn hàng không tồn tại');
            return res.redirect('/admin/manageorder');
          }
        }

        const ordersPerPage = 7; // Số đơn hàng trên mỗi trang
        const currentPage = req.query.page || 1; // Trang hiện tại (mặc định là 1)
        const startIndex = (currentPage - 1) * ordersPerPage;
        const endIndex = currentPage * ordersPerPage;
        const ordersPage = filteredOrders.slice(startIndex, endIndex);
        res.render('admin/quan_ly_don_hang', {
          flash,
          user: user,
          users: users,
          ordersPage: multipleMongooseToObject(ordersPage),
          totalPages: Math.ceil(filteredOrders.length / ordersPerPage),
          currentPage,
          boardgames: boardgames,
          orderStatus: orderStatus,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  //[GET] /admin/orderdetail
  async getOrderDetailPage(req, res, next){
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const user = await User.findOne({ _id: req.session.user });
        const order = await Order.findById(req.params.id);
        const boardgames = await Boardgame.find();
        const users = await User.find();
        await order.save();
        res.render('admin/chi_tiet_don_hang',{
          user: user,
          users: users,
          order: order,
          boardgames: boardgames,
        });
      }
    } catch(error){
      next(error);
    }
  }

  //[GET] /admin/managecustomer
  async getManageCustomerPage(req, res, next){
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const user = await User.findOne({ _id: req.session.user });
        const users = await User.find({ username: { $ne: 'admin' } }).sort({ createdAt: -1 });
        const flash = req.flash();

        //Tìm kiếm khách hàng theo Id
        const customerSearchId = req.query.customerId;//Lấy Id khách hàng trên Url từ name = 'customerId' từ input 
        if(customerSearchId){
          const customerSearch = await User.findOne({ Id: customerSearchId});
          if(customerSearch){
            let customerSearch_id = customerSearch._id;
            res.redirect(`/admin/managecustomer/${customerSearch_id}`)
          } else {
            req.flash('errorMessages', 'Khách hàng không tồn tại');
            return res.redirect('/admin/managecustomer/');
          }
        }

        const cusPerPage = 7;
        const currentPage = req.query.page || 1;
        const startIndex = (currentPage - 1) * cusPerPage;
        const endIndex = currentPage * cusPerPage;
        const cusPage = users.slice(startIndex, endIndex);
        res.render('admin/quan_ly_khach_hang',{
          flash,
          user: user,
          users: users,
          currentPage,
          cusPage: multipleMongooseToObject(cusPage),
          totalPages: Math.ceil(users.length / cusPerPage),
          currentPage,
        });
      }
    } catch(error){
      next(error);
    }
  }

  //[GET] /admin/managecustomer/:id
  async getDetailCustomerPage(req, res, next){
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const user = await User.findOne({ _id: req.session.user });
        const cus = await User.findById(req.params.id);
        const orders = await Order.find({ customerId: cus._id });
        const ordersRenting = await Order.find({ customerId: cus._id, orderStatus: { $in: [1, 2, 3] } });
        res.render('admin/chi_tiet_khach_hang',{
          user: user,
          cus: cus,
          orders: orders,
          ordersRenting: ordersRenting,
        });
      }
    } catch(error){
      next(error);
    }
  }

  //[POST] /admin/addboardgame
async addBoardgame(req, res, next){
  try{
    if(req.session.user && req.session.user.role === 'admin'){
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        const { name, description, price, ages, playerMin, playerMax, length, quantity } = req.body;

        if (!name || !description ||  !price || !ages || !playerMin || !playerMax || !length ||!quantity) {
          req.flash('errorMessages','Chưa điền đầy đủ thông tin')
          return res.redirect('/admin/addboardgame');
        }

        const boardgame = new Boardgame({
          name,
          description,
          price,
          ages,
          playerMin,
          playerMax,
          length,
          quantity,
        });

        if (req.files) {
          boardgame.images = req.files.map(file => file.filename); // Lưu danh sách tên file vào trường images
          boardgame.imageUrls = req.files.map(file => '/Boardgame_img/' + file.filename); // Lưu danh sách đường dẫn đầy đủ của ảnh
        }

        const existBoardgame = await Boardgame.findOne({name : boardgame.name});
        if(existBoardgame){
          req.flash('errorMessages','Tên sản phẩm đã tồn tại');
          return res.redirect(`/admin/addboardgame`);
        }

        if(boardgame.ages === 0){
          req.flash('errorMessages','Độ tuổi phải lớn hơn 0');
          return res.redirect(`/admin/addboardgame`);
        }

        if(boardgame.playerMax < boardgame.playerMin){
          req.flash('errorMessages','Số người chơi tối đa phải lớn hơn số người chơi tối thiểu');
          return res.redirect(`/admin/addboardgame`);
        }

        await boardgame.save();
        res.redirect('/admin/manageboardgame');
      });
    }
  } catch(error){
    next(error);
  }
}


  //[POST] /admin/editboardgame/:id
  async editBoardgame(req, res, next) {
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const boardgames = await Boardgame.find();
        const filter = { _id : req.params.id };
        const update = {
          name: req.body.name,
          description: req.body.description,
          ages: req.body.ages,
          playerMax: req.body.playerMax,
          playerMin: req.body.playerMin,
          length: req.body.length,
          price: req.body.price,
          quantity: req.body.quantity
        }

        await Boardgame.findOneAndUpdate(filter, update, {
          new: true
        });
        res.redirect('/admin/manageboardgame');
      }
    } catch (error) {
      next(error);
    }
  }

  // [POST] /admin/deleteBoardgame/:id
  async deleteBoardgame (req, res, next){
    try{
      if(req.session.user && req.session.user.role === 'admin'){
        const boardgameId = req.params.id;
        const flash = req.flash();
        // Kiểm tra xem sản phẩm có tồn tại không
        const boardgame = await Boardgame.findById(boardgameId);
        if (!boardgame) {
          req.flash('errorMessages', 'Sản phẩm không tồn tại');
          return res.redirect('/admin/manageboardgame');
        }

        // Thực hiện xóa sản phẩm
        await Boardgame.findByIdAndRemove(boardgameId);

        req.flash('errorMessages', 'Sản phẩm đã được xóa');
        res.redirect('/admin/manageboardgame');
      }
    } catch (error){
      next(error);
    }
  }

  //[POST] /admin/orderdetail/:id
  async editOrder(req, res, next) {
    try {
      if(req.session.user && req.session.user.role === 'admin'){
        const filter = { _id : req.params.id };
        const update = {
          orderStatus: parseInt(req.body.orderStatus),
        };

        await Order.findOneAndUpdate(filter, update, {
          new: true
        });

        const order = await Order.findById(filter);
        switch(order.orderStatus) {
            // case 1:
            //   order.progressTime.created = order.createdAt;
            //   order.progressTime.confirmed = order.createdAt;
            //   await order.save();
            //   break;
            case 2:
              order.progressTime.payment = new Date();
              await order.save();
              break;
            case 3:
              order.progressTime.due = new Date();
              await order.save();
              break;
            case 4:
              order.progressTime.completed = new Date();
              await order.save();
              break;
            default:
              await order.save();
              break;
        }
        res.redirect('/admin/manageorder');
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new adminController();
