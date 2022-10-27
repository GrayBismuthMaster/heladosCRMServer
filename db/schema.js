import {gql} from 'apollo-server';

//Schema
const typeDefs = gql `
    
    type Message {
        id: ID!
        from: String!
        text: String!
    }

    input MessageInput {
        text: String!
    }

    type Token {
        token: String,
    }
    type UsuarioAutenticado {
        id : ID,
        nombre : String,
        email : String
    }
    input UsuarioInput {
        nombre: String
        apellido: String!
        email: String!
        password: String!
    }

    input AutenticarInput {
        email: String!
        password: String!
    }

    input ProductoInput {
        nombre: String!
        existencia: Int!
        precio: Float!
    }
    input ClienteInput {
        nombre: String!
        apellido: String!
        empresa: String!
        email: String!
        telefono:String
    }
    input PedidoProductoInput {
        id:ID
        cantidad: Int
        nombre: String
        precio: Float
    }
    input AporteInput {
        valor: Float
        pedido: ID
    }
    input PedidoInput {
        pedido: [PedidoProductoInput]
        aportes: [AporteInput]
        total: Float
        cliente: ID
        estado: EstadoPedido
    }
    enum EstadoPedido {
        PENDIENTE 
        COMPLETADO 
        CANCELADO
    }
    type Usuario {
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }
    type Producto {
        id: ID
        nombre: String
        existencia: Int
        precio:Float
        imagen: String
        creado: String
    }
    type Cliente {
        id:ID
        nombre: String
        apellido: String
        empresa: String
        email: String
        telefono:String
        vendedor: ID
    }
    type Aporte {
        id: ID
        valor: Float 
        creado: String
        pedido: ID
    }
    type Pedido {
        id: ID!
        pedido: [PedidoGrupo]
        total: Float
        cliente: Cliente
        vendedor: ID
        aportes: [Aporte]
        fecha: String
        saldo: Float
        estado: EstadoPedido
    }
    type PedidoGrupo{
        id:ID
        cantidad: Int
        nombre: String
        precio: Float
    }
    type TopCliente{
        total: Float
        cliente: [Cliente]
    }
    type TopVendedor{
        total: Float
        vendedor: [Usuario]
    }
    type Query {
            #Productos
            #Si colocamos en array nos dará todo el producto
            obtenerProductos: [Producto]
            obtenerProducto(id:ID!): Producto
            #Usuarios
            obtenerUsuario: Usuario
            #Clientes
            obtenerClientes: [Cliente]
            obtenerClientesVendedor: [Cliente]
            obtenerCliente(id:ID!):Cliente
            #Pedidos
            obtenerPedidos: [Pedido]
            obtenerPedidosVendedor: [Pedido]
            obtenerPedidoId(id:ID!): Pedido
            obtenerPedidosEstado(estado:String!): [Pedido]
            #Busquedas Avanzadas
            mejoresClientes: [TopCliente]
            mejoresVendedores: [TopVendedor]
            buscarProducto(texto: String!): [Producto]

            #PSEUDO CHAT PARA NOTIFICACIONES
            messages: [Message!]
            message: Message
        }
    type Mutation {
        #Productos
        nuevoProducto(input: ProductoInput) : Producto
        actualizarProducto(id:ID!, input:ProductoInput): Producto
        eliminarProducto(id:ID!):String
        
        #Usuarios
        nuevoUsuario(input: UsuarioInput) : Usuario 
        autenticarUsuario(input: AutenticarInput) : Token
        
        #Clientes
        nuevoCliente(input:ClienteInput) : Cliente
        actualizarCliente(id:ID!,input:ClienteInput):Cliente
        eliminarCliente(id:ID!):String

        #Pedidos 
        nuevoPedido(input: PedidoInput): Pedido
        actualizarPedido(id:ID!, input: PedidoInput) : Pedido
        eliminarPedido(id:ID!):String

        #PSEUDO CHAT PARA NOTIFICACIONES
        addMessage(input: MessageInput!): Message
    }
    type Subscription {
        messageAdded: Message
    }
`;
//Importar node
export default typeDefs;