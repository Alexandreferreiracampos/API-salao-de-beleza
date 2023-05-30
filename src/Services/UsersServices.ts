import { compare, hash } from "bcrypt";
import { IUpdate, Icreate } from "../interfaces/UsersInterfaces";
import { UsersRepository } from "../repositories/UsersRepository"
import { s3 } from "../config/aws";
import {v4 as uuid} from 'uuid';
import { sign } from "jsonwebtoken";

class UserServices{

    private usersRepository: UsersRepository

    constructor(){
        this.usersRepository = new UsersRepository();
    }
    

    async create({name, email, password}: Icreate){

        const findUser = await this.usersRepository.findUserByEmail(email);

        if(findUser){
            throw new Error('Users Exists')
        }

        if(password.length < 8 ){

            throw new Error('New password does not meet minimum requirements.');
        }

        const hashPassword = await hash(password, 10);

        const create = await this.usersRepository.create({
            name, 
            email, 
            password: hashPassword
        });
        return create;
            
    }

    async update({name, oldPassword, newPassword, avatar_url, user_id}: IUpdate){

        let password
        if( oldPassword && newPassword){
            const findUserById = await this.usersRepository.findUserById(user_id);
            if(!findUserById){
                throw new Error('User not found');

            }
            const passwordMatch = await compare(oldPassword, findUserById.password);
            if(!passwordMatch){
                throw new Error('password invalis.');
    
            }

            if(newPassword.length < 8){

                throw new Error('New password does not meet minimum requirements.');

            }
            password = await hash(newPassword, 10);

            await this.usersRepository.updatePassword(password, user_id);
            }

        if(avatar_url){
            const uploadImage = avatar_url?.buffer;
            const uploadS3 = await s3.upload({
            Bucket: 'semana-heroi-alexandre-dev',
            Key:`${uuid()}-${avatar_url?.originalname}`,
            //ACL:'public-read',
            Body: uploadImage,
        })
        .promise();

        await this.usersRepository.update(name, uploadS3.Location, user_id)

        }

        return{
            message: 'User update successfully',
        }

    }

    async auth(email: string, password: string){

        const findUser = await this.usersRepository.findUserByEmail(email);
        if(!findUser){
            throw new Error('User or password invalis.');
        }

        const passwordMatch = await compare(password, findUser.password);
        console.log(passwordMatch)

        if(!passwordMatch){
            throw new Error('User or password invalis.');

        }

        let secretKey: string | undefined = process.env.ACCESS_KEY_TOKEN
       
        if(!secretKey){
            throw new Error('There is no token Key');
        }

        const token = sign({email}, secretKey, {
            subject: findUser.id,
            expiresIn: 60*15,
        })

        return {
            token,
            user:{
                name: findUser.name,
                email: findUser.email,
            }
        }

    }
}

export {UserServices}