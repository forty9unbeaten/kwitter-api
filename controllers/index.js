const users = require("./users");
const messages = require("./messages");
const likes = require("./likes");
const auth = require("./auth");
const models = require("../models");

const EnforcerMiddleware = require("openapi-enforcer-middleware");
const enforcer = EnforcerMiddleware("./specification.yaml");
const enforcerMulter = require("openapi-enforcer-multer");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000 }
});

module.exports = {
  ...auth,
  ...likes,
  ...messages,
  ...users,
  middleware: [
    enforcerMulter(enforcer, upload),
    enforcer.middleware(),
    (err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413);
        } else {
          res.status(400);
        }
        next({
          statusCode: res.statusCode,
          message: `${err.message}: ${err.field}`
        });
      }
      next(err);
    },
    models.errorHandlerMiddleware
  ],
  startup: async () => {
    await enforcer.promise;
    await enforcer.controllers("./controllers");
    await models.startup();
  }
};
