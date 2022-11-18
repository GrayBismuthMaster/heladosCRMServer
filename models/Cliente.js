import mongoose from "mongoose";

const ClientesSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    empresa: {
        type:String,
        required: true,
        trim:true
    },
    telefono: {
        type:String,
        required: true,
        trim:true
    },
    creado: {
        type:Date,
        default: Date.now()
    },
    direccion : {  
        type:String,
        required:false,
    },
    vendedor: {
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Usuario'
    }
});

const Cliente = mongoose.model('Cliente', ClientesSchema)
export default Cliente
