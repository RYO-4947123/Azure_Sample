/*
** Sample Table Definition - this supports the Azure Mobile Apps
** TodoItem product with authentication and offline sync
*/
var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger'),
    azure = require('azure'),
    request = require('request');

// 環境変数
var enviromentvariables = require('../environmentvariables');

// Create a new table definition
var table = azureMobileApps.table();

var notificationHubService = azure.createNotificationHubService(enviromentvariables.NHS_NAME,enviromentvariables.NHS_SIGNATURE);

function pushFCM(message, from_userid) {
    var serverKey = enviromentvariables.FCS_SERVER_KEY;
    
    var options = {
        uri : "https://fcm.googleapis.com/fcm/send",
        headers : {
            "Authorization" : "key=" + serverKey,
            "Content-type" : "application/json",
        },
        json : {
            "to" : "/topics/all",
            "priority" : "high",
            "notification" : {
                "body" : message,
                "title" : "新着メッセージ",
                "icon" : "icon_for_notification",
                "color" : "#00ff00",
                "tag" : "push_msg"
            },
            "data" : {
                "from_userid" : from_userid
            }
        }
    };
    
    request.post(options, function(err, response, body){
        if (err) {
            logger.error('[FCM] Error while sending push notification: ', err);
        } else if(response.statusCode != 200) {
            logger.error('[FCM] Error while sending push notification: ');
        } else {
            logger.info('[FCM] Push notification sent successfully!');
        }
        logger.info("HTTP POST STATUS:" + response.statusCode);
    });
}

function pushGCM(messageParam) {
    // Define the template payload.
    //var payload = '{"to" : "/topics/all","priority": "high","notification" : {"body" : "Deleted","title" : "Azure Notification","icon" : "myicon"}}';
    //var payload = '{"data":{"message":"Notification Hub test notification"}}';
    var payload = '{"messageParam": "' + messageParam + '" }';
    
    notificationHubService.gcm.send(null, payload, function (error) {
        if (error) {
            logger.error('[GCM] Error while sending push notification: ', error);
        } else {
            logger.info('[GCM] Push notification sent successfully!');
        }
    });
}

// Configure specific code when the client does a request
// READ - only return records belonging to the authenticated user
// table.read(function (context) {
//   context.query.where({ userId: context.user.id });
//   return context.execute();
// });

// CREATE - add or overwrite the userId based on the authenticated user
// table.insert(function (context) {
//   context.item.userId = context.user.id;
//   return context.execute();
// });

// UPDATE - for this scenario, we don't need to do anything - this is
// the default version
//table.update(function (context) {
//  return context.execute();
//});

// DELETE - for this scenario, we don't need to do anything - this is
// the default version
table.delete(function (context) {
    logger.info('Running TodoItem.delete');
    var payload = '{"to" : "/topics/all","priority": "high","notification" : {"body" : "Deleted","title" : "Azure Notification","icon" : "myicon"}}';
    
    return context.execute()
        .then(function (results) {
            // Only do the push if configured
            if (context.push) {
                // Send a template notification.
                context.push.send(null, payload, function (error) {
                    if (error) {
                        logger.error('Error while sending push notification: ', error);
                    } else {
                        logger.info('Push notification sent successfully!');
                    }
                });
            }
            else {
                logger.info('Push notification not sent');
            }
            // Don't forget to return the results from the context.execute()
            return results;
        })
        .catch(function (error) {
            logger.error('Error while running context.execute: ', error);
        });
});

// Finally, export the table to the Azure Mobile Apps SDK - it can be
// read using the azureMobileApps.tables.import(path) method

table.insert(function (context) {
    // For more information about the Notification Hubs JavaScript SDK, 
    // see http://aka.ms/nodejshubs
    logger.info('Running TodoItem.insert');
    
    //pushGCM(context.item.text);
    pushFCM(context.item.text, context.item.userid);
    
    return context.execute();
    
    /*
    // Define the template payload.
    var payload = '{"messageParam": "' + context.item.text + '" }';
    
    // Execute the insert.  The insert returns the results as a Promise,
    // Do the push as a post-execute action within the promise flow.
    return context.execute()
        .then(function (results) {
            // Only do the push if configured
            if (context.push) {
                // Send a template notification.
                context.push.send(null, payload, function (error) {
                    if (error) {
                        logger.error('Error while sending push notification: ', error);
                    } else {
                        logger.info('Push notification sent successfully!');
                    }
                });
            }
            else {
                logger.info('Push notification not sent');
            }
            // Don't forget to return the results from the context.execute()
            return results;
        })
        .catch(function (error) {
            logger.error('Error while running context.execute: ', error);
        });
    */
});

module.exports = table;