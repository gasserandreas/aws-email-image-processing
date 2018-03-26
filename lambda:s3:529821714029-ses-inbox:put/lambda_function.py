def lambda_handler(event, context):
    import boto3
    import email
    import base64
    import os
    
    # define vars
    inputContentType = os.environ['inputContentType']
    outputImageType = os.environ['outputImageType']
    outputBucket = os.environ['outputBucket']
    
    # get necessary information from event
    eventS3 = event['Records'][0]['s3']
    bucket = eventS3['bucket']['name']
    key = eventS3['object']['key']
    
    # create s3 resource
    s3 = boto3.client('s3')
    s3resource = boto3.resource('s3')
    
    # wait until object is ready
    waiterFlg = s3.get_waiter('object_exists')
    waiterFlg.wait(Bucket=bucket, Key=key)
    
    # load email from s3
    response = s3resource.Bucket(bucket).Object(key)
    messageString = response.get()['Body'].read().decode('utf-8')
    message = email.message_from_string(messageString)
    
    # only parse multipart emails (text + attachment)
    if message.is_multipart():
        # parse email content of inputContentType
        for part in message.walk():
            if part.get_content_type() == inputContentType:
                base64ImageString = part.get_payload()
        
        # create image from base64 string
        imageData = base64.b64decode(base64ImageString)
        filePath = '/tmp/newImage.' + outputImageType
        
        # save image to temp path
        with open(filePath, 'wb') as f:
            f.write(imageData)
        
        # write image to outout s3 bucket
        newFileName = key + '.' + outputImageType
        s3resource.meta.client.upload_file(filePath, outputBucket, newFileName)
        
        # echo message
        print('SUCCESS: Saved new image to output bucket')
        print('Image: ' + outputBucket + '/' + newFileName)
    else:
        print('Could not get image attachment')

    return ''
