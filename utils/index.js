const jwt = require('jsonwebtoken');
const generateToken = (user) => jwt.sign({id : user.id},process.env.SECRET_KEY,{expiresIn :'2m'})

module.exports = generateToken