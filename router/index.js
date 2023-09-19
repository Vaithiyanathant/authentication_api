const express = require('express');
const User = require("../model");
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware');
const nodemail = require("nodemailer");
const router = express.Router();
const generateToken = require('../utils')


router.get("/test",(req,res) => 
res.json({message: "Api Testing Successful"})
);

router.post("/user",async (req,res) =>{
    const {email, password} = req.body;

    const user = await User.findOne({ email });

    if(!user){
        const hashedpassword = await bcrypt.hash(password,10);

        const newUser = new User({email,password:hashedpassword});
        
        await newUser.save();

        return res.status(201).json({message: 'user created'});
    }
    res.status(404).json({message: "user already exists"});
});

router.post('/authentication', async (req, res) =>{
    const {email,password} = req.body;
    const user = await User.findOne({email});

    if(!user)
    {
        return res.status(404).json({message: "User not found"})
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(! isMatch )
    {
        return res.status(404).json({message:"Incorrect password"});
    }
    const token = generateToken(user);
    res.json({token});

});


router.get('/data',verifyToken, (req,res) => {
    res.json({message: `welcome, ${req.user.email}! this is protected data`})

});

router.post("/reset-password", async(req,res)=>{
    const { email } = req.body;
    const user = await User.findOne({email});

    if (!user){
        return res.status(404).json({message : "User not found"}); 
    }
    const token = Math.random().toString(36).slice(-8);
    user.restPasswordToken = token;
    user.restPasswordExpires = Date.now() + 3600000; //1 hour

    await user.save();
    const transporter = nodemail.createTransport({
        service: "gmail",
        auth: {
            user: "vaithiyanathan30@gmail.com",
            pass: "ipjj wxwc uzvw fuii"

        }
    })

    const message = {
        from: "srenginedb@gmail.com",
        to: user.email,
        subject: "password reset request",
        text : `you are receiving this email because you (or someone else ) has requested a password reset for your account. \n\n please use the following token to reset your password :${token}\n\n If you did not request a password reset ,please ignore this email .`
    };


    transporter.sendMail(message,(err,info) => {
        if (err)
        {
            res.status(404).json({message:"Something went wrong , Try again "});
        }
        res.status(200).json({message: "Email reset email sent "+ info.response});
        
    });


});

router.post('/reset-password/:token', async (req, res) => {
    const { token} = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires:{$gt: Date.now()}

});
if (!user)
{
    return res.status(404).json({message: "Invalid Token"})
}
const hashedPassword = await bcrypt.hash(password,10);
user.password = hashedPassword;
user.restPasswordToken = null;
user.resetPasswordExpires = null;

await user.save();

res.json({message:"password reset sucessfull"})

});
module.exports = router;