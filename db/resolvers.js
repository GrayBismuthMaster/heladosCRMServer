//Importamos los modelos  
import Usuario from '../models/Usuario.js';
import Producto from '../models/Producto.js'
import Cliente  from '../models/Cliente.js'
import Pedido from '../models/Pedido.js'
import Aporte from '../models/Aporte.js'
//Importamos el crypt para hashear las passwords
import bcryptjs from 'bcryptjs';
//Importamos el jwt para los tokens
import jwt from 'jsonwebtoken';
//Importamos el path con la variable de entorno de la palabraSecreta para el token
import dotenv from 'dotenv';
dotenv.config({path:'Variables.env'});
//SUBSCRIPTIONS PSEUDO CHAT
import { PubSub } from 'graphql-subscriptions';
import { Message } from '../fakeDb.js';
import mongoose from 'mongoose';
//Resolvers
//Los resolvers son objetos
//En los resolvers se leen los input
const crearToken = (usuario,secreta,expiresIn) => {
    console.log(usuario)
    //Desestructuración del usuario
    const{ id, email, nombre, apellido} = usuario;
    //EL json web token firma el token y envia un payload (Objeto)
    //que se agregara en la cabecera del jsonWebToken
    return jwt.sign({id,email,nombre,apellido},secreta,{expiresIn})
}

//PSEUDO CHAT PARANOTIFICACIONES

const pubSub = new PubSub();

function rejectIf(condition) {
  if (condition) {
    throw new Error('Unauthorized');
  }
}



