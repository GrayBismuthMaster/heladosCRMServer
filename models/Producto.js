const mongoose = require('mongoose');
const ProductosSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    existencia: {
        type: Number,
        required: true,
        trim:true
    },
    precio: {
        type: Number,
        required: true,
        trim:true
    },
    imagen : {
        type : String,
        required : true
    }
    ,
    creado: {
        type: Date,
        default: Date.now()
    }
});
//Agregamos el index en el modelo 
ProductosSchema.index({nombre: "text"});
module.exports =mongoose.model('Producto', ProductosSchema);
