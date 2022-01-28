const Joi = require("@hapi/joi")

const registerValidation = (data) =>
{
    const schema = Joi.object(
        {
            username: Joi.string().min(3).max(30).required(),
            email: Joi.string().min(6).required().email(),
            password: Joi.string().min(6).required()
        }
    )
    return schema.validate(data)
}

module.exports.registerValidation = registerValidation; 