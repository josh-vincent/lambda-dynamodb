# Lambda and DynamoDB

Lambda function for interacting with DynamoDB

### Prerequisites

Set up SQS QUEUE and give lambda permissions to SQS
Set up DynamoDB tables and give lambda permissions to it.

`npm install uuid`

### Get individual item from table 
```javascript 
const getIndividualItem = (TABLE_NAME, id) => {
    
    let inputParams = {
        TableName: TABLE_NAME,
        Key: {
            id: id,
        },
    };
    
    const item = await docClient.get(inputParams).promise()
        .then((data) => console.log(data))
        .catch((err) => console.log(err));
    return item
}
```
### Get all items from table 
```javascript 
const getAllItemsFromTable = (TABLE_NAME) => {
    let params = { TableName: TABLE_NAME };
    let items;
    let scanResults = [];
    do {
        items = await docClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    return scanResults
}
```

### Create Item 
```javascript 
const values = { 
  amount:10, 
  members:["alice","bob"], 
  timestamp: new Date.toISOString();
}

const createItem = (TABLE_NAME, values) => {
    let inputParams = {
        TableName: TABLE_NAME,
        Key: {
            id: uuid.v4(),
        },
        UpdateExpression:
        "SET #ts = :t,  #members = :mbs, #ca = :ca",
        ExpressionAttributeValues: {
            ":t": values.amount,
            ":mbs": values.members,
            ":ca": values.timestamp,
        },
        ExpressionAttributeNames: {
            "#ts": "amount",
            "#members": "members",
            "#ca": "createdAt",
            }
        }
    let response = docClient.update(inputParams).promise();
    return response
}
```

### Send SQS message 
```javascript 
const sendSQSMessage = async (item) => {
    var params = {
        MessageBody: JSON.stringify(item),
        QueueUrl: QUEUE_URL,
    };
    return await SQS.sendMessage(params).promise();
};
```

### Scan DynamoDB Table & Send to SQS 

```javascript 
const sendEachItemToSQS = (TABLE_NAME) => {
    let params = { TableName: TABLE_NAME };
    let items;
    let scanResults = [];
    
    do {
        items = await docClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    const getData = async () => {
        return Promise.all(scanResults.map((item) => sendSQSMessage(item)));
    };
    
    return getData().then((data) => {
        return data;
    });
}
```
