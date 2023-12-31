const Boardgame = require('../models/Boardgame');
const User = require('../models/User');
const { multipleMongooseToObject } = require('../util/mongoose');
const { mongooseToObject } = require('../util/mongoose');


class storeController {
    //[GET] /store
    async index(req, res, next) {
        try {
            const { name, price, max_players, min_players, playing_time, age } = req.query; // Lấy giá trị tên sản phẩm từ query params
            let query = {}; // Mặc định là truy vấn tất cả sản phẩm

            // Nếu có tên sản phẩm được cung cấp, thêm điều kiện tìm kiếm vào truy vấn
            if (name) {
                query = { name: { $regex: name, $options: 'i' } };
            }

            if (max_players) {
                // Thêm điều kiện lọc theo số người chơi tối đa
                query.playerMax = parseInt(max_players);
            }

            if (min_players) {
                // Thêm điều kiện lọc theo số người chơi tối thiểu
                query.playerMin = parseInt(min_players);
            }

            if (playing_time) {
                // Thêm điều kiện lọc theo thời gian chơi
                query.length = parseInt(playing_time);
            }

            if (age) {
                // Thêm điều kiện lọc theo độ tuổi
                query.ages = parseInt(age);
            }
            const boardgamesOrigin = await Boardgame.find(query);
            const boardgamesCount = await Boardgame.countDocuments(query);
            const boardgamesNewest = await Boardgame.find(query).sort({createdAt : -1});
            const user = await User.findOne({ _id: req.session.user });
            const boardgamesOption = req.query.boardgames || 'all';

            if(boardgamesOption !== 'all'){
                const itemsPerPage = 20; // Số sản phẩm trên mỗi trang
                const currentPage = req.query.page || 1; // Trang hiện tại (mặc định là 1)
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = currentPage * itemsPerPage;
                const boardgamesPage = boardgamesNewest.slice(startIndex, endIndex);
                res.render('customer_website/boardgames/store', {
                    boardgames: multipleMongooseToObject(boardgamesPage),
                    currentPage,
                    totalPages: Math.ceil(boardgamesNewest.length / itemsPerPage),
                    user: user,
                    boardgamesCount: boardgamesCount,
                    boardgamesOption,
            });
            }

            const itemsPerPage = 20; // Số sản phẩm trên mỗi trang
            const currentPage = req.query.page || 1; // Trang hiện tại (mặc định là 1)
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = currentPage * itemsPerPage;
            const boardgamesPage = boardgamesOrigin.slice(startIndex, endIndex);
            res.render('customer_website/boardgames/store', {
                boardgames: multipleMongooseToObject(boardgamesPage),
                boardgamesNewest: boardgamesNewest,
                currentPage,
                totalPages: Math.ceil(boardgamesOrigin.length / itemsPerPage),
                user: user,
                boardgamesCount: boardgamesCount,
                boardgamesOption
            });
        } catch (error) {
            next(error);
        }
    }
    
    //[GET] /store/:id 
    async show(req, res, next) {
        try {
            const boardgames = await Boardgame.find({});
            const boardgame = await Boardgame.findById(req.params.id);
            const user = await User.findOne({ _id: req.session.user });
            const formattedPrice = boardgame.price.toLocaleString('vi-VN');

            //Sản phẩm tương tự theo khoảng giá hơn kém 100k
            let similarBoardgames = boardgames.filter((game) => Math.abs(game.price - boardgame.price) <= 50000 && game._id.toString() !== boardgame._id.toString());
            similarBoardgames = similarBoardgames.slice(0,5);
            
            res.render('customer_website/boardgames/detail', { 
                boardgame: mongooseToObject(boardgame),
                similarBoardgames: multipleMongooseToObject(similarBoardgames),
                formattedPrice,
                user: user,
             });
          } catch (error) {
            next(error);
        }
    }
}

module.exports = new storeController();
