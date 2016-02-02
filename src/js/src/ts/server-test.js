/// <reference path="../../typings/express/express.d.ts" />
/// <reference path="../../typings/body-parser/body-parser.d.ts" />
var express = require('express');
const app = express();
var bodyParser = require('body-parser');
var DAO = require('./dao/daoImpl');
const userDAO = new DAO.InMemoryUserDAO();
// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = process.env.PORT || 8080;
const router = express.Router();
// // test route
// router.get('/', function (req, res) {
//     res.json({message: 'welcome' + req.query.name});
// });
router.get('/', function (req, res) {
    res.json(userDAO.read(req.query.id));
});
router.post('/', function (req, res) {
    res.json(userDAO.create(req.body));
});
router.put('/', function (req, res) {
    res.json({ result: userDAO.update(req.body) });
});
router.delete('/', function (req, res) {
    res.json({ result: userDAO.delete(req.query.id) });
});
// prefixed all routes with /api
app.use('/api', router);
app.listen(port);
console.log('http://127.0.0.1:' + port + '/api');

//# sourceMappingURL=../../maps/src/ts/server-test.js.map
