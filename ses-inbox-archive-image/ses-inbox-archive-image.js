exports.handler = (event, context, callback) => {

    //
    // Moves processed files from upload to archive directory.  Normally the
    // last processing step. 
    //

    var AWS = require('aws-sdk');
    var s3 = new AWS.S3({apiVersion: '2006-03-01', region: process.env.AWS_REGION});
    
    const newBucket = process.env.ARCHIVE_BUCKET;

    // Retrieve parameters from export handler event
    var oldBucket = event.bucket;
    var oldFilename = event.key;
    var alert = event.Alert;

    // "New file" retains same name, just the path is changed from upload to archive
    var newFilename = oldFilename;
    
    // // In which subdirectory shall the file be saved?
    // if (alert == 'true'){
    //     newFilename = event.key.replace('upload/', 'archive/alerts/');          // All Alerts
    // }else{
    //     newFilename = event.key.replace('upload/', 'archive/falsepositives/');  // False positives
    // }
    
    // Parameters for copy function
    var archiveParams = {
       Bucket: newBucket,
       CopySource: oldBucket+'/' + oldFilename,
       Key: newFilename,
    };
    
    // Parameters for delete function
    var deleteParams = {
       Bucket: oldBucket,
       Key: oldFilename,
    };
    
    // Moving requires first a copy...
    s3.copyObject(archiveParams, function(err, data) {
      if (err) {
        var errorMessage =  'Error in in [s3-archive-image].\r' + 
                                '   Error copying [' + oldFilename + '] to [' + newFilename + '] in bucket ['+newBucket+'].\r' +  
                                '   Function input ['+JSON.stringify(event, null, 2)+'].\r' +  
                                '   Error ['+err+'].';
              
        console.log(errorMessage, err);
        callback(errorMessage, null);
      } if (data) {
          
        // ...followed by a delete   
        s3.deleteObject(deleteParams, function(err, data){
          if (err) {
            var errorMessage =  'Error in in [s3-archive-image].\r' + 
                                '   Error deleting [' + oldFilename +'] from oldBucket ['+oldBucket+'].\r' + 
                                '   Function input ['+JSON.stringify(event, null, 2)+'].\r' +  
                                '   Error ['+err+'].';
              
            console.log(errorMessage, err);
            callback(errorMessage, null);
          } else {
            console.log('Successful archiving [' + newFilename + ']');
            callback(null, 'Successful archiving [' + newFilename + ']');
          }
        });
      }
    });
};
