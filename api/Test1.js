var logger = require('azure-mobile-apps/src/logger');

module.exports = {
    get: function (req, res, next) {
        var date = { currentTime: Date.now() };
        res.status(200).type('application/json').send(date);
    },
    post: function(req, res, next) {
        
        var userID = req.body.userid;
        logger.info(userID);
        
        /*
        var qs = require('querystring');
		var body = '';
		var param;
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			param = qs.parse(body).param1;
		});
        logger.info("body:" + body);
        logger.info("param:" + param);
        */
        
        if (typeof req.body.userid === 'undefined') {
            res.status(400);
            res.json('パラメータ不足');
            return next();
        }
        
        //var table = req.service.tables.getTable('todoitem');
        
        // SQLインジェクションチェック
        if( userID.toLowerCase().indexOf('insert') != -1 ||
            userID.toLowerCase().indexOf('update') != -1 ||
            userID.toLowerCase().indexOf('delete') != -1) {
            res.status(400);
            res.json('不正なリクエストです！');
            return next();
        }
        
        /*
        var query = {
            sql : "SELECT * FROM todoitem WHERE userid = @user",
            parameters: [{
                user: userID
            }]
        };
        */
        
        var query = {
            sql : "SELECT * FROM todoitem WHERE userid = '" + userID + "'"
        };
        
        req.azureMobile.data.execute(query)
        .then(function(results) {
            //res.send(statusCodes.OK, { message : '' });
            res.json(results);
        });
    }
}
