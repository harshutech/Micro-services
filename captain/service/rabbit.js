require('dotenv').config();
const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL;

let connection, channel;

async function connect() {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.log(error);
    }
}

async function subscribeToQueue(queueName,callback) {
   if(!channel) await connect();
   await channel.assertQueue(queueName);
    channel.consume(queueName,(msg) => {
         callback(msg.content.toString());
         channel.ack(msg);
    });
}

async function publishToQueue(queueName,data) {
    if(!channel) await connect();
    await channel.assertQueue(queueName);
    channel.sendToQueue(queueName,Buffer.from(data));
}

module.exports = {
    connect,
    subscribeToQueue,
    publishToQueue
};