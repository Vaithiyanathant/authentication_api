const jwt = require('jsonwebtoken');
const User = require("../model");
const verifyToken = (req,res,next)  => {   
    const authHedder = req.headers.authorization;
    if (!authHedder){
        res.status(401).json({message: "missing token"});
    }

    const token = authHedder.split(" ")[1];
    jwt.verify(token,process.env.SECRET_KEY,async (err, decode) =>{
        if(err){
            return res.status(403).json({message: "invalid token"})

        }
        const user = await User.findOne({_id: decode.id})

        if (!user){
            return res.status(404).json({message: "user not found"})
        }

    req.user = user;
    next();

    })
};

module.exports = verifyToken;