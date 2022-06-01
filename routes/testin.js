var express = require('express');
var router = express.Router();

/* GET testin page. */
router.get('/', function(req, res, next) {
    res.render('testin', { title: 'testin'});
});

module.exports = router;

