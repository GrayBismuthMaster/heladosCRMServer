//Requerimos el jwt y el dotenv
// require('dotenv').config({path:'Variables.env'});
import dotenv from 'dotenv'
dotenv.config({path:'Variables.env'});
import typeDefs from './db/schema.js'
import resolvers from './db/resolvers.js'
import conectarDB from './config/db.js'
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import express from 'express';
import { expressjwt } from 'express-jwt';
import { useServer  } from 'graphql-ws/lib/use/ws';
import { createServer  } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import bcryptjs from 'bcryptjs';
//DESDE EL BSE
// const { makeExecutableSchema } = require('@graphql-tools/schema') ;
// const { ApolloServer } = require('apollo-server-express') ;
// const cors = require('cors');
// const express = require('express');
// const { expressjwt } = require('express-jwt');
// // import { readFile } from 'fs/promises';
// const { useServer } = require('graphql-ws/lib/use/ws');
// const { createServer } = require('http');
// const jwt = require('jsonwebtoken');
// const { WebSocketServer } = require('ws');

//INTENTO UPLOAD
// const {
//     GraphQLUpload,
  
//     graphqlUploadExpress, // A Koa implementation is also exported.
  
//   } = require('graphql-upload');
  




//Roles
import createRoles from './libs/initialSetup.js';
import Usuario from './models/Usuario.js';
createRoles();
//Conectar a la base de datos
conectarDB();
//Servidor 

const PORT = 9000;
// const JWT_SECRET = Buffer.from('+Z3zPGXY7v/0MoMm1p8QuHDGGVrhELGd', 'base64');


const app = express();

app.use(cors(), express.json(), expressjwt({
  algorithms: ['HS256'],
  credentialsRequired: false,
  secret : process.env.SECRETA,
//   secret: JWT_SECRET,

}));

app.post('/login', async (req, res) => {
    console.log("Loging")
    const { email, password } = req.body;
    const existeUsuario = await Usuario.findOne({email})
    if(!existeUsuario){
        throw new Error('El usuario no existe')
    }

    //Revisar si el password no es correcto
    const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
    if(!passwordCorrecto) {
        throw new Error('El password es Incorrecto');
    }
    //Generar token
    console.log("usuario de existe")
    console.log(existeUsuario);

    const { id, nombre, apellido } = existeUsuario;
    //   const token = jwt.sign({ sub: user.id }, JWT_SECRET);
    const token = jwt.sign({id,email,nombre,apellido}, process.env.SECRETA);
      res.json({ token }); 

    });
  
    //ESTE ES EL CONTEXTO DESDE LOS HEADERS O REQUEST
    //EN ESTE CASO VIENE EN AUTH
  function getHttpContext({ req }) {
    console.log("getHttpContext", req.auth);
    if (req.auth) {
      return { usuario: {id : req.auth.id} };
    }
    return {};
  }
  
  function getWsContext({ connectionParams }) {
    console.log("Params mostrado en el server :", connectionParams);
    const token = connectionParams?.accessToken;
    if (token) {
      
      const payload = jwt.verify(token.replace('Bearer ',''),process.env.SECRETA);
      console.log("payload desde token", payload);
      return { usuario: payload.id};
    }
    return {};
  }
  
const httpServer = createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
// const typeDefs = await readFile('./schema.graphql', 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });
useServer({ schema, context: getWsContext }, wsServer);

const apolloServer = new ApolloServer({ schema, context: getHttpContext });
await apolloServer.start();
apolloServer.applyMiddleware({ app, path: '/graphql' });

await httpServer.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});



// const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//     //El context funciona en todos los resolvers
//     context: ({req}) =>{
//         console.log(req.headers)
//         const token = req.headers['authorization'] || '';
//         if(token){
//             try {
//                 const usuario = jwt.verify(token.replace('Bearer ',''),process.env.SECRETA)
//                 //console.log(usuario)
//                 return {
//                     usuario
//                 }
//             } catch (error) {
//                 console.log(error)
//             }
//         }
//     }
// })
 
//Arrancar el servidor
//El then har'a un promise
// server.listen().then(({url})=>{
//     console.log(`Servidor listo en la URL ${url}`)
// })