const AWS = require("aws-sdk",{ region: "ap-southeast-2" });
const uuid = require("uuid");
const docClient = new AWS.DynamoDB.DocumentClient();
const QUEUE_URL = process.env.SQS_QUEUE

const values = {amount: 10, members: ["user1", "user2"], updatedTotal:1234, timestamp: new Date.toISOString()}

exports.handler = async (event) => {
    sendEachItemToSQS("Table_Name")
    getAllItems("Table_Name")
    getItem("Table_Name", id)
    updateItem({TABLE_NAME:"Table_Name", id:123, values})
    createItem("Table_Name", values)
};

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

const getItem = (TABLE_NAME, id) => {
    var inputParams = {
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

const updateItem = ({TABLE_NAME, id, values}) => {
    var inputParams = {
        TableName: TABLE_NAME,
        Key: {
            id: id,
        },
        UpdateExpression: "SET #ts = :t, #uA = :ua",
        ExpressionAttributeValues: {
            ":t": values.updatedTotal,
            ":ua": values.timestamp,
        },
        ExpressionAttributeNames: {
            "#ts": "amount",
            "#uA": "updatedAt",
        },
    };
    const updated = await docClient
        .update(inputParams)
        .promise()
        .then((data) => console.log(data))
        .catch((err) => console.log(err));
    return updated
}

const getAllItems = (TABLE_NAME) => {
    let params = { TableName: TABLE_NAME };
    let items;
    let scanResults = [];
    do {
        items = await docClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    //console.log(scanResults);
    return scanResults
}

const sendEachItemToSQS = (TABLE_NAME) => {
    let params = { TableName: TABLE_NAME };
    let items;
    let scanResults = [];
    do {
        items = await docClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    //console.log(scanResults);

    const getData = async () => {
        return Promise.all(scanResults.map((item) => sendSQSMessage(item)));
    };
    return getData().then((data) => {
        return data;
    });
}

const sendSQSMessage = async (item) => {
    var params = {
        MessageBody: JSON.stringify(item),
        QueueUrl: QUEUE_URL,
    };
    console.log(params);
    return await SQS.sendMessage(params).promise();
};