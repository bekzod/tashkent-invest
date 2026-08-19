'use strict';

module.exports = (handler) => async (request, reply) => {
  try {
    return await handler(request, reply);
  } catch (error) {
    request.log.error(error);
    if (!reply.sent)
      return reply
        .code(error.statusCode || 500)
        .send({ error: error.message || 'Internal server error' });
  }
};