const resolvers = {
    Query:{
        obtenerUsuario: async (_,{},ctx) => {
            //Verificamos el token 
            return ctx.usuario;
        },
        obtenerProductos: async()=> {
            try {
                //Para poder obtener todo el array es necesario pasar por
                //param un objeto void
                const productos = await Producto.find({});  
                return productos;
            } catch (error) {
                console.log(error)
            }
        },
        obtenerProducto: async(_,{id})=>{
            //Verificamos la existencia
            try {
                const producto = await Producto.findById(id);
                return producto
            } catch (error) {
                console.log(error)
            }
        },
        obtenerClientes: async()=>{
            try {
                //Con el objeto enviado sin nada se obtiene todo el arrat
                const clientes = await Cliente.find({});
                return clientes
            } catch (error) {
                console.log(error)
            }
        },
        obtenerClientesVendedor: async(_,{},ctx)=>{
            console.log("cobtexti : ", ctx);
            try {
                const clientes = await Cliente.find({vendedor:ctx.usuario.id})    
                return clientes
            } catch (error) {
                console.log(error)
            }
            
        },
        obtenerCliente: async(_,{id},ctx) =>{
            try {
                //Revisar si el cliente existe o no
                const cliente = await Cliente.findById(id);
                if(!cliente) {
                    console.log("El cliente no fue encontrado")
                }
                //Quien lo creó puede verlo
                if(cliente.vendedor.toString() !== ctx.usuario.id){
                    throw new Error("No tienes las credenciales")
                }   
                
                return cliente;
            } catch (error) {
                console.log(error)
            }
            
        },
        obtenerPedidos: async() => {
            try {
                const pedidos = await Pedido.                                                                                            find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor: async(_,{},ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id}).populate('cliente', {
                }).populate(('aportes'));
                console.log(pedidos);
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidoId: async(_,{id},ctx) => {
            console.log("Entra")
            try {
                //Verificar si el pedido existe o no
                const pedidoId = await Pedido.findById(id)
                
                if(!pedidoId){
                    throw new Error("No existe el pedido");
                }  
                //Solo quien lo crea puede verlo
                if(pedidoId.vendedor.toString()!== ctx.usuario.id){
                    throw new Error("No tienes las credenciales")
                }
                //Retornar el pedido
                return pedidoId;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosEstado: async(_,{estado},ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado});
            return pedidos;
        },
        mejoresClientes: async () =>{
            //El match es como un where , $cliente es el nombre del modelo
            //pero igual debe ser en minusculas. Aggregate es un arreglo con diferentes funciones
            //En mongoDb se utiliza el operador $match que filtra
            //El total es del schema
            //lookup es como un join 
            //sort ordena la consulta
            //El aggregate se usa sobre todo para obtener un solo resultado

            const clientes = await Pedido.aggregate([
                { $match : {estado : "COMPLETADO"}},
                {$group : {
                    _id : "$cliente",
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: "cliente"
                    }
                },
                {
                    $sort: {
                        total : -1
                    }
                }
            ])
            return clientes;
        },
        mejoresVendedores: async () => {
            //Cuando se coloca el guión bajo es por que es acumulador
            //Al realizar la operación en mongodb hay que colocarle con $
            //El total esta sacando de Pedido
            const vendedores = await Pedido.aggregate([
                {$match: { estado: "COMPLETADO"}},
                {$group :{
                    _id: "$vendedor",
                    total: {$sum: '$total'}

                }},
                {
                    $lookup : {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
    
                    }
    
                },
                {
                    $limit : 3
                },
                {
                    $sort : {total : -1}
                }
            ])
            return vendedores;
        },
        buscarProducto: async (_,{texto},ctx)=>{
            const productos = await Producto.find({ $text : { $search: texto}})
            return productos;
        },
        //MENSAJE DESDE EL CLIENTE AL SERVIDOR
        messages: (_root, _args,  {usuario:{id}}) => {
            console.log("Entra a messages")
            console.log("Id de entra a messages", id);
            rejectIf(!id);
            // let mensajes = Message.findAll();
            // console.log("mensajes del json", mensajes);
            return Message.findAll();
        },
    },
    Mutation: {
        nuevoUsuario: async (_,{input} ) => {
            //Utilizamos destructuring
            const {email, password} = input;
            //Revisar si el usuario it's alright registered 
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario) {
                throw new Error ('El usuario ya está registrado')
            }
            //Hashear su password
            input.password = await bcryptjs.hashSync(password,10);
            
            //Guardarlo en la base de datos
            try {
                const usuario = new Usuario(input);
                usuario.save(); //Guardarlo
                return usuario;
            } catch (error) {
                console.log(error)
            }

        },
        editarUsuario: async (_,{input}) => {
            const {email, oldPassword, newPassword} = input;
            //Si el usuario existe
            const existeUsuario = await Usuario.findOne({email})
            if(!existeUsuario){
                throw new Error('El usuario no existe')
            }

            //Revisar si el password no es correcto
            const passwordCorrecto = await bcryptjs.compare(oldPassword, existeUsuario.password);
            if(!passwordCorrecto) {
                throw new Error('El password es Incorrecto');
            }
            //Generar token
            console.log("usuario de existe")
            console.log(existeUsuario);
            let pruebaNewPassword = await bcryptjs.hashSync(newPassword,10);
            console.log("Password de Usuario nuevo", pruebaNewPassword);

            let usuarioActualizado = await Usuario.findByIdAndUpdate({_id : existeUsuario._id },{email, password : pruebaNewPassword},{new:true})
            console.log("Usuario actualizado email y password", usuarioActualizado);
            return {
                usuario : usuarioActualizado
            }
        },
        autenticarUsuario: async (_,{input}) => {
            const {email,password} = input;
            //Si el usuario existe
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
            // const user = {
            //     id: existeUsuario._id,
            //     nombre: existeUsuario.nombre,
            //     email: existeUsuario.email,
            // }
            return {
                token: crearToken(existeUsuario,process.env.SECRETA, '7d')
            }
        },
        nuevoProducto: async(_,{input}) =>{
            try {
                const producto = new Producto (input);

                //Almacenar en la base de datos
                const resultado = await producto.save();
                return resultado;
    
            } catch (error) {
                console.log(error)
            }
            
            //Deestructuramos
            //const {nombre,existencia,precio} = input;

        },
        actualizarProducto: async (_,{id,input}) =>{
            try {
                //Revisar si el producto existe o no
                let producto = await Producto.findById(id);
                if(!producto) {
                    throw new Error('Producto no encontrado')
                } 
                //Guardar en la base de datos
                producto = await Producto.findOneAndUpdate({_id :id},input,{new: true});
                return producto;
            } catch (error) {
                console.log(error)
            }
        },
        eliminarProducto: async (_,{id}) => {
            try {
                 //Revisar si el producto existe o no
                 let producto = await Producto.findById(id);
                 if(!producto) {
                     throw new Error('Producto no encontrado')
                 } 
                 await Producto.findOneAndDelete({_id: id});
                 return "Producto eliminado";
            } catch (error) {
                console.log(error)
            }
        },
        nuevoCliente: async(_,{input},ctx ) => {
            console.log(ctx)
            //Verificar si el cliente ya esta registrado
            console.log(input)
          
            //Asignar el vendedor
            let cliente = new Cliente(input);
            try{
                //Obtener token para guardarlo
                cliente.vendedor = ctx.usuario.id;
                //Guardarlo en la base de datos
                const resultado = cliente.save();
                return resultado;
                
            }catch(error) {
                console.log(error)
            }
        },
        actualizarCliente: async(_,{id,input},ctx) =>{
            try {
                //Verificar si existe el cliente
                let cliente = await Cliente.findById(id)
                if(!cliente) {
                    throw new Error("Ese cliente no existe")
                }
                //Verificar si en el vendedor es quien edita
                if(cliente.vendedor.toString() !== ctx.usuario.id){
                    throw new Error("No está permitido")
                }
                //Guardar en la base de datos
                const res = await Cliente.findByIdAndUpdate({_id:id},input,{new:true})
                return res
            } catch (error) {
                
            }
        },
        eliminarCliente: async(_,{id},ctx)=> {
             //Verificar si existe el cliente
             let cliente = await Cliente.findById(id)
             if(!cliente) {
                 throw new Error("Ese cliente no existe")
             }
              //Verificar si en el vendedor es quien edita
              if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error("No está permitido")
            }
            //Eliminar el cliente
            await Cliente.findByIdAndDelete({_id:id})
            return "Cliente eliminado"
        },
        
        nuevoPedido: async (_,{input},ctx)=> {
            const {cliente} =input
            //Verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
            if(!clienteExiste)
            {
                throw new Error('EL cliente no existe') 
            }
            //Verificar si el cliente es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id)
            {
                throw new Error("No tienes las credenciales");
            }
            //Revisar que el stock esté disponible 
            //For await se usa enves de for each para evitar
            // que se ejecute el code posterior adem'as es async
            for await(const articulo of input.pedido){
                const {id} =articulo;
                
                const producto = await Producto.findById(id);
                console.log("Cantidad de productos a realizar peidod", articulo.cantidad , "existencia del producto", producto.existencia);
                if(articulo.cantidad > producto.existencia)
                {
                    throw new Error(`EL artículo ${producto.nombre} excede la cantidad disponible`);
                }
                const productoActualizacion = await Producto.findByIdAndUpdate({_id:id},{existencia : producto.existencia-articulo.cantidad},{new:true})
                console.log("Resultado de actualizacion de existencia", productoActualizacion)
            }
            console.log('después del error ....');
            //Crear un nuevo pedido
            try{
                const nuevoPedido = new Pedido(input);            
                //Asignarle un vendedor
                nuevoPedido.vendedor = ctx.usuario.id;
                //Guardarlo en la base de datos 
                const resultado = await nuevoPedido.save();
                return resultado;
            }
            catch(error) {
                console.log(error)
            }
        },
        actualizarPedido : async (_,{id,input},ctx) => {
            try {
                //Deestructuramos el input
                const {cliente, aportes} = input;
                console.log('INput desde el estado')
                console.log(input, aportes);
                //Verificar si el pedido existe 
                const existePedido =await Pedido.findById(id)
                if(!existePedido){
                    throw new Error("El pedido no existe");
                }
                //Verificar si el cliente existe 
                const existeCliente =await Cliente.findById(cliente)
                if(!existeCliente){
                    throw new Error("El cliente no existe");
                }
                
                //Si el cliente y pedido pertenece al vendedor
                if(existeCliente.vendedor.toString() !== ctx.usuario.id)
                {
                    throw new Error("No tienes las credenciales necesarias")
                }
                //Guardar el pedido
                if(aportes !== undefined){
                    console.log("entra de undefined")
                    if(aportes.length>0){

                        //VALIDAR APORTE MAYOR DE LA BD
                            //CONSEGUIR TODOS LOS APORTES PREVIOS
                            const aportesDB = await Aporte.find({pedido:id});
                            //Ingreso de aportes en el pedido
                            let idAportes = [];
                            idAportes =await aportesDB.map(aporteDB => {return aporteDB._id});
                            console.log("aportes de id", idAportes);
    
                                     
                            //ACUM DE VALORES DE APORTES 
                            let acumAportes = await aportesDB.map(aporteDB=>{return aporteDB.valor})
                            let acumValores = acumAportes.reduce((a,b)=> a+b,0)
                            console.log('Valores de aportes', acumValores);
    
                            console.log("TOTAL", existePedido.total)
                            //CONDICIONAL DE < 0
                                //INPUT APORTES ES LO QUE ACABA DE ENVIAR EL USUARIO
                            if(existePedido.total - (acumValores + input.aportes[0].valor) < 0){ 
                                
                                const inputAporte = {
                                    aportes : idAportes,
                                }
                                await Pedido.findOneAndUpdate({_id:id},inputAporte, {new:true})
                                let pedidoActualizado = await Pedido.findById(id).populate("aportes");
                                console.log(pedidoActualizado);
                                //ACTUALIZAR SALDO DE LA BASE DE DATOS 
                                
                                return pedidoActualizado;
                            }else{
                                
                                const nuevoAporte = new Aporte({valor:input.aportes[0].valor, pedido : 
                                    mongoose.Types.ObjectId(id)}); 
                                //Guardarlo en la base de datos 
                                let aporteIdNueva = await nuevoAporte.save();
                                    console.log("ID NUEVA DE APORTE", aporteIdNueva);
                                    //AFJUNTAR AL ARRAY DE ID DE APORTES 
                                    idAportes.push(aporteIdNueva);

                                const inputAporte = {
                                    aportes : idAportes,
                                    saldo : existePedido.total - (acumValores + input.aportes[0].valor)
                                }
                                let resultadoPedido = await Pedido.findOneAndUpdate({_id:id},inputAporte, {new:true}).populate("aportes");
                                
                                // let pedidoActualizado = await Pedido.findById(id).populate("aportes");
                                console.log("Pedido actualizado ",resultadoPedido);
                                //ACTUALIZAR SALDO DE LA BASE DE DATOS 
                                
                                return resultadoPedido;
                            }
    
                        
                    }
                }
                const resultado = await Pedido.findOneAndUpdate({_id:mongoose.Types.ObjectId(id)},input, {new:true}).populate("aportes");
                console.log('resultado de cambio estado', resultado)
                return resultado;
            } catch (error) {
                console.log(error)
            }
        },
        eliminarPedido: async (_,{id},ctx) => {
            //Verificar si el pedido existe o no
            const pedido = await Pedido.findById(id);
            if(!pedido) {
                throw new Error("El pedido no existe")
            }
            //Verificar si el vendedor es quien lo borra
            if(pedido.vendedor.toString()!== ctx.usuario.id)
            {
                throw new Error("No tienes los permisos para borrar el producto")
            }
            //Eliminar de la base de datos
            await Pedido.findOneAndDelete({_id:id});
            return "Pedido eliminado";
        },
        //MENSAJE DEL PSEUDO CAHT PARA LASN OTIFICACIONES
        addMessage: async (_root, { input:{text} }, {usuario:{id}}) => {
            console.log(text)
            console.log(id)
          rejectIf(!id);
          const message = await Message.create({ from: id, text });
        //   const message = {id: Date.now(), from: id, text };
        //   pubSub.publish('MESSAGE_ADDED', { messageAdded: {from : id, text} });
          pubSub.publish('MESSAGE_ADDED', { messageAdded: message });

          return message;
        },  
        
    }, Subscription: {
        messageAdded: {
          subscribe: (_root, _args, {usuario}) => {
            // console.log("entro al subscription", id);
            // rejectIf(!usuario);
            let mensaje = Message.findAll();
            
            mensaje.then((messages)=>{
                let numTotalMensajes = messages.length;
                let cont=0;
                messages.map((message)=>{
                    if(cont<numTotalMensajes-10){
                        Message.delete(message.id);
                    }
                    else{
                        return;
                    }
                        
                })
                // Message.delete(message.id);
            })
            console.log("se va al pub asyncIterator")
            return pubSub.asyncIterator('MESSAGE_ADDED');
          },
        },
      },
}
export default resolvers
