const { SendMessageCommand } = require('@aws-sdk/client-sqs');

/**
 * Creates an SQS repository for payment events.
 *
 * @param {{ client: { send: Function }, queueUrl: string }} dependencies - AWS client and queue URL.
 * @returns {{ publish: Function }} SQS repository.
 */
function createSqsRepository({ client, queueUrl }) {
  /**
   * Publishes a payment event to SQS.
   *
   * @param {object} event - Validated payment event.
   * @returns {Promise<object>} AWS send result.
   * @throws {Error} When AWS rejects the message.
   */
  async function publish(event) {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(event)
    });

    return client.send(command);
  }

  return {
    publish
  };
}

module.exports = {
  createSqsRepository
};
