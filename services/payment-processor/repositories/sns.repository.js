const { PublishCommand } = require('@aws-sdk/client-sns');

/**
 * Creates an SNS repository for payment result events.
 *
 * @param {{ client: { send: Function }, topicArn: string }} dependencies - SNS client and topic ARN.
 * @returns {{ publish: Function }} SNS repository.
 */
function createSnsRepository({ client, topicArn }) {
  async function publish(event) {
    return client.send(new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(event)
    }));
  }

  return { publish };
}

module.exports = { createSnsRepository };
