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

const loginValidation = (data) =>
{
    //create a framework for Joi to check
    const schema = Joi.object(
        {
            email: Joi.string().min(6).email().required(),
            password: Joi.string().min(6).required()
        }
    )
    //checks the data if it is valid relative to the schema
    return schema.validate(data)
}

module.exports.registerValidation = registerValidation; 
module.exports.loginValidation = loginValidation; 