const router = require('express').Router();

const User = require('../models/User')

router.post('/',async(req,res)=>{
    try{
        const {name ,email,password,picture} = req.body;
        console.log(req.body);
        const user = await User.create({name,email,password,picture,status :"online"});
        res.status(201).json(user)
    } catch(e) {
        let mesage;
        if(e.code === 11000){
            mesage = "User already exists"
        }
        else{
            mesage = e.message;
        }
        console.log(e);
        res.status(400).json(mesage)
    }
})

router.post('/login',async(req,res)=>{
    try{
        const{email,password} = req.body
        const user = await User.findByCredentials(email,password)
        user.status = 'online'
        await user.save();
        res.status(200).json(user);

    } catch(e){
        res.status(400).json(e.message)
    }
})

module.exports = router