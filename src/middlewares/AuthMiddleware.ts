import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { Ipayload } from "../interfaces/UsersInterfaces";

class AuthMiddleware{
    auth(request: Request, response: Response, next: NextFunction){

        const authHeader = request.headers.authorization;
        if(!authHeader){
            return response.status(401).json({
                code:'Token.missing',
                message: 'Token Missing',
            })
        }

        const [, token] = authHeader.split(' ');

        let secretKey: string | undefined = process.env.ACCESS_KEY_TOKEN
       
        if(!secretKey){
            throw new Error('There is no token Key');
        }


        try{
            
            const {sub} = verify(token, secretKey) as Ipayload;
            request.user_id = sub;
             return next()

        }catch(error){
            return response.status(401).json({
                code: 'token.expired',
                message: 'token expired',

            })

        }

    }

}


export {AuthMiddleware}