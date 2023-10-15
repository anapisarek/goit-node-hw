const Joi = require('joi');

exports.userDataValidator = (data) =>
  Joi.object()
    .options({ abortEarly: false })
    .keys({
      password: Joi.string().min(6).required(),
      email: Joi.string().email().required(),           
    })
    .validate(data);


exports.verifyEmailValidator = (data) =>
  Joi.object()
    .options({ abortEarly: false })
    .keys({
      email: Joi.string().email().required(),           
    })
    .validate(data);    