const Boardgame = require('../models/Boardgame');
const { multipleMongooseToObject } = require('../util/mogoose');
const { mongooseToObject } = require('../util/mogoose');

class boardgameController {
    //[GET] /store
    async index(req, res, next) {
        try {
            const boardgames = await Boardgame.find({});
            res.render('layout/main', {
                boardgames: multipleMongooseToObject(boardgames)
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
            const randomGames = shuffle(boardgames).slice(0, 5);
            res.render('boardgames/detail', { 
                boardgame: mongooseToObject(boardgame),
                boardgames: multipleMongooseToObject(randomGames)
             });
             // Hàm xáo trộn mảng sản phẩm
            function shuffle(array) {
                let currentIndex = array.length, temporaryValue, randomIndex;
            
                while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
            
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
                }
            
                return array;
            }
          } catch (error) {
            next(error);
        }
    }

    async order(req, res, next){
        try {
            res.send('Order page');
        }
        catch(error){
            next(error);
        }
    }
}

module.exports = new boardgameController();